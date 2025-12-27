/**
 * TRAITLAB - Módulo de UI
 * Maneja todas las funciones helper de interfaz, mensajes, estados y gestión de DOM
 */

class UIManager {
    constructor() {
        this.eventListeners = new Map();
        this.domElements = new Map();
        this.currentFilter = null;
        this._traitsSeenIds = new Set();
        
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
            batchSize: 25, // Cargar 25 traits por batch
            observer: null,
            sentinel: null
        };
        
        // Pagination state for traits (max 300 per page)
        this.paginationState = {
            enabled: false,
            allTokens: [], // Todos los traits cargados (cache completo)
            currentPage: 1,
            tokensPerPage: 300, // Máximo de tokens por pantalla
            totalPages: 1
        };
        
        // Bind methods
        this.displayTokens = this.displayTokens.bind(this);
        this.displayPlaceholders = this.displayPlaceholders.bind(this);
        this.updateSelectionInfo = this.updateSelectionInfo.bind(this);
        this.getImagePath = this.getImagePath.bind(this);
        this.getTokenKey = this.getTokenKey.bind(this);
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

        // Crear botón de carga incremental si no existe
        const tokensGrid = document.getElementById('tokens-grid');
        if (tokensGrid && !document.getElementById('load-more-traits')) {
            const btn = document.createElement('button');
            btn.id = 'load-more-traits';
            btn.className = 'btn btn-secondary mt-3 load-more-btn';
            btn.style.display = 'none';
            btn.textContent = 'Load More';
            tokensGrid.parentNode.insertBefore(btn, tokensGrid.nextSibling);
            this.domElements.set('load-more-traits', btn);
        } else if (tokensGrid) {
            const btn = document.getElementById('load-more-traits');
            if (btn) {
                btn.textContent = 'Load More';
            }
            this.domElements.set('load-more-traits', btn);
        }
        
        // Crear controles de paginación si no existen
        if (tokensGrid && !document.getElementById('pagination-controls')) {
            const paginationDiv = document.createElement('div');
            paginationDiv.id = 'pagination-controls';
            paginationDiv.className = 'pagination-controls';
            paginationDiv.style.display = 'none';
            paginationDiv.innerHTML = `
                <button id="prev-page-btn" class="btn btn-secondary">Previous</button>
                <span id="page-info" class="page-info">Page 1 of 1</span>
                <button id="next-page-btn" class="btn btn-secondary">Next</button>
            `;
            tokensGrid.parentNode.insertBefore(paginationDiv, tokensGrid.nextSibling);
            this.domElements.set('pagination-controls', paginationDiv);
            this.domElements.set('prev-page-btn', paginationDiv.querySelector('#prev-page-btn'));
            this.domElements.set('next-page-btn', paginationDiv.querySelector('#next-page-btn'));
            this.domElements.set('page-info', paginationDiv.querySelector('#page-info'));
        } else if (tokensGrid) {
            const paginationDiv = document.getElementById('pagination-controls');
            if (paginationDiv) {
                this.domElements.set('pagination-controls', paginationDiv);
                this.domElements.set('prev-page-btn', paginationDiv.querySelector('#prev-page-btn'));
                this.domElements.set('next-page-btn', paginationDiv.querySelector('#next-page-btn'));
                this.domElements.set('page-info', paginationDiv.querySelector('#page-info'));
            }
        }
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

