/**
 * TraitLAB Configuration
 * Configuración centralizada para TraitLAB v2
 */
class TraitLABConfig {
    constructor() {
        this.CONTRACTS = {
            ERC721: "0x6e369bf0e4e0c106192d606fb6d85836d684da75", // AdrianZERO
            ERC1155: "0x90546848474fb3c9fda3fdad887969bb244e7e58", // AdrianLAB
            CRAFTING: "0x1234567890123456789012345678901234567890" // Placeholder
        };
        
        this.ALCHEMY_API_KEY = "5qIXA1UZxOAzi8b9l0nrYmsQBO9-W7Ot";
        this.ALCHEMY_BASE_URL = "https://base-mainnet.g.alchemy.com/nft/v3";
        
        this.NETWORK = {
            name: "Base Mainnet",
            chainId: 8453,
            rpcUrl: "https://mainnet.base.org"
        };
        
        console.log('⚙️ TraitLABConfig: Configuración inicializada');
    }

    /**
     * Obtener contrato por tipo
     */
    getContract(type) {
        return this.CONTRACTS[type] || null;
    }

    /**
     * Obtener URL de Alchemy
     */
    getAlchemyUrl() {
        return this.ALCHEMY_BASE_URL;
    }

    /**
     * Obtener API key de Alchemy
     */
    getAlchemyApiKey() {
        return this.ALCHEMY_API_KEY;
    }

    /**
     * Obtener configuración de red
     */
    getNetwork() {
        return this.NETWORK;
    }
}

// Crear instancia global
window.TraitLABConfig = new TraitLABConfig();
