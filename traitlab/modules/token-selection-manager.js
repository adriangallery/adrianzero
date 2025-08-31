/**
 * Token Selection Manager
 * Maneja la selección y gestión de tokens en TraitLAB v2
 */
class TokenSelectionManager {
    constructor() {
        this.selectedERC721 = null;
        this.selectedERC1155 = [];
        this.selectedFloppy = null;
        this.selectedSerum = null;
        this.currentFilter = null;
        this.stickyManager = null;
    }

    /**
     * Configurar sticky manager
     */
    setStickyManager(stickyManager) {
        this.stickyManager = stickyManager;
    }

    /**
     * Manejar selección de token
     */
    onTokenSelected(token, filter) {
        console.log('🎯 TokenSelectionManager: Token seleccionado:', token.tokenId, 'Filter:', filter);
        console.log('🎯 Token completo:', token);
        
        this.currentFilter = filter;
        
        if (filter === 'adrianzero') {
            console.log('🎭 Setting as AdrianZERO token');
            this.selectedERC721 = token;
            this.selectedERC1155 = [];
            this.selectedFloppy = null;
            this.selectedSerum = null;
            
            // Propagar selección al ZeroManager para operaciones on-chain
            if (window.app && window.app.modules.zero && window.app.modules.zero.setSelectedERC721) {
                window.app.modules.zero.setSelectedERC721(token);
            }
        } else if (filter === 'traits') {
            console.log('🎨 Setting as Traits token');
            if (token.tokenType === 'ERC721') {
                this.selectedERC721 = token;
                if (window.app && window.app.modules.zero && window.app.modules.zero.setSelectedERC721) {
                    window.app.modules.zero.setSelectedERC721(token);
                }
            } else if (token.tokenType === 'ERC1155') {
                if (window.app && window.app.modules.traits && window.app.modules.traits.handleTraitSelection) {
                    window.app.modules.traits.handleTraitSelection(token);
                    this.selectedERC1155 = window.app.modules.traits.getSelectedTraits();
                }
            }
            this.selectedFloppy = null;
            this.selectedSerum = null;
        } else if (filter === 'floppy') {
            console.log('💾 Setting as Floppy token');
            this.selectedFloppy = token;
            if (this.currentFilter !== 'floppy') {
                this.selectedERC721 = null;
            }
            this.selectedERC1155 = [];
            this.selectedSerum = null;
            
            if (window.app && window.app.modules.floppy && window.app.modules.floppy.setSelectedFloppy) {
                window.app.modules.floppy.setSelectedFloppy(token);
            }
        } else if (filter === 'serum') {
            console.log('🧪 Setting as Serum token');
            this.selectedSerum = token;
            this.selectedERC1155 = [];
            this.selectedFloppy = null;
            
            if (window.app && window.app.modules.serums && window.app.modules.serums.setSelectedSerum) {
                window.app.modules.serums.setSelectedSerum(token);
            }
        } else if (filter === 'crafting') {
            console.log('🔨 Setting as Crafting token');
            if (token.tokenType === 'ERC1155') {
                this.selectedERC1155 = [token];
                if (window.app && window.app.modules.crafting && window.app.modules.crafting.selectTrait) {
                    window.app.modules.crafting.selectTrait(token.tokenId, 1);
                }
            }
        } else {
            // AdrianLAB - traits
            console.log('🎭 Setting as Traits token');
            if (token.tokenType === 'ERC721') {
                this.selectedERC721 = token;
                if (window.app && window.app.modules.zero && window.app.modules.zero.setSelectedERC721) {
                    window.app.modules.zero.setSelectedERC721(token);
                }
            } else if (token.tokenType === 'ERC1155') {
                if (window.app && window.app.modules.traits && window.app.modules.traits.handleTraitSelection) {
                    window.app.modules.traits.handleTraitSelection(token);
                    this.selectedERC1155 = window.app.modules.traits.getSelectedTraits();
                }
            }
        }
        
        console.log('📊 Final selection state:', {
            selectedERC721: this.selectedERC721?.tokenId,
            selectedFloppy: this.selectedFloppy?.tokenId,
            selectedSerum: this.selectedSerum?.tokenId,
            selectedERC1155: this.selectedERC1155.map(t => t.tokenId)
        });
        
        this.updateSelectionInfo();
    }