        // Botón "Load More"
        const loadMoreBtn = this.domElements.get('load-more-traits');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', async () => {
                const dataManager = window.app?.modules?.dataManager;
                if (!dataManager) return;
                loadMoreBtn.disabled = true;
                loadMoreBtn.textContent = 'Loading...';
                try {
                    // 🚨 FIX: Obtener estado antes de cargar
                    const statusBefore = dataManager.getTraitsStatus?.() || {};
                    console.log(`📊 UI: Estado antes de cargar más traits: ${statusBefore.totalLoaded || 0} en cache, ${this.paginationState.allTokens.length} en pantalla`);
                    
                    const newTraits = await dataManager.loadMoreTraits();
                    
                    // 🚨 FIX: Obtener estado después de cargar
                    const statusAfter = dataManager.getTraitsStatus?.() || {};
                    console.log(`📊 UI: Estado después de cargar: ${statusAfter.totalLoaded || 0} en cache, ${newTraits?.length || 0} nuevos traits recibidos`);
                    
                    if (newTraits && newTraits.length > 0) {
                        // 🚨 FIX: Sincronizar con cache de data-manager como fuente única de verdad
                        const allTraitsFromCache = dataManager.getFilteredTokens?.('traits') || [];
                        this.paginationState.allTokens = allTraitsFromCache;
                        this.paginationState.totalPages = Math.ceil(this.paginationState.allTokens.length / this.paginationState.tokensPerPage);
                        
                        console.log(`📊 UI: Sincronizado con cache - ${this.paginationState.allTokens.length} traits totales en pantalla`);
                        
                        // Si estamos en modo paginación, actualizar la vista
                        if (this.paginationState.enabled) {
                            this.updatePaginationDisplay();
                        } else {
                            // Si no estamos en modo paginación, simplemente agregar
                            this.appendTokens(newTraits);
                        }
                    } else {
                        console.log(`📊 UI: No se agregaron nuevos traits (${newTraits?.length || 0} recibidos)`);
                    }
                    const hasMore = dataManager.getTraitsHasMore?.() ?? false;
                    this.setLoadMoreVisibility(hasMore && !this.isMobile() && !this.paginationState.enabled); // Ocultar si estamos en modo paginación
                } catch (err) {
                    console.error('❌ Error loading more traits:', err);
                } finally {
                    loadMoreBtn.disabled = false;
                    loadMoreBtn.textContent = 'Load More';
                }
            });
        }
        
        // Controles de paginación
        const prevBtn = this.domElements.get('prev-page-btn');
        const nextBtn = this.domElements.get('next-page-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.goToPreviousPage());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.goToNextPage());
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
            // Mantener cache pero desactivar paginación
            this.paginationState.enabled = false;
            this.hidePaginationControls();
        }
        
        this.currentFilter = filter;
        console.log('✅ currentFilter set to:', this.currentFilter);
        
        // Aplicar nombres pendientes si volvemos a adrianzero
        if (filter === 'adrianzero' && window.app?.pendingAdrianZeroNameMap) {
            const pendingMap = window.app.pendingAdrianZeroNameMap;
            if (pendingMap && Object.keys(pendingMap).length > 0) {
                console.log('📝 Aplicando nombres personalizados pendientes al volver a adrianzero');
                this.updateTokenNamesOnly(pendingMap);
                this.finalizeProgressiveLoading?.();
            }
        }

        // Mostrar tokens pendientes si estaban diferidos mientras el usuario estaba en otra pestaña
        if (filter === 'adrianzero' && window.app?.pendingAdrianZeroTokens) {
            const pendingTokens = window.app.pendingAdrianZeroTokens;
            if (pendingTokens && Array.isArray(pendingTokens) && pendingTokens.length > 0) {
                console.log('🎯 Mostrando AdrianZERO tokens pendientes al volver a adrianzero');
                this.displayTokens(pendingTokens, 'adrianzero');
                window.app.pendingAdrianZeroTokens = null;
            }
        }
        
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
     * Mostrar/ocultar botón "Cargar más traits" (solo desktop)
     */
    setLoadMoreVisibility(show) {
        const btn = this.domElements.get('load-more-traits');
        if (!btn) return;
        btn.style.display = show ? 'block' : 'none';
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
        
        // Remover listener del data-manager si existe
        const dataManager = window.app?.modules?.dataManager;
        if (dataManager && this._moreTraitsLoadedHandler) {
            dataManager.off('adrianLabMoreTraitsLoaded', this._moreTraitsLoadedHandler);
            this._moreTraitsLoadedHandler = null;
            }
        
        this.lazyLoadingState.enabled = false;
        this.lazyLoadingState.allTokens = [];
        this.lazyLoadingState.currentIndex = 0;

        // Ocultar botón de carga incremental si estaba visible
        this.setLoadMoreVisibility(false);
    }

    /**
     * Render a batch of tokens
     */
    renderTokenBatch(tokens, startIndex, endIndex, tokensGrid) {
        const batch = tokens.slice(startIndex, endIndex);
        
        batch.forEach(token => {
            const tokenCard = this.createTokenCard(token);
            tokensGrid.appendChild(tokenCard);
        });
        
        return batch.length;
    }

    /**
     * Create a single token card element
     */
    createTokenCard(token) {
            const tokenCard = document.createElement('div');
            tokenCard.className = 'token-card';
            tokenCard.setAttribute('data-token-id', token.tokenId);
            tokenCard.setAttribute('data-contract', token.contract.toLowerCase());
            
            // Use specific image URLs for different token types
            let imageUrl = token.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+';
            
            // Hardcode names for specific floppy discs
            let displayTitle = token.title;
            if (this.currentFilter === 'floppy') {
                if (token.tokenId === 10003) {
                    displayTitle = 'GLITCH Floppy';
                } else if (token.tokenId === 10004) {
                    displayTitle = 'GF Floppy';
                } else if (token.tokenId === 10005) {
                    displayTitle = 'Golden Floppy';
                } else if (token.tokenId === 10007) {
                    displayTitle = 'NEONpack';
                } else if (token.tokenId === 10008) {
                    displayTitle = 'OPTICALpack';
                } else if (token.tokenId === 10009) {
                    displayTitle = 'PUNKSfloppy';
                } else if (token.tokenId === 10010) {
                    displayTitle = 'ComradesUSB';
                } else if (token.tokenId === 1123) {
                    displayTitle = 'CensorPACK';
                } else if (token.tokenId === 15010) {
                    displayTitle = 'Back to Work';
                } else {
                    displayTitle = token.title.replace(/^\d+\s*/, '');
                }
            }
            
            // Override image URL for specific token types
            if (this.currentFilter === 'serum' && token.tokenId >= 262144 && token.tokenId <= 262147) {
                imageUrl = this.getImagePath(token.tokenId, '.gif');
            } else if (this.currentFilter === 'floppy') {
                // Use local images for floppy discs
                if (token.tokenId === 10000) {
                    imageUrl = this.getImagePath(10000, '.gif');
                } else if (token.tokenId === 10001) {
                    imageUrl = this.getImagePath(10001, '.gif');
                } else if (token.tokenId === 10002) {
                    imageUrl = this.getImagePath(10002, '.gif');
                } else if (token.tokenId === 10003) {
                    imageUrl = this.getImagePath(10003, '.gif');
                } else if (token.tokenId === 10004) {
                    imageUrl = this.getImagePath(10004, '.gif');
                } else if (token.tokenId === 10005) {
                    imageUrl = this.getImagePath(10005, '.gif');
                } else if (token.tokenId === 10007) {
                    imageUrl = this.getImagePath(10007, '.gif');
                } else if (token.tokenId === 15000) {
                    imageUrl = this.getImagePath(15000, '.gif');
                } else if (token.tokenId === 15001) {
                    imageUrl = this.getImagePath(15001, '.gif');
                } else if (token.tokenId === 15002) {
                    imageUrl = this.getImagePath(15002, '.gif');
                } else if (token.tokenId === 15003) {
                    imageUrl = this.getImagePath(15003, '.gif');
                } else if (token.tokenId === 15004) {
                    imageUrl = this.getImagePath(15004, '.gif');
                } else if (token.tokenId === 15005) {
                    imageUrl = this.getImagePath(15005, '.gif');
                } else if (token.tokenId === 15006) {
                    imageUrl = this.getImagePath(15006, '.gif');
                } else if (token.tokenId === 15007) {
                    imageUrl = this.getImagePath(15007, '.gif');
                } else if (token.tokenId === 15008) {
                    imageUrl = this.getImagePath(15008, '.png');
                } else if (token.tokenId === 15009) {
                    imageUrl = this.getImagePath(15009, '.png');
                } else if (token.tokenId === 15010) {
                    imageUrl = this.getImagePath(15010, '.png');
                } else if (token.tokenId === 15011) {
                    imageUrl = this.getImagePath(15011, '.png');
                } else if (token.tokenId === 15012) {
                    imageUrl = this.getImagePath(15012, '.png');
                } else if (token.tokenId === 15013) {
                    imageUrl = this.getImagePath(15013, '.png');
                } else if (token.tokenId === 15014) {
                    imageUrl = this.getImagePath(15014, '.png');
                } else if (token.tokenId === 15015) {
                    imageUrl = this.getImagePath(15015, '.png');
                } else if (token.tokenId === 10008) {
                    imageUrl = this.getImagePath(10008, '.gif');
                } else if (token.tokenId === 10009) {
                    imageUrl = this.getImagePath(10009, '.gif');
                } else if (token.tokenId === 10010) {
                    imageUrl = this.getImagePath(10010, '.gif');
                } else if (token.tokenId === 10011) {
                    imageUrl = this.getImagePath(10011, '.gif');
                } else if (token.tokenId === 10012) {
                    imageUrl = this.getImagePath(10012, '.gif');
                } else if (token.tokenId === 10013) {
                    imageUrl = this.getImagePath(10013, '.gif');
                } else if (token.tokenId === 10015) {
                    imageUrl = this.getImagePath(10015, '.gif');
                }
            }
            
            // Create quantity tag for ERC1155 tokens with balance > 1
            const quantityTag = token.tokenType === 'ERC1155' && token.balance > 1 ? 
                `<div class="token-quantity-tag">x${token.balance}</div>` : '';
            
            // Create category display for ERC1155 tokens
            const categoryDisplay = token.tokenType === 'ERC1155' && token.category ? 
                `<div class="token-category">${token.category}</div>` : '';
            
            // Handle image loading with fallback for traits
            let imgTag;
            if (token.fallbackImageUrl && imageUrl !== token.fallbackImageUrl) {
                // Trait with local asset - use fallback if local fails
                const fallbackUrl = token.fallbackImageUrl.replace(/'/g, "\\'");
            imgTag = `<img src="${imageUrl}" alt="${displayTitle}" class="token-image" loading="lazy" onerror="if('${fallbackUrl}') { this.src='${fallbackUrl}'; this.onerror=function(){ this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'; }; }">`;
            } else {
                // Standard image tag for other tokens
            imgTag = `<img src="${imageUrl}" alt="${displayTitle}" class="token-image" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'>">`;
            }
            
            tokenCard.innerHTML = `
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
            
                    // Add click event for token selection
        const clickHandler = () => {
            this.handleTokenSelection(tokenCard, token);
        };
        
        // Store the handler reference for potential removal
        tokenCard._clickHandler = clickHandler;
        tokenCard.addEventListener('click', clickHandler);
            
        return tokenCard;
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
     * Setup lazy loading for traits on mobile
     * Ahora integrado con carga desde Alchemy
     */
    setupLazyLoading(tokens) {
        const tokensGrid = this.domElements.get('tokens-grid');
        if (!tokensGrid) return;
        
        // Clean up any existing lazy loading
        this.cleanupLazyLoading();
        
        // Initialize state
        this.lazyLoadingState.allTokens = tokens;
        this.lazyLoadingState.currentIndex = 0;
        this.lazyLoadingState.enabled = true;
        
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
        
        // Escuchar eventos del data-manager para cuando se carguen más traits desde Alchemy
        const dataManager = window.app?.modules?.dataManager;
        if (dataManager) {
            // Remover listener anterior si existe
            if (this._moreTraitsLoadedHandler) {
                dataManager.off('adrianLabMoreTraitsLoaded', this._moreTraitsLoadedHandler);
            }
            
            // Crear nuevo handler
            this._moreTraitsLoadedHandler = (data) => {
                if (this.lazyLoadingState.enabled && data.newTraits) {
                    const dataManager = window.app?.modules?.dataManager;
                    const status = dataManager?.getTraitsStatus?.() || {};
                    console.log(`📡 UI: Nuevos traits cargados desde Alchemy: ${data.newTraits.length} nuevos, ${data.totalTraits || 0} totales en cache`);
                    console.log(`📊 UI: Estado actual - ${status.totalLoaded || 0} en cache, ${status.totalUnique || 0} únicos, hasMore: ${status.hasMore}`);
                    
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
            
            dataManager.on('adrianLabMoreTraitsLoaded', this._moreTraitsLoadedHandler);
        }
    }

    /**
     * Display tokens in grid
     */
    displayTokens(tokens, skipSelectionUpdate = false, hasLoadingWheels = false) {
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
        // Reiniciar mapa de vistos con los tokens mostrados actualmente
        this._traitsSeenIds = new Set(tokens.map(t => this.getTokenKey(t)));
        
        // 🚨 PAGINACIÓN: Si estamos en tab traits y hay más de 300 tokens, activar paginación
        const isTraitsTab = this.currentFilter === 'traits';
        
        // Si ya estamos en modo paginación y recibimos nuevos tokens, actualizar cache
        if (this.paginationState.enabled && isTraitsTab) {
            // Actualizar cache con nuevos tokens (evitar duplicados)
            const existingTokenIds = new Set(this.paginationState.allTokens.map(t => t.tokenId));
            const newTokens = tokens.filter(t => !existingTokenIds.has(t.tokenId));
            if (newTokens.length > 0) {
                this.paginationState.allTokens = [...this.paginationState.allTokens, ...newTokens];
                this.paginationState.totalPages = Math.ceil(this.paginationState.allTokens.length / this.paginationState.tokensPerPage);
                console.log(`📄 Cache actualizado: ${newTokens.length} nuevos traits agregados. Total: ${this.paginationState.allTokens.length}`);
            } else {
                // Si no hay nuevos tokens, usar los que ya tenemos en cache
                tokens = this.paginationState.allTokens;
            }
        }
        
        // Limitar render duro en móvil (sin paginación) a 150
        const MAX_MOBILE_RENDER = 150;
        const shouldUsePagination = isTraitsTab && tokens.length > 300 && !this.isMobile();
        
        if (shouldUsePagination) {
            // Activar modo paginación
            this.paginationState.enabled = true;
            this.paginationState.allTokens = [...tokens]; // Guardar todos los tokens en cache
            this.paginationState.currentPage = 1;
            this.paginationState.totalPages = Math.ceil(tokens.length / this.paginationState.tokensPerPage);
            
            console.log(`📄 Pagination enabled: ${tokens.length} tokens, ${this.paginationState.totalPages} pages`);
            
            // Mostrar primera página
            this.updatePaginationDisplay();
            
            // Mostrar controles de paginación
            this.showPaginationControls();
            
            if (!skipSelectionUpdate) {
                this.updateSelectionInfo();
            }
            return;
        } else {
            // Desactivar paginación si no es necesario
            this.paginationState.enabled = false;
            this.hidePaginationControls();
        }
        
        // 🚨 LAZY LOADING: Check if we should use lazy loading (mobile + traits tab + many tokens)
        const shouldUseLazyLoading = this.isMobile() && 
                                     this.currentFilter === 'traits' && 
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
        
        // Standard rendering: mostrar tokens
        let traitsToDisplay = tokens;
        if (isTraitsTab && tokens.length > 300 && !this.isMobile()) {
            // Limitar a 300 tokens y activar paginación
            traitsToDisplay = tokens.slice(0, 300);
            this.paginationState.enabled = true;
            this.paginationState.allTokens = [...tokens];
            this.paginationState.currentPage = 1;
            this.paginationState.totalPages = Math.ceil(tokens.length / this.paginationState.tokensPerPage);
            this.showPaginationControls();
        } else if (isTraitsTab && this.isMobile() && tokens.length > MAX_MOBILE_RENDER) {
            // En móvil sin paginación: limitar render a 150
            traitsToDisplay = tokens.slice(0, MAX_MOBILE_RENDER);
            this.paginationState.enabled = false;
            this.hidePaginationControls();
        }
        
        traitsToDisplay.forEach(token => {
            const tokenCard = this.createTokenCard(token);
            tokensGrid.appendChild(tokenCard);
        });

        // Mostrar/ocultar botón de carga incremental (solo desktop, solo si no hay paginación)
        if (!this.isMobile() && !this.paginationState.enabled) {
            const dataManager = window.app?.modules?.dataManager;
            const hasMore = dataManager?.getTraitsHasMore?.() ?? false;
            this.setLoadMoreVisibility(hasMore && this.currentFilter === 'traits');
        } else {
            this.setLoadMoreVisibility(false);
        }
        
        if (!skipSelectionUpdate) {
            this.updateSelectionInfo();
        }
    }

    /**
     * Append tokens without limpiar grid (para cargar más)
     */
    appendTokens(tokens) {
        const tokensGrid = this.domElements.get('tokens-grid');
        if (!tokensGrid || !tokens || !Array.isArray(tokens)) return;
        
        // Agregar al cache de paginación si estamos en modo paginación
        if (this.paginationState.enabled) {
            this.paginationState.allTokens = [...this.paginationState.allTokens, ...tokens];
            this.paginationState.totalPages = Math.ceil(this.paginationState.allTokens.length / this.paginationState.tokensPerPage);
            
            // Verificar si necesitamos activar paginación ahora
            if (this.paginationState.allTokens.length > this.paginationState.tokensPerPage) {
                // Recalcular qué tokens mostrar en la página actual
                this.updatePaginationDisplay();
                return;
            }
        }
        
        tokens.forEach(token => {
            const tokenCard = this.createTokenCard(token);
            tokensGrid.appendChild(tokenCard);
        });
        this.updateSelectionInfo();
    }

    /**
     * Append traits incremental sin repintar todo el grid
     */
    appendTraits(newTraits = [], { hasMore = false } = {}) {
        if (this.currentFilter !== 'traits') {
            console.log('⚠️ appendTraits ignorado: currentFilter no es traits');
            return;
        }
        if (!Array.isArray(newTraits) || newTraits.length === 0) return;

        // Dedupe robusto usando llave contract:tokenId
        if (!this._traitsSeenIds || this._traitsSeenIds.size === 0) {
            // Pre-cargar con lo ya renderizado o cacheado
            const seedTokens = this.paginationState.enabled
                ? (this.paginationState.allTokens || [])
                : Array.from(this.domElements.get('tokens-grid')?.querySelectorAll('.token-card') || []).map(card => ({
                    tokenId: card.getAttribute('data-token-id'),
                    contract: card.getAttribute('data-contract') || ''
                }));
            seedTokens.forEach(t => this._traitsSeenIds.add(this.getTokenKey(t)));
        }
        const deduped = newTraits.filter(t => {
            const key = this.getTokenKey(t);
            if (this._traitsSeenIds.has(key)) return false;
            this._traitsSeenIds.add(key);
            return true;
        });
        if (deduped.length === 0) {
            console.log('ℹ️ appendTraits: no hay nuevos traits después de dedupe');
            this.setLoadMoreVisibility?.(hasMore && !this.isMobile() && !this.paginationState.enabled);
            return;
        }

        // Si está activo paginación (desktop con >300)
        if (this.paginationState.enabled) {
            this.paginationState.allTokens = [...this.paginationState.allTokens, ...deduped];
            this.paginationState.totalPages = Math.ceil(this.paginationState.allTokens.length / this.paginationState.tokensPerPage);
            // No re-render de la página actual; solo actualizar controles si cambia hasMore
            this.setLoadMoreVisibility?.(hasMore && !this.isMobile() && !this.paginationState.enabled);
            return;
        }

        // Si está activo lazy loading (mobile)
        if (this.lazyLoadingState.enabled) {
            // Mantener un límite duro de elementos en DOM para móvil
            const MAX_MOBILE_RENDER = 150;
            this.lazyLoadingState.allTokens = [...this.lazyLoadingState.allTokens, ...deduped].slice(-MAX_MOBILE_RENDER);
            // Asegurar que el sentinel siga observado para cargar siguientes lotes
            if (hasMore && this.lazyLoadingState.sentinel && this.lazyLoadingState.observer) {
                this.lazyLoadingState.observer.observe(this.lazyLoadingState.sentinel);
            }
            this.setLoadMoreVisibility?.(false);
            // No forzar repaint inmediato; lazy loader agregará cuando se acerque al sentinel
            return;
        }

        // Caso estándar sin paginación ni lazy: append directo al grid
        this.appendTokens(deduped);
        this.setLoadMoreVisibility?.(hasMore && !this.isMobile());
    }
    
    /**
     * Update pagination display - show current page tokens
     */
    updatePaginationDisplay() {
        if (!this.paginationState.enabled || this.paginationState.allTokens.length === 0) {
            return;
        }
        
        const tokensGrid = this.domElements.get('tokens-grid');
        if (!tokensGrid) return;
        
        // Limpiar grid
        const existingCards = tokensGrid.querySelectorAll('.token-card');
        existingCards.forEach(card => {
            if (card._clickHandler) {
                card.removeEventListener('click', card._clickHandler);
                delete card._clickHandler;
            }
        });
        tokensGrid.innerHTML = "";
        
        // Calcular índices para la página actual
        const startIndex = (this.paginationState.currentPage - 1) * this.paginationState.tokensPerPage;
        const endIndex = Math.min(startIndex + this.paginationState.tokensPerPage, this.paginationState.allTokens.length);
        const pageTokens = this.paginationState.allTokens.slice(startIndex, endIndex);
        
        console.log(`📄 Displaying page ${this.paginationState.currentPage}: tokens ${startIndex + 1}-${endIndex} of ${this.paginationState.allTokens.length}`);
        
        // Renderizar tokens de la página actual
        pageTokens.forEach(token => {
            const tokenCard = this.createTokenCard(token);
            tokensGrid.appendChild(tokenCard);
        });
        
        // Actualizar información de página
        this.updatePageInfo();
        
        // Actualizar botones de navegación
        this.updatePaginationButtons();
        
        this.updateSelectionInfo();
    }
    
    /**
     * Go to previous page
     */
    goToPreviousPage() {
        if (this.paginationState.currentPage > 1) {
            this.paginationState.currentPage--;
            this.updatePaginationDisplay();
            // Scroll to top of grid
            const tokensGrid = this.domElements.get('tokens-grid');
            if (tokensGrid) {
                tokensGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }
    
    /**
     * Go to next page
     */
    goToNextPage() {
        if (this.paginationState.currentPage < this.paginationState.totalPages) {
            this.paginationState.currentPage++;
            this.updatePaginationDisplay();
            // Scroll to top of grid
            const tokensGrid = this.domElements.get('tokens-grid');
            if (tokensGrid) {
                tokensGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }
    
    /**
     * Update page info display
     */
    updatePageInfo() {
        const pageInfo = this.domElements.get('page-info');
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.paginationState.currentPage} of ${this.paginationState.totalPages}`;
        }
    }
    
    /**
     * Update pagination buttons state
     */
    updatePaginationButtons() {
        const prevBtn = this.domElements.get('prev-page-btn');
        const nextBtn = this.domElements.get('next-page-btn');
        
        if (prevBtn) {
            prevBtn.disabled = this.paginationState.currentPage <= 1;
        }
        if (nextBtn) {
            nextBtn.disabled = this.paginationState.currentPage >= this.paginationState.totalPages;
        }
    }
    
    /**
     * Show pagination controls
     */
    showPaginationControls() {
        const paginationControls = this.domElements.get('pagination-controls');
        if (paginationControls) {
            paginationControls.style.display = 'flex';
            paginationControls.style.justifyContent = 'center';
            paginationControls.style.alignItems = 'center';
            paginationControls.style.gap = '1rem';
            paginationControls.style.marginTop = '1rem';
        }
    }
    
    /**
     * Hide pagination controls
     */
    hidePaginationControls() {
        const paginationControls = this.domElements.get('pagination-controls');
        if (paginationControls) {
            paginationControls.style.display = 'none';
        }
    }

    /**
     * Refrescar los tokens mostrados cuando llega metadata adicional
     */
    refreshTokensMetadata(tokens) {
        if (!tokens || !Array.isArray(tokens)) {
            console.warn('⚠️ refreshTokensMetadata: tokens inválidos', tokens);
            return;
        }
        console.log(`🔄 Refrescando metadata visual para ${tokens.length} tokens`);
        // Re-render pero sin tocar la selección actual
        this.displayTokens(tokens, true, false);
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
     * Handle token selection with visual feedback - using original logic
     */
    handleTokenSelection(tokenCard, token) {
        console.log('🔍 handleTokenSelection called with:', { token, currentFilter: this.currentFilter });
        
        const tokensGrid = this.domElements.get('tokens-grid');
        if (!tokensGrid) {
            console.error('❌ tokensGrid not found');
            return;
        }

        if (token.tokenType === 'ERC721') {
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
        } else {
            // Handle ERC1155 selection based on current filter
            if (this.currentFilter === 'floppy') {
                // Single selection for Packs - deseleccionar automáticamente el anterior
                const packIndex = this.selectedPacks.findIndex(p => p.tokenId === token.tokenId);
                if (packIndex !== -1) {
                    // Deselect pack si ya está seleccionado
                    this.selectedPacks.splice(packIndex, 1);
                    tokenCard.classList.remove('selected');
                    this.selectedFloppy = null;
                } else {
                    // Deseleccionar pack anterior si existe
                    if (this.selectedPacks.length > 0) {
                        const prevSelectedCard = tokensGrid.querySelector('.token-card.selected');
                        if (prevSelectedCard) {
                            prevSelectedCard.classList.remove('selected');
                        }
                        this.selectedPacks = [];
                    }
                    
                    // Seleccionar el nuevo pack
                    this.selectedPacks = [token];
                    tokenCard.classList.add('selected');
                    this.selectedFloppy = token;
                }
                
                // Notificar cambio de selección para actualizar UI
                this.emit('packsSelectionChanged', { 
                    selectedPacks: this.selectedPacks,
                    selectedFloppy: this.selectedFloppy 
                });
            } else if (this.currentFilter === 'serum') {
                // Single selection for Serums
                if (this.selectedSerum && this.selectedSerum.tokenId === token.tokenId) {
                    this.selectedSerum = null;
                    tokenCard.classList.remove('selected');
                } else {
                    // Deselect previous serum
                    const prevSelected = tokensGrid.querySelector('.token-card.selected');
                    if (prevSelected) prevSelected.classList.remove('selected');
                    
                    this.selectedSerum = token;
                    tokenCard.classList.add('selected');
                }
            } else {
                // Handle selection for AdrianLAB (Traits tab) with category management
                if (token.tokenType === 'ERC721') {
                    // Single selection for ERC721 in AdrianLAB tab
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
                    // Emit event for main app to react if needed
                    this.emit('tokenSelected', { token, filter: this.currentFilter });
                } else if (token.tokenType === 'ERC1155') {
                    // Handle selection for AdrianLAB (Traits tab) with category management
                    // This will be handled by the traits module
                    // Just toggle the visual state for now
                    tokenCard.classList.toggle('selected');
                }
            }
        }
        
        console.log('📤 Emitting tokenSelected event with:', { token, filter: this.currentFilter });
        // Emit tokenSelected event for main app to handle
        this.emit('tokenSelected', { token, filter: this.currentFilter });
        
        // Si estamos en tab rename y se selecciona un ERC721, mostrar sección de rename
        if (this.currentFilter === 'rename' && token.tokenType === 'ERC721') {
            if (window.app && window.app.modules.stickyPopupManager && window.app.modules.stickyPopupManager.showRenameSection) {
                window.app.modules.stickyPopupManager.showRenameSection();
            }
        }
        
        // If we're in lambo tab and an ERC721 is selected, handle AdrianZERO selection
        if (this.currentFilter === 'lambo' && token.tokenType === 'ERC721') {
            if (window.app && window.app.modules.lambo) {
                window.app.modules.lambo.selectAdrianZero(token);
                this.showLamboModal(token);
            }
        }
        
        // If we're in customise tab and an ERC721 is selected, open Customise modal
        if (this.currentFilter === 'customise' && token.tokenType === 'ERC721') {
            if (window.app && window.app.modules.stickyPopupManager) {
                // Set the selected token first
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
     * Build unique key for token (contract + tokenId)
     */
    getTokenKey(token) {
        const contract = (token.contract || '').toLowerCase();
        return `${contract}:${String(token.tokenId)}`;
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
