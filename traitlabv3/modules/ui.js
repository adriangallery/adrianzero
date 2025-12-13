/**
 * TRAITLAB - Módulo de UI
 * Maneja todas las funciones helper de interfaz, mensajes, estados y gestión de DOM
 */

class UIManager {
    constructor() {
        this.eventListeners = new Map();
        this.domElements = new Map();
        this.currentFilter = null;
        
        // Selection state properties (like in original index.html)
        this.selectedERC721 = null;
        this.selectedERC1155 = [];
        this.selectedFloppy = null;
        this.selectedPacks = []; // Array para selección múltiple de packs (hasta 4)
        this.selectedSerum = null;
        
        // Lazy loading state for mobile traits
        this.lazyLoadingState = {
            enabled: false,
            allTokens: [],
            currentIndex: 0,
            batchSize: 25, // Cargar 25 traits por batch (se ajusta dinámicamente)
            observer: null,
            sentinel: null
        };
        
        // Image cleanup observer para liberar memoria en móvil
        this.imageCleanupObserver = null;
        
        // Bind methods
        this.displayTokens = this.displayTokens.bind(this);
        this.displayPlaceholders = this.displayPlaceholders.bind(this);
        this.updateSelectionInfo = this.updateSelectionInfo.bind(this);
        this.getImagePath = this.getImagePath.bind(this);
        this.showLoading = this.showLoading.bind(this);
        this.hideLoading = this.hideLoading.bind(this);
        this.showError = this.showError.bind(this);
        this.showSuccess = this.showSuccess.bind(this);
        this.hideMessages = this.hideMessages.bind(this);
        this.showNoTokens = this.showNoTokens.bind(this);

        this.refreshAdrianZeroToken = this.refreshAdrianZeroToken.bind(this);
        
        // Status functions
        this.showApplyStatus = this.showApplyStatus.bind(this);
        this.showRefreshMetadataStatus = this.showRefreshMetadataStatus.bind(this);
        this.showOpenFloppyStatus = this.showOpenFloppyStatus.bind(this);
        this.showUseSerumStatus = this.showUseSerumStatus.bind(this);
        this.showActivateTokenStatus = this.showActivateTokenStatus.bind(this);
        this.showRenameStatus = this.showRenameStatus.bind(this);
        this.showOpenPackStatus = this.showOpenPackStatus.bind(this);
        
        // Selection methods
        this.getSelectionState = this.getSelectionState.bind(this);
    }

    /**
     * Initialize UI manager
     */
    init() {
        this.cacheDOMElements();
        this.setupEventListeners();
    }

    /**
     * Cache DOM elements for better performance
     */
    cacheDOMElements() {
        const elements = [
            'connect-section', 'account-section', 'tokens-section',
            'connectBtn', 'disconnectBtn', 'walletAddress',
            'loading', 'error', 'success', 'no-tokens',
            'tokens-grid', 'contract-btn', 'selection-info',
            'selection-text', 'generated-image',
            'combined-image', 'image-loading-overlay',
            'apply-traits-section', 'applyTraitsBtn', 'apply-status',
            'refresh-metadata-section', 'refreshMetadataBtn', 'refresh-metadata-status',
            'open-floppy-section', 'openFloppyBtn', 'open-floppy-status',
            'open-pack-section', 'open-pack-status',
            'use-serum-section', 'useSerumBtn', 'use-serum-status',
            'activate-token-section', 'activateTokenBtn', 'activate-token-status',
            'rename-section', 'newTokenName', 'approveRenameBtn', 'renameTokenBtn', 'rename-status'
        ];

        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.domElements.set(id, element);
            }
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Contract filter buttons
        const contractBtns = document.querySelectorAll('.contract-btn');
        contractBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                contractBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const contract = btn.dataset.contract;
                const filter = btn.dataset.filter || null;
                