    /**
     * Actualizar información de selección
     */
    updateSelectionInfo() {
        const selectionInfo = document.getElementById('selection-info');
        const selectionText = document.getElementById('selection-text');
        
        if (!selectionInfo || !selectionText) {
            console.warn('⚠️ TokenSelectionManager: selection-info o selection-text no encontrado');
            return;
        }
        
        // Mostrar la sección de selección
        selectionInfo.style.display = 'block';
        console.log('🎯 TokenSelectionManager: selection-info mostrado');
        
        // Agregar clase para el tipo de token seleccionado
        selectionInfo.className = 'selection-info with-side-menu';
        if (this.selectedERC721 && this.selectedERC1155.length === 0) {
            selectionInfo.classList.add('adrianzero-only');
        } else if (this.selectedERC721 && this.selectedERC1155.length > 0) {
            selectionInfo.classList.add('adrianzero-traits');
        }
        console.log('🎯 TokenSelectionManager: Clases CSS aplicadas:', selectionInfo.className);
        
        let text = '';
        
        // Hide all sections by default
        const sections = [
            'erc721-actions-section',
            'traits-actions-section',
            'use-serum-section',
            'open-floppy-section',
            'open-pack-section',
            'activate-token-section',
            'rename-section',
            'apply-traits-section',
            'refresh-metadata-section'
        ];
        
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) section.style.display = 'none';
        });
        
        if (this.selectedERC721) {
            text += `<h3 class="selected-token-title">${this.selectedERC721.title}</h3>`;
            
            // Show ERC721 actions section
            const erc721ActionsSection = document.getElementById('erc721-actions-section');
            if (erc721ActionsSection) {
                erc721ActionsSection.style.display = 'block';
            }

            // Mostrar imagen base del AdrianZERO cuando no hay traits seleccionados
            if (this.selectedERC1155.length === 0) {
                const generatedImage = document.getElementById('generated-image');
                const combinedImage = document.getElementById('combined-image');
                const imageLoadingOverlay = document.getElementById('image-loading-overlay');
                
                if (generatedImage && combinedImage) {
                    const baseImageUrl = this.selectedERC721.image || this.selectedERC721.imageUrl || `https://adrianlab.vercel.app/api/render/${this.selectedERC721.tokenId}.png`;
                    
                    if (imageLoadingOverlay) imageLoadingOverlay.style.display = 'flex';
                    
                    combinedImage.src = baseImageUrl;
                    generatedImage.style.display = 'block';
                    combinedImage.style.display = 'block';
                    
                    combinedImage.onload = function() {
                        if (imageLoadingOverlay) imageLoadingOverlay.style.display = 'none';
                    };
                    
                    combinedImage.onerror = function() {
                        if (imageLoadingOverlay) imageLoadingOverlay.style.display = 'none';
                    };
                }
            }
            
            // Generate combined image if we have traits
            if (this.selectedERC1155.length > 0) {
                this.generateCombinedImage();
            }
        }
        
        if (this.selectedERC1155.length > 0) {
            text += `<h4 class="selected-traits-title">Selected Traits:</h4>`;
            text += `<div class="traits-container">`;
            this.selectedERC1155.forEach(trait => {
                text += `<span class="trait-tag">${trait.title}</span>`;
            });
            text += `</div>`;
            
            // Show traits actions section
            const traitsActionsSection = document.getElementById('traits-actions-section');
            if (traitsActionsSection) {
                traitsActionsSection.style.display = 'block';
            }
        }
        
        if (this.selectedFloppy) {
            // Use hardcoded names for specific floppy discs
            let floppyDisplayName = this.selectedFloppy.title;
            if (this.selectedFloppy.tokenId === 10003) {
                floppyDisplayName = 'GLITCH Floppy';
            } else if (this.selectedFloppy.tokenId === 10004) {
                floppyDisplayName = 'GF Floppy';
            } else if (this.selectedFloppy.tokenId === 10005) {
                floppyDisplayName = 'Golden Floppy';
            } else if (this.selectedFloppy.tokenId === 10007) {
                floppyDisplayName = 'Action Pack 10007';
            }
            
            text += `<h4 class="selected-floppy-title">${floppyDisplayName}</h4>`;
            
            // Show floppy actions section
            const openFloppySection = document.getElementById('open-floppy-section');
            if (openFloppySection) {
                openFloppySection.style.display = 'block';
            }
        }
        
        if (this.selectedSerum) {
            text += `<h4 class="selected-serum-title">${this.selectedSerum.title}</h4>`;
            
            // Show serum actions section
            const useSerumSection = document.getElementById('use-serum-section');
            if (useSerumSection) {
                useSerumSection.style.display = 'block';
            }
        }
        
        // Update selection text
        if (selectionText) {
            selectionText.innerHTML = text;
            console.log('🎯 TokenSelectionManager: Texto de selección actualizado:', text);
        }
        
        // Update sticky visibility manager
        if (this.stickyManager) {
            const appState = {
                selectedERC721: this.selectedERC721,
                selectedERC1155: this.selectedERC1155,
                selectedFloppy: this.selectedFloppy,
                selectedSerum: this.selectedSerum,
                currentFilter: this.currentFilter
            };
            console.log('🎯 TokenSelectionManager: Actualizando sticky manager con estado:', appState);
            this.stickyManager.update(appState);
        } else {
            console.warn('⚠️ TokenSelectionManager: stickyManager no disponible');
        }
        
        console.log('🎯 TokenSelectionManager: updateSelectionInfo completado');
    }

    /**
     * Generar imagen combinada
     */
    generateCombinedImage() {
        if (!this.selectedERC721 || this.selectedERC1155.length === 0) return;
        
        const generatedImage = document.querySelector('.generated-image img');
        const imageLoadingOverlay = document.querySelector('.image-loading-overlay');
        
        if (!generatedImage || !imageLoadingOverlay) return;
        
        // Show loading
        imageLoadingOverlay.style.display = 'flex';
        
        // Generate combined image URL
        const baseTokenId = this.selectedERC721.tokenId;
        const traitIds = this.selectedERC1155.map(t => t.tokenId).join(',');
        const combinedImageUrl = `https://adrianlab.vercel.app/api/render/${baseTokenId}?traits=${traitIds}`;
        
        // Load combined image
        generatedImage.src = combinedImageUrl;
        generatedImage.style.display = 'block';
        
        generatedImage.onload = function() {
            imageLoadingOverlay.style.display = 'none';
        };
        
        generatedImage.onerror = function() {
            imageLoadingOverlay.style.display = 'none';
        };
    }

    /**
     * Obtener estado de selección
     */
    getSelectionState() {
        return {
            selectedERC721: this.selectedERC721,
            selectedERC1155: this.selectedERC1155,
            selectedFloppy: this.selectedFloppy,
            selectedSerum: this.selectedSerum,
            currentFilter: this.currentFilter
        };
    }

    /**
     * Limpiar selección
     */
    clearSelection() {
        this.selectedERC721 = null;
        this.selectedERC1155 = [];
        this.selectedFloppy = null;
        this.selectedSerum = null;
        this.currentFilter = null;
    }
}

// Exportar para uso global
window.TokenSelectionManager = TokenSelectionManager;
