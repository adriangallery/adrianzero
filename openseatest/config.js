// OpenSea API Configuration
const OPENSEA_CONFIG = {
    // Contract address for AdrianZERO collection
    CONTRACT_ADDRESS: '0x6e369bf0e4e0c106192d606fb6d85836d684da75',
    
    // Collection slug (you may need to adjust this)
    COLLECTION_SLUG: 'adrianzero',
    
    // OpenSea API endpoints
    API_BASE_URL: 'https://api.opensea.io/api/v2',
    
    // API endpoints
    ENDPOINTS: {
        COLLECTION: '/collection',
        NFTS: '/nfts',
        ORDERS: '/orders',
        EVENTS: '/events',
        ASSET: '/asset'
    },
    
    // Rate limiting (requests per minute)
    RATE_LIMIT: {
        FREE: 1, // Free tier: 1 request per second
        PRO: 10  // Pro tier: 10 requests per second
    },
    
    // Default parameters
    DEFAULT_PARAMS: {
        LIMIT: 20,
        OFFSET: 0
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OPENSEA_CONFIG;
}
