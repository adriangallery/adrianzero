/**
 * TraitLAB Configuration
 * Configuración centralizada para TraitLAB v2
 */
class TraitLABConfig {
    constructor() {
        this.CONTRACTS = {
            ERC721: "0x6e369bf0e4e0c106192d606fb6d85836d684da75", // AdrianZERO
            ERC1155: "0x90546848474fb3c9fda3fdad887969bb244e7e58", // AdrianLAB
            CRAFTING: "0x9ab651F50ac78A13a1612CCDDF5a074B2e570829" // AdrianCrafting
        };
        
        // Contratos adicionales
        this.ADRIAN_LAB_CORE_CONTRACT = "0x6e369bf0e4e0c106192d606fb6d85836d684da75"; // AdrianZERO (usado para activateToken)
        this.TRAITS_EXTENSIONS_CONTRACT = "0x6e369bf0e4e0c106192d606fb6d85836d684da75"; // AdrianZERO (usado para applyTraits)
        this.ADRIAN_CRAFTING_CONTRACT = "0x9ab651F50ac78A13a1612CCDDF5a074B2e570829";
        this.ADRIAN_NAME_REGISTRY_CONTRACT = "0xaeC5ED33c88c1943BB7452aC4B571ad0b4c4068C";
        this.ACTION_PACKS_CONTRACT = "0xa7e2ae50e7f15d220cd3f61728e52d0e6e1b2e36";
        this.NEW_FLOPPY_PACK_CONTRACT = "0x03f501158103dd54A23898bADf8E77Cb8305EB38";
        this.ADRIAN_FLOPPY_DISCS_CONTRACT = "0x56B3fCc1417f269138CB7eBA1272e8Ccfee8fFc8";
        this.PACK_TOKEN_MINTER_CONTRACT = "0x673bE1968A12470F93BE374AAB529a89d5D607d5";
        this.ACTION_PACK_10007_CONTRACT = "0xA7e2Ae50E7f15D220CD3f61728E52D0E6e1b2E36";
        this.SERUM_MODULE_CONTRACT = "0xEb84a51F8d59d1C55cACFd15074AeB104D82B2ec";
        this.ADRIAN_TOKEN = "0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea";
        
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
