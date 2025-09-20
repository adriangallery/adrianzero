// Configuración de la aplicación AdrianLAB
const CONFIG = {
    // Configuración de la API de OpenSea
    OPENSEA: {
        API_BASE_URL: 'https://api.opensea.io/api/v2',
        API_KEY: process.env.OPENSEA_API_KEY || 'OPENSEA_API_KEY', // Se reemplazará con la clave real
        RATE_LIMIT: {
            REQUESTS_PER_SECOND: 2,
            REQUESTS_PER_MINUTE: 100
        }
    },
    
    // Configuración de la colección AdrianLAB
    COLLECTION: {
        CONTRACT_ADDRESS: '0x90546848474FB3c9fda3fdAd887969bB244E7e58',
        NAME: 'AdrianLAB',
        DESCRIPTION: 'Colección NFT experimental de AdrianLAB',
        WEBSITE: 'https://adrianzero.com',
        TWITTER: '@adrianzero'
    },
    
    // Configuración de la UI
    UI: {
        ITEMS_PER_PAGE: 20,
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000,
        ANIMATION_DURATION: 300
    },
    
    // Configuración de endpoints específicos
    ENDPOINTS: {
        COLLECTION: '/chain/ethereum/contract',
        COLLECTION_STATS: '/collections',
        NFTS: '/chain/ethereum/contract',
        EVENTS: '/events/collection',
        LISTINGS: '/orders/ethereum/seaport/listings',
        OFFERS: '/orders/ethereum/seaport/offers'
    },
    
    // Configuración de errores
    ERROR_MESSAGES: {
        API_KEY_INVALID: 'API Key inválida o faltante',
        RATE_LIMIT_EXCEEDED: 'Límite de rate excedido',
        NETWORK_ERROR: 'Error de red',
        NOT_FOUND: 'Recurso no encontrado',
        SERVER_ERROR: 'Error del servidor'
    },
    
    // Configuración de fallbacks
    FALLBACKS: {
        IMAGE_PLACEHOLDER: 'https://via.placeholder.com/280x250?text=Sin+Imagen',
        ERROR_IMAGE: 'https://via.placeholder.com/280x250?text=Error+Imagen',
        DEFAULT_AVATAR: 'https://via.placeholder.com/40x40?text=U'
    }
};

// Función para obtener la configuración
function getConfig() {
    return CONFIG;
}

// Función para actualizar la API key
function updateApiKey(apiKey) {
    CONFIG.OPENSEA.API_KEY = apiKey;
}

// Función para obtener la URL completa de un endpoint
function getEndpointUrl(endpoint, params = {}) {
    const baseUrl = CONFIG.OPENSEA.API_BASE_URL;
    let url = `${baseUrl}${endpoint}`;
    
    // Agregar parámetros si existen
    if (Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
    }
    
    return url;
}

// Función para obtener headers de la API
function getApiHeaders() {
    return {
        'X-API-KEY': CONFIG.OPENSEA.API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        getConfig,
        updateApiKey,
        getEndpointUrl,
        getApiHeaders
    };
}
