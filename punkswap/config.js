/**
 * Punkswap Configuration
 * Configuración de contratos y direcciones para el sistema de swap
 */

class PunkswapConfig {
    constructor() {
        // Contract addresses
        this.SWAP_CONTRACT = "0xd184A1153fb6970250c58BB3c5C282140D1c5701"; // AdrianGallerySwap
        this.GALLERY_CONTRACT = "0xa92a8F5A47efC77da796dfD0827D07872E7D0429"; // AdrianGallery (ERC1155)
        this.PUNKS_CONTRACT = "0x79BE8AcdD339C7b92918fcC3fd3875b5Aaad7566"; // AdrianPunks (ERC721)
        
        // Network configuration
        this.NETWORK = {
            name: "Base Mainnet",
            chainId: 8453,
            chainIdHex: "0x2105",
            rpcUrl: "https://mainnet.base.org"
        };
        
        // Alchemy configuration
        this.ALCHEMY_API_KEY = "5qIXA1UZxOAzi8b9l0nrYmsQBO9-W7Ot";
        this.ALCHEMY_RPC_URL = `https://base-mainnet.g.alchemy.com/v2/${this.ALCHEMY_API_KEY}`;
        
        // Cache configuration
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
        this.CACHE_KEY = 'punkswap_cache';
        
        // Contract ABIs
        this.SWAP_ABI = [
            "function swap(uint256[] calldata ids, uint256[] calldata amounts, uint256 minPunks) external",
            "function quoteUnits(uint256[] calldata ids, uint256[] calldata amounts) external view returns (uint256 units, uint256 punksOut)",
            "function depositPunks(uint256[] calldata tokenIds) external",
            "function bagSize() external view returns (uint256)",
            "function isInBag(uint256 tokenId) external view returns (bool)",
            "function unitById(uint256) external view returns (uint8)",
            "function allowedId(uint256) external view returns (bool)",
            "function paused() external view returns (bool)",
            "function maxPunksOut() external view returns (uint256)",
            "function totalPunksOut() external view returns (uint256)",
            "function punkCount() external view returns (uint256)",
            "event SwapExecuted(address indexed user, uint256 unitsSpent, uint256 punksOut, uint256[] ids, uint256[] amounts)"
        ];

        this.GALLERY_ABI = [
            "function balanceOf(address account, uint256 id) external view returns (uint256)",
            "function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) external view returns (uint256[] memory)",
            "function isApprovedForAll(address account, address operator) external view returns (bool)",
            "function setApprovalForAll(address operator, bool approved) external",
            "function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external"
        ];

        this.PUNKS_ABI = [
            "function balanceOf(address owner) external view returns (uint256)",
            "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
            "function ownerOf(uint256 tokenId) external view returns (address)"
        ];

        // Allowed Gallery IDs (from constructor defaults)
        this.ALLOWED_IDS = [
            { id: 1, name: "GENESIS", units: 6 }, // 3 punks
            { id: 3, name: "TRUE ASCENDANT", units: 6 }, // 3 punks
            { id: 4, name: "ASCENSION", units: 2 }, // 1 punk
            { id: 6, name: "THE BURNED FORTUNE", units: 2 }, // 1 punk
            { id: 15, name: "THE OFFERING", units: 1 }, // 0.5 punk
            { id: 16, name: "ORACLE", units: 1 } // 0.5 punk
        ];

        console.log('⚙️ PunkswapConfig: Configuración inicializada');
    }

    /**
     * Obtener provider para lecturas (Alchemy RPC)
     */
    getReadProvider() {
        if (typeof ethers === 'undefined') {
            throw new Error('Ethers library not loaded');
        }
        return new ethers.providers.JsonRpcProvider(this.ALCHEMY_RPC_URL);
    }

    /**
     * Obtener provider para transacciones (Web3Provider)
     */
    async getWriteProvider() {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask is not installed');
        }
        if (typeof ethers === 'undefined') {
            throw new Error('Ethers library not loaded');
        }
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        return provider;
    }

    /**
     * Obtener datos del caché
     */
    getCachedData() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < this.CACHE_DURATION) {
                    console.log('📦 Using cached data');
                    return data;
                }
            }
        } catch (error) {
            console.warn('Error reading cache:', error);
        }
        return null;
    }

    /**
     * Guardar datos en caché
     */
    setCachedData(data) {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify({
                ...data,
                timestamp: Date.now()
            }));
            console.log('💾 Data cached successfully');
        } catch (error) {
            console.warn('Error saving cache:', error);
        }
    }

    /**
     * Limpiar caché
     */
    clearCache() {
        try {
            localStorage.removeItem(this.CACHE_KEY);
            console.log('🗑️ Cache cleared');
        } catch (error) {
            console.warn('Error clearing cache:', error);
        }
    }

    /**
     * Verificar si el contrato de swap está desplegado
     */
    isSwapContractDeployed() {
        return this.SWAP_CONTRACT !== "0x0000000000000000000000000000000000000000";
    }

    /**
     * Actualizar dirección del contrato de swap
     */
    updateSwapContract(address) {
        this.SWAP_CONTRACT = address;
        console.log('✅ Swap contract address updated:', address);
    }
}

// Crear instancia global
window.PunkswapConfig = new PunkswapConfig();

