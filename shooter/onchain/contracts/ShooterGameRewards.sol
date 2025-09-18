// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";

/// @title ShooterGameRewards
/// @notice Contract handling Key NFTs, reward claiming, and anti-exploit protections
contract ShooterGameRewards is Ownable, ReentrancyGuard, ERC721Burnable {
    using ECDSA for bytes32;

    // ============ State ============

    uint256 public nextKeyId;
    address public backendSigner; // Address allowed to sign rewards
    address public adminWallet; // Admin wallet for configuration
    ERC1155 public rewardToken; // ERC1155 for rewards
    
    // Game configuration
    uint256 public burnTokenId; // Token ID to burn for playing
    uint256 public playCost; // Cost to play (in wei)
    mapping(uint256 => uint256) public scoreRewards; // score -> reward token ID
    mapping(uint256 => uint256) public rewardAmounts; // reward token ID -> amount
    
    mapping(address => uint256) public nonces; // user nonces
    mapping(uint256 => bool) public usedKeys; // burned keys

    // ============ Events ============

    event KeyMinted(address indexed user, uint256 keyId);
    event RewardClaimed(address indexed user, uint256 keyId, uint256 score, uint256 rewardTokenId, uint256 amount);
    event GameConfigUpdated(uint256 burnTokenId, uint256 playCost);
    event ScoreRewardUpdated(uint256 score, uint256 rewardTokenId, uint256 amount);

    // ============ Modifiers ============

    modifier onlyAdmin() {
        require(msg.sender == adminWallet, "Not admin");
        _;
    }

    // ============ Constructor ============

    constructor(
        address _backendSigner, 
        address _rewardToken,
        address _adminWallet
    ) ERC721("ShooterKey", "SKY") {
        backendSigner = _backendSigner;
        rewardToken = ERC1155(_rewardToken);
        adminWallet = _adminWallet;
        nextKeyId = 1;
    }

    // ============ Admin Functions ============

    function setBackendSigner(address _newSigner) external onlyOwner {
        backendSigner = _newSigner;
    }

    function setRewardToken(address _newToken) external onlyOwner {
        rewardToken = ERC1155(_newToken);
    }

    function setAdminWallet(address _newAdmin) external onlyOwner {
        adminWallet = _newAdmin;
    }

    function setGameConfig(uint256 _burnTokenId, uint256 _playCost) external onlyAdmin {
        burnTokenId = _burnTokenId;
        playCost = _playCost;
        emit GameConfigUpdated(_burnTokenId, _playCost);
    }

    function setScoreReward(uint256 _score, uint256 _rewardTokenId, uint256 _amount) external onlyAdmin {
        scoreRewards[_score] = _rewardTokenId;
        rewardAmounts[_rewardTokenId] = _amount;
        emit ScoreRewardUpdated(_score, _rewardTokenId, _amount);
    }

    function batchSetScoreRewards(
        uint256[] calldata _scores,
        uint256[] calldata _rewardTokenIds,
        uint256[] calldata _amounts
    ) external onlyAdmin {
        require(_scores.length == _rewardTokenIds.length && _rewardTokenIds.length == _amounts.length, "Array length mismatch");
        
        for (uint256 i = 0; i < _scores.length; i++) {
            scoreRewards[_scores[i]] = _rewardTokenIds[i];
            rewardAmounts[_rewardTokenIds[i]] = _amounts[i];
            emit ScoreRewardUpdated(_scores[i], _rewardTokenIds[i], _amounts[i]);
        }
    }

    // ============ Core Functions ============

    /// @notice Mint a Key NFT required to play
    function mintKey() external payable nonReentrant returns (uint256) {
        require(msg.value >= playCost, "Insufficient payment");
        
        uint256 keyId = nextKeyId++;
        _safeMint(msg.sender, keyId);
        emit KeyMinted(msg.sender, keyId);
        return keyId;
    }

    /// @notice Check if player has a valid key
    function hasKey(address player) external view returns (bool) {
        return balanceOf(player) > 0;
    }

    /// @notice Get player's key ID (first one found)
    function getPlayerKeyId(address player) external view returns (uint256) {
        for (uint256 i = 1; i < nextKeyId; i++) {
            if (ownerOf(i) == player && !usedKeys[i]) {
                return i;
            }
        }
        return 0;
    }

    /// @notice Claim rewards by burning a key and presenting a backend signature
    function claimReward(
        uint256 keyId,
        uint256 score,
        uint256 nonce,
        uint256 expiry,
        bytes calldata signature
    ) external nonReentrant {
        require(ownerOf(keyId) == msg.sender, "Not owner of key");
        require(block.timestamp <= expiry, "Signature expired");
        require(nonce == nonces[msg.sender] + 1, "Invalid nonce");
        require(!usedKeys[keyId], "Key already used");

        // Get reward configuration
        uint256 rewardTokenId = scoreRewards[score];
        require(rewardTokenId != 0, "No reward for this score");
        uint256 rewardAmount = rewardAmounts[rewardTokenId];
        require(rewardAmount > 0, "Invalid reward amount");

        // Verify signature
        bytes32 message = keccak256(
            abi.encodePacked(msg.sender, keyId, score, rewardTokenId, rewardAmount, nonce, expiry)
        ).toEthSignedMessageHash();

        address signer = message.recover(signature);
        require(signer == backendSigner, "Invalid signature");

        // Burn the key
        _burn(keyId);
        usedKeys[keyId] = true;

        // Update nonce
        nonces[msg.sender] = nonce;

        // Transfer reward
        rewardToken.safeTransferFrom(address(this), msg.sender, rewardTokenId, rewardAmount, "");

        emit RewardClaimed(msg.sender, keyId, score, rewardTokenId, rewardAmount);
    }

    /// @notice Withdraw contract balance (only owner)
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /// @notice Emergency function to recover ERC1155 tokens
    function recoverERC1155(uint256 tokenId, uint256 amount) external onlyOwner {
        rewardToken.safeTransferFrom(address(this), owner(), tokenId, amount, "");
    }

    // ============ View Functions ============

    function getGameConfig() external view returns (uint256, uint256) {
        return (burnTokenId, playCost);
    }

    function getScoreReward(uint256 score) external view returns (uint256, uint256) {
        return (scoreRewards[score], rewardAmounts[scoreRewards[score]]);
    }

    function getPlayerInfo(address player) external view returns (bool hasKey, uint256 keyId, uint256 nonce) {
        hasKey = balanceOf(player) > 0;
        keyId = hasKey ? this.getPlayerKeyId(player) : 0;
        nonce = nonces[player];
    }
}
