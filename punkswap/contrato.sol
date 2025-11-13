// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AdrianGallery → AdrianPunks Weighted Swap (custody + receivers)
 * @notice Swaps eligible ERC1155 tokens (AdrianGallery) for random ERC721 tokens (AdrianPunks)
 *         using integer weights. Supports two UX paths:
 *
 *  (A) Pull-swap: user approves Gallery to this contract and calls `swap(ids, amounts, minPunks)`.
 *  (B) Push-swap: user sends ERC1155 directly to this contract with ABI-encoded `SwapIntent` in `data`.
 *      The contract forwards the received ERC1155 to a burn sink and immediately delivers random Punks.
 *
 *  ERC721 (AdrianPunks) inventory:
 *   - Anyone can deposit via `depositPunks([...])` (requires approvalForAll) OR
 *   - Send from marketplaces/wallets using `safeTransferFrom` → we implement ERC721Receiver and
 *     auto-enlist incoming Punk tokenIds into the internal pool.
 *
 *  Weights are defined in "units" where 2 units = 1 Punk. For example:
 *    - GENESIS id1 → 6 units (3 Punks)
 *    - TRUE ASCENDANT id3 → 6 units (3 Punks)
 *    - ASCENSION id4 → 2 units (1 Punk)
 *    - THE BURNED FORTUNE id6 → 2 units (1 Punk)
 *    - THE OFFERING id15 → 1 unit (0.5 Punk)
 *    - ORACLE id16 → 1 unit (0.5 Punk)
 *
 *  Randomness: pseudo-random selection (block.prevrandao) over an internal bag of ERC721 tokenIds;
 *  tokenIds are removed via swap-and-pop to avoid duplicates.
 *
 *  @dev SECURITY IMPROVEMENTS:
 *   - Removed msg.sender check in onERC721Received (allows OpenSea conduits)
 *   - Added tokenId ownership verification
 *   - ownerWithdrawPunk now reverts if tokenId not found in bag
 *   - Added bag index mapping for O(1) lookups
 *   - Enhanced validation in _processPushSwap
 *   - Allows re-deposits without reverting
 *   - Better error messages and input validation
 */

// ===== Minimal Interfaces =====
interface IERC165 { function supportsInterface(bytes4 interfaceId) external view returns (bool); }

interface IERC1155 is IERC165 {
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
    function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external;
    function isApprovedForAll(address account, address operator) external view returns (bool);
}

interface IERC1155Receiver is IERC165 {
    function onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes calldata data) external returns (bytes4);
    function onERC1155BatchReceived(address operator, address from, uint256[] calldata ids, uint256[] calldata values, bytes calldata data) external returns (bytes4);
}

