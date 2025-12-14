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
        this.TRAITS_EXTENSIONS_CONTRACT = "0x0995c0dA1ca071b792E852b6Ec531b7cD7d1F8D6"; // AdrianTraitsExtensions (usado para applyTraits)
        this.ADRIAN_CRAFTING_CONTRACT = "0x9ab651F50ac78A13a1612CCDDF5a074B2e570829";
        this.ADRIAN_NAME_REGISTRY_CONTRACT = "0xaeC5ED33c88c1943BB7452aC4B571ad0b4c4068C";
        this.ACTION_PACKS_CONTRACT = "0xa7e2ae50e7f15d220cd3f61728e52d0e6e1b2e36";
        this.NEW_FLOPPY_PACK_CONTRACT = "0x03f501158103dd54A23898bADf8E77Cb8305EB38";
        this.ADRIAN_FLOPPY_DISCS_CONTRACT = "0x56B3fCc1417f269138CB7eBA1272e8Ccfee8fFc8";
        this.PACK_TOKEN_MINTER_CONTRACT = "0x673bE1968A12470F93BE374AAB529a89d5D607d5";
        this.ACTION_PACK_10007_CONTRACT = "0xA7e2Ae50E7f15D220CD3f61728E52D0E6e1b2E36";
        this.OPENPACK_V4_CONTRACT = "0x238083148F4FBF4232efe16261e7aa87CE787022";
        this.SERUM_MODULE_CONTRACT = "0xEb84a51F8d59d1C55cACFd15074AeB104D82B2ec";
        this.ZOOM_TOGGLE_CONTRACT = "0x568933634be4027339c80F126C91742d41A515A0";
        this.ADRIAN_TOKEN = "0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea";
        
        // API keys de Alchemy - se cargarán desde config-keys.js si está disponible
        this.ALCHEMY_API_KEYS = ["pqRmKgTaLqm2eak9iML1f"]; // Fallback keys (sin primary key hardcodeada)
        this.ALCHEMY_API_KEY = "pqRmKgTaLqm2eak9iML1f"; // Mantener para compatibilidad
        this.ALCHEMY_BASE_URL = "https://base-mainnet.g.alchemy.com/nft/v3";
        
        this.NETWORK = {
            name: "Base Mainnet",
            chainId: 8453,
            rpcUrl: "https://mainnet.base.org"
        };
        
        // Múltiples RPC providers para Base con fallback
        this.BASE_RPC_URLS = [
            "https://mainnet.base.org",
            "https://base-mainnet.g.alchemy.com/v2/pqRmKgTaLqm2eak9iML1f",
            "https://base.llamarpc.com",
            "https://base-rpc.publicnode.com"
        ];
        
        // Cargar keys desde config-keys.js si está disponible
        this.loadAlchemyKeysFromConfig();

        // ABI mínimos necesarios
        this.ERC20_ABI = [
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function balanceOf(address owner) view returns (uint256)"
        ];

        // ABI del Name Registry (métodos usados)
        this.ADRIAN_NAME_REGISTRY_ABI = [
            "function setTokenName(uint256 tokenId, string newName)",
            "function getTokenName(uint256 tokenId) view returns (string)",
            "function namePrice() view returns (uint256)",
            "function getCoreContract() view returns (address)"
        ];
        
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
     * Cargar API keys desde config-keys.js (generado por GitHub Actions)
     * Si no está disponible, usa las keys de fallback
     */
    loadAlchemyKeysFromConfig() {
        try {
            if (window.ALCHEMY_KEYS_CONFIG) {
                const config = window.ALCHEMY_KEYS_CONFIG;
                // Construir array con primary primero, luego fallbacks
                this.ALCHEMY_API_KEYS = [];
                if (config.primary) {
                    this.ALCHEMY_API_KEYS.push(config.primary);
                }
                if (config.fallbacks && Array.isArray(config.fallbacks)) {
                    this.ALCHEMY_API_KEYS.push(...config.fallbacks);
                }
                // Actualizar también ALCHEMY_API_KEY para compatibilidad
                this.ALCHEMY_API_KEY = this.ALCHEMY_API_KEYS[0] || "pqRmKgTaLqm2eak9iML1f";
                console.log('✅ TraitLABConfig: API keys cargadas desde config-keys.js');
            } else {
                console.log('⚠️ TraitLABConfig: config-keys.js no disponible, usando keys de fallback');
            }
        } catch (error) {
            console.warn('⚠️ TraitLABConfig: Error cargando config-keys.js:', error.message);
        }
    }

    /**
     * Obtener API key de Alchemy (compatibilidad)
     */
    getAlchemyApiKey() {
        return this.ALCHEMY_API_KEY;
    }

    /**
     * Obtener API key de Alchemy por índice (para fallback)
     * @param {number} index - Índice de la key (0 = primaria)
     * @returns {string|null} API key o null si el índice no existe
     */
    getAlchemyApiKeyWithFallback(index = 0) {
        if (index >= 0 && index < this.ALCHEMY_API_KEYS.length) {
            return this.ALCHEMY_API_KEYS[index];
        }
        return this.ALCHEMY_API_KEYS[0] || null;
    }

    /**
     * Obtener todas las API keys disponibles
     * @returns {string[]} Array de API keys
     */
    getAllAlchemyApiKeys() {
        return [...this.ALCHEMY_API_KEYS];
    }

    /**
     * Obtener configuración de red
     */
    getNetwork() {
        return this.NETWORK;
    }

    /**
     * Crear provider con fallbacks para Base
     * Usa múltiples RPC endpoints para mayor confiabilidad
     * Mejorado: Manejo de errores cuando todos los providers fallan
     */
    getBaseProviderWithFallback() {
        if (typeof ethers === 'undefined') {
            console.warn('Ethers no disponible para crear provider con fallback');
            return null;
        }
        
        try {
            const providers = this.BASE_RPC_URLS.map(url => {
                try {
                    return new ethers.providers.JsonRpcProvider(url);
                } catch (error) {
                    console.warn(`⚠️ Error creando provider para ${url}:`, error.message);
                    return null;
                }
            }).filter(p => p !== null); // Filtrar providers que fallaron al crear
            
            if (providers.length === 0) {
                console.error('❌ No se pudo crear ningún provider con fallback');
                return null;
            }
            
            // FallbackProvider intenta cada provider en orden hasta que uno funcione
            // El segundo parámetro (1) es el quorum - número de providers que deben responder
            const fallbackProvider = new ethers.providers.FallbackProvider(providers, 1);
            
            // Agregar manejo de errores al provider
            providers.forEach((provider, index) => {
                provider.on('error', (error) => {
                    console.warn(`⚠️ Provider ${index} (${this.BASE_RPC_URLS[index]}) falló:`, error.message);
                    // El FallbackProvider automáticamente intentará el siguiente
                });
            });
            
            return fallbackProvider;
        } catch (error) {
            console.error('❌ Error creando FallbackProvider:', error);
            // Si falla completamente, retornar null para usar fallback a MetaMask
            return null;
        }
    }
}

// Crear instancia global
window.TraitLABConfig = new TraitLABConfig();

// Config module loaded
