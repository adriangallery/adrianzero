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
        this.stickyPopupManager = null;
    }

    /**
     * Configurar sticky popup manager
     */
    setStickyPopupManager(stickyPopupManager) {
        this.stickyPopupManager = stickyPopupManager;
    }

    /**
     * Manejar selección de token
     */
    async onTokenSelected(token, filter) {
        console.log('🎯 TokenSelectionManager: Token seleccionado:', token.tokenId, 'Filter:', filter);
        console.log('🎯 Token completo:', token);
        
        this.currentFilter = filter;
        
        if (filter === 'adrianzero') {
            console.log('🎭 Setting as AdrianZERO token');
            this.selectedERC721 = token;
            this.selectedERC1155 = [];
            this.selectedFloppy = null;
            this.selectedSerum = null;
            
            // Limpiar selección de traits cuando se selecciona un nuevo AdrianZERO
            if (window.app && window.app.modules.traits && window.app.modules.traits.clearTraitsSelection) {
                console.log('🧹 Limpiando selección de traits para nuevo AdrianZERO');
                window.app.modules.traits.clearTraitsSelection();
            }
            
            // Propagar selección al ZeroManager para operaciones on-chain
            if (window.app && window.app.modules.zero && window.app.modules.zero.setSelectedERC721) {
                window.app.modules.zero.setSelectedERC721(token);
            }
        } else if (filter === 'traits') {
            console.log('🎨 Setting as Traits token');
            if (token.tokenType === 'ERC721') {
                this.selectedERC721 = token;
                
                // Limpiar selección de traits cuando se selecciona un nuevo AdrianZERO desde traits
                if (window.app && window.app.modules.traits && window.app.modules.traits.clearTraitsSelection) {
                    console.log('🧹 Limpiando selección de traits para nuevo AdrianZERO desde traits');
                    window.app.modules.traits.clearTraitsSelection();
                    this.selectedERC1155 = []; // También limpiar el array local
                }
                
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
            // 🚨 NUEVO: Siempre deseleccionar AdrianZERO cuando se selecciona floppy
            this.selectedERC721 = null;
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
            // 🚨 NUEVO: NO deseleccionar AdrianZERO cuando se selecciona serum
            // this.selectedERC721 se mantiene para permitir uso del serum
            
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
        } else if (filter === 'rename') {
            console.log('✍️ Setting as Rename token (AdrianZERO)');
            this.selectedERC721 = token;
            this.selectedERC1155 = [];
            this.selectedFloppy = null;
            this.selectedSerum = null;
            
            // Propagar selección al ZeroManager para operaciones de rename
            if (window.app && window.app.modules.zero && window.app.modules.zero.setSelectedERC721) {
                console.log('🎯 TokenSelectionManager: Sincronizando selectedERC721 con zero module para rename');
                window.app.modules.zero.setSelectedERC721(token);
            }
        } else if (filter === 'customise') {
            console.log('🎨 Setting as Customise token (AdrianZERO)');
            this.selectedERC721 = token;
            this.selectedERC1155 = [];
            this.selectedFloppy = null;
            this.selectedSerum = null;
            
            // Propagar selección a CustomiseManager y ZeroManager
            if (window.app && window.app.modules.customise && window.app.modules.customise.setSelectedERC721) {
                console.log('🎯 TokenSelectionManager: Sincronizando selectedERC721 con customise module');
                await window.app.modules.customise.setSelectedERC721(token);
            }
            if (window.app && window.app.modules.zero && window.app.modules.zero.setSelectedERC721) {
                console.log('🎯 TokenSelectionManager: Sincronizando selectedERC721 con zero module para customise');
                window.app.modules.zero.setSelectedERC721(token);
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
        // Si el filter es customise, abrir el modal en lugar del sticky popup
        if (this.currentFilter === 'customise' && this.selectedERC721) {
            if (window.app?.modules?.stickyPopupManager?.openCustomiseModal) {
                window.app.modules.stickyPopupManager.openCustomiseModal();
                return; // No continuar con el sticky popup
            }
        }
        
        const selectionInfo = document.getElementById('selection-info');
        const selectionText = document.getElementById('selection-text');
        
        if (!selectionInfo || !selectionText) {
            console.warn('⚠️ TokenSelectionManager: selection-info o selection-text no encontrado');
            return;
        }
        
        // Mostrar la sección de selección
        selectionInfo.style.display = 'block';
        console.log('🎯 TokenSelectionManager: selection-info mostrado');
        
        // 🎯 CRUCIAL: NO aplicar clases del popup aquí - delegar a sticky-popup-manager.js
        // Solo asegurar que tenga la estructura base
        if (!selectionInfo.classList.contains('sticky-modal-container')) {
            selectionInfo.className = 'sticky-modal-container';
        }
        console.log('🎯 TokenSelectionManager: Estructura base mantenida, clases de popup delegadas a StickyPopupManager');
        
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
            
            // La generación de imagen se maneja en sticky-popup-manager.js
            // No generar imagen aquí para evitar duplicación
        }
        
        if (this.selectedERC1155.length > 0) {
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
        
        // Update sticky popup manager
        if (this.stickyPopupManager) {
            const selectionData = {
                selectedERC721: this.selectedERC721,
                selectedERC1155: this.selectedERC1155,
                selectedFloppy: this.selectedFloppy,
                selectedSerum: this.selectedSerum,
                currentFilter: this.currentFilter,
                currentTab: this.currentFilter
            };
            console.log('🎯 TokenSelectionManager: Actualizando sticky popup manager con estado:', selectionData);
            this.stickyPopupManager.updateSelectionState(selectionData);
        } else {
            console.warn('⚠️ TokenSelectionManager: stickyPopupManager no disponible');
        }
        
        console.log('🎯 TokenSelectionManager: updateSelectionInfo completado');
    }

    // Método generateCombinedImage eliminado - se maneja en sticky-popup-manager.js

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