interface IERC721 is IERC165 {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IERC721Receiver is IERC165 {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

// ===== Lightweight Ownable & Reentrancy =====
abstract contract Ownable {
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    address public owner;
    constructor() { owner = msg.sender; emit OwnershipTransferred(address(0), msg.sender); }
    modifier onlyOwner() { require(msg.sender == owner, "NOT_OWNER"); _; }
    function transferOwnership(address newOwner) external onlyOwner { require(newOwner != address(0), "ZERO"); emit OwnershipTransferred(owner, newOwner); owner = newOwner; }
}

abstract contract ReentrancyGuard {
    uint256 private _status; // 1 = unlocked, 2 = locked
    constructor() { _status = 1; }
    modifier nonReentrant() { require(_status == 1, "REENTRANCY"); _status = 2; _; _status = 1; }
}

contract AdrianGallerySwap is Ownable, ReentrancyGuard, IERC1155Receiver, IERC721Receiver {
    // ===== Immutable targets =====
    IERC1155 public immutable gallery;   // AdrianGallery (ERC1155)
    IERC721  public immutable punks;     // AdrianPunks (ERC721)

    // ===== Config =====
    uint256 public maxPunksOut = 300; // 0 = unlimited
    uint256 public totalPunksOut;
    bool    public paused;

    // Burn sink for ERC1155 (EOA is OK).
    address public burnSink = 0x000000000000000000000000000000000000dEaD;

    // Allowed Gallery IDs and their unit weights (2 units = 1 Punk)
    mapping(uint256 => uint8) public unitById;
    mapping(uint256 => bool)  public allowedId;

    // Internal ERC721 inventory (bag). We own deposited Punks.
    uint256[] public punkBag;    // bag of tokenIds
    uint256   public punkCount;  // equals punkBag.length for convenience
    
    // NEW: Mapping for O(1) lookups - tracks if tokenId is in bag and its index
    mapping(uint256 => uint256) private _bagIndex; // tokenId => index+1 (0 = not in bag)

    // Events
    event Paused(bool status);
    event BurnSinkUpdated(address sink);
    event MaxPunksOutUpdated(uint256 cap);
    event WeightsUpdated(uint256[] ids, uint8[] units);
    event AllowedIdsSet(uint256[] ids, bool allowed);
    event PunksDeposited(address indexed from, uint256 count);
    event PunkWithdrawn(uint256 indexed tokenId, address indexed to);
    event SwapExecuted(address indexed user, uint256 unitsSpent, uint256 punksOut, uint256[] ids, uint256[] amounts);

    // Intent struct to support push-swap via ERC1155 `data` param
    struct SwapIntent { address beneficiary; uint256 minPunks; }

    constructor(address _gallery, address _punks) {
        require(_gallery != address(0) && _punks != address(0), "ZERO_ADDR");
        gallery = IERC1155(_gallery);
        punks   = IERC721(_punks);

        // Defaults (editable):
        _setAllowedAndWeight(1,  true, 6); // GENESIS id1 → 6 units (3 punks)
        _setAllowedAndWeight(3,  true, 6); // TRUE ASCENDANT id3 → 6 units (3 punks)
        _setAllowedAndWeight(4,  true, 2); // ASCENSION id4 → 2 units (1 punk)
        _setAllowedAndWeight(6,  true, 2); // THE BURNED FORTUNE id6 → 2 units (1 punk)
        _setAllowedAndWeight(15, true, 1); // THE OFFERING id15 → 1 unit (0.5 punk)
        _setAllowedAndWeight(16, true, 1); // ORACLE id16 → 1 unit (0.5 punk)
    }

    // ===== Admin =====
    function setPaused(bool _paused) external onlyOwner { paused = _paused; emit Paused(_paused); }
    function setBurnSink(address _sink) external onlyOwner { require(_sink != address(0), "ZERO"); burnSink = _sink; emit BurnSinkUpdated(_sink); }
    function setMaxPunksOut(uint256 cap) external onlyOwner { maxPunksOut = cap; emit MaxPunksOutUpdated(cap); }

    function setWeight(uint256 id, uint8 units) external onlyOwner { require(allowedId[id], "ID_NOT_ALLOWED"); _setWeight(id, units); _emitSingleWeight(id, units); }
    function setWeightsBatch(uint256[] calldata ids, uint8[] calldata units) external onlyOwner {
        require(ids.length == units.length && ids.length > 0, "LEN");
        for (uint256 i=0; i<ids.length; i++) { require(allowedId[ids[i]], "ID_NOT_ALLOWED"); _setWeight(ids[i], units[i]); }
        emit WeightsUpdated(ids, units);
    }

    function setAllowedIds(uint256[] calldata ids, bool allowed) external onlyOwner {
        require(ids.length > 0, "EMPTY_ARRAY");
        for (uint256 i=0; i<ids.length; i++) { allowedId[ids[i]] = allowed; }
        emit AllowedIdsSet(ids, allowed);
    }

    function _setAllowedAndWeight(uint256 id, bool allowed, uint8 units) internal { allowedId[id] = allowed; _setWeight(id, units); }
    function _setWeight(uint256 id, uint8 units) internal { require(units>0 && units<=200, "UNITS_OOB"); unitById[id] = units; }
    function _emitSingleWeight(uint256 id, uint8 units) internal { 
        uint256[] memory a = new uint256[](1);
        uint8[] memory b = new uint8[](1);
        a[0] = id;
        b[0] = units;
        emit WeightsUpdated(a, b);
    }

    // ===== ERC721 inventory management =====

    /// @notice Deposit multiple Punks from the caller (must have setApprovalForAll to this contract).
    /// @dev Anyone can deposit punks, even when paused. Skips duplicates silently.
    function depositPunks(uint256[] calldata tokenIds) external nonReentrant {
        require(tokenIds.length > 0, "EMPTY_ARRAY");
        
        uint256 deposited = 0;
        for (uint256 i=0; i<tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            // Skip if already in bag (allows idempotent deposits)
            if (_bagIndex[tokenId] == 0) {
                punks.safeTransferFrom(msg.sender, address(this), tokenId);
                _addToBag(tokenId);
                deposited++;
            }
        }
        
        // Emit event even if deposited is 0 (all were duplicates) - helps debugging
        emit PunksDeposited(msg.sender, deposited);
    }

    /// @notice Owner can withdraw any specific Punk (rescue / rebalancing).
    /// @dev Reverts if tokenId is not in bag.
    function ownerWithdrawPunk(uint256 tokenId, address to) external onlyOwner {
        require(to != address(0), "ZERO");
        require(_bagIndex[tokenId] > 0, "TOKEN_NOT_IN_BAG");
        _removeFromBag(tokenId);
        punks.safeTransferFrom(address(this), to, tokenId);
        emit PunkWithdrawn(tokenId, to);
    }

    /// @notice Check if a tokenId is in the bag
    function isInBag(uint256 tokenId) external view returns (bool) {
        return _bagIndex[tokenId] > 0;
    }

    function bagSize() external view returns (uint256) { return punkBag.length; }

    // ===== Internal bag management with O(1) lookups =====
    function _addToBag(uint256 tokenId) internal {
        punkBag.push(tokenId);
        _bagIndex[tokenId] = punkBag.length; // Store index+1
        punkCount = punkBag.length;
    }

    function _removeFromBag(uint256 tokenId) internal {
        uint256 indexPlusOne = _bagIndex[tokenId];
        require(indexPlusOne > 0, "TOKEN_NOT_IN_BAG");
        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = punkBag.length - 1;
        if (index != lastIndex) {
            uint256 lastTokenId = punkBag[lastIndex];
            punkBag[index] = lastTokenId;
            _bagIndex[lastTokenId] = indexPlusOne; // Update moved token's index
        }
        punkBag.pop();
        delete _bagIndex[tokenId];
        punkCount = punkBag.length;
    }

    // ===== View helpers =====
    function quoteUnits(uint256[] calldata ids, uint256[] calldata amounts) public view returns (uint256 units, uint256 punksOut) {
        require(ids.length == amounts.length && ids.length>0, "LEN");
        for (uint256 i=0; i<ids.length; i++) {
            require(allowedId[ids[i]], "ID_NOT_ALLOWED");
            require(amounts[i] > 0, "ZERO_AMOUNT");
            units += uint256(unitById[ids[i]]) * amounts[i];
        }
        punksOut = units / 2;
    }

    // Version interna para arrays en memory (push-swap)
    function _quoteUnitsMem(uint256[] memory ids, uint256[] memory amounts) internal view returns (uint256 units, uint256 punksOut) {
        require(ids.length == amounts.length && ids.length>0, "LEN");
        for (uint256 i=0; i<ids.length; i++) {
            require(allowedId[ids[i]], "ID_NOT_ALLOWED");
            require(amounts[i] > 0, "ZERO_AMOUNT");
            units += uint256(unitById[ids[i]]) * amounts[i];
        }
        punksOut = units / 2;
    }

    // ===== Core swap (pull path) =====
    function swap(uint256[] calldata ids, uint256[] calldata amounts, uint256 minPunks) external nonReentrant {
        require(!paused, "PAUSED");
        require(ids.length == amounts.length && ids.length>0, "LEN");
        require(gallery.isApprovedForAll(msg.sender, address(this)), "GALLERY_NOT_APPROVED");

        (uint256 units, uint256 punksOut) = quoteUnits(ids, amounts);
        require(units>0 && units%2==0, "UNITS_EVEN");
        require(punksOut >= minPunks, "SLIPPAGE");
        require(punksOut > 0, "NO_PUNKS_OUT");
        _precheckInventoryAndCap(punksOut);

        // Pull and burn
        gallery.safeBatchTransferFrom(msg.sender, burnSink, ids, amounts, "");

        // Deliver random punks
        _deliverRandomPunks(msg.sender, punksOut);

        emit SwapExecuted(msg.sender, units, punksOut, ids, amounts);
    }

    // ===== Push-swap via ERC1155Receiver =====
    function onERC1155Received(address, address from, uint256 id, uint256 value, bytes calldata data) external nonReentrant returns (bytes4) {
        require(msg.sender == address(gallery), "ONLY_GALLERY");
        require(allowedId[id], "ID_NOT_ALLOWED");
        require(value > 0, "ZERO_VALUE");

        SwapIntent memory si = _decodeSwapIntent(data);
        uint256[] memory ids = new uint256[](1);
        uint256[] memory amts = new uint256[](1);
        ids[0] = id;
        amts[0] = value;
        _processPushSwap(from, si, ids, amts);
        return 0xf23a6e61; // ERC1155_ACCEPTED
    }

    function onERC1155BatchReceived(address, address from, uint256[] calldata ids, uint256[] calldata values, bytes calldata data) external nonReentrant returns (bytes4) {
        require(msg.sender == address(gallery), "ONLY_GALLERY");
        require(ids.length==values.length && ids.length>0, "LEN");
        for (uint256 i=0; i<ids.length; i++) {
            require(allowedId[ids[i]], "ID_NOT_ALLOWED");
            require(values[i] > 0, "ZERO_VALUE");
        }
        SwapIntent memory si = _decodeSwapIntent(data);
        // Convert calldata arrays to memory for internal processing
        uint256[] memory idsM = new uint256[](ids.length);
        uint256[] memory valuesM = new uint256[](values.length);
        for (uint256 i = 0; i < ids.length; i++) {
            idsM[i] = ids[i];
            valuesM[i] = values[i];
        }
        _processPushSwap(from, si, idsM, valuesM);
        return 0xbc197c81; // ERC1155_BATCH_ACCEPTED
    }

    function _processPushSwap(address from, SwapIntent memory si, uint256[] memory ids, uint256[] memory amts) internal {
        require(!paused, "PAUSED");
        (uint256 units, uint256 punksOut) = _quoteUnitsMem(ids, amts);
        require(units>0 && units%2==0, "UNITS_EVEN");
        require(punksOut >= si.minPunks, "SLIPPAGE");
        require(punksOut > 0, "NO_PUNKS_OUT");

        // Check inventory BEFORE forwarding tokens to prevent griefing
        _precheckInventoryAndCap(punksOut);

        // Forward the just-received ERC1155 to burn sink
        gallery.safeBatchTransferFrom(address(this), burnSink, ids, amts, "");

        // Deliver random punks to beneficiary (or sender if zero address)
        address to = si.beneficiary == address(0) ? from : si.beneficiary;
        _deliverRandomPunks(to, punksOut);

        emit SwapExecuted(to, units, punksOut, ids, amts);
    }

    function _precheckInventoryAndCap(uint256 punksOut) internal view {
        require(punkBag.length >= punksOut, "INSUFFICIENT_INVENTORY");
        if (maxPunksOut>0) { require(totalPunksOut + punksOut <= maxPunksOut, "EXCEEDS_CAP"); }
    }

    function _deliverRandomPunks(address to, uint256 n) internal {
        for (uint256 i=0; i<n; i++) {
            uint256 idx = _rand(punkBag.length);
            uint256 tokenId = punkBag[idx];

            // Remove from bag using optimized method (swap & pop + index map)
            uint256 lastIndex = punkBag.length - 1;
            if (idx != lastIndex) {
                uint256 lastTokenId = punkBag[lastIndex];
                punkBag[idx] = lastTokenId;
                _bagIndex[lastTokenId] = idx + 1;
            }
            punkBag.pop();
            delete _bagIndex[tokenId];
            punkCount = punkBag.length;

            punks.safeTransferFrom(address(this), to, tokenId);
            totalPunksOut += 1;
        }
    }

    function _rand(uint256 modulo) internal view returns (uint256) {
        require(modulo > 0, "MODULO_ZERO");
        // Pseudo-random, acceptable for bag shuffling; not for assets with economic value beyond randomization fairness.
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, modulo, totalPunksOut, address(this)))) % modulo;
    }

    function _decodeSwapIntent(bytes calldata data) internal pure returns (SwapIntent memory si) {
        if (data.length == 0) {
            // default: beneficiary = address(0) (→ use `from`), minPunks = 0
            return SwapIntent({beneficiary: address(0), minPunks: 0});
        }
        // Try to decode as abi.encode(SwapIntent) - 64 bytes
        if (data.length == 64) {
            try this._tryDecodeIntent(data) returns (address who, uint256 minPunks) {
                return SwapIntent({beneficiary: who, minPunks: minPunks});
            } catch {
                // If decode fails, use defaults (e.g., OpenSea might send other data)
                return SwapIntent({beneficiary: address(0), minPunks: 0});
            }
        }
        // For any other data length (e.g., OpenSea batch transfers), use defaults
        // This allows compatibility with marketplaces that send arbitrary data
        return SwapIntent({beneficiary: address(0), minPunks: 0});
    }

    // Helper function for try-catch in _decodeSwapIntent
    function _tryDecodeIntent(bytes calldata data) external pure returns (address, uint256) {
        return abi.decode(data, (address, uint256));
    }

    // ===== ERC721 Receiver =====
    /// @dev Accepts any ERC721 token, but only adds AdrianPunks to the bag
    /// @dev Works with OpenSea, Basescan, and any wallet/marketplace
    function onERC721Received(address, address from, uint256 tokenId, bytes calldata) external override nonReentrant returns (bytes4) {
        // Try to verify it's an AdrianPunk by checking if we own it and it responds correctly
        try punks.ownerOf(tokenId) returns (address owner) {
            // If ownerOf succeeds and we're the owner, it's a valid AdrianPunk
            if (owner == address(this) && _bagIndex[tokenId] == 0) {
                _addToBag(tokenId);
                emit PunksDeposited(from, 1);
            }
        } catch {
            // If ownerOf fails, it's not an AdrianPunk - ignore silently
            // This allows the transfer to succeed but doesn't add to bag
        }
        
        return 0x150b7a02; // ERC721_RECEIVED
    }

    // ===== ERC165 Support =====
    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return (
            interfaceId == 0x01ffc9a7 || // ERC165
            interfaceId == 0x4e2312e0 || // ERC1155Receiver
            interfaceId == 0x150b7a02    // ERC721Receiver
        );
    }
}