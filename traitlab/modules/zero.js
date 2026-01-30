/**
 * TRAITLAB - Módulo de ZERO
 * Maneja la gestión completa de tokens AdrianZERO (ERC721)
 */

// 🚀 OPTIMIZACIÓN: Request Deduplication para Alchemy API
// Map para rastrear peticiones pendientes y evitar duplicados simultáneos
const pendingAlchemyRequests = new Map();

class ZeroManager {
    constructor() {
        this.selectedERC721 = null;
        this.selectedTokenForRename = null;
        this.namePrice = null;
        this.eventListeners = new Map();

        // Active toggles management
        this.activeToggles = new Map();
        this.activeTogglesLoaded = false;
        
        // Bind methods
        this.loadTokens = this.loadTokens.bind(this);
        this.loadCustomNames = this.loadCustomNames.bind(this);
        this.refreshMetadata = this.refreshMetadata.bind(this);
        this.activateToken = this.activateToken.bind(this);
        this.loadNamePrice = this.loadNamePrice.bind(this);
        this.approveRename = this.approveRename.bind(this);
        this.renameToken = this.renameToken.bind(this);
        this.refreshAdrianZeroToken = this.refreshAdrianZeroToken.bind(this);
        this.setSelectedERC721 = this.setSelectedERC721.bind(this);
        this.getSelectedERC721 = this.getSelectedERC721.bind(this);
        this.clearSelection = this.clearSelection.bind(this);
        this.isAdrianZeroToken = this.isAdrianZeroToken.bind(this);
    }

    /**
     * Initialize zero manager
     */
    init() {
        console.log('🚀 ZeroManager inicializado');
    }

    /**
     * Set selected ERC721 token
     */
    setSelectedERC721(token) {
        this.selectedERC721 = token;
        this.emit('erc721Selected', { token });
    }

    /**
     * Get selected ERC721 token
     */
    getSelectedERC721() {
        return this.selectedERC721;
    }

    /**
     * Clear ERC721 selection
     */
    clearSelection() {
        this.selectedERC721 = null;
        this.selectedTokenForRename = null;
        this.emit('erc721SelectionCleared');
    }

    /**
     * Check if token is an AdrianZERO token
     */
    isAdrianZeroToken(token) {
        return token && token.tokenType === 'ERC721' && 
               token.contract.toLowerCase() === window.TraitLABConfig.CONTRACTS.ERC721.toLowerCase();
    }

    /**
     * Load active toggles from Zoom Toggle contract
     */
    async loadActiveToggles() {
        try {
            console.log('🔍 Loading active toggles from contract...');
            
            // Cargar ethers si no está disponible
            let ethers = window.ethers;
            if (typeof ethers === 'undefined') {
                await this.loadEthers();
                ethers = window.ethers;
            }

            const provider = new ethers.providers.JsonRpcProvider(window.TraitLABConfig.NETWORK.rpcUrl);
            const contract = new ethers.Contract(
                window.TraitLABConfig.ZOOM_TOGGLE_CONTRACT,
                [{
                    "inputs": [],
                    "name": "getAllActiveToggles",
                    "outputs": [{
                        "components": [
                            {"internalType": "uint256", "name": "tokenId", "type": "uint256"}, 
                            {"internalType": "uint256", "name": "toggleId", "type": "uint256"}
                        ], 
                        "internalType": "struct ZoomInZEROS.TokenToggle[]", 
                        "name": "", 
                        "type": "tuple[]"
                    }],
                    "stateMutability": "view",
                    "type": "function"
                }],
                provider
            );

            const activeToggles = await contract.getAllActiveToggles();
            console.log('🔍 Active toggles loaded:', activeToggles);
            
            // Crear mapa de tokenId -> toggleId para acceso rápido
            const toggleMap = new Map();
            activeToggles.forEach(toggle => {
                const tokenId = parseInt(toggle.tokenId.toString());
                const toggleId = parseInt(toggle.toggleId.toString());
                toggleMap.set(tokenId, toggleId);
                console.log(`🔍 Token ${tokenId} has toggle ${toggleId}`);
            });
            
            return toggleMap;
        } catch (error) {
            console.warn('⚠️ Error loading active toggles:', error);
            return new Map(); // Fallback: continuar sin cambios
        }
    }

