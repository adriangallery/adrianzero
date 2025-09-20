/**
 * AdrianREWARDS Configuration
 * Configuración de contratos y direcciones para el sistema de recompensas
 */

class RewardsConfig {
    constructor() {
        // Contract addresses
        this.REWARDS_CONTRACT = "0x5b8c47176432f0b587ca31c4ccc61d0513814be1"; // AdrianOGREWARDS deployed contract
        this.PUNKS_CONTRACT = "0x79BE8AcdD339C7b92918fcC3fd3875b5Aaad7566"; // AdrianPunks
        this.TRAITS_CORE_CONTRACT = "0x90546848474fb3c9fda3fdad887969bb244e7e58"; // AdrianLAB
        
        // Network configuration
        this.NETWORK = {
            name: "Base Mainnet",
            chainId: 8453,
            rpcUrl: "https://mainnet.base.org"
        };
        
        // Contract ABIs
        this.REWARDS_ABI = [
            "function getCampaign(uint256 campaignId) external view returns (tuple(uint256 assetId, uint256 amountPerToken, uint64 startTime, uint64 endTime, bool active, uint256 totalClaimed))",
            "function canClaim(uint256 campaignId, uint256 punkId, address user) external view returns (bool, string)",
            "function hasClaimed(uint256 campaignId, uint256 punkId) external view returns (bool)",
            "function claim(uint256 campaignId, uint256 punkId) external",
            "function batchClaim(uint256 campaignId, uint256[] calldata punkIds) external",
            "function currentCampaignId() external view returns (uint256)",
            "event Claimed(uint256 indexed campaignId, address indexed account, uint256 indexed punkId, uint256 assetId, uint256 amount)",
            "event BatchClaimed(uint256 indexed campaignId, address indexed account, uint256 count)"
        ];

        this.PUNKS_ABI = [
            "function balanceOf(address owner) external view returns (uint256)",
            "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
            "function ownerOf(uint256 tokenId) external view returns (address)"
        ];

        this.TRAITS_CORE_ABI = [
            "function mintFromExtension(address to, uint256 id, uint256 amount) external"
        ];

        // Mock campaigns for testing (will be replaced with real data from contract)
        this.MOCK_CAMPAIGNS = [
            {
                id: 1,
                assetId: 10001,
                amountPerToken: 1,
                startTime: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
                endTime: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days from now
                active: true,
                totalClaimed: 0,
                name: "OG Serum Pack",
                description: "Serum especial para holders OG",
                image: "https://via.placeholder.com/200x200/00ff88/000000?text=OG+Serum"
            },
            {
                id: 2,
                assetId: 10002,
                amountPerToken: 2,
                startTime: Math.floor(Date.now() / 1000) - 86400 * 2,
                endTime: Math.floor(Date.now() / 1000) + 86400 * 15,
                active: true,
                totalClaimed: 0,
                name: "Rare Floppy",
                description: "Floppy raro para la comunidad OG",
                image: "https://via.placeholder.com/200x200/ff6b35/ffffff?text=Rare+Floppy"
            },
            {
                id: 3,
                assetId: 10003,
                amountPerToken: 1,
                startTime: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
                endTime: Math.floor(Date.now() / 1000) + 86400 * 37,
                active: false,
                totalClaimed: 0,
                name: "Future Reward",
                description: "Recompensa futura para la comunidad",
                image: "https://via.placeholder.com/200x200/666666/ffffff?text=Future+Reward"
            }
        ];

        console.log('⚙️ RewardsConfig: Configuración inicializada');
    }

    /**
     * Obtener contrato por tipo
     */
    getContract(type) {
        const contracts = {
            'rewards': this.REWARDS_CONTRACT,
            'punks': this.PUNKS_CONTRACT,
            'traits': this.TRAITS_CORE_CONTRACT
        };
        return contracts[type] || null;
    }

    /**
     * Obtener ABI por tipo
     */
    getABI(type) {
        const abis = {
            'rewards': this.REWARDS_ABI,
            'punks': this.PUNKS_ABI,
            'traits': this.TRAITS_CORE_ABI
        };
        return abis[type] || null;
    }

    /**
     * Obtener configuración de red
     */
    getNetwork() {
        return this.NETWORK;
    }

    /**
     * Verificar si el contrato de recompensas está desplegado
     */
    isRewardsContractDeployed() {
        return this.REWARDS_CONTRACT !== "0x0000000000000000000000000000000000000000";
    }

    /**
     * Actualizar dirección del contrato de recompensas
     */
    updateRewardsContract(address) {
        this.REWARDS_CONTRACT = address;
        console.log('✅ Rewards contract address updated:', address);
    }
}

// Crear instancia global
window.RewardsConfig = new RewardsConfig();

// 🚨 DEBUG: Verificar que el módulo se está cargando correctamente
console.log('🔧 DEBUG RewardsConfig: Módulo config.js cargado');
console.log('🔧 DEBUG RewardsConfig: window.RewardsConfig:', window.RewardsConfig);
console.log('🔧 DEBUG RewardsConfig: PUNKS_CONTRACT:', window.RewardsConfig?.PUNKS_CONTRACT);
console.log('🔧 DEBUG RewardsConfig: TRAITS_CORE_CONTRACT:', window.RewardsConfig?.TRAITS_CORE_CONTRACT);
