/**
 * TRAITLAB - Módulo de ZERO
 * Maneja la gestión completa de tokens AdrianZERO (ERC721)
 */

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
     */
    isFloppyToken(tokenId) {
        return (tokenId >= 10000 && tokenId <= 10007) || 
               (tokenId >= 15000 && tokenId <= 15015);
    }

    /**
     * Check if token ID is a serum token
     */
    isSerumToken(tokenId) {
        return tokenId >= 262144 && tokenId <= 262147;
    }

    /**
     * Fetch con fallback secuencial de API keys de Alchemy
     * @param {string} urlTemplate - Template de URL sin API key (ej: "https://base-mainnet.g.alchemy.com/nft/v3/{API_KEY}/getNFTsForOwner?...")
     * @param {string[]} apiKeys - Array de API keys a probar
     * @param {number} timeout - Timeout en ms (default 15000 para móviles)
     * @returns {Promise<Response>} Response de la petición exitosa
     */
    async fetchWithAlchemyFallback(urlTemplate, apiKeys, timeout = 15000) {
        const maxRetriesPerKey = 2;
        const retryDelays = [1000, 2000, 4000]; // Exponential backoff
        
        for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
            const apiKey = apiKeys[keyIndex];
            const url = urlTemplate.replace('{API_KEY}', apiKey);
            
            for (let retry = 0; retry <= maxRetriesPerKey; retry++) {
                try {
                    console.log(`🌐 Intentando con API key ${keyIndex + 1}/${apiKeys.length}${retry > 0 ? ` (retry ${retry}/${maxRetriesPerKey})` : ''}`);
                    
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
                    
                    // Si es rate limit (429), cambiar inmediatamente a siguiente key
                    if (response.status === 429) {
                        console.warn(`⚠️ Rate limit (429) con key ${keyIndex + 1}, cambiando a siguiente key`);
                        break; // Salir del loop de retry y probar siguiente key
                    }
                    
                    // Si es error del servidor (5xx), retry con misma key o cambiar
                    if (response.status >= 500 && response.status < 600) {
                        if (retry < maxRetriesPerKey) {
                            const delay = retryDelays[retry] || 4000;
                            console.warn(`⚠️ Error del servidor (${response.status}), retry en ${delay}ms...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue; // Retry con misma key
                        } else {
                            console.warn(`⚠️ Error del servidor (${response.status}) después de ${maxRetriesPerKey} intentos, cambiando a siguiente key`);
                            break; // Cambiar a siguiente key
                        }
                    }
                    
                    // Si la respuesta es OK, retornarla
                    if (response.ok) {
                        console.log(`✅ Petición exitosa con API key ${keyIndex + 1}`);
                        return response;
                    }
                    
                    // Si es otro error (4xx), cambiar a siguiente key
                    if (response.status >= 400 && response.status < 500) {
                        console.warn(`⚠️ Error ${response.status} con key ${keyIndex + 1}, cambiando a siguiente key`);
                        break;
                    }
                    
                    // Si llegamos aquí, retry
                    if (retry < maxRetriesPerKey) {
                        const delay = retryDelays[retry] || 4000;
                        console.warn(`⚠️ Respuesta no exitosa, retry en ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                    
                } catch (error) {
                    // Limpiar timeout si existe
                    if (typeof timeoutId !== 'undefined') {
                        clearTimeout(timeoutId);
                    }
                    
                    // Timeout o abort
                    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
                        console.warn(`⏱️ Timeout (${timeout}ms) con key ${keyIndex + 1}, cambiando a siguiente key`);
                        break; // Cambiar a siguiente key
                    }
                    
                    // Network error - retry con exponential backoff
                    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
                        if (retry < maxRetriesPerKey) {
                            const delay = retryDelays[retry] || 4000;
                            console.warn(`🌐 Error de red, retry en ${delay}ms...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        } else {
                            console.warn(`🌐 Error de red después de ${maxRetriesPerKey} intentos, cambiando a siguiente key`);
                            break;
                        }
                    }
                    
                    // Otro error - cambiar a siguiente key
                    console.warn(`⚠️ Error con key ${keyIndex + 1}: ${error.message}, cambiando a siguiente key`);
                    break;
                }
            }
        }
        
        // Si todas las keys fallaron
        throw new Error(`Todas las API keys de Alchemy fallaron después de ${maxRetriesPerKey + 1} intentos cada una`);
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
    async loadTokens(userAddress, contractAddress, filter = null, skipIndividualMetadata = false, limit = null, startPageKey = null) {
        console.log('loadTokens called with:', { userAddress, contractAddress, filter, skipIndividualMetadata, limit, startPageKey });
        
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
            const MAX_TOKENS = limit || 10000; // Usar limit si se proporciona, sino 10k
            const isBatchMode = limit !== null; // Modo batch si se proporciona limit
            
            console.log(`🚀 Iniciando carga de tokens ${tokenType} con límites: max ${MAX_PAGES} páginas, max ${MAX_TOKENS} tokens${isBatchMode ? ' (BATCH MODE)' : ''}`);
            
            while (hasMore && pageCount < MAX_PAGES && allNfts.length < MAX_TOKENS) {
                pageCount++;
                console.log(`📄 Loading page ${pageCount}/${MAX_PAGES}... (tokens: ${allNfts.length}/${MAX_TOKENS})`);
                
                // Build URL template with pagination (sin API key, se inyectará en fetchWithAlchemyFallback)
                let urlParams = `owner=${userAddress}&contractAddresses[]=${contractAddress}&withMetadata=true&pageSize=100&tokenType=${tokenType}`;
                
                if (pageKey) {
                    urlParams += `&pageKey=${encodeURIComponent(pageKey)}`;
                    console.log(`🔗 Using pageKey: ${pageKey.substring(0, 20)}...`);
                }
                
                const urlTemplate = `https://base-mainnet.g.alchemy.com/nft/v3/{API_KEY}/getNFTsForOwner?${urlParams}`;
                
                // Obtener todas las API keys disponibles
                const apiKeys = window.TraitLABConfig?.getAllAlchemyApiKeys() || [window.TraitLABConfig?.ALCHEMY_API_KEY || "pqRmKgTaLqm2eak9iML1f"];
                
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
                
                // NUEVA VALIDACIÓN: Verificar si el pageKey es diferente al anterior
                if (newPageKey && newPageKey === previousPageKey) {
                    console.warn('⚠️ PageKey duplicado detectado, deteniendo paginación para evitar bucle infinito');
                    console.warn(`🔄 PageKey anterior: ${previousPageKey?.substring(0, 20)}...`);
                    console.warn(`🔄 PageKey actual: ${newPageKey?.substring(0, 20)}...`);
                    hasMore = false;
                } else {
                    pageKey = newPageKey;
                    hasMore = !!pageKey;
                }
                
                previousPageKey = newPageKey;
                
                console.log(`📊 Total tokens loaded so far: ${allNfts.length}/${MAX_TOKENS}. Has more: ${hasMore}`);
                
                // Log de progreso cada 10 páginas
                if (pageCount % 10 === 0) {
                    console.log(`📈 Progreso: ${pageCount} páginas, ${allNfts.length} tokens cargados`);
                }
                
                // Optional: Add a small delay to avoid rate limiting
                if (hasMore) {
                    await new Promise(resolve => setTimeout(resolve, 100));
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
            
            // Capturar nextPageKey antes de procesar (para modo batch)
            const nextPageKey = pageKey;
            const hasMoreTokens = hasMore && allNfts.length >= MAX_TOKENS;
            
            if (allNfts.length === 0) {
                console.log('No NFTs found for this user');
                this.emit('noTokensFound', { userAddress, contractAddress });
                if (isBatchMode) {
                    return { tokens: [], hasMore: false, nextPageKey: null };
                }
                return [];
            }
            
            // Process all NFTs
            let tokens = allNfts.map(nft => this.processNFT(nft, isERC721, contractAddress))
                .filter(token => token !== null);

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
                    // 🚨 NUEVO: Emitir tokens listos para mostrar inmediatamente (con loading wheels)
                    console.log('🎯 Emitiendo tokens listos para mostrar inmediatamente...');
                    this.emit('tokensReadyForDisplay', { 
                        tokens: filteredTokens, 
                        contractAddress, 
                        tokenType,
                        hasLoadingWheels: true 
                    });
                    
                    const tokensWithMetadata = await Promise.all(
                        filteredTokens.map(async (token) => {
                            if (!token.metadata || Object.keys(token.metadata).length === 0) {
                                console.log(`Fetching individual metadata for token ${token.tokenId}`);
                                try {
                                    const metadataUrlTemplate = `https://base-mainnet.g.alchemy.com/nft/v3/{API_KEY}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${token.tokenId}&tokenType=ERC1155`;
                                    const apiKeys = window.TraitLABConfig?.getAllAlchemyApiKeys() || [window.TraitLABConfig?.ALCHEMY_API_KEY || "pqRmKgTaLqm2eak9iML1f"];
                                    
                                    const metadataResponse = await this.fetchWithAlchemyFallback(metadataUrlTemplate, apiKeys, 15000);
                                    
                                    if (metadataResponse.ok) {
                                        const metadataData = await metadataResponse.json();
                                        console.log(`Metadata for token ${token.tokenId}:`, metadataData);
                                        
                                        // Extract category from the new metadata
                                        let category = '';
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
                                        }
                                        
                                        return {
                                            ...token,
                                            metadata: metadataData.metadata || {},
                                            category: category
                                        };
                                    }
                                } catch (error) {
                                    console.error(`Error fetching metadata for token ${token.tokenId}:`, error);
                                }
                            }
                            // Return the token as is, preserving the balance
                            console.log(`Returning token ${token.tokenId} with balance: ${token.balance}`);
                            return token;
                        })
                    );
                    
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
        // Only process AdrianZERO tokens (ERC721)
        const adrianZeroTokens = tokens.filter(token => 
            this.isAdrianZeroToken(token)
        );
        
        if (adrianZeroTokens.length === 0) {
            console.log('No AdrianZERO tokens to process for custom names');
            return tokens;
        }

        console.log(`Loading custom names for ${adrianZeroTokens.length} AdrianZERO tokens with cascading approach...`);

        try {
            // Load ethers dynamically if not available
            let ethers = window.ethers;
            if (typeof ethers === 'undefined') {
                console.log('Ethers not available, loading dynamically...');
                try {
                    // Load ethers dynamically
                    const script = document.createElement('script');
                    script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                    script.onload = () => {
                        console.log('Ethers loaded successfully for custom names');
                    };
                    script.onerror = () => {
                        console.log('Failed to load ethers for custom names');
                    };
                    document.head.appendChild(script);
                    
                    // Wait a bit for ethers to load
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    ethers = window.ethers;
                    if (typeof ethers === 'undefined') {
                        console.log('Ethers still not available after loading, skipping custom names');
                        return tokens;
                    }
                } catch (loadError) {
                    console.log('Error loading ethers dynamically:', loadError.message);
                    return tokens;
                }
            }

            // Check if wallet is connected
            if (!window.ethereum) {
                console.log('Wallet not connected, skipping custom names');
                return tokens;
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            
            // Only proceed if on Base network
            if (network.chainId !== 8453) {
                console.log('Not on Base network, skipping custom names');
                return tokens;
            }

            // Try to load ABI from config first, fallback to local file
            let contractABI;
            try {
                if (window.TraitLABConfig?.ADRIAN_NAME_REGISTRY_ABI) {
                    contractABI = window.TraitLABConfig.ADRIAN_NAME_REGISTRY_ABI;
                    console.log('Using ABI from config');
                } else {
                    // Fallback to local ABI file
                    const response = await fetch('./adrian-name-registry-abi.json');
                    if (!response.ok) {
                        throw new Error('Failed to load local ABI');
                    }
                    contractABI = await response.json();
                    console.log('Using local ABI file');
                }
            } catch (abiError) {
                console.log('Failed to load ABI, skipping custom names:', abiError.message);
                return tokens;
            }

            // Create contract instance
            const nameRegistryContract = new ethers.Contract(
                window.TraitLABConfig?.ADRIAN_NAME_REGISTRY_CONTRACT || '0x...', // Add your contract address here
                contractABI, 
                provider
            );

            // First, display all tokens with Alchemy names immediately
            console.log('🔄 Displaying tokens with Alchemy names first...');
            // Emit event to trigger display update
            this.emit('tokensReadyForDisplay', { tokens, skipSelectionUpdate: true });

            // Then, get custom names with delays to avoid rate limiting
            const nameMap = new Map();
            let processedCount = 0;

            // Process tokens in batches with delays
            const batchSize = 5; // Process 5 tokens at a time
            const delayBetweenBatches = 2000; // 2 seconds between batches

            for (let i = 0; i < adrianZeroTokens.length; i += batchSize) {
                const batch = adrianZeroTokens.slice(i, i + batchSize);
                
                console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(adrianZeroTokens.length/batchSize)} (${batch.length} tokens)`);
                
                // Process batch with individual delays
                const batchPromises = batch.map(async (token, index) => {
                    // Add delay between individual requests
                    await new Promise(resolve => setTimeout(resolve, index * 500)); // 500ms between each request
                    
                    try {
                        const customName = await nameRegistryContract.getTokenName(token.tokenId);
                        if (customName && customName.trim()) {
                            nameMap.set(token.tokenId, customName.trim());
                            console.log(`✅ Custom name found for token ${token.tokenId}: "${customName.trim()}"`);
                        }
                    } catch (error) {
                        console.log(`No custom name for token ${token.tokenId}:`, error.message);
                    }
                    
                    processedCount++;
                    console.log(`📊 Progress: ${processedCount}/${adrianZeroTokens.length} tokens processed`);
                });

                await Promise.all(batchPromises);

                // Update display with any custom names found so far
                if (nameMap.size > 0) {
                    // Update tokens array with new names
                    tokens.forEach(token => {
                        if (this.isAdrianZeroToken(token) && nameMap.has(token.tokenId)) {
                            const customName = nameMap.get(token.tokenId);
                            token.title = customName;
                            token.originalTitle = token.originalTitle || token.title; // Keep original title as backup
                        }
                    });

                    console.log(`🔄 Updating display with ${nameMap.size} custom names found so far...`);
                    // Emit event to update names progressively
                    this.emit('customNamesProgressUpdate', { nameMap, tokens });
                }

                // Add delay between batches (except for the last batch)
                if (i + batchSize < adrianZeroTokens.length) {
                    console.log(`⏳ Waiting ${delayBetweenBatches}ms before next batch...`);
                    await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                }
            }

            // Final update with all custom names
            const finalUpdatedTokens = tokens.map(token => {
                if (this.isAdrianZeroToken(token) && nameMap.has(token.tokenId)) {
                    const customName = nameMap.get(token.tokenId);
                    return {
                        ...token,
                        title: customName,
                        originalTitle: token.title // Keep original title as backup
                    };
                }
                return token;
            });

            console.log(`✅ Custom names loading complete: ${nameMap.size} tokens updated`);
            
            // Emit final event with complete name map
            this.emit('customNamesLoaded', { nameMap, tokens: finalUpdatedTokens });
            
            return { nameMap, tokens: finalUpdatedTokens }; // Return an object with nameMap and finalTokens

        } catch (error) {
            console.error('Error loading custom names:', error);
            // Return original tokens if custom names fail
            return tokens;
        }
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

            // Prepare parameters
            const tokenId = this.selectedERC721.tokenId;

            // Call the contract function
            const tx = await contract.assignTokenAttributes(tokenId);
            
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
                // Intentar obtener desde tokenSelection como fallback (nombre correcto del módulo)
                tokenId = window.app?.modules?.tokenSelection?.selectedERC721?.tokenId;
                console.log('🎯 Fallback: tokenId obtenido desde tokenSelection:', tokenId);
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

    /**
     * Procesar un NFT individual
     */
    processNFT(nft, isERC721, contractAddress) {
        try {
            const tokenId = this.extractTokenId(nft);
            if (!tokenId) return null;
            
            const tokenIdInt = this.parseTokenId(tokenId);
            if (isNaN(tokenIdInt)) return null;
            
            const title = this.extractTitle(nft, tokenIdInt);
            const { imageUrl, fallbackImageUrl } = this.extractImageUrl(nft, tokenIdInt, isERC721);
            const balance = nft.balance || '1';
            const category = this.extractCategory(nft);
            
            const tokenObj = {
                tokenId: tokenIdInt,
                title: title,
                imageUrl: imageUrl,
                contract: nft.contract.address,
                contractName: nft.contract.name || 'Unknown Contract',
                tokenType: isERC721 ? 'ERC721' : 'ERC1155',
                category: category,
                balance: balance,
                metadata: nft.metadata || {}
            };
            
            if (fallbackImageUrl && !isERC721) {
                tokenObj.fallbackImageUrl = fallbackImageUrl;
            }
            
            return tokenObj;
        } catch (err) {
            console.error("Error processing NFT:", err, nft);
            return null;
        }
    }

    /**
     * Extraer tokenId del NFT
     */
    extractTokenId(nft) {
        if (nft.tokenId) {
            return nft.tokenId;
        } else if (nft.id && nft.id.tokenId) {
            return nft.id.tokenId;
        }
        console.error("No tokenId found in NFT:", nft);
        return null;
    }

    /**
     * Parsear tokenId a entero
     */
    parseTokenId(tokenId) {
        if (typeof tokenId === 'number') {
            return tokenId;
        } else if (tokenId.startsWith('0x')) {
            return parseInt(tokenId, 16);
        } else {
            return parseInt(tokenId, 10);
        }
    }

    /**
     * Extraer título del NFT
     */
    extractTitle(nft, tokenIdInt) {
        if (nft.title) {
            return nft.title;
        } else if (nft.name) {
            return nft.name;
        } else if (nft.metadata && nft.metadata.name) {
            return nft.metadata.name;
        } else if (nft.contract && nft.contract.name) {
            return `${nft.contract.name} #${tokenIdInt}`;
        }
        return `Token #${tokenIdInt}`;
    }

    /**
     * Extraer URL de imagen del NFT
     */
    extractImageUrl(nft, tokenIdInt, isERC721) {
        let mediaUrl = "";
        let fallbackImageUrl = null;
        
        if (isERC721) {
            mediaUrl = this.getERC721ImageUrl(tokenIdInt);
        } else {
            const result = this.getERC1155ImageUrl(nft, tokenIdInt);
            mediaUrl = result.imageUrl;
            fallbackImageUrl = result.fallbackUrl;
        }
        
        return { imageUrl: mediaUrl, fallbackImageUrl };
    }

    /**
     * Obtener URL de imagen para ERC721
     */
    getERC721ImageUrl(tokenIdInt) {
        const hasZoomToggle = this.activeToggles.has(tokenIdInt) && 
                             this.activeToggles.get(tokenIdInt) === 1;
        
        if (hasZoomToggle) {
            console.log(`🔍 Token ${tokenIdInt} has zoom toggle - using closeup=true`);
            return `https://adrianlab.vercel.app/api/render/${tokenIdInt}.png?closeup=true`;
        } else {
            return `https://adrianlab.vercel.app/api/render/${tokenIdInt}.png`;
        }
    }

    /**
     * Obtener URL de imagen para ERC1155
     */
    getERC1155ImageUrl(nft, tokenIdInt) {
        // Floppy
        if (this.isFloppyToken(tokenIdInt)) {
            if (window.app?.modules?.floppy) {
                return {
                    imageUrl: window.app.modules.floppy.getFloppyImageUrl(tokenIdInt),
                    fallbackUrl: null
                };
            }
            return {
                imageUrl: `https://adrianlab.vercel.app/api/render/${tokenIdInt}.png`,
                fallbackUrl: null
            };
        }
        
        // Serum
        if (this.isSerumToken(tokenIdInt)) {
            if (window.app?.modules?.serums) {
                return {
                    imageUrl: window.app.modules.serums.getSerumImageUrl(tokenIdInt),
                    fallbackUrl: null
                };
            }
            return {
                imageUrl: `https://adrianlab.vercel.app/api/render/${tokenIdInt}.png`,
                fallbackUrl: null
            };
        }
        
        // Traits - usar TraitImageLoader
        const alchemyImageUrl = this.extractAlchemyImageUrl(nft);
        
        if (window.traitImageLoader && typeof window.traitImageLoader.getTraitImageUrl === 'function') {
            try {
                const imageUrls = window.traitImageLoader.getTraitImageUrl(
                    tokenIdInt,
                    alchemyImageUrl || `https://adrianlab.vercel.app/api/render/floppy/${tokenIdInt}.png`
                );
                return {
                    imageUrl: imageUrls.localUrl,
                    fallbackUrl: imageUrls.fallbackUrl
                };
            } catch (error) {
                console.warn('⚠️ Error usando TraitImageLoader, usando fallback:', error);
                return {
                    imageUrl: alchemyImageUrl,
                    fallbackUrl: null
                };
            }
        }
        
        return {
            imageUrl: alchemyImageUrl,
            fallbackUrl: null
        };
    }

    /**
     * Extraer URL de imagen de Alchemy
     */
    extractAlchemyImageUrl(nft) {
        if (nft.raw?.metadata?.image) {
            return nft.raw.metadata.image;
        } else if (nft.media && Array.isArray(nft.media) && nft.media.length > 0) {
            return nft.media[0].gateway || nft.media[0].raw || '';
        } else if (nft.metadata?.image) {
            return nft.metadata.image;
        }
        return '';
    }

    /**
     * Extraer categoría del NFT
     */
    extractCategory(nft) {
        if (!nft.metadata) return '';
        
        let category = nft.metadata.category || nft.metadata.Category || '';
        
        if (!category && nft.metadata.attributes) {
            const categoryAttr = nft.metadata.attributes.find(attr => 
                attr.trait_type && attr.trait_type.toLowerCase() === 'category'
            );
            if (categoryAttr) {
                category = categoryAttr.value.toLowerCase();
            }
        }
        
        return category;
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