                this.setCurrentFilter(filter);
                this.emit('filterChanged', { contract, filter });
            });
        });

        // Initialize mobile grid layout
        const tokensGrid = this.domElements.get('tokens-grid');
        if (tokensGrid) {
            tokensGrid.classList.add('adrianlab-mobile'); // Default to AdrianLAB layout
        }
    }

    /**
     * Set current filter
     */
    setCurrentFilter(filter) {
        console.log('🔧 setCurrentFilter called with:', filter);
        
        // Clean up lazy loading if changing away from traits
        if (this.currentFilter === 'traits' && filter !== 'traits') {
            this.cleanupLazyLoading();
        }
        
        this.currentFilter = filter;
        console.log('✅ currentFilter set to:', this.currentFilter);
        
        // Update mobile grid layout based on current tab
        const tokensGrid = this.domElements.get('tokens-grid');
        if (tokensGrid) {
            if (filter === 'floppy' || filter === 'serum') {
                tokensGrid.classList.remove('adrianlab-mobile');
            } else {
                tokensGrid.classList.add('adrianlab-mobile');
            }
        }
    }

    /**
     * Get current filter
     */
    getCurrentFilter() {
        return this.currentFilter;
    }

    /**
     * Check if device is mobile
     */
    isMobile() {
        return window.innerWidth <= 768;
    }

    /**
     * Clean up lazy loading observer
     */
    cleanupLazyLoading() {
        if (this.lazyLoadingState.observer) {
            this.lazyLoadingState.observer.disconnect();
            this.lazyLoadingState.observer = null;
        }
        if (this.lazyLoadingState.sentinel) {
            this.lazyLoadingState.sentinel.remove();
            this.lazyLoadingState.sentinel = null;
        }
        
        // Limpiar observer de imágenes
        if (this.imageCleanupObserver) {
            this.imageCleanupObserver.disconnect();
            this.imageCleanupObserver = null;
        }
        
        // Remover listener del data-manager si existe
        const dataManager = window.app?.modules?.dataManager;
        if (dataManager && this._moreTraitsLoadedHandler) {
            dataManager.off('adrianLabMoreTraitsLoaded', this._moreTraitsLoadedHandler);
            this._moreTraitsLoadedHandler = null;
            }
        
        this.lazyLoadingState.enabled = false;
        this.lazyLoadingState.allTokens = [];
        this.lazyLoadingState.currentIndex = 0;
    }

    /**
     * Render a batch of tokens
     */
    renderTokenBatch(tokens, startIndex, endIndex, tokensGrid) {
        const batch = tokens.slice(startIndex, endIndex);
        
        // Limpiar elementos fuera del viewport antes de agregar nuevos (solo en móvil)
        if (this.isMobile()) {
            this.cleanupOffscreenElements(tokensGrid, startIndex, endIndex);
        }
        
        batch.forEach(token => {
            const tokenCard = this.createTokenCard(token);
            tokensGrid.appendChild(tokenCard);
            
            // Observar imágenes para cleanup (solo en móvil)
            if (this.isMobile()) {
                const img = tokenCard.querySelector('img');
                if (img) {
                    this.observeImageForCleanup(img);
                }
            }
        });
        
        return batch.length;
    }

    /**
     * Limpiar elementos fuera del viewport (virtualización para móvil)
     */
    cleanupOffscreenElements(tokensGrid, currentStart, currentEnd) {
        const allCards = Array.from(tokensGrid.querySelectorAll('.token-card'));
        const viewportHeight = window.innerHeight;
        const bufferSize = 300; // Mantener 300px de buffer antes de limpiar
        
        allCards.forEach(card => {
            const cardRect = card.getBoundingClientRect();
            
            // Si está más de bufferSize fuera del viewport, remover
            if (cardRect.bottom < -bufferSize || cardRect.top > viewportHeight + bufferSize) {
                // Limpiar imagen antes de remover
                const img = card.querySelector('img');
                if (img && this.imageCleanupObserver) {
                    this.imageCleanupObserver.unobserve(img);
                    // Limpiar src para liberar memoria
                    if (img.dataset.originalSrc) {
                        img.src = '';
                    }
                }
                card.remove();
            }
        });
    }

    /**
     * Configurar cleanup de imágenes fuera del viewport
     */
    setupImageCleanup() {
        if (!this.imageCleanupObserver) {
            this.imageCleanupObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const img = entry.target;
                    if (!entry.isIntersecting) {
                        // Imagen fuera del viewport: limpiar src para liberar memoria
                        if (img.src && !img.dataset.originalSrc) {
                            img.dataset.originalSrc = img.src;
                        }
                        if (img.dataset.originalSrc) {
                            img.src = ''; // Liberar memoria
                            img.dataset.isUnloaded = 'true';
                        }
                    } else {
                        // Imagen visible: restaurar src si fue descargada
                        if (img.dataset.isUnloaded === 'true' && img.dataset.originalSrc) {
                            img.src = img.dataset.originalSrc;
                            img.dataset.isUnloaded = 'false';
                        }
                    }
                });
            }, {
                rootMargin: '200px' // Mantener 200px de margen
            });
        }
    }

    /**
     * Observar imagen para cleanup automático
     */
    observeImageForCleanup(imgElement) {
        if (!this.imageCleanupObserver) {
            this.setupImageCleanup();
        }
        
        // Guardar src original si no está guardado
        if (imgElement.src && !imgElement.dataset.originalSrc) {
            imgElement.dataset.originalSrc = imgElement.src;
        }
        
        // Observar imagen
        this.imageCleanupObserver.observe(imgElement);
    }

    /**
     * Create a single token card element
     */
    createTokenCard(token) {
            const tokenCard = document.createElement('div');
            tokenCard.className = 'token-card';
            tokenCard.setAttribute('data-token-id', token.tokenId);
            tokenCard.setAttribute('data-contract', token.contract.toLowerCase());
            
            // 🚨 NUEVO: Marcar como seleccionado si ya está en la lista de traits seleccionados
            if (this.currentFilter === 'traits' && window.app?.modules?.traits) {
                const selectedTraits = window.app.modules.traits.getSelectedTraits();
                const isSelected = selectedTraits.some(t => t.tokenId === token.tokenId);
                if (isSelected) {
                    tokenCard.classList.add('selected');
                    console.log(`✅ Token ${token.tokenId} ya está seleccionado, marcando como selected`);
                }
            }
            
        // Obtener imagen y título
        const { imageUrl, displayTitle } = this.getTokenDisplayInfo(token);
        
        // Crear contenido HTML
        tokenCard.innerHTML = this.buildTokenCardHTML(token, imageUrl, displayTitle);
        
        // Agregar event listeners
        this.attachTokenCardListeners(tokenCard, token);
        
        return tokenCard;
    }

    /**
     * Obtener información de visualización del token
     */
    getTokenDisplayInfo(token) {
        let imageUrl = token.imageUrl || this.getDefaultImageUrl();
        let displayTitle = token.title;
        
        // Aplicar lógica específica por filtro
        if (this.currentFilter === 'floppy') {
            displayTitle = this.getFloppyDisplayName(token.tokenId);
            imageUrl = this.getFloppyImageUrl(token);
        } else if (this.currentFilter === 'serum') {
            imageUrl = this.getSerumImageUrl(token);
        }
        
        return { imageUrl, displayTitle };
    }

    /**
     * Construir HTML del token card
     */
    buildTokenCardHTML(token, imageUrl, displayTitle) {
        const quantityTag = this.getQuantityTag(token);
        const categoryDisplay = this.getCategoryDisplay(token);
        const imgTag = this.buildImageTag(token, imageUrl, displayTitle);
        
        return `
                <div style="position: relative;">
                    ${imgTag}
                    ${quantityTag}
                </div>
                <div class="token-info">
                    <div class="token-title">${displayTitle}</div>
                    <div class="token-id">ID: ${token.tokenId}</div>
                    ${categoryDisplay}
                </div>
            `;
    }

    /**
     * Construir tag de imagen con fallback
     */
    buildImageTag(token, imageUrl, displayTitle) {
        const defaultImageUrl = this.getDefaultImageUrl();
        
        if (token.fallbackImageUrl && imageUrl !== token.fallbackImageUrl) {
            const fallbackUrl = token.fallbackImageUrl.replace(/'/g, "\\'");
            return `<img src="${imageUrl}" alt="${displayTitle}" class="token-image" loading="lazy" onerror="if('${fallbackUrl}') { this.src='${fallbackUrl}'; this.onerror=function(){ this.src='${defaultImageUrl}'; }; }">`;
        } else {
            return `<img src="${imageUrl}" alt="${displayTitle}" class="token-image" loading="lazy" onerror="this.src='${defaultImageUrl}'">`;
        }
    }

    /**
     * Obtener URL de imagen por defecto
     */
    getDefaultImageUrl() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+';
    }

    /**
     * Obtener tag de cantidad
     */
    getQuantityTag(token) {
        return token.tokenType === 'ERC1155' && token.balance > 1 ? 
            `<div class="token-quantity-tag">x${token.balance}</div>` : '';
    }

    /**
     * Obtener display de categoría
     */
    getCategoryDisplay(token) {
        return token.tokenType === 'ERC1155' && token.category ? 
            `<div class="token-category">${token.category}</div>` : '';
    }

    /**
     * Obtener nombre de display para floppy
     */
    getFloppyDisplayName(tokenId) {
        const floppyNames = {
            10003: 'GLITCH Floppy',
            10004: 'GF Floppy',
            10005: 'Golden Floppy',
            10007: 'NEONpack',
            10008: 'OPTICALpack',
            10009: 'PUNKSfloppy',
            10010: 'ComradesUSB',
            1123: 'CensorPACK',
            15010: 'Back to Work'
        };
        
        return floppyNames[tokenId] || tokenId.toString().replace(/^\d+\s*/, '');
    }

    /**
     * Obtener URL de imagen para floppy
     */
    getFloppyImageUrl(token) {
        if (window.app?.modules?.floppy) {
            return window.app.modules.floppy.getFloppyImageUrl(token.tokenId);
        }
        // Fallback: usar getImagePath para tokens específicos
        const floppyImageMap = {
            10000: '.gif', 10001: '.gif', 10002: '.gif', 10003: '.gif', 10004: '.gif',
            10005: '.gif', 10007: '.gif', 10008: '.gif', 10009: '.gif', 10010: '.gif',
            10011: '.gif', 10012: '.gif', 10013: '.gif', 10015: '.gif',
            15000: '.gif', 15001: '.gif', 15002: '.gif', 15003: '.gif', 15004: '.gif',
            15005: '.gif', 15006: '.gif', 15007: '.gif',
            15008: '.png', 15009: '.png', 15010: '.png', 15011: '.png',
            15012: '.png', 15013: '.png', 15014: '.png', 15015: '.png'
        };
        
        if (floppyImageMap[token.tokenId]) {
            return this.getImagePath(token.tokenId, floppyImageMap[token.tokenId]);
        }
        
        return token.imageUrl || this.getDefaultImageUrl();
    }

    /**
     * Obtener URL de imagen para serum
     */
    getSerumImageUrl(token) {
        if (window.app?.modules?.serums) {
            return window.app.modules.serums.getSerumImageUrl(token.tokenId);
        }
        // Fallback: usar getImagePath para serums específicos
        if (token.tokenId >= 262144 && token.tokenId <= 262147) {
            return this.getImagePath(token.tokenId, '.gif');
        }
        return token.imageUrl || this.getDefaultImageUrl();
    }

    /**
     * Adjuntar event listeners al token card
     */
    attachTokenCardListeners(tokenCard, token) {
        const clickHandler = () => {
            this.handleTokenSelection(tokenCard, token);
        };
        
        tokenCard._clickHandler = clickHandler;
        tokenCard.addEventListener('click', clickHandler);
    }

    /**
     * Load next batch of traits using lazy loading
     * Ahora carga desde Alchemy cuando se necesitan más traits
     */
    async loadNextBatch() {
        const state = this.lazyLoadingState;
        const tokensGrid = this.domElements.get('tokens-grid');
        if (!tokensGrid || !state.enabled) return;
        
        // Verificar si necesitamos cargar más desde Alchemy
        const needsMoreFromAlchemy = state.currentIndex >= state.allTokens.length;
        
        if (needsMoreFromAlchemy) {
            // Cargar más traits desde Alchemy
            console.log('📡 No hay más traits locales, cargando desde Alchemy...');
            
            const dataManager = window.app?.modules?.dataManager;
            if (!dataManager) {
                console.warn('📊 DataManager no disponible');
                this.cleanupLazyLoading();
                return;
            }
            
            try {
                // Cargar siguiente batch desde Alchemy
                const newTraits = await dataManager.loadMoreTraits();
                
                if (newTraits && newTraits.length > 0) {
                    // Agregar nuevos traits al array local
                    state.allTokens = [...state.allTokens, ...newTraits];
                    console.log(`✅ ${newTraits.length} nuevos traits cargados desde Alchemy (total: ${state.allTokens.length})`);
                    
                    // Continuar con el renderizado del batch
                    // (el código continuará después de este if)
                } else {
                    // No hay más traits disponibles
                    console.log('✅ No hay más traits disponibles');
                    this.cleanupLazyLoading();
                    return;
                }
            } catch (error) {
                console.error('❌ Error cargando más traits desde Alchemy:', error);
                this.cleanupLazyLoading();
                return;
            }
        }
        
        const endIndex = Math.min(state.currentIndex + state.batchSize, state.allTokens.length);
        
        if (state.currentIndex >= state.allTokens.length) {
            // All tokens loaded, remove sentinel
            if (state.sentinel) {
                state.sentinel.remove();
                state.sentinel = null;
            }
            if (state.observer) {
                state.observer.disconnect();
                state.observer = null;
            }
            return;
        }
        
        console.log(`📦 Lazy loading batch: ${state.currentIndex} to ${endIndex} (${endIndex - state.currentIndex} traits)`);
        
        // Remove old sentinel if exists
        if (state.sentinel) {
            state.sentinel.remove();
        }
        
        // Render batch
        this.renderTokenBatch(state.allTokens, state.currentIndex, endIndex, tokensGrid);
        state.currentIndex = endIndex;
        
        // Update selection info after rendering
        this.updateSelectionInfo();
        
        // Verificar si hay más traits disponibles (localmente o desde Alchemy)
        const dataManager = window.app?.modules?.dataManager;
        const hasMoreFromAlchemy = dataManager?.paginationState?.traits?.hasMore || false;
        const hasMoreLocally = state.currentIndex < state.allTokens.length;
        const hasMore = hasMoreLocally || hasMoreFromAlchemy;
        
        // Add new sentinel for next batch if there are more tokens
        if (hasMore) {
            state.sentinel = document.createElement('div');
            state.sentinel.className = 'lazy-loading-sentinel';
            state.sentinel.style.height = '20px';
            state.sentinel.style.width = '100%';
            tokensGrid.appendChild(state.sentinel);
            
            // Observe the sentinel
            if (state.observer) {
                state.observer.observe(state.sentinel);
            }
        } else {
            // All loaded, cleanup
            if (state.observer) {
                state.observer.disconnect();
                state.observer = null;
            }
            console.log('✅ All traits loaded via lazy loading');
        }
    }

    /**
     * Configurar listeners de data-manager ANTES de iniciar lazy loading
     */
    setupDataManagerListeners() {
        const dataManager = window.app?.modules?.dataManager;
        if (!dataManager) {
            console.warn('⚠️ DataManager no disponible para configurar listeners');
            return;
        }
        
        // Remover listener anterior si existe
        if (this._moreTraitsLoadedHandler) {
            dataManager.off('adrianLabMoreTraitsLoaded', this._moreTraitsLoadedHandler);
        }
        
        // Crear nuevo handler
        this._moreTraitsLoadedHandler = (data) => {
            if (this.lazyLoadingState.enabled && data.newTraits) {
                console.log(`📡 Nuevos traits cargados desde Alchemy: ${data.newTraits.length}`);
                // Los nuevos traits ya fueron agregados a allTokens en loadNextBatch
                // Solo necesitamos verificar si debemos continuar cargando
                if (data.hasMore && this.lazyLoadingState.sentinel) {
                    // Asegurar que el sentinel esté siendo observado
                    if (this.lazyLoadingState.observer) {
                        this.lazyLoadingState.observer.observe(this.lazyLoadingState.sentinel);
                    }
                }
            }
        };
        
        // Configurar listener ANTES de que dataManager comience a cargar
        dataManager.on('adrianLabMoreTraitsLoaded', this._moreTraitsLoadedHandler);
        console.log('✅ Listeners de DataManager configurados');
    }

    /**
     * Setup lazy loading for traits on mobile
     * Ahora integrado con carga desde Alchemy
     */
    setupLazyLoading(tokens) {
        const tokensGrid = this.domElements.get('tokens-grid');
        if (!tokensGrid) return;
        
        // 🚨 NUEVO: Configurar listeners ANTES de iniciar lazy loading
        this.setupDataManagerListeners();
        
        // Clean up any existing lazy loading
        this.cleanupLazyLoading();
        
        // Ajustar batch size dinámicamente según cantidad total de traits
        // Para wallets grandes (1000+), usar batch más pequeño para evitar memory issues
        if (tokens.length > 500) {
            this.lazyLoadingState.batchSize = 15; // Batch más pequeño para wallets grandes
            console.log(`📱 Wallet grande detectada (${tokens.length} traits), usando batch size: ${this.lazyLoadingState.batchSize}`);
        } else if (tokens.length > 200) {
            this.lazyLoadingState.batchSize = 20; // Batch medio
        } else {
            this.lazyLoadingState.batchSize = 25; // Default para wallets pequeñas
        }
        
        // Initialize state
        this.lazyLoadingState.allTokens = tokens;
        this.lazyLoadingState.currentIndex = 0;
        this.lazyLoadingState.enabled = true;
        
        // Configurar cleanup de imágenes si es móvil
        if (this.isMobile()) {
            this.setupImageCleanup();
        }
        
        // Load first batch immediately
        this.loadNextBatch();
        
        // Setup IntersectionObserver for subsequent batches
        this.lazyLoadingState.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.lazyLoadingState.enabled) {
                    this.loadNextBatch();
                }
            });
        }, {
            rootMargin: '200px' // Start loading 200px before sentinel is visible
        });
        
        // Observe sentinel if it exists
        if (this.lazyLoadingState.sentinel) {
            this.lazyLoadingState.observer.observe(this.lazyLoadingState.sentinel);
        }
    }

    /**
     * Display tokens in grid
     * @param {Array} tokens - Array de tokens a mostrar
     * @param {Object|string|boolean} options - Opciones de visualización o compatibilidad hacia atrás
     * @param {string} options.filter - Filtro actual (opcional, se usa currentFilter si no se proporciona)
     * @param {boolean} options.skipSelectionUpdate - Si true, no actualiza selección
     * @param {boolean} options.hasLoadingWheels - Si true, muestra loading wheels
     */
    displayTokens(tokens, options = {}) {
        // Compatibilidad con llamadas antiguas
        let filter, skipSelectionUpdate, hasLoadingWheels;
        
        if (typeof options === 'string') {
            // Llamada antigua: displayTokens(tokens, 'filter')
            filter = options;
            skipSelectionUpdate = false;
            hasLoadingWheels = false;
        } else if (typeof options === 'boolean') {
            // Llamada antigua: displayTokens(tokens, skipSelectionUpdate, hasLoadingWheels)
            skipSelectionUpdate = options;
            hasLoadingWheels = arguments[2] || false;
            filter = this.currentFilter;
        } else {
            // Llamada nueva: displayTokens(tokens, { filter, skipSelectionUpdate, hasLoadingWheels })
            filter = options.filter || this.currentFilter;
            skipSelectionUpdate = options.skipSelectionUpdate || false;
            hasLoadingWheels = options.hasLoadingWheels || false;
        }
        
        const tokensGrid = this.domElements.get('tokens-grid');
        if (!tokensGrid) return;

        // Clean up existing event listeners before clearing
        const existingCards = tokensGrid.querySelectorAll('.token-card');
        existingCards.forEach(card => {
            if (card._clickHandler) {
                card.removeEventListener('click', card._clickHandler);
                delete card._clickHandler;
            }
        });

        // Clean up any existing lazy loading
        this.cleanupLazyLoading();

        tokensGrid.innerHTML = "";
        
        // 🚨 LAZY LOADING: Check if we should use lazy loading (mobile + traits tab + many tokens)
        const shouldUseLazyLoading = this.isMobile() && 
                                     filter === 'traits' && 
                                     tokens.length > 50; // Only use lazy loading if more than 50 traits
        
        if (shouldUseLazyLoading) {
            console.log(`📱 Lazy loading enabled for ${tokens.length} traits on mobile`);
            this.setupLazyLoading(tokens);
            if (!skipSelectionUpdate) {
                this.updateSelectionInfo();
            }
            return;
        }
        
        // 🚨 NUEVO: Mostrar loading wheel si se especifica
        if (hasLoadingWheels) {
            console.log('🔄 Mostrando tokens con loading wheels...');
        }
        
        // Standard rendering for desktop or non-traits tabs
        tokens.forEach(token => {
            const tokenCard = this.createTokenCard(token);
            tokensGrid.appendChild(tokenCard);
        });
        
        if (!skipSelectionUpdate) {
            this.updateSelectionInfo();
        }
    }

    /**
     * Display placeholders for tokens to give loading sensation
     */
    displayPlaceholders(tokens, filter) {
        const tokensGrid = this.domElements.get('tokens-grid');
        if (!tokensGrid) return;

        // Clear existing content
        tokensGrid.innerHTML = "";
        tokensGrid.className = ""; // Clear any specific classes

        console.log(`🎯 Mostrando ${tokens.length} placeholders para ${filter}...`);

        tokens.forEach((token, index) => {
            const placeholderCard = document.createElement('div');
            placeholderCard.className = 'token-card placeholder';
            placeholderCard.setAttribute('data-token-id', token.tokenId);
            placeholderCard.setAttribute('data-contract', token.contract.toLowerCase());

            // Create placeholder content
            placeholderCard.innerHTML = `
                <div class="token-image-container">
                    <div class="placeholder-image">
                        <div class="loading-spinner"></div>
                    </div>
                </div>
                <div class="token-info">
                    <div class="token-name placeholder-text">Loading...</div>
                    <div class="token-id placeholder-text">ID: ${token.tokenId}</div>
                </div>
            `;

            // Add click handler for selection
            const clickHandler = () => {
                this.handleTokenSelection(placeholderCard, token);
            };
            placeholderCard.addEventListener('click', clickHandler);
            placeholderCard._clickHandler = clickHandler;

            tokensGrid.appendChild(placeholderCard);
        });

        console.log(`✅ ${tokens.length} placeholders mostrados para ${filter}`);
    }

    /**
     * Handle token selection with visual feedback
     */
    handleTokenSelection(tokenCard, token) {
        console.log('🔍 handleTokenSelection called with:', { token, currentFilter: this.currentFilter });
        
        const tokensGrid = this.domElements.get('tokens-grid');
        if (!tokensGrid) {
            console.error('❌ tokensGrid not found');
            return;
        }

        if (token.tokenType === 'ERC721') {
            this.handleERC721Selection(tokenCard, token, tokensGrid);
        } else {
            this.handleERC1155Selection(tokenCard, token, tokensGrid);
        }
        
        // Emitir evento
        this.emit('tokenSelected', { token, filter: this.currentFilter });
        
        // Manejar acciones específicas por filtro
        this.handleFilterSpecificActions(token);
    }

    /**
     * Manejar selección de tokens ERC721
     */
    handleERC721Selection(tokenCard, token, tokensGrid) {
            // Single selection for ERC721
            if (this.selectedERC721 && this.selectedERC721.tokenId === token.tokenId) {
                this.selectedERC721 = null;
                tokenCard.classList.remove('selected');
            } else {
                // Deselect previous ERC721
                const prevSelected = tokensGrid.querySelector('.token-card.selected');
                if (prevSelected) prevSelected.classList.remove('selected');
                
                this.selectedERC721 = token;
                tokenCard.classList.add('selected');
            }
    }

    /**
     * Manejar selección de tokens ERC1155
     */
    handleERC1155Selection(tokenCard, token, tokensGrid) {
            if (this.currentFilter === 'floppy') {
            this.handleFloppySelection(tokenCard, token, tokensGrid);
        } else if (this.currentFilter === 'serum') {
            this.handleSerumSelection(tokenCard, token, tokensGrid);
        } else {
            this.handleTraitsSelection(tokenCard, token);
        }
    }

    /**
     * Manejar selección de floppy
     */
    handleFloppySelection(tokenCard, token, tokensGrid) {
                const packIndex = this.selectedPacks.findIndex(p => p.tokenId === token.tokenId);
                if (packIndex !== -1) {
                    this.selectedPacks.splice(packIndex, 1);
                    tokenCard.classList.remove('selected');
                    this.selectedFloppy = null;
                } else {
                    if (this.selectedPacks.length > 0) {
                        const prevSelectedCard = tokensGrid.querySelector('.token-card.selected');
                        if (prevSelectedCard) {
                            prevSelectedCard.classList.remove('selected');
                        }
                        this.selectedPacks = [];
                    }
                    
                    this.selectedPacks = [token];
                    tokenCard.classList.add('selected');
                    this.selectedFloppy = token;
                }
                
                this.emit('packsSelectionChanged', { 
                    selectedPacks: this.selectedPacks,
                    selectedFloppy: this.selectedFloppy 
                });
    }

    /**
     * Manejar selección de serum
     */
    handleSerumSelection(tokenCard, token, tokensGrid) {
                if (this.selectedSerum && this.selectedSerum.tokenId === token.tokenId) {
                    this.selectedSerum = null;
                    tokenCard.classList.remove('selected');
                } else {
                    const prevSelected = tokensGrid.querySelector('.token-card.selected');
                    if (prevSelected) prevSelected.classList.remove('selected');
                    
                    this.selectedSerum = token;
                    tokenCard.classList.add('selected');
                }
    }

    /**
     * Manejar selección de traits
     */
    handleTraitsSelection(tokenCard, token) {
        // Delegar al módulo de traits
        if (window.app?.modules?.traits) {
            // 🚨 NUEVO: Obtener categoría antes de seleccionar para manejar exclusión mutua visual
            const category = window.app.modules.traits.getTraitCategory(token.tokenId);
            const selectedTraitsByCategory = window.app.modules.traits.getSelectedTraitsByCategory();
            
            // Si hay un trait de la misma categoría ya seleccionado, deseleccionarlo visualmente primero
            if (category && selectedTraitsByCategory.has(category)) {
                const existingTrait = selectedTraitsByCategory.get(category);
                // Buscar el card del trait existente y deseleccionarlo visualmente
                const tokensGrid = tokenCard.closest('#tokens-grid');
                if (tokensGrid) {
                    const existingCard = tokensGrid.querySelector(`[data-token-id="${existingTrait.tokenId}"]`);
                    if (existingCard && existingCard !== tokenCard) {
                        existingCard.classList.remove('selected');
                        console.log(`🔄 Deseleccionando visualmente trait ${existingTrait.tokenId} de categoría ${category}`);
                    }
                }
            }
            
            const wasSelected = window.app.modules.traits.handleTraitSelection(token);
            if (wasSelected) {
                tokenCard.classList.add('selected');
            } else {
                tokenCard.classList.remove('selected');
            }
        } else {
            // Fallback: toggle simple
            tokenCard.classList.toggle('selected');
        }
    }

    /**
     * Manejar acciones específicas por filtro
     */
    handleFilterSpecificActions(token) {
        // Rename tab
        if (this.currentFilter === 'rename' && token.tokenType === 'ERC721') {
            if (window.app?.modules?.stickyPopupManager?.showRenameSection) {
                window.app.modules.stickyPopupManager.showRenameSection();
            }
        }
        
        // Lambo tab
        if (this.currentFilter === 'lambo' && token.tokenType === 'ERC721') {
            if (window.app?.modules?.lambo) {
                window.app.modules.lambo.selectAdrianZero(token);
                this.showLamboModal(token);
            }
        }
        
        // Customise tab
        if (this.currentFilter === 'customise' && token.tokenType === 'ERC721') {
            if (window.app?.modules?.stickyPopupManager) {
                window.app.modules.stickyPopupManager.selectedERC721 = token;
                window.app.modules.stickyPopupManager.openCustomiseModal();
            }
        }
    }

    /**
     * Update visual selection state for all tokens
     */
    updateVisualSelection(selectedTokens) {
        const tokensGrid = this.domElements.get('tokens-grid');
        if (!tokensGrid) return;

        const allTokenCards = tokensGrid.querySelectorAll('.token-card');
        allTokenCards.forEach(card => {
            const tokenId = parseInt(card.getAttribute('data-token-id'));
            const isSelected = selectedTokens.some(t => t.tokenId === tokenId);
            
            if (isSelected) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    /**
     * Update selection info display
     */
    updateSelectionInfo() {
        // This will be implemented when we have the selection state management
        this.emit('selectionInfoUpdate');
    }

    /**
     * Function to get correct image path based on environment
     */
    getImagePath(assetId, extension) {
        // Check if we're running locally (localhost) or online
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocal) {
            // Local development - use relative path from current directory
            return '../components/images/' + assetId + extension;
        } else {
            // Production - use absolute path from root
            return '/components/images/' + assetId + extension;
        }
    }

    /**
     * Loading states
     */
    showLoading() {
        const loading = this.domElements.get('loading');
        if (loading) loading.style.display = 'block';
    }

    hideLoading() {
        const loading = this.domElements.get('loading');
        if (loading) loading.style.display = 'none';
    }

    /**
     * 🚨 NUEVO: Actualizar solo los nombres de los tokens sin re-renderizar todo
     */
    updateTokenNamesOnly(nameMap) {
        console.log('📝 Actualizando nombres de tokens progresivamente...');
        
        Object.entries(nameMap).forEach(([tokenId, customName]) => {
            const tokenCard = document.querySelector(`[data-token-id="${tokenId}"]`);
            if (tokenCard) {
                const titleElement = tokenCard.querySelector('.token-title');
                if (titleElement && customName) {
                    // Agregar animación de actualización
                    titleElement.classList.add('name-update-glow');
                    titleElement.textContent = customName;
                    
                    // Remover animación después de un tiempo
                    setTimeout(() => {
                        titleElement.classList.remove('name-update-glow');
                    }, 1000);
                }
            }
        });
    }

    /**
     * 🚨 NUEVO: Finalizar carga progresiva removiendo loading wheels
     */
    finalizeProgressiveLoading() {
        console.log('✅ Finalizando carga progresiva...');
        
        const loadingOverlays = document.querySelectorAll('.token-loading-overlay');
        loadingOverlays.forEach(overlay => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
            }, 500);
        });
    }

    /**
     * Message states
     */
    showError(message) {
        const error = this.domElements.get('error');
        if (error) {
            error.textContent = message;
            error.style.display = 'block';
        }
    }

    showSuccess(message) {
        const success = this.domElements.get('success');
        if (success) {
            success.textContent = message;
            success.style.display = 'block';
        }
    }

    hideMessages() {
        const error = this.domElements.get('error');
        const success = this.domElements.get('success');
        if (error) error.style.display = 'none';
        if (success) success.style.display = 'none';
    }

    /**
     * No tokens state
     */
    showNoTokens() {
        const noTokens = this.domElements.get('no-tokens');
        if (noTokens) {
            noTokens.style.display = 'block';
            const tokensGrid = this.domElements.get('tokens-grid');
            if (tokensGrid) tokensGrid.innerHTML = '';
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
            const newUrl = `https://adrianlab.vercel.app/api/render/${tokenId}.png?v=${timestamp}`;
            
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
    }

    /**
     * Status functions for different operations
     */
    showApplyStatus(message, type) {
        const applyStatus = this.domElements.get('apply-status');
        if (applyStatus) {
            applyStatus.textContent = message;
            applyStatus.className = `apply-status ${type}`;
            applyStatus.style.display = 'block';
            
            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    applyStatus.style.display = 'none';
                }, 5000);
            }
        }
    }

    showRefreshMetadataStatus(message, type) {
        const refreshMetadataStatus = this.domElements.get('refresh-metadata-status');
        if (refreshMetadataStatus) {
            refreshMetadataStatus.textContent = message;
            refreshMetadataStatus.className = `apply-status ${type}`;
            refreshMetadataStatus.style.display = 'block';
            
            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    refreshMetadataStatus.style.display = 'none';
                }, 5000);
            }
        }
    }

    showOpenFloppyStatus(message, type) {
        const openFloppyStatus = this.domElements.get('open-floppy-status');
        if (openFloppyStatus) {
            openFloppyStatus.textContent = message;
            openFloppyStatus.className = `apply-status ${type}`;
            openFloppyStatus.style.display = 'block';
            
            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    openFloppyStatus.style.display = 'none';
                }, 5000);
            }
        }
    }

    showUseSerumStatus(message, type) {
        const useSerumStatus = this.domElements.get('use-serum-status');
        if (useSerumStatus) {
            useSerumStatus.textContent = message;
            useSerumStatus.className = `apply-status ${type}`;
            useSerumStatus.style.display = 'block';
            
            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    useSerumStatus.style.display = 'none';
                }, 5000);
            }
        }
    }

    showActivateTokenStatus(message, type) {
        const activateTokenStatus = this.domElements.get('activate-token-status');
        if (activateTokenStatus) {
            activateTokenStatus.textContent = message;
            activateTokenStatus.className = `apply-status ${type}`;
            activateTokenStatus.style.display = 'block';
            
            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    activateTokenStatus.style.display = 'none';
                }, 5000);
            }
        }
    }

    showRenameStatus(message, type) {
        const renameStatus = this.domElements.get('rename-status');
        if (renameStatus) {
            renameStatus.textContent = message;
            renameStatus.className = `apply-status ${type}`;
            renameStatus.style.display = 'block';
            
            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    renameStatus.style.display = 'none';
                }, 5000);
            }
        }
    }

    showOpenPackStatus(message, type) {
        const openPackStatus = this.domElements.get('open-pack-status');
        if (openPackStatus) {
            openPackStatus.textContent = message;
            openPackStatus.className = `apply-status ${type}`;
            openPackStatus.style.display = 'block';
            
            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    openPackStatus.style.display = 'none';
                }, 5000);
            }
        }
    }

    /**
     * Get current selection state
     */
    getSelectionState() {
        return {
            selectedERC721: this.selectedERC721,
            selectedERC1155: this.selectedERC1155,
            selectedFloppy: this.selectedFloppy,
            selectedPacks: this.selectedPacks,
            selectedSerum: this.selectedSerum,
            currentFilter: this.currentFilter
        };
    }

    /**
     * Show Lambo modal
     */
    showLamboModal(selectedToken) {
        console.log('🚗 Showing Lambo modal...');
        
        const modal = document.getElementById('lambo-modal');
        if (!modal) return;
        
        const lamboManager = window.app?.modules?.lambo;
        if (!lamboManager) return;
        
        const colors = lamboManager.getLamboColors();
        const previouslySelectedColor = lamboManager.getSelectedLamboColor();
        
        // Update selected token info
        const tokenInfo = modal.querySelector('#lambo-selected-token');
        if (tokenInfo) {
            tokenInfo.textContent = `${selectedToken.title} (ID: ${selectedToken.tokenId})`;
        }
        
        // Generate color buttons with previous selection
        const colorGrid = modal.querySelector('.lambo-color-grid');
        if (colorGrid) {
            colorGrid.innerHTML = colors.map(color => {
                const isSelected = previouslySelectedColor === color.name ? 'selected' : '';
                return `<button class="lambo-color-btn ${isSelected}" data-color="${color.name}" title="${color.display}">
                    ${color.emoji} ${color.display}
                </button>`;
            }).join('');
        }
        
        // Show modal
        modal.style.display = 'flex';
        
        // Setup event listeners
        this.setupLamboModalEvents();
        
        // If there was a previously selected color, generate the image automatically
        if (previouslySelectedColor) {
            console.log('🚗 Auto-generating image with previously selected color:', previouslySelectedColor);
            this.selectLamboColor(previouslySelectedColor, false); // Don't auto-generate here
            lamboManager.generateLamboImage(); // Generate manually
        }
    }

    /**
     * Setup Lambo modal event listeners
     */
    setupLamboModalEvents() {
        const modal = document.getElementById('lambo-modal');
        if (!modal) return;
        
        const closeBtn = modal.querySelector('.lambo-modal-close');
        const colorBtns = modal.querySelectorAll('.lambo-color-btn');
        
        // Close modal events
        if (closeBtn) {
            closeBtn.onclick = () => this.closeLamboModal();
        }
        
        modal.onclick = (e) => {
            if (e.target === modal) this.closeLamboModal();
        };
        
        // Color selection events
        colorBtns.forEach(btn => {
            btn.onclick = () => {
                const colorName = btn.dataset.color;
                this.selectLamboColor(colorName);
            };
        });
    }

    /**
     * Close Lambo modal
     */
    closeLamboModal() {
        const modal = document.getElementById('lambo-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Select Lambo color
     */
    selectLamboColor(colorName, autoGenerate = true) {
        console.log('🚗 Lambo color selected:', colorName);
        
        const lamboManager = window.app?.modules?.lambo;
        if (!lamboManager) return;
        
        lamboManager.selectLamboColor(colorName);
        
        // Update UI to show selected color
        const colorButtons = document.querySelectorAll('.lambo-color-btn');
        colorButtons.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.color === colorName) {
                btn.classList.add('selected');
            }
        });
        
        // Generate image automatically unless explicitly disabled
        if (autoGenerate) {
            lamboManager.generateLamboImage();
        }
    }

    /**
     * Display generated Lambo image
     */
    displayLamboImage(imageUrl, token, color) {
        console.log('🚗 Displaying generated Lambo image:', imageUrl);
        
        const modal = document.getElementById('lambo-modal');
        const previewImage = modal?.querySelector('#lambo-preview-image');
        const loadingOverlay = modal?.querySelector('#lambo-loading');
        
        if (!previewImage || !loadingOverlay) return;
        
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        previewImage.style.display = 'none';
        
        // Preload image
        const img = new Image();
        img.onload = () => {
            // Hide loading overlay
            loadingOverlay.style.display = 'none';
            
            // Set image source
            previewImage.src = imageUrl;
            previewImage.alt = `AdrianZERO ${token.tokenId} with Lambo ${color}`;
            
            // Show generated image
            previewImage.style.display = 'block';
            
            console.log('✅ Lambo image loaded successfully');
        };
        
        img.onerror = () => {
            console.error('❌ Error loading Lambo image');
            loadingOverlay.style.display = 'none';
        };
        
        img.src = imageUrl;
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
    window.TraitLABUI = UIManager;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}