    /**
     * Load ethers library dynamically
     */
    async loadEthers() {
        return new Promise((resolve, reject) => {
            if (typeof window.ethers !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
            script.onload = () => {
                console.log('✅ Ethers library loaded');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Failed to load ethers library');
                reject(new Error('Failed to load ethers library'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Check if token ID is a floppy token
     * Rangos: 10000-10019 (packs/floppys), 15000-15015 (floppys especiales)
     */
    isFloppyToken(tokenId) {
        return (tokenId >= 10000 && tokenId <= 10019) ||
               (tokenId >= 15000 && tokenId <= 15015) ||
               tokenId === 1123;
    }

    /**
     * Check if token ID is a serum token
     */
    isSerumToken(tokenId) {
        return tokenId >= 262144 && tokenId <= 262147;
    }

    /**
     * Fetch con fallback secuencial de API keys de Alchemy
     * 🚀 OPTIMIZACIÓN: Incluye Request Deduplication para evitar llamadas duplicadas simultáneas
     * @param {string} urlTemplate - Template de URL sin API key (ej: "https://base-mainnet.g.alchemy.com/nft/v3/{API_KEY}/getNFTsForOwner?...")
     * @param {string[]} apiKeys - Array de API keys a probar
     * @param {number} timeout - Timeout en ms (default 15000 para móviles)
     * @returns {Promise<Response>} Response de la petición exitosa
     */
    async fetchWithAlchemyFallback(urlTemplate, apiKeys, timeout = 15000) {
        if (!apiKeys || apiKeys.length === 0) {
            throw new Error('No hay API keys de Alchemy disponibles. Verificar que ALCHEMY_PRIMARY_KEY esté configurado en GitHub Secrets.');
        }

        // 🚀 OPTIMIZACIÓN: Request Deduplication
        // Crear clave de cache basada en la URL sin API key (para que todas las variantes compartan)
        // Normalizar la URL removiendo el placeholder {API_KEY} para crear una clave consistente
        const cacheKey = urlTemplate.replace('{API_KEY}', 'NORMALIZED');

        // Verificar si hay una petición pendiente para esta URL
        if (pendingAlchemyRequests.has(cacheKey)) {
            console.log('🔄 Request deduplication: Reutilizando petición existente para', cacheKey.substring(0, 100) + '...');
            return pendingAlchemyRequests.get(cacheKey);
        }

        // Crear nueva petición y guardarla en el Map
        const requestPromise = this._executeAlchemyFetch(urlTemplate, apiKeys, timeout)
            .finally(() => {
                // Limpiar del Map cuando termine (éxito o error)
                pendingAlchemyRequests.delete(cacheKey);
                console.log('🧹 Request deduplication: Limpiado cache para', cacheKey.substring(0, 100) + '...');
            });

        pendingAlchemyRequests.set(cacheKey, requestPromise);
        console.log('💾 Request deduplication: Nueva petición registrada para', cacheKey.substring(0, 100) + '...');

        return requestPromise;
    }

    /**
     * Ejecuta el fetch real con fallback de API keys (función interna)
     * @private
     */
    async _executeAlchemyFetch(urlTemplate, apiKeys, timeout = 15000) {
        const maxRetriesPerKey = 2;
        const retryDelays = [1000, 2000, 4000]; // Exponential backoff
        const rateLimitDelay = 2000; // Delay cuando hay rate limit (2 segundos)
        let rateLimitCount = 0; // Contador de rate limits consecutivos
        const hasMultipleKeys = apiKeys.length > 1;
        
        for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
            const apiKey = apiKeys[keyIndex];
            const url = urlTemplate.replace('{API_KEY}', apiKey);
            
            for (let retry = 0; retry <= maxRetriesPerKey; retry++) {
                try {
                    const keyInfo = hasMultipleKeys ? `API key ${keyIndex + 1}/${apiKeys.length}` : 'API key';
                    console.log(`🌐 Intentando con ${keyInfo}${retry > 0 ? ` (retry ${retry}/${maxRetriesPerKey})` : ''}`);
                    
                    // Crear AbortController para timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), timeout);
                    
                    const response = await fetch(url, { 
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    // Si es rate limit (429), esperar antes de reintentar
                    if (response.status === 429) {
                        rateLimitCount++;
                        const delay = rateLimitDelay * rateLimitCount; // Delay incremental
                        if (hasMultipleKeys) {
                        console.warn(`⚠️ Rate limit (429) con key ${keyIndex + 1}, esperando ${delay}ms antes de cambiar a siguiente key`);
                        } else {
                            console.warn(`⚠️ Rate limit (429), esperando ${delay}ms antes de reintentar...`);
                        }
                        await new Promise(resolve => setTimeout(resolve, delay));
                        if (hasMultipleKeys) {
                        break; // Salir del loop de retry y probar siguiente key
                        } else {
                            continue; // Reintentar con misma key
                        }
                    }
                    
                    // Si llegamos aquí y no hay rate limit, resetear contador
                    if (response.status !== 429) {
                        rateLimitCount = 0;
                    }
                    
                    // Si es error del servidor (5xx), retry con misma key
                    if (response.status >= 500 && response.status < 600) {
                        if (retry < maxRetriesPerKey) {
                            const delay = retryDelays[retry] || 4000;
                            console.warn(`⚠️ Error del servidor (${response.status}), retry en ${delay}ms...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue; // Retry con misma key
                        } else {
                            if (hasMultipleKeys) {
                            console.warn(`⚠️ Error del servidor (${response.status}) después de ${maxRetriesPerKey} intentos, cambiando a siguiente key`);
                            break; // Cambiar a siguiente key
                            } else {
                                throw new Error(`Error del servidor (${response.status}) después de ${maxRetriesPerKey + 1} intentos. La API key puede no tener permisos o estar inválida.`);
                            }
                        }
                    }
                    
                    // Si la respuesta es OK, retornarla
                    if (response.ok) {
                        console.log(`✅ Petición exitosa con ${keyInfo}`);
                        return response;
                    }
                    
                    // Si es otro error (4xx), no hay más keys disponibles
                    if (response.status >= 400 && response.status < 500) {
                        if (hasMultipleKeys && keyIndex < apiKeys.length - 1) {
                        console.warn(`⚠️ Error ${response.status} con key ${keyIndex + 1}, cambiando a siguiente key`);
                        break;
                        } else {
                            // Última key o solo hay una key
                            const errorMsg = response.status === 403 
                                ? `Error 403 (Forbidden). La API key no tiene permisos o está inválida. Verificar ALCHEMY_PRIMARY_KEY en GitHub Secrets.`
                                : `Error ${response.status} con la API key. Verificar que ALCHEMY_PRIMARY_KEY esté configurado correctamente.`;
                            throw new Error(errorMsg);
                        }
                    }
                    
                    // Si llegamos aquí, retry
                    if (retry < maxRetriesPerKey) {
                        const delay = retryDelays[retry] || 4000;
                        console.warn(`⚠️ Respuesta no exitosa, retry en ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                    
                } catch (error) {
                    // Si el error ya es un Error con mensaje, relanzarlo
                    if (error instanceof Error && error.message.includes('API key')) {
                        throw error;
                    }
                    
                    // Limpiar timeout si existe
                    if (typeof timeoutId !== 'undefined') {
                        clearTimeout(timeoutId);
                    }
                    
                    // Timeout o abort
                    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
                        if (hasMultipleKeys && keyIndex < apiKeys.length - 1) {
                        console.warn(`⏱️ Timeout (${timeout}ms) con key ${keyIndex + 1}, cambiando a siguiente key`);
                        break; // Cambiar a siguiente key
                        } else {
                            throw new Error(`Timeout (${timeout}ms) después de ${maxRetriesPerKey + 1} intentos.`);
                        }
                    }
                    
                    // Network error - retry con exponential backoff
                    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
                        if (retry < maxRetriesPerKey) {
                            const delay = retryDelays[retry] || 4000;
                            console.warn(`🌐 Error de red, retry en ${delay}ms...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        } else {
                            if (hasMultipleKeys && keyIndex < apiKeys.length - 1) {
                            console.warn(`🌐 Error de red después de ${maxRetriesPerKey} intentos, cambiando a siguiente key`);
                            break;
                            } else {
                                throw new Error(`Error de red después de ${maxRetriesPerKey + 1} intentos.`);
                            }
                        }
                    }
                    
                    // Otro error
                    if (hasMultipleKeys && keyIndex < apiKeys.length - 1) {
                    console.warn(`⚠️ Error con key ${keyIndex + 1}: ${error.message}, cambiando a siguiente key`);
                    break;
                    } else {
                        throw new Error(`Error con la API key: ${error.message}`);
                    }
                }
            }
        }
        
        // Si todas las keys fallaron por rate limit, esperar más tiempo antes de reintentar
        if (rateLimitCount >= apiKeys.length && apiKeys.length > 0) {
            const longDelay = rateLimitDelay * apiKeys.length * 2; // Delay más largo
            console.warn(`⚠️ Rate limit en todas las API keys, esperando ${longDelay}ms antes de reintentar...`);
            await new Promise(resolve => setTimeout(resolve, longDelay));
            // Reintentar una vez más con la primera key
            console.log(`🔄 Reintentando con la primera API key después del delay...`);
            const firstKey = apiKeys[0];
            const url = urlTemplate.replace('{API_KEY}', firstKey);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(url, { 
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                clearTimeout(timeoutId);
                if (response.ok) {
                    console.log(`✅ Petición exitosa después del delay`);
                    return response;
                }
            } catch (error) {
                clearTimeout(timeoutId);
            }
        }
        
        // Si todas las keys fallaron
        throw new Error(`Todas las API keys de Alchemy fallaron después de ${maxRetriesPerKey + 1} intentos cada una. Verificar que ALCHEMY_PRIMARY_KEY esté configurado correctamente en GitHub Secrets.`);
    }

    /**
     * Load tokens for specific contract using direct API calls with pagination
     * @param {string} userAddress - User wallet address
     * @param {string} contractAddress - Contract address
     * @param {string|null} filter - Filter type (optional)
     * @param {boolean} skipIndividualMetadata - Skip individual metadata (optional)
     * @param {number|null} limit - Maximum number of tokens to load (optional, for batch loading)
     * @param {string|null} startPageKey - Page key to start from (optional, for batch loading)
     * @returns {Promise<{tokens: Array, hasMore: boolean, nextPageKey: string|null}>}
     */
    async loadTokens(userAddress, contractAddress, filter = null, skipIndividualMetadata = false, limit = null, startPageKey = null, options = {}) {
        // Permitir sobrecarga: si startPageKey es un objeto, se trata como options
        if (startPageKey && typeof startPageKey === 'object' && options && Object.keys(options).length === 0) {
            options = startPageKey;
            startPageKey = null;
        }

        const {
            includeMetadata = true, // true = cargar metadata completa desde Alchemy (más eficiente)
            maxTokens = null,
            pageSize = 100
        } = options || {};

        console.log('loadTokens called with:', { userAddress, contractAddress, filter, skipIndividualMetadata, limit, startPageKey, options });
        
        if (!userAddress) {
            throw new Error('User address is required');
        }

        try {
            // Determine token type based on contract address
            const isERC721 = contractAddress.toLowerCase() === window.TraitLABConfig.CONTRACTS.ERC721.toLowerCase(); // AdrianZERO
            const tokenType = isERC721 ? "ERC721" : "ERC1155";
            
            console.log(`Loading ${tokenType} tokens from contract: ${contractAddress}`);
            
            // Cargar toggles activos para AdrianZERO tokens
            if (isERC721 && !this.activeTogglesLoaded) {
                console.log('🔍 Loading active toggles for AdrianZERO tokens...');
                this.activeToggles = await this.loadActiveToggles();
                this.activeTogglesLoaded = true;
            }
            
        // Load tokens with pagination
            let allNfts = [];
            let pageKey = startPageKey || null;
            let previousPageKey = null;
            let hasMore = true;
            let pageCount = 0;
            const MAX_PAGES = 1000; // Límite de seguridad para páginas
            // 🚨 FIX: Guardar el pageKey inicial para detectar ciclos
            const initialPageKey = startPageKey;
            const seenPageKeys = new Set();
            if (startPageKey) {
                seenPageKeys.add(startPageKey);
            }
            // Por defecto, limitar ERC1155 a una página para respuesta rápida; ERC721 mantiene 10k
            const hasExplicitLimit = (limit !== null && limit !== undefined) || (maxTokens !== null && maxTokens !== undefined);
        // Para ERC1155 en modo batch, no cortar por defecto en 100 para no repetir primera página
        const defaultMaxTokens = (!hasExplicitLimit && tokenType === 'ERC1155') ? 100 : 10000;
        const MAX_TOKENS = hasExplicitLimit ? (maxTokens ?? limit ?? defaultMaxTokens) : defaultMaxTokens;
        const isBatchMode = hasExplicitLimit; // Modo batch solo si se proporciona límite explícito
            
            console.log(`🚀 Iniciando carga de tokens ${tokenType} con límites: max ${MAX_PAGES} páginas, max ${MAX_TOKENS === 10000 ? 'TODOS' : MAX_TOKENS} tokens${isBatchMode ? ' (BATCH MODE)' : ' (LIMITADO RÁPIDO por defecto)'}`);
            while (hasMore && pageCount < MAX_PAGES && allNfts.length < MAX_TOKENS) {
                pageCount++;
                console.log(`📄 Loading page ${pageCount}/${MAX_PAGES}... (tokens: ${allNfts.length}/${MAX_TOKENS})`);
                
                // Build URL template with pagination (sin API key, se inyectará en fetchWithAlchemyFallback)
                const safePageSize = Math.min(Math.max(pageSize || 100, 1), 100); // 1..100
                let urlParams = `owner=${userAddress}&contractAddresses[]=${contractAddress}&withMetadata=${includeMetadata ? 'true' : 'false'}&omitMetadata=${includeMetadata ? 'false' : 'true'}&pageSize=${safePageSize}&tokenType=${tokenType}`;
                
                if (pageKey) {
                    urlParams += `&pageKey=${encodeURIComponent(pageKey)}`;
                    console.log(`🔗 Using pageKey: ${pageKey.substring(0, 20)}...`);
                }
                
                const urlTemplate = `https://base-mainnet.g.alchemy.com/nft/v3/{API_KEY}/getNFTsForOwner?${urlParams}`;
                
                // Obtener todas las API keys disponibles
                const apiKeys = window.TraitLABConfig?.getAllAlchemyApiKeys() || [];
                
                console.log(`🌐 Requesting NFTs con ${apiKeys.length} API key(s) disponibles`);
                
                // Usar fetchWithAlchemyFallback para manejar fallback automático
                const alchemyResponse = await this.fetchWithAlchemyFallback(urlTemplate, apiKeys, 15000);
                
                const nftsData = await alchemyResponse.json();
                const tokensInPage = nftsData.ownedNfts?.length || 0;
                console.log(`📦 Page ${pageCount}: ${tokensInPage} tokens received`);
                // Add tokens from this page
                if (nftsData.ownedNfts && nftsData.ownedNfts.length > 0) {
                    allNfts = allNfts.concat(nftsData.ownedNfts);
                }
                
                // Check if there are more pages
                const newPageKey = nftsData.pageKey;
                console.log(`🔗 newPageKey de Alchemy: ${newPageKey ? newPageKey.substring(0, 50) + '...' : 'null'}`);
                console.log(`🔗 pageKey actual antes de actualizar: ${pageKey ? pageKey.substring(0, 50) + '...' : 'null'}`);
                
                // 🚨 FIX: Verificar si se alcanzó el límite ANTES de actualizar el pageKey
                const limitReached = allNfts.length >= MAX_TOKENS;
                
                // 🔍 FIX: Verificar si el batch tiene menos tokens de los esperados
                // Si tokensInPage < pageSize y newPageKey es null, puede haber más tokens disponibles
                const pageSizeRequested = safePageSize;
                const receivedLessThanExpected = tokensInPage > 0 && tokensInPage < pageSizeRequested && !newPageKey;
                
                if (receivedLessThanExpected && isBatchMode) {
                    console.warn(`⚠️ ADVERTENCIA: Batch recibido con menos tokens de los esperados (${tokensInPage} < ${pageSizeRequested}) y pageKey=null`);
                    console.warn(`🔍 Esto puede indicar que hay más tokens disponibles pero Alchemy no los está devolviendo correctamente`);
                    // En modo batch, si recibimos menos tokens de los esperados, puede haber más disponibles
                    // No establecer hasMore a false inmediatamente, dejar que el sistema intente cargar más
                }
                
                // NUEVA VALIDACIÓN: Verificar si el pageKey es diferente al anterior
                if (newPageKey && newPageKey === previousPageKey) {
                    console.warn('⚠️ PageKey duplicado detectado, deteniendo paginación para evitar bucle infinito');
                    console.warn(`🔄 PageKey anterior: ${previousPageKey?.substring(0, 20)}...`);
                    console.warn(`🔄 PageKey actual: ${newPageKey?.substring(0, 20)}...`);
                    hasMore = false;
                } else if (newPageKey && seenPageKeys.has(newPageKey)) {
                    // 🚨 FIX: Detectar si el pageKey ya se vio antes (ciclo)
                    console.warn('⚠️ PageKey ciclando detectado - este pageKey ya se usó antes');
                    console.warn(`🔄 PageKey repetido: ${newPageKey?.substring(0, 20)}...`);
                    hasMore = false;
                } else {
                    if (newPageKey) {
                        seenPageKeys.add(newPageKey);
                    }
                    // 🚨 FIX: Actualizar pageKey con el newPageKey de la respuesta ANTES de verificar el límite
                    pageKey = newPageKey;
                    // 🔍 FIX: En modo batch, si recibimos menos tokens de los esperados, mantener hasMore como true
                    // para permitir que el sistema intente cargar más en el siguiente batch
                    if (isBatchMode && receivedLessThanExpected && !newPageKey) {
                        console.warn(`🔧 MODO BATCH: Manteniendo hasMore=true temporalmente para permitir verificación adicional`);
                        hasMore = true; // Mantener hasMore como true para permitir verificación
                    } else {
                        hasMore = !!pageKey;
                    }
                }
                
                previousPageKey = newPageKey;
                
                console.log(`📊 Total tokens loaded so far: ${allNfts.length}/${MAX_TOKENS}. Has more: ${hasMore}`);
                console.log(`🔗 PageKey actualizado: ${pageKey ? pageKey.substring(0, 30) + '...' : 'null'}`);
                
                // 🚨 FIX: Si se alcanzó el límite, salir del loop pero mantener el pageKey actualizado
                if (limitReached) {
                    console.log(`⚠️ Límite de tokens alcanzado (${allNfts.length}/${MAX_TOKENS}), saliendo del loop pero manteniendo pageKey para siguiente batch`);
                    break; // Salir del loop pero mantener el pageKey actualizado
                }
                
                // Log de progreso cada 10 páginas
                if (pageCount % 10 === 0) {
                    console.log(`📈 Progreso: ${pageCount} páginas, ${allNfts.length} tokens cargados`);
                }
                
                // Add delay between requests to avoid rate limiting
                // Delay más largo si hay muchas páginas para evitar saturar las API keys
                if (hasMore) {
                    const baseDelay = 200; // Delay base de 200ms
                    const adaptiveDelay = Math.min(pageCount * 10, 500); // Delay adaptativo hasta 500ms
                    const delay = baseDelay + adaptiveDelay;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            // Validaciones finales
            if (pageCount >= MAX_PAGES) {
                console.warn(`⚠️ Límite de páginas alcanzado (${MAX_PAGES}), deteniendo carga`);
            }
            if (allNfts.length >= MAX_TOKENS) {
                console.warn(`⚠️ Límite de tokens alcanzado (${MAX_TOKENS}), deteniendo carga`);
            }
            
            console.log(`Total tokens loaded: ${allNfts.length} from ${pageCount} pages`);
            
            // 🚨 FIX: Capturar nextPageKey correctamente
            // Si se alcanzó el límite pero hay más páginas, usar el pageKey de la última respuesta
            // Si no hay más páginas, nextPageKey debe ser null
            let nextPageKey = null;
            if (isBatchMode) {
                // En modo batch, si hay más páginas disponibles, usar el pageKey actual
                // Si se alcanzó el límite pero hasMore es true, significa que hay más tokens
                if (hasMore && allNfts.length >= MAX_TOKENS) {
                    // Se alcanzó el límite pero hay más tokens disponibles
                    nextPageKey = pageKey;
                    // 🚨 FIX: Verificar si el nextPageKey es diferente al startPageKey
                    if (nextPageKey === initialPageKey && initialPageKey !== null) {
                        console.warn('⚠️ ADVERTENCIA: nextPageKey es igual al pageKey inicial, esto puede causar un ciclo!');
                        console.warn(`🔗 initialPageKey: ${initialPageKey.substring(0, 50) + '...'}`);
                        console.warn(`🔗 nextPageKey: ${nextPageKey.substring(0, 50) + '...'}`);
                    }
                    console.log(`🔗 Modo batch: Límite alcanzado (${allNfts.length}/${MAX_TOKENS}), pero hay más tokens. nextPageKey=${nextPageKey ? (nextPageKey.length > 100 ? nextPageKey.substring(0, 100) + '...' : nextPageKey) : 'null'}`);
                } else if (hasMore && allNfts.length < MAX_TOKENS) {
                    // No se alcanzó el límite pero hay más páginas
                    // 🔍 FIX: Si pageKey es null pero hasMore es true (debido a nuestra verificación),
                    // usar null como nextPageKey para permitir verificación adicional
                    if (pageKey === null) {
                        console.log(`🔗 Modo batch: hasMore=true pero pageKey=null (verificación adicional activada). nextPageKey=null`);
                        nextPageKey = null;
                    } else {
                        nextPageKey = pageKey;
                        console.log(`🔗 Modo batch: No se alcanzó límite (${allNfts.length}/${MAX_TOKENS}), hay más páginas. nextPageKey=${nextPageKey ? (nextPageKey.length > 100 ? nextPageKey.substring(0, 100) + '...' : nextPageKey) : 'null'}`);
                    }
                } else {
                    // No hay más páginas
                    nextPageKey = null;
                    console.log(`🔗 Modo batch: No hay más páginas. nextPageKey=null`);
                }
            }
            const hasMoreTokens = hasMore && allNfts.length >= MAX_TOKENS;
            console.log(`🔗 Resumen paginación: hasMore=${hasMore}, hasMoreTokens=${hasMoreTokens}, nextPageKey=${nextPageKey ? (nextPageKey.length > 100 ? nextPageKey.substring(0, 100) + '...' : nextPageKey) : 'null'}`);
            
            if (allNfts.length === 0) {
                console.log('No NFTs found for this user');
                this.emit('noTokensFound', { userAddress, contractAddress });
                if (isBatchMode) {
                    return { tokens: [], hasMore: false, nextPageKey: null };
                }
                return [];
            }
            
            // Process all NFTs - Filtrar spam solo para contratos desconocidos
            // Para contratos conocidos (AdrianZERO, AdrianLAB), no filtrar spam
            // porque omitMetadata puede hacer que tokens legítimos se marquen como spam
            const knownContracts = [
                window.TraitLABConfig?.CONTRACTS?.ERC721?.toLowerCase(), // AdrianZERO
                window.TraitLABConfig?.CONTRACTS?.ERC1155?.toLowerCase(), // AdrianLAB
                "0x6e369bf0e4e0c106192d606fb6d85836d684da75".toLowerCase(), // AdrianZERO (fallback)
                "0x90546848474fb3c9fda3fdad887969bb244e7e58".toLowerCase()  // AdrianLAB (fallback)
            ];
            
            const contractLower = contractAddress.toLowerCase();
            const isKnownContract = knownContracts.includes(contractLower);
            
            const validNfts = allNfts.filter(nft => {
                // Solo filtrar spam para contratos desconocidos
                // Para contratos conocidos, confiar en que los tokens son legítimos
                if (!isKnownContract && nft.isSpam === true) {
                    return false;
                }
                return true;
            });
            
            console.log(`📊 Tokens válidos después de filtrar spam: ${validNfts.length}/${allNfts.length} (contrato conocido: ${isKnownContract})`);
            
            let tokens = validNfts.map(nft => {
                    try {
                        // Extract tokenId
                        let tokenId;
                        if (nft.tokenId) {
                            tokenId = nft.tokenId;
                        } else if (nft.id && nft.id.tokenId) {
                            tokenId = nft.id.tokenId;
                        } else {
                            console.error("No tokenId found in NFT:", nft);
                            return null;
                        }
                        
                        // Convert tokenId to integer
                        let tokenIdInt;
                        if (typeof tokenId === 'number') {
                            tokenIdInt = tokenId;
                        } else if (tokenId.startsWith('0x')) {
                            tokenIdInt = parseInt(tokenId, 16);
                        } else {
                            tokenIdInt = parseInt(tokenId, 10);
                        }
                        
                        if (isNaN(tokenIdInt)) {
                            console.error("Invalid tokenId format:", tokenId);
                            return null;
                        }
                        
                        // Extract title/name - Manejar casos sin metadata
                        let title = `Token #${tokenIdInt}`;
                        
                        if (nft.title) {
                            title = nft.title;
                        } else if (nft.name) {
                            title = nft.name;
                        } else if (nft.metadata && nft.metadata.name) {
                            title = nft.metadata.name;
                        } else if (nft.contract && nft.contract.name) {
                            title = `${nft.contract.name} #${tokenIdInt}`;
                        } else if (isERC721) {
                            // Para ERC721 sin metadata, usar formato estándar
                            title = `AdrianZERO #${tokenIdInt}`;
                        } else {
                            // Para ERC1155 sin metadata, usar formato estándar
                            title = `Token #${tokenIdInt}`;
                        }
                        
                        // Extract image URL
                        let mediaUrl = "";
                        let fallbackImageUrl = null; // Initialize fallback URL for traits
                        
                        // For ERC721 tokens (AdrianZERO), use the specific render API format
                        if (isERC721) {
                            // Verificar si el token tiene toggle activo (toggleId = 1 = zoom in)
                            const hasZoomToggle = this.activeToggles.has(tokenIdInt) && 
                                                 this.activeToggles.get(tokenIdInt) === 1;
                            
                            if (hasZoomToggle) {
                                mediaUrl = `https://adrianlab.vercel.app/api/render/${tokenIdInt}.png?closeup=true`;
                                console.log(`🔍 Token ${tokenIdInt} has zoom toggle - using closeup=true`);
                            } else {
                                mediaUrl = `https://adrianlab.vercel.app/api/render/${tokenIdInt}.png`;
                            }
                        } else {
                            // For ERC1155 tokens, check if it's a floppy disc or serum first
                            if (this.isFloppyToken(tokenIdInt)) {
                                // Use floppy manager for local images
                                if (window.app && window.app.modules.floppy) {
                                    mediaUrl = window.app.modules.floppy.getFloppyImageUrl(tokenIdInt);
                                } else {
                                    // Fallback to default floppy image
                                    mediaUrl = `https://adrianlab.vercel.app/api/render/${tokenIdInt}.png`;
                                }
                            } else if (this.isSerumToken(tokenIdInt)) {
                                // Use serum manager for local images
                                if (window.app && window.app.modules.serums) {
                                    mediaUrl = window.app.modules.serums.getSerumImageUrl(tokenIdInt);
                                } else {
                                    // Fallback to default serum image
                                    mediaUrl = `https://adrianlab.vercel.app/api/render/${tokenIdInt}.png`;
                                }
                            } else {
                                // For other ERC1155 tokens (traits), prioritize local assets
                                // Get fallback URL from Alchemy metadata first
                                let alchemyImageUrl = '';
                                if (nft.raw && nft.raw.metadata && nft.raw.metadata.image) {
                                    alchemyImageUrl = nft.raw.metadata.image;
                                } else if (nft.media && Array.isArray(nft.media) && nft.media.length > 0) {
                                    alchemyImageUrl = nft.media[0].gateway || nft.media[0].raw || '';
                                } else if (nft.metadata && nft.metadata.image) {
                                    alchemyImageUrl = nft.metadata.image;
                                }
                                
                                // Use TraitImageLoader to get local URL with fallback
                                if (window.traitImageLoader) {
                                    const imageUrls = window.traitImageLoader.getTraitImageUrl(
                                        tokenIdInt,
                                        alchemyImageUrl || `https://adrianlab.vercel.app/api/render/floppy/${tokenIdInt}.png`
                                    );
                                    // Set local URL as primary
                                    mediaUrl = imageUrls.localUrl;
                                    // Store fallback URL for ui.js to use if local fails
                                    fallbackImageUrl = imageUrls.fallbackUrl;
                                } else {
                                    // Fallback to original logic if TraitImageLoader not available
                                    mediaUrl = alchemyImageUrl;
                                }
                            }
                        }
                        
                        // Extract balance
                        const balance = nft.balance || '1';

                        // 🚀 OPTIMIZACIÓN: Minimal Metadata Caching
                        // Extraer solo campos esenciales en lugar de toda la metadata
                        // Reducción de ~60-80% en uso de memoria para metadata
                        let minimalMetadata = {};
                        let category = '';

                        if (includeMetadata) {
                            // Alchemy puede devolver metadata en diferentes lugares
                            const fullMetadata = nft.metadata || nft.raw?.metadata || {};

                            // Extract category - Manejar casos sin metadata
                            if (fullMetadata && Object.keys(fullMetadata).length > 0) {
                                category = fullMetadata.category || fullMetadata.Category || '';

                                if (!category && fullMetadata.attributes) {
                                    const categoryAttr = fullMetadata.attributes.find(attr =>
                                        attr.trait_type && attr.trait_type.toLowerCase() === 'category'
                                    );
                                    if (categoryAttr) {
                                        category = categoryAttr.value.toLowerCase();
                                    }
                                }

                                // 🚀 Guardar solo campos esenciales (no toda la metadata)
                                minimalMetadata = {
                                    name: fullMetadata.name,
                                    category: category,
                                    // Solo guardar image si es diferente a imageUrl ya calculado
                                    ...(fullMetadata.image && fullMetadata.image !== mediaUrl ? { image: fullMetadata.image } : {})
                                };
                            }
                        }
                        // Si no hay metadata, category queda vacío (OK para tokens básicos)

                        const tokenObj = {
                            tokenId: tokenIdInt,
                            title: title,
                            imageUrl: mediaUrl,
                            contract: (nft.contract && nft.contract.address) ? nft.contract.address : contractAddress,
                            contractName: (nft.contract && nft.contract.name) ? nft.contract.name : 'Unknown Contract',
                            tokenType: tokenType,
                            category: category,
                            balance: balance,
                            metadata: minimalMetadata // 🚀 Solo campos esenciales en lugar de metadata completa
                        };
                        
                        // Add fallback image URL for traits if available
                        if (fallbackImageUrl && tokenType === 'ERC1155' && !this.isFloppyToken(tokenIdInt) && !this.isSerumToken(tokenIdInt)) {
                            tokenObj.fallbackImageUrl = fallbackImageUrl;
                        }
                        
                        return tokenObj;
                    } catch (err) {
                        console.error("Error processing NFT:", err, nft);
                        return null;
                    }
                }).filter(token => token !== null);

                // zero.js solo maneja ERC721 (AdrianZERO) - sin filtrado
                // El filtrado se hace en filters.js
                let filteredTokens = tokens;
            
            console.log('Processed tokens:', filteredTokens);
            
            // For ERC1155 tokens, fetch individual metadata if it's empty (unless skipped)
            if (tokenType === 'ERC1155') {
                if (skipIndividualMetadata) {
                    console.log('🚀 Saltando metadata individual para carga rápida');
                    // Return tokens with basic info only
                    filteredTokens.forEach(token => {
                        console.log(`Returning basic token ${token.tokenId} with balance: ${token.balance}`);
                    });
                    this.emit('tokensLoaded', { tokens: filteredTokens, contractAddress, tokenType });
                    return filteredTokens;
                } else {
                    // 🚨 NUEVO: Emitir tokens listos para mostrar inmediatamente (solo ERC721)
                    if (tokenType === 'ERC721') {
                        console.log('🎯 Emitiendo tokens listos para mostrar inmediatamente...');
                        this.emit('tokensReadyForDisplay', { 
                            tokens: filteredTokens, 
                            contractAddress, 
                            tokenType,
                            hasLoadingWheels: true 
                        });
                    }
                    // Si includeMetadata=true, la metadata ya viene en la respuesta, no hacer llamadas individuales
                    let tokensWithMetadata;
                    if (includeMetadata) {
                        // Metadata ya está incluida, usar tokens directamente
                        console.log('✅ Usando metadata de la respuesta principal (includeMetadata=true)');
                        tokensWithMetadata = filteredTokens;
                    } else {
                        // Solo hacer llamadas individuales si includeMetadata=false y no tenemos metadata
                        tokensWithMetadata = await Promise.all(
                            filteredTokens.map(async (token) => {
                                if (!token.metadata || Object.keys(token.metadata).length === 0) {
                                    console.log(`Fetching individual metadata for token ${token.tokenId}`);
                                    try {
                                        const metadataUrlTemplate = `https://base-mainnet.g.alchemy.com/nft/v3/{API_KEY}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${token.tokenId}&tokenType=ERC1155`;
                                        const apiKeys = window.TraitLABConfig?.getAllAlchemyApiKeys() || [];
                                        
                                        const metadataResponse = await this.fetchWithAlchemyFallback(metadataUrlTemplate, apiKeys, 15000);
                                        
                                        if (metadataResponse.ok) {
                                            const metadataData = await metadataResponse.json();
                                            console.log(`Metadata for token ${token.tokenId}:`, metadataData);

                                            // 🚀 OPTIMIZACIÓN: Minimal Metadata Caching
                                            // Extraer solo campos esenciales
                                            let category = '';
                                            let minimalMetadata = {};

                                            if (metadataData.metadata) {
                                                category = metadataData.metadata.category || metadataData.metadata.Category || '';

                                                if (!category && metadataData.metadata.attributes) {
                                                    const categoryAttr = metadataData.metadata.attributes.find(attr =>
                                                        attr.trait_type && attr.trait_type.toLowerCase() === 'category'
                                                    );
                                                    if (categoryAttr) {
                                                        category = categoryAttr.value.toLowerCase();
                                                    }
                                                }

                                                // 🚀 Guardar solo campos esenciales
                                                minimalMetadata = {
                                                    name: metadataData.metadata.name,
                                                    category: category,
                                                    ...(metadataData.metadata.image ? { image: metadataData.metadata.image } : {})
                                                };
                                            }

                                            return {
                                                ...token,
                                                metadata: minimalMetadata, // 🚀 Solo campos esenciales
                                                category: category
                                            };
                                        }
                                    } catch (error) {
                                        console.error(`Error fetching metadata for token ${token.tokenId}:`, error);
                                    }
                                }
                                // Return the token as is, preserving the balance
                                return token;
                            })
                        );
                    }
                    
                    console.log(`Tokens with metadata:`, tokensWithMetadata);
                    this.emit('tokensLoaded', { tokens: tokensWithMetadata, contractAddress, tokenType });
                    
                    // Retornar con información de paginación si está en modo batch
                    if (isBatchMode) {
                        return { 
                            tokens: tokensWithMetadata, 
                            hasMore: hasMoreTokens, 
                            nextPageKey: nextPageKey 
                        };
                    }
                    return tokensWithMetadata;
                }
            } else {
                // For ERC721 tokens, load custom names
                const customNamesResult = await this.loadCustomNames(tokens);
                if (customNamesResult && customNamesResult.nameMap) {
                    // If we got a result with nameMap, use it
                    tokens.forEach(t => {
                        const n = customNamesResult.nameMap.get(t.tokenId);
                        if (n) t.title = n; // Override displayed name
                    });
                } else if (customNamesResult && Array.isArray(customNamesResult)) {
                    // If we got updated tokens array directly, use it
                    tokens = customNamesResult;
                }
                this.emit('tokensLoaded', { tokens, contractAddress, tokenType });
                
                // Retornar con información de paginación si está en modo batch
                if (isBatchMode) {
                    return { 
                        tokens: tokens, 
                        hasMore: hasMoreTokens, 
                        nextPageKey: nextPageKey 
                    };
                }
                return tokens;
            }

        } catch (error) {
            console.error("Error loading tokens:", error);
            this.emit('tokensLoadError', { error: error.message, contractAddress });
            
            // Retornar formato batch si está en modo batch
            if (limit !== null) {
                return { tokens: [], hasMore: false, nextPageKey: null };
            }
            throw error;
        }
    }

    /**
     * Load custom names from AdrianNameRegistry contract with cascading approach
     */
    async loadCustomNames(tokens) {
        // 🚧 DEBUG: Desactivar temporalmente la mejora de nombres para evitar progresos/repaints
        console.log('⛔️ Mejora de nombres desactivada temporalmente (skip loadCustomNames)');
        return tokens;

    }

    /**
     * Refresh metadata by calling Vercel endpoints
     */
    async refreshMetadata() {
        console.log('refreshMetadata called');
        
        if (!this.selectedERC721) {
            throw new Error('Please select an AdrianZERO token first.');
        }

        try {
            const tokenId = this.selectedERC721.tokenId;
            const renderUrl = `https://adrianlab.vercel.app/api/render/${tokenId}`;
            const metadataUrl = `https://adrianlab.vercel.app/api/metadata/${tokenId}`;

            console.log('Calling render URL:', renderUrl);
            console.log('Calling metadata URL:', metadataUrl);

            // Make both requests in parallel
            const [renderResponse, metadataResponse] = await Promise.all([
                fetch(renderUrl),
                fetch(metadataUrl)
            ]);

            console.log('Render response status:', renderResponse.status);
            console.log('Metadata response status:', metadataResponse.status);

            // Check if both requests were successful
            if (renderResponse.ok && metadataResponse.ok) {
                console.log('Both endpoints called successfully');
                
                // Emit success event
                this.emit('metadataRefreshed', { 
                    tokenId, 
                    renderStatus: 'success', 
                    metadataStatus: 'success' 
                });
                
                return { success: true, message: `Metadata refreshed successfully for token ${tokenId}!` };
            } else {
                let errorMessage = 'Failed to refresh metadata.';
                if (!renderResponse.ok) {
                    errorMessage += ` Render endpoint returned ${renderResponse.status}.`;
                }
                if (!metadataResponse.ok) {
                    errorMessage += ` Metadata endpoint returned ${metadataResponse.status}.`;
                }
                
                throw new Error(errorMessage);
            }

        } catch (error) {
            console.error('Error refreshing metadata:', error);
            
            // Check if it's a CORS error
            if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
                throw new Error('❌ CORS Error: Server needs to be configured to allow requests from this domain. Please contact the server administrator.');
            } else {
                throw error;
            }
        }
    }

    /**
     * Activate AdrianZERO token using AdrianLabCore contract
     */
    async activateToken() {
        console.log('🔍 DEBUG ZeroManager.activateToken: Llamado');
        console.log('🔍 DEBUG ZeroManager.activateToken: this.selectedERC721:', this.selectedERC721);
        console.log('🔍 DEBUG ZeroManager.activateToken: window.TraitLABWallet existe?', !!window.TraitLABWallet);
        console.log('🔍 DEBUG ZeroManager.activateToken: window.TraitLABWallet.isWalletConnected():', window.TraitLABWallet?.isWalletConnected());
        console.log('🔍 DEBUG ZeroManager.activateToken: window.TraitLABConfig existe?', !!window.TraitLABConfig);
        console.log('🔍 DEBUG ZeroManager.activateToken: window.TraitLABConfig keys:', window.TraitLABConfig ? Object.keys(window.TraitLABConfig) : 'undefined');
        console.log('🔍 DEBUG ZeroManager.activateToken: ADRIAN_LAB_CORE_CONTRACT:', window.TraitLABConfig?.ADRIAN_LAB_CORE_CONTRACT);
        console.log('🔍 DEBUG ZeroManager.activateToken: CONTRACTS:', window.TraitLABConfig?.CONTRACTS);
        
        if (!this.selectedERC721) {
            throw new Error('Please select an AdrianZERO token first.');
        }

        if (!window.TraitLABWallet || !window.TraitLABWallet.isWalletConnected()) {
            throw new Error('Please connect your wallet first.');
        }

        // Check if user owns the token
        if (this.selectedERC721.owner && this.selectedERC721.owner.toLowerCase() !== window.TraitLABWallet.getCurrentAccount().toLowerCase()) {
            throw new Error('❌ You must own this token to activate it.');
        }

        try {
            // Load ethers dynamically only when needed
            let ethers;
            if (typeof window.ethers === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        ethers = window.ethers;
                        console.log('Ethers loaded successfully');
                        this.executeActivateTokenTransaction(ethers)
                            .then(resolve)
                            .catch(reject);
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load ethers library. Please refresh the page.'));
                    };
                    document.head.appendChild(script);
                });
            } else {
                ethers = window.ethers;
                return await this.executeActivateTokenTransaction(ethers);
            }
        } catch (error) {
            console.error('Error in activateToken:', error);
            throw error;
        }
    }

    /**
     * Execute the activate token transaction
     */
    async executeActivateTokenTransaction(ethers) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // AdrianLabCore contract address - using AdrianZERO contract for now
            const ADRIAN_LAB_CORE_CONTRACT = window.TraitLABConfig.ADRIAN_LAB_CORE_CONTRACT;
            
            // Contract ABI for assignTokenAttributes function
            const contractABI = [
                {
                    "inputs": [
                        {
                            "internalType": "uint256",
                            "name": "tokenId",
                            "type": "uint256"
                        }
                    ],
                    "name": "assignTokenAttributes",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ];

            // Create contract instance
            const contract = new ethers.Contract(ADRIAN_LAB_CORE_CONTRACT, contractABI, signer);
            console.log('🔍 DEBUG ZeroManager.executeActivateTokenTransaction: Contrato creado:', !!contract);

            // Prepare parameters
            const tokenId = this.selectedERC721.tokenId;
            console.log('🔍 DEBUG ZeroManager.executeActivateTokenTransaction: Token ID:', tokenId);

            console.log('Contract address:', ADRIAN_LAB_CORE_CONTRACT);
            console.log('Token ID:', tokenId);

            // Call the contract function
            console.log('🔍 DEBUG ZeroManager.executeActivateTokenTransaction: Llamando contract.assignTokenAttributes...');
            const tx = await contract.assignTokenAttributes(tokenId);
            
            console.log('🔍 DEBUG ZeroManager.executeActivateTokenTransaction: Transacción enviada, hash:', tx.hash);
            console.log('Transaction hash:', tx.hash);

            // Wait for transaction confirmation
            const receipt = await tx.wait();
            
            console.log('Transaction confirmed:', receipt);

            // Emit success event
            this.emit('tokenActivated', { 
                tokenId, 
                transactionHash: receipt.transactionHash 
            });

            return receipt;

        } catch (error) {
            console.error('Error in transaction:', error);
            
            let errorMessage = 'Failed to assign SKIN.';
            
            // Handle specific error cases
            if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                errorMessage = '❌ Transaction was cancelled by user.';
            } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
                // Check for specific revert reasons
                if (error.reason && error.reason.includes('already assigned')) {
                    errorMessage = '❌ This token has already been activated!';
                } else if (error.reason && error.reason.includes('not owner')) {
                    errorMessage = '❌ You must own this token to activate it.';
                } else if (error.reason && error.reason.includes('token does not exist')) {
                    errorMessage = '❌ Token does not exist.';
                } else if (error.reason && error.reason.includes('not authorized')) {
                    errorMessage = '❌ You are not authorized to activate this token.';
                } else {
                    errorMessage = `❌ Transaction failed: ${error.reason}`;
                }
            } else if (error.code === 'INSUFFICIENT_FUNDS') {
                errorMessage = '❌ Insufficient funds for gas fees.';
            } else if (error.message) {
                errorMessage = `❌ Error: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Load name price from AdrianNameRegistry contract
     */
    async loadNamePrice() {
        try {
            // Load ethers dynamically only when needed
            let ethers;
            if (typeof window.ethers === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        ethers = window.ethers;
                        this.executeLoadPrice(ethers)
                            .then(resolve)
                            .catch(reject);
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load ethers library'));
                    };
                    document.head.appendChild(script);
                });
            } else {
                ethers = window.ethers;
                return await this.executeLoadPrice(ethers);
            }
        } catch (error) {
            console.error('Error in loadNamePrice:', error);
            throw error;
        }
    }

    /**
     * Execute the load price transaction
     */
    async executeLoadPrice(ethers) {
        try {
            console.log('🔍 executeLoadPrice - window.TraitLABConfig:', window.TraitLABConfig);
            console.log('🔍 executeLoadPrice - ADRIAN_NAME_REGISTRY_ABI:', window.TraitLABConfig?.ADRIAN_NAME_REGISTRY_ABI);
            
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Check if we're on the correct network (Base)
            const network = await provider.getNetwork();
            console.log('Current network:', network);
            
            if (network.chainId !== 8453) { // Base mainnet
                throw new Error('Please switch to Base network to use this feature.');
            }
            
            console.log('Contract address:', window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT);
            
            // Check if contract exists
            const code = await provider.getCode(window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT);
            if (code === '0x') {
                throw new Error('Contract not found at specified address');
            }
            
            // Use ABI from config
            const contractABI = window.TraitLABConfig.ADRIAN_NAME_REGISTRY_ABI;

            // Create contract instance
            const contract = new ethers.Contract(window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT, contractABI, provider);

            // Mostrar el coreContract configurado
            try {
                const coreContract = await contract.getCoreContract();
                console.log('AdrianNameRegistry coreContract:', coreContract);
            } catch (e) {
                console.warn('No se pudo leer el coreContract:', e);
            }
            
            // Get the name price
            console.log('Calling namePrice()...');
            const price = await contract.namePrice();
            this.namePrice = price;
            
            console.log('Name price loaded:', ethers.utils.formatEther(price), 'ADRIAN');
            
            // Emit success event
            this.emit('namePriceLoaded', { 
                price: ethers.utils.formatEther(price), 
                rawPrice: price 
            });
            
            return ethers.utils.formatEther(price);
            
        } catch (error) {
            console.error('Error loading name price:', error);
            // Use default price if contract call fails
            this.namePrice = ethers.utils.parseEther("10000"); // 10000 ADRIAN default
            
            // Emit event with default price
            this.emit('namePriceLoaded', { 
                price: "10000", 
                rawPrice: this.namePrice,
                isDefault: true 
            });
            
            return "10000";
        }
    }

    /**
     * Approve ADRIAN tokens for rename
     */
    async approveRename(userAddress) {
        console.log('Approving ADRIAN tokens for rename...');
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            // ADRIAN token contract
            const adrianToken = new ethers.Contract(
                window.TraitLABConfig.ADRIAN_TOKEN,
                window.TraitLABConfig.ERC20_ABI,
                signer
            );
            
            // Check current allowance
            const allowance = await adrianToken.allowance(
                userAddress, 
                window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT
            );
            
            if (allowance.gte(this.namePrice)) {
                console.log('Allowance already sufficient');
                return true;
            }
            
            console.log('Approving ADRIAN tokens...');
            const tx = await adrianToken.approve(
                window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT, 
                this.namePrice
            );
            
            console.log('Approval transaction:', tx.hash);
            await tx.wait();
            
            console.log('Approval successful');
            return true;
            
        } catch (error) {
            console.error('Error in approval:', error);
            throw error;
        }
    }

    /**
     * Execute rename transaction
     */
    async executeRename(ethers, newName) {
        console.log('Executing rename transaction...');
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            const contract = new ethers.Contract(
                window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT,
                window.TraitLABConfig.ADRIAN_NAME_REGISTRY_ABI,
                signer
            );
            
            // 🎯 Fallback defensivo para obtener tokenId
            let tokenId = this.selectedERC721?.tokenId;
            if (typeof tokenId === 'undefined') {
                // Intentar obtener desde tokenSelectionManager como fallback
                tokenId = window.app?.modules?.tokenSelectionManager?.selectedERC721?.tokenId;
                console.log('🎯 Fallback: tokenId obtenido desde tokenSelectionManager:', tokenId);
            }
            
            if (typeof tokenId === 'undefined') {
                throw new Error('No AdrianZERO token selected - tokenId no disponible');
            }
            
            console.log('Contract address:', window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT);
            console.log('Token ID:', tokenId);
            console.log('New name:', newName);
            
            const tx = await contract.setTokenName(tokenId, newName);
            console.log('Rename transaction:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('Rename successful:', receipt);
            
            return receipt;
            
        } catch (error) {
            console.error('Error in rename:', error);
            throw error;
        }
    }

    /**
     * Approve $ADRIAN tokens for rename
     */
    async approveRename() {
        console.log('approveRename called');
        
        if (!this.selectedERC721) {
            throw new Error('Please select an AdrianZERO token first.');
        }

        if (!window.TraitLABWallet || !window.TraitLABWallet.isWalletConnected()) {
            throw new Error('Please connect your wallet first.');
        }

        if (!this.namePrice) {
            throw new Error('Loading name price...');
        }

        try {
            // Load ethers dynamically only when needed
            let ethers;
            if (typeof window.ethers === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        ethers = window.ethers;
                        console.log('Ethers loaded successfully');
                        this.executeApproval(ethers)
                            .then(resolve)
                            .catch(reject);
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load ethers library. Please refresh the page.'));
                    };
                    document.head.appendChild(script);
                });
            } else {
                ethers = window.ethers;
                return await this.executeApproval(ethers);
            }
        } catch (error) {
            console.error('Error in approveRename:', error);
            throw error;
        }
    }

    /**
     * Execute the approval transaction
     */
    async executeApproval(ethers) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // ADRIAN token contract
            const ADRIAN_TOKEN = window.TraitLABConfig.ADRIAN_TOKEN;
            
            // ERC20 ABI for approve function
            const erc20ABI = [
                "function approve(address spender, uint256 amount) returns (bool)",
                "function allowance(address owner, address spender) view returns (uint256)"
            ];

            // Create contract instance
            const contract = new ethers.Contract(ADRIAN_TOKEN, erc20ABI, signer);

            // Check current allowance (handle historical state errors)
            const userAddress = await signer.getAddress();
            let currentAllowance;
            try {
                currentAllowance = await contract.allowance(userAddress, window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT);
            } catch (error) {
                // If historical state error or RPC error, assume no allowance and proceed with approval
                // The approve transaction will work regardless of current allowance check
                console.warn('⚠️ Cannot check allowance (RPC may have issues), proceeding with approval:', error.message);
                currentAllowance = ethers.BigNumber.from(0);
            }
            
            console.log('Current allowance:', ethers.utils.formatEther(currentAllowance));
            console.log('Required amount:', ethers.utils.formatEther(this.namePrice));

            // Check if approval is needed
            if (currentAllowance.gte(this.namePrice)) {
                console.log('Sufficient allowance already exists');
                
                // Emit event
                this.emit('renameApproved', { 
                    allowance: ethers.utils.formatEther(currentAllowance),
                    required: ethers.utils.formatEther(this.namePrice)
                });
                
                return { approved: true, message: 'Sufficient allowance already exists' };
            }

            // Approve the required amount
            console.log('Approving ADRIAN tokens...');
            const tx = await contract.approve(window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT, this.namePrice);
            
            console.log('Approval transaction hash:', tx.hash);

            // Wait for transaction confirmation
            const receipt = await tx.wait();
            
            console.log('Approval confirmed:', receipt);

            // Emit success event
            this.emit('renameApproved', { 
                transactionHash: receipt.transactionHash,
                amount: ethers.utils.formatEther(this.namePrice)
            });

            return receipt;

        } catch (error) {
            console.error('Error in approval transaction:', error);
            
            let errorMessage = 'Failed to approve ADRIAN tokens.';
            
            if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                errorMessage = '❌ Transaction was cancelled by user.';
            } else if (error.code === 'INSUFFICIENT_FUNDS') {
                errorMessage = '❌ Insufficient funds for gas fees.';
            } else if (error.message) {
                errorMessage = `❌ Error: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Rename token using AdrianNameRegistry contract
     */
    async renameToken(newName) {
        console.log('renameToken called with name:', newName);
        
        if (!this.selectedERC721) {
            throw new Error('Please select an AdrianZERO token first.');
        }

        if (!newName || newName.trim() === '') {
            throw new Error('Please provide a valid name.');
        }

        if (!window.TraitLABWallet || !window.TraitLABWallet.isWalletConnected()) {
            throw new Error('Please connect your wallet first.');
        }

        if (!this.namePrice) {
            throw new Error('Name price not loaded. Please try again.');
        }

        try {
            // Load ethers dynamically only when needed
            let ethers;
            if (typeof window.ethers === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        ethers = window.ethers;
                        console.log('Ethers loaded successfully');
                        this.executeRename(ethers, newName)
                            .then(resolve)
                            .catch(reject);
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load ethers library. Please refresh the page.'));
                    };
                    document.head.appendChild(script);
                });
            } else {
                ethers = window.ethers;
                return await this.executeRename(ethers, newName);
            }
        } catch (error) {
            console.error('Error in renameToken:', error);
            throw error;
        }
    }



    /**
     * Refresh AdrianZERO token image
     */
    refreshAdrianZeroToken(tokenId, buttonElement) {
        console.log('🔄 Refreshing AdrianZERO token:', tokenId);
        
        // Add loading class to button
        buttonElement.classList.add('refreshing');
        buttonElement.title = 'Actualizando...';
        
        // Find token image
        const tokenCard = buttonElement.closest('.token-card');
        const img = tokenCard.querySelector('.token-image');
        
        if (img) {
            // Create new URL with timestamp to force refresh
            const timestamp = Date.now();
            
            // Verificar si el token tiene toggle activo (toggleId = 1 = zoom in)
            const hasZoomToggle = this.activeToggles.has(tokenId) && 
                                 this.activeToggles.get(tokenId) === 1;
            
            let baseUrl;
            if (hasZoomToggle) {
                baseUrl = `https://adrianlab.vercel.app/api/render/${tokenId}.png?closeup=true`;
                console.log(`🔍 Refreshing token ${tokenId} with zoom toggle - using closeup=true`);
            } else {
                baseUrl = `https://adrianlab.vercel.app/api/render/${tokenId}.png`;
            }
            
            const newUrl = `${baseUrl}&v=${timestamp}`;
            
            // Preload new image
            const preloadImg = new Image();
            preloadImg.onload = function() {
                // Update main image when loaded
                img.src = newUrl;
                
                // Remove loading class after delay
                setTimeout(() => {
                    buttonElement.classList.remove('refreshing');
                    buttonElement.title = 'Actualizar imagen';
                    console.log('✅ Token image refreshed:', tokenId);
                }, 500);
            };
            
            preloadImg.onerror = function() {
                console.error('❌ Error refreshing token:', tokenId);
                buttonElement.classList.remove('refreshing');
                buttonElement.title = 'Actualizar imagen';
            };
            
            preloadImg.src = newUrl;
        }

        // Emit event
        this.emit('tokenImageRefreshed', { tokenId });
    }

    /**
     * Set the current filter for token filtering
     */
    setCurrentFilter(filter) {
        this.currentFilter = filter;
        console.log('ZeroManager: Filter set to:', filter);
    }

    /**
     * Event system for communication with other modules
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
}

// Export for browser environment
if (typeof window !== 'undefined') {
    window.TraitLABZero = ZeroManager;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZeroManager;
}
