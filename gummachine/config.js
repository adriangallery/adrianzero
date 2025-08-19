// Configuration file for Adrian Gumball Machine
const CONFIG = {
    // Network Configuration
    NETWORK: {
        CHAIN_ID: '0x2105', // Base Mainnet (8453)
        CHAIN_NAME: 'Base Mainnet',
        NATIVE_CURRENCY: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
        },
        RPC_URLS: ['https://mainnet.base.org'],
        BLOCK_EXPLORER_URLS: ['https://basescan.org/'],
    },
    
    // Contract Configuration
    CONTRACT: {
        ADDRESS: '0x...', // TODO: Add actual deployed contract address
        ABI: [
            "function requestPlayETH(uint32 qty) external payable",
            "function requestPlayToken(uint32 qty) external",
            "function availableSupply() external view returns (uint256)",
            "function freeSupply() external view returns (uint256)",
            "function priceETH() external view returns (uint256)",
            "function priceToken() external view returns (uint256)",
            "function paymentToken() external view returns (address)",
            "function getClaimHistory() external view returns (uint256[] memory tokenIds, uint64[] memory timestamps)",
            "function getClaimHistoryExtended() external view returns (uint256[] memory tokenIds, address[] memory tos, uint64[] memory timestamps, address[] memory payTokens, uint256[] memory unitPrices)",
            "function getRequest(uint256 requestId) external view returns (address user, uint32 qty, uint64 requestBlock, bool fulfilled, address payTok, uint256 unitPrice, uint256 totalAmount)",
            "function requestCount() external view returns (uint256)",
            "function claimCount() external view returns (uint256)"
        ]
    },
    
    // UI Configuration
    UI: {
        DEFAULT_QUANTITIES: [1, 3, 5, 10],
        MAX_QUANTITY: 10,
        ANIMATION_DURATION: 300,
        LOADING_DELAY: 2000,
        STATUS_TIMEOUT: 3000
    },
    
    // Features Configuration
    FEATURES: {
        ENABLE_TOKEN_PAYMENTS: false, // Set to true when ERC20 payments are enabled
        ENABLE_HISTORY: true,
        ENABLE_ANIMATIONS: true,
        ENABLE_SOUNDS: false
    },
    
    // API Configuration
    API: {
        ALCHEMY_KEY: '5qIXA1UZxOAzi8b9l0nrYmsQBO9-W7Ot', // Same as traitlab
        ALCHEMY_RPC: 'https://base-mainnet.g.alchemy.com/v2/',
        IPFS_GATEWAY: 'https://ipfs.io/ipfs/'
    },
    
    // Theme Configuration
    THEME: {
        PRIMARY_COLOR: '#00ff88',
        SECONDARY_COLOR: '#ff6b6b',
        BACKGROUND_GRADIENT: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        TEXT_COLOR: '#ffffff',
        ACCENT_COLOR: '#00cc6a'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
