// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IAdrianTraitsCore {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function mintFromExtension(address to, uint256 id, uint256 amount) external;
    function burnFromExtension(address from, uint256 id, uint256 amount) external;
    function exists(uint256 tokenId) external view returns (bool);
    function getAvailableSupply(uint256 assetId) external view returns (uint256);
}

struct PackConfig {
    uint32 itemsPerPack;
    bool active;
}

/**
 * @title OpenPack V4 - Fixed
 * @dev Pack opening with stable randomization and supply validation
 */
contract OpenPack  is Ownable, ReentrancyGuard {
    IAdrianTraitsCore public immutable traitsCore;
    
    mapping(uint256 => PackConfig) public packConfigs;
    mapping(uint256 => uint256[]) private packAssets;
    
    uint256 private globalNonce;

    event PackConfigured(uint256 indexed packId, uint256 assetCount, uint32 itemsPerPack, bool active);
    event PacksOpened(address indexed user, uint256 indexed packId, uint32 quantity, uint32 opened, uint256[] rewards);
    event PackAssetsUpdated(uint256 indexed packId, uint256 assetsRemoved);

    constructor(address _traitsCore) Ownable(msg.sender) {
        require(_traitsCore != address(0), "Invalid core address");
        traitsCore = IAdrianTraitsCore(_traitsCore);
    }

    // =============== CONFIGURATION ===============
    
    /**
     * @notice Configura pack sin validación estricta - acepta todos los assets
     */
    function configurePack(
        uint256 packId,
        uint256[] calldata assetIds,
        uint32 itemsPerPack,
        bool active
    ) external onlyOwner {
        require(assetIds.length > 0, "Empty asset list");
        require(itemsPerPack > 0, "Items per pack must be > 0");
        
        // Sin validación - aceptar todos los assets
        delete packAssets[packId];
        for (uint256 i = 0; i < assetIds.length; i++) {
            packAssets[packId].push(assetIds[i]);
        }
        
        packConfigs[packId].itemsPerPack = itemsPerPack;
        packConfigs[packId].active = active;
        
        emit PackConfigured(packId, assetIds.length, itemsPerPack, active);
    }

    /**
     * @notice Actualiza automáticamente assets del pack eliminando los sin supply
     */
    function refreshPackAssets(uint256 packId) external onlyOwner {
        uint256[] storage currentAssets = packAssets[packId];
        require(currentAssets.length > 0, "Pack not configured");
        
        uint256[] memory validAssets = new uint256[](currentAssets.length);
        uint256 validCount = 0;
        
        // Filtrar assets que tienen supply disponible
        for (uint256 i = 0; i < currentAssets.length; i++) {
            uint256 assetId = currentAssets[i];
            if (_hasAvailableSupply(assetId)) {
                validAssets[validCount] = assetId;
                validCount++;
            }
        }
        
        require(validCount > 0, "No assets with supply available");
        
        // Actualizar solo si hay cambios
        if (validCount != currentAssets.length) {
            delete packAssets[packId];
            for (uint256 i = 0; i < validCount; i++) {
                packAssets[packId].push(validAssets[i]);
            }
            
            uint256 removedCount = currentAssets.length - validCount;
            emit PackAssetsUpdated(packId, removedCount);
        }
    }

    function setPackActive(uint256 packId, bool active) external onlyOwner {
        packConfigs[packId].active = active;
    }

    // =============== SINGLE TRANSACTION OPENING ===============
    
    function openPacks(uint256 packId, uint32 quantity) external nonReentrant {
        require(quantity > 0 && quantity <= 50, "Invalid quantity");
        require(packConfigs[packId].active, "Pack not active");
        require(packAssets[packId].length > 0, "Pack not configured");
        require(traitsCore.balanceOf(msg.sender, packId) >= quantity, "Insufficient pack balance");
        
        PackConfig memory config = packConfigs[packId];
        uint256[] memory availableAssets = _getAvailableAssets(packId);
        require(availableAssets.length >= config.itemsPerPack, "Not enough assets with supply");
        
        // Generate deterministic but unpredictable seed (sin block.timestamp)
        uint256 baseSeed = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            msg.sender,
            ++globalNonce
        )));
        
        // PRE-CALCULATE all rewards to avoid changing simulation
        uint256[] memory allRewards = new uint256[](uint256(quantity) * config.itemsPerPack);
        uint256 rewardIndex = 0;
        
        for (uint32 pack = 0; pack < quantity; pack++) {
            uint256 packSeed = uint256(keccak256(abi.encodePacked(baseSeed, pack)));
            
            for (uint32 item = 0; item < config.itemsPerPack; item++) {
                uint256 itemSeed = uint256(keccak256(abi.encodePacked(packSeed, item)));
                uint256 selectedIndex = itemSeed % availableAssets.length;
                allRewards[rewardIndex] = availableAssets[selectedIndex];
                rewardIndex++;
            }
        }
        
        // Execute all mints at once
        uint32 packsOpened = 0;
        rewardIndex = 0;
        
        for (uint32 pack = 0; pack < quantity; pack++) {
            bool packSuccess = true;
            
            // Try to mint all items for this pack
            for (uint32 item = 0; item < config.itemsPerPack; item++) {
                try traitsCore.mintFromExtension(msg.sender, allRewards[rewardIndex], 1) {
                    rewardIndex++;
                } catch {
                    // Rollback this pack's items
                    for (uint32 rollback = 0; rollback < item; rollback++) {
                        try traitsCore.burnFromExtension(msg.sender, allRewards[rewardIndex - item + rollback], 1) {} catch {}
                    }
                    // Skip remaining items of this pack
                    rewardIndex += (config.itemsPerPack - item);
                    packSuccess = false;
                    break;
                }
            }
            
            if (packSuccess) {
                packsOpened++;
            }
        }
        
        // Burn successfully opened packs
        if (packsOpened > 0) {
            traitsCore.burnFromExtension(msg.sender, packId, packsOpened);
        }
        
        // Resize rewards to actual minted items
        uint256 actualRewards = uint256(packsOpened) * config.itemsPerPack;
        assembly {
            mstore(allRewards, actualRewards)
        }
        
        emit PacksOpened(msg.sender, packId, quantity, packsOpened, allRewards);
    }

    // =============== INTERNAL FUNCTIONS ===============
    
    function _getAvailableAssets(uint256 packId) private view returns (uint256[] memory) {
        uint256[] storage allAssets = packAssets[packId];
        uint256[] memory available = new uint256[](allAssets.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allAssets.length; i++) {
            if (_hasAvailableSupply(allAssets[i])) {
                available[count] = allAssets[i];
                count++;
            }
        }
        
        // Resize array
        assembly {
            mstore(available, count)
        }
        
        return available;
    }
    
    function _hasAvailableSupply(uint256 assetId) private view returns (bool) {
        try traitsCore.getAvailableSupply(assetId) returns (uint256 available) {
            return available > 0;
        } catch {
            // If getAvailableSupply fails, check if asset exists and assume it has supply
            try traitsCore.exists(assetId) returns (bool exists) {
                return exists;
            } catch {
                return false;
            }
        }
    }

    // =============== VIEW FUNCTIONS ===============
    
    function getPackAssets(uint256 packId) external view returns (uint256[] memory) {
        return packAssets[packId];
    }
    
    function getAvailablePackAssets(uint256 packId) external view returns (uint256[] memory) {
        return _getAvailableAssets(packId);
    }

    function canOpenPack(address user, uint256 packId) external view returns (bool, string memory) {
        if (!packConfigs[packId].active) return (false, "Pack not active");
        if (traitsCore.balanceOf(user, packId) == 0) return (false, "No packs");
        if (packAssets[packId].length == 0) return (false, "Pack not configured");
        
        uint256[] memory available = _getAvailableAssets(packId);
        if (available.length < packConfigs[packId].itemsPerPack) {
            return (false, "Not enough assets with supply");
        }
        
        return (true, "Can open");
    }

    // =============== DEBUG FUNCTIONS ===============
    
    function debugMintAsset(uint256 assetId) external onlyOwner {
        try traitsCore.mintFromExtension(msg.sender, assetId, 1) {
            // Success
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("Debug mint failed: ", reason)));
        } catch {
            revert("Debug mint failed: unknown error");
        }
    }
}
