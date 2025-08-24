/**
 * TRAITLAB - Módulo de Configuración
 * Contiene todas las constantes, contratos y configuración base
 */

console.log('🚀 CONFIG.JS: Archivo cargado y ejecutándose...');

// API Configuration
const ALCHEMY_API_KEY = "5qIXA1UZxOAzi8b9l0nrYmsQBO9-W7Ot";
const ALCHEMY_RPC_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

// Network Configuration
const BASE_NETWORK = {
    chainId: "0x2105", // 8453 in hex
    chainName: "Base Mainnet",
    nativeCurrency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18,
    },
    rpcUrls: [ALCHEMY_RPC_URL],
    blockExplorerUrls: ["https://basescan.org/"],
};

// Contract Addresses
const CONTRACTS = {
    ERC721: "0x6e369bf0e4e0c106192d606fb6d85836d684da75", // AdrianZERO
    ERC1155: "0x90546848474fb3c9fda3fdad887969bb244e7e58" // AdrianLAB
};

// AdrianTraitsExtensions contract
const TRAITS_EXTENSIONS_CONTRACT = "0x0995c0dA1ca071b792E852b6Ec531b7cD7d1F8D6";

// PackTokenMinter contract
const PACK_TOKEN_MINTER_CONTRACT = "0x673bE1968A12470F93BE374AAB529a89d5D607d5";

// AdrianNameRegistry contract
const ADRIAN_NAME_REGISTRY_CONTRACT = "0xaeC5ED33c88c1943BB7452aC4B571ad0b4c4068C";

// ActionPacks contract (para abrir packs 15008-15015)
const ACTION_PACKS_CONTRACT = "0xa7e2ae50e7f15d220cd3f61728e52d0e6e1b2e36";

// Nuevo contrato para abrir pack del floppy 10003
const NEW_FLOPPY_PACK_CONTRACT = "0x03f501158103dd54A23898bADf8E77Cb8305EB38";

// Nuevo contrato para Golden Floppy 10005
const ADRIAN_FLOPPY_DISCS_CONTRACT = "0x56B3fCc1417f269138CB7eBA1272e8Ccfee8fFc8";

// Contrato para ActionPack 10007
const ACTION_PACK_10007_CONTRACT = "0xA7e2Ae50E7f15D220CD3f61728E52D0E6e1b2E36";

// SerumModule contract address
const SERUM_MODULE_CONTRACT = "0xEb84a51F8d59d1C55cACFd15074AeB104D82B2ec";

// ADRIAN token contract
const ADRIAN_TOKEN = "0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea";

// AdrianLabCore contract address
const ADRIAN_LAB_CORE_CONTRACT = "0x6e369bf0e4e0c106192d606fb6d85836d684da75";

// Minimal ABI for AdrianNameRegistry used by ZERO rename & name overrides
const ADRIAN_NAME_REGISTRY_ABI = [
    // Read price
    "function namePrice() view returns (uint256)",
    // Optional introspection (logged if present)
    "function getCoreContract() view returns (address)",
    // Rename action
    "function rename(uint256 tokenId, string name)"
];

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        ALCHEMY_API_KEY,
        ALCHEMY_RPC_URL,
        BASE_NETWORK,
        CONTRACTS,
        TRAITS_EXTENSIONS_CONTRACT,
        PACK_TOKEN_MINTER_CONTRACT,
        ADRIAN_NAME_REGISTRY_CONTRACT,
        ACTION_PACKS_CONTRACT,
        NEW_FLOPPY_PACK_CONTRACT,
        ADRIAN_FLOPPY_DISCS_CONTRACT,
        ACTION_PACK_10007_CONTRACT,
        SERUM_MODULE_CONTRACT,
        ADRIAN_TOKEN,
        ADRIAN_LAB_CORE_CONTRACT,
        ADRIAN_NAME_REGISTRY_ABI
    };
} else {
    // Browser environment - attach to window
    console.log('🔧 Config.js: Setting up window.TraitLABConfig...');
    console.log('🔧 Config.js: ADRIAN_NAME_REGISTRY_ABI value:', ADRIAN_NAME_REGISTRY_ABI);
    window.TraitLABConfig = {
        ALCHEMY_API_KEY,
        ALCHEMY_RPC_URL,
        BASE_NETWORK,
        CONTRACTS,
        TRAITS_EXTENSIONS_CONTRACT,
        PACK_TOKEN_MINTER_CONTRACT,
        ADRIAN_NAME_REGISTRY_CONTRACT,
        ACTION_PACKS_CONTRACT,
        NEW_FLOPPY_PACK_CONTRACT,
        ADRIAN_FLOPPY_DISCS_CONTRACT,
        ACTION_PACK_10007_CONTRACT,
        SERUM_MODULE_CONTRACT,
        ADRIAN_TOKEN,
        ADRIAN_LAB_CORE_CONTRACT,
        ADRIAN_NAME_REGISTRY_ABI
    };
    console.log('🔧 Config.js: window.TraitLABConfig setup complete:', window.TraitLABConfig);
    console.log('🔧 Config.js: Verificando ABI específica:', window.TraitLABConfig.ADRIAN_NAME_REGISTRY_ABI);
}
