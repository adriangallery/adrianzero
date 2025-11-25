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

        tokensGrid.innerHTML = "";
        
        // 🚨 NUEVO: Mostrar loading wheel si se especifica
        if (hasLoadingWheels) {
            console.log('🔄 Mostrando tokens con loading wheels...');
        }
        
        tokens.forEach(token => {
            const tokenCard = document.createElement('div');
            tokenCard.className = 'token-card';
            tokenCard.setAttribute('data-token-id', token.tokenId);
            tokenCard.setAttribute('data-contract', token.contract.toLowerCase());
            
            // Use specific image URLs for different token types
            let imageUrl = token.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+';
            
            // 🐛 DEBUG: Omitir carga de imagen para tokenId 1118 en tab traits (temporal)
            if (this.currentFilter === 'traits' && (token.tokenId === 1118 || token.tokenId === '1118')) {
                imageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+';
                console.log('🐛 DEBUG: Omitiendo carga de imagen para tokenId 1118 en tab traits');
            }
            
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
                    // 🚨 NUEVO: Limpiar el título quitando números al inicio
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
                }
            }
            
            // Create quantity tag for ERC1155 tokens with balance > 1
            const quantityTag = token.tokenType === 'ERC1155' && token.balance > 1 ? 
                `<div class="token-quantity-tag">x${token.balance}</div>` : '';
            
            // Create category display for ERC1155 tokens
            const categoryDisplay = token.tokenType === 'ERC1155' && token.category ? 
                `<div class="token-category">${token.category}</div>` : '';
            
            // 🚨 NUEVO: Agregar loading wheel si se especifica
            const loadingWheel = hasLoadingWheels ? 
                `<div class="token-loading-overlay">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Cargando...</div>
                </div>` : '';
            
            // Handle image loading with fallback for traits
            let imgTag;
            if (token.fallbackImageUrl && imageUrl !== token.fallbackImageUrl) {
                // Trait with local asset - use fallback if local fails
                const fallbackUrl = token.fallbackImageUrl.replace(/'/g, "\\'");
                imgTag = `<img src="${imageUrl}" alt="${displayTitle}" class="token-image" onerror="if('${fallbackUrl}') { this.src='${fallbackUrl}'; this.onerror=function(){ this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'; }; }">`;
            } else {
                // Standard image tag for other tokens
                imgTag = `<img src="${imageUrl}" alt="${displayTitle}" class="token-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'>">`;
            }
            
            tokenCard.innerHTML = `
                <div style="position: relative;">
                    ${imgTag}
                    ${quantityTag}
                    ${loadingWheel}
                </div>
                <div class="token-info">
                    <div class="token-title">${displayTitle}</div>
                    <div class="token-id">ID: ${token.tokenId}</div>
                    ${categoryDisplay}
                </div>
            `;
            
                    // Add click event for token selection
        const clickHandler = () => {
            // Handle visual selection state and emit event
            this.handleTokenSelection(tokenCard, token);
        };
        
        // Store the handler reference for potential removal
        tokenCard._clickHandler = clickHandler;
        tokenCard.addEventListener('click', clickHandler);
            
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
