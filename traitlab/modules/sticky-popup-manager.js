/**
 * Sticky Popup Manager
 * Maneja toda la lógica del sticky popup, incluyendo botones, imágenes y acciones
 */
class StickyPopupManager {
    constructor() {
        this.selectedERC721 = null;
        this.selectedERC1155 = [];
        this.selectedFloppy = null;
        this.selectedSerum = null;
        this.currentFilter = null;
        this.currentTab = null;
        this.isInitialized = false;
    }

    /**
     * Inicializar el sticky popup manager
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('🔧 StickyPopupManager: Inicializando...');
        
        try {
            // Mapear elementos del DOM
            this.mapElements();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Configurar botones del side menu
            this.setupSideMenuButtons();
            
            this.isInitialized = true;
            console.log('✅ StickyPopupManager: Inicializado correctamente');
            
        } catch (error) {
            console.error('❌ StickyPopupManager: Error en inicialización:', error);
        }
    }

    /**
     * Mapear elementos del DOM
     */
    mapElements() {
        // Elementos principales
        this.elements = {
            selectionInfo: document.getElementById('selection-info'),
            selectionText: document.getElementById('selection-text'),
            minimizeBtn: document.getElementById('minimizeBtn'),
            generatedImage: document.getElementById('generated-image'),
            combinedImage: document.getElementById('combined-image'),
            imageLoadingOverlay: document.getElementById('image-loading-overlay'),
            
            // Secciones de acciones
            erc721ActionsSection: document.getElementById('erc721-actions-section'),
            traitsActionsSection: document.getElementById('traits-actions-section'),
            openFloppySection: document.getElementById('open-floppy-section'),
            openPackSection: document.getElementById('open-pack-section'),
            useSerumSection: document.getElementById('use-serum-section'),
            renameSection: document.getElementById('rename-section'),
            applyTraitsSection: document.getElementById('apply-traits-section'),
            refreshMetadataSection: document.getElementById('refresh-metadata-section'),
            
            // Botones de acción
            activateTokenBtn: document.getElementById('activateTokenBtn'),
            showRenameSectionBtn: document.getElementById('showRenameSectionBtn'),
            applyTraitsBtn: document.getElementById('applyTraitsBtn'),
            openFloppyBtn: document.getElementById('openFloppyBtn'),
            openPackBtn: document.getElementById('openPackBtn'),
            useSerumBtn: document.getElementById('useSerumBtn'),
            approveRenameBtn: document.getElementById('approveRenameBtn'),
            renameTokenBtn: document.getElementById('renameTokenBtn'),
            refreshMetadataBtn: document.getElementById('refreshMetadataBtn'),
            
            // Inputs
            newTokenName: document.getElementById('newTokenName'),
            
            // Status elements
            applyStatus: document.getElementById('apply-status'),
            openFloppyStatus: document.getElementById('open-floppy-status'),
            openPackStatus: document.getElementById('open-pack-status'),
            useSerumStatus: document.getElementById('use-serum-status'),
            activateTokenStatus: document.getElementById('activate-token-status'),
            renameStatus: document.getElementById('rename-status'),
            refreshMetadataStatus: document.getElementById('refresh-metadata-status')
        };
        
        console.log('✅ StickyPopupManager: Elementos mapeados:', Object.keys(this.elements));
    }

    /**
     * Configurar event listeners para botones de acción
     */
    setupEventListeners() {
        // Botón minimize
        if (this.elements.minimizeBtn) {
            this.elements.minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        }

        // Botones de acción principales
        if (this.elements.activateTokenBtn) {
            this.elements.activateTokenBtn.addEventListener('click', () => this.activateToken());
        }

        if (this.elements.applyTraitsBtn) {
            this.elements.applyTraitsBtn.addEventListener('click', () => this.applyTraits());
        }

        if (this.elements.openFloppyBtn) {
            this.elements.openFloppyBtn.addEventListener('click', () => this.openFloppy());
        }

        if (this.elements.openPackBtn) {
            this.elements.openPackBtn.addEventListener('click', () => this.openPack());
        }

        if (this.elements.useSerumBtn) {
            this.elements.useSerumBtn.addEventListener('click', () => this.useSerum());
        }

        if (this.elements.refreshMetadataBtn) {
            this.elements.refreshMetadataBtn.addEventListener('click', () => this.refreshMetadata());
        }

        // Botones de rename
        if (this.elements.approveRenameBtn) {
            this.elements.approveRenameBtn.addEventListener('click', () => this.approveRename());
        }

        if (this.elements.renameTokenBtn) {
            this.elements.renameTokenBtn.addEventListener('click', () => this.renameToken());
        }

        console.log('✅ StickyPopupManager: Event listeners configurados');
    }

    /**
     * Configurar botones del side menu (emoji buttons)
     */
    setupSideMenuButtons() {
        const sideMenu = document.querySelector('.side-emoji-menu');
        if (!sideMenu) {
            console.warn('⚠️ StickyPopupManager: Side menu no encontrado');
            return;
        }

        const contractBtns = sideMenu.querySelectorAll('.contract-btn');
        contractBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remover clase active de todos los botones
                contractBtns.forEach(b => b.classList.remove('active'));
                
                // Agregar clase active al botón clickeado
                e.target.classList.add('active');
                
                // Obtener datos del botón
                const contract = e.target.dataset.contract;
                const filter = e.target.dataset.filter;
                
                console.log('🎯 StickyPopupManager: Botón del side menu clickeado:', { contract, filter });
                
                // Emitir evento para que la app principal maneje el cambio
                this.emitSideMenuChange({ contract, filter });
            });
        });

        console.log('✅ StickyPopupManager: Botones del side menu configurados');
    }

    /**
     * Emitir cambio del side menu
     */
    emitSideMenuChange(data) {
        // Crear y disparar evento personalizado
        const event = new CustomEvent('sideMenuChanged', { 
            detail: data 
        });
        document.dispatchEvent(event);
    }

    /**
     * Actualizar estado de selección
     */
    updateSelectionState(selectionData) {
        this.selectedERC721 = selectionData.selectedERC721 || null;
        this.selectedERC1155 = selectionData.selectedERC1155 || [];
        this.selectedFloppy = selectionData.selectedFloppy || null;
        this.selectedSerum = selectionData.selectedSerum || null;
        this.currentFilter = selectionData.currentFilter || null;
        this.currentTab = selectionData.currentTab || null;

        console.log('🔄 StickyPopupManager: Estado actualizado:', {
            selectedERC721: this.selectedERC721?.tokenId,
            selectedERC1155: this.selectedERC1155.map(t => t.tokenId),
            selectedFloppy: this.selectedFloppy?.tokenId,
            selectedSerum: this.selectedSerum?.tokenId,
            currentFilter: this.currentFilter,
            currentTab: this.currentTab
        });

        // Actualizar UI basado en el nuevo estado
        this.updateUI();
    }

    /**
     * Actualizar UI basado en el estado actual
     */
    updateUI() {
        // Ocultar todas las secciones por defecto
        this.hideAllSections();

        // Mostrar secciones según el estado
        if (this.selectedERC721) {
            this.showERC721Actions();
            
            // Si no hay traits seleccionados, mostrar imagen base del AdrianZERO
            if (this.selectedERC1155.length === 0) {
                this.showBaseAdrianZeroImage();
            } else {
                this.showTraitsActions();
                this.generateCombinedImage();
            }
        }

        if (this.selectedFloppy) {
            this.showFloppyActions();
        }

        if (this.selectedSerum) {
            this.showSerumActions();
        }

        // Actualizar texto de selección
        this.updateSelectionText();
        
        // Aplicar clase .sticky para que funcione como popup overlay
        this.applyStickyClass();
    }

    /**
     * Ocultar todas las secciones
     */
    hideAllSections() {
        const sections = [
            'erc721ActionsSection',
            'traitsActionsSection',
            'openFloppySection',
            'openPackSection',
            'useSerumSection',
            'renameSection',
            'applyTraitsSection',
            'refreshMetadataSection'
        ];

        sections.forEach(sectionKey => {
            const section = this.elements[sectionKey];
            if (section) {
                section.style.display = 'none';
            }
        });
    }

    /**
     * Mostrar acciones de ERC721
     */
    showERC721Actions() {
        if (this.elements.erc721ActionsSection) {
            this.elements.erc721ActionsSection.style.display = 'block';
        }
    }

    /**
     * Mostrar acciones de traits
     */
    showTraitsActions() {
        if (this.elements.traitsActionsSection) {
            this.elements.traitsActionsSection.style.display = 'block';
        }
    }

    /**
     * Mostrar acciones de floppy
     */
    showFloppyActions() {
        if (this.elements.openFloppySection) {
            this.elements.openFloppySection.style.display = 'block';
        }
    }

    /**
     * Mostrar acciones de serum
     */
    showSerumActions() {
        if (this.elements.useSerumSection) {
            this.elements.useSerumSection.style.display = 'block';
        }
    }

    /**
     * Mostrar imagen base del AdrianZERO
     */
    showBaseAdrianZeroImage() {
        if (!this.elements.generatedImage || !this.elements.combinedImage) return;

        const baseImageUrl = this.selectedERC721.image || 
                           this.selectedERC721.imageUrl || 
                           `https://adrianlab.vercel.app/api/render/${this.selectedERC721.tokenId}.png`;

        // Mostrar loading overlay
        if (this.elements.imageLoadingOverlay) {
            this.elements.imageLoadingOverlay.style.display = 'flex';
        }

        // Cargar imagen
        this.elements.combinedImage.src = baseImageUrl;
        this.elements.generatedImage.style.display = 'block';
        this.elements.combinedImage.style.display = 'block';

        // Manejar eventos de carga
        this.elements.combinedImage.onload = () => {
            if (this.elements.imageLoadingOverlay) {
                this.elements.imageLoadingOverlay.style.display = 'none';
            }
            console.log('✅ Imagen base del AdrianZERO cargada');
        };

        this.elements.combinedImage.onerror = () => {
            if (this.elements.imageLoadingOverlay) {
                this.elements.imageLoadingOverlay.style.display = 'none';
            }
            console.error('❌ Error cargando imagen base del AdrianZERO');
        };
    }

    /**
     * Generar imagen combinada
     */
    generateCombinedImage() {
        if (!this.selectedERC721 || this.selectedERC1155.length === 0) return;

        // Si estamos en tab Floppy, no generar imagen
        if (this.currentTab === 'floppy') {
            console.log('🖼️ Tab Floppy detectado - no generando imagen combinada');
            return;
        }

        if (!this.elements.generatedImage || !this.elements.combinedImage) return;

        // Mostrar loading overlay
        if (this.elements.imageLoadingOverlay) {
            this.elements.imageLoadingOverlay.style.display = 'flex';
        }

        // Generar URL de imagen combinada
        const baseTokenId = this.selectedERC721.tokenId;
        const traitIds = this.selectedERC1155.map(t => t.tokenId).join(',');
        const combinedImageUrl = `https://adrianlab.vercel.app/api/render/${baseTokenId}?traits=${traitIds}`;

        // Cargar imagen combinada
        this.elements.combinedImage.src = combinedImageUrl;
        this.elements.generatedImage.style.display = 'block';
        this.elements.combinedImage.style.display = 'block';

        // Manejar eventos de carga
        this.elements.combinedImage.onload = () => {
            if (this.elements.imageLoadingOverlay) {
                this.elements.imageLoadingOverlay.style.display = 'none';
            }
            console.log('✅ Imagen combinada generada');
        };

        this.elements.combinedImage.onerror = () => {
            if (this.elements.imageLoadingOverlay) {
                this.elements.imageLoadingOverlay.style.display = 'none';
            }
            console.error('❌ Error generando imagen combinada');
        };
    }

    /**
     * Actualizar texto de selección
     */
    updateSelectionText() {
        if (!this.elements.selectionText) return;

        let text = '';

        if (this.selectedERC721) {
            text += `<h3 class="selected-token-title">${this.selectedERC721.title}</h3>`;
        }

        if (this.selectedERC1155.length > 0) {
            text += `<h4 class="selected-traits-title">Selected Traits:</h4>`;
            text += `<div class="traits-container">`;
            this.selectedERC1155.forEach(trait => {
                text += `<span class="trait-tag">${trait.title}</span>`;
            });
            text += `</div>`;
        }

        if (this.selectedFloppy) {
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
        }

        if (this.selectedSerum) {
            text += `<h4 class="selected-serum-title">${this.selectedSerum.title}</h4>`;
        }

        this.elements.selectionText.innerHTML = text;
        console.log('✅ StickyPopupManager: Texto de selección actualizado');
    }

    /**
     * Toggle minimize/expand
     */
    toggleMinimize() {
        if (!this.elements.selectionInfo || !this.elements.minimizeBtn) return;

        const isMinimized = this.elements.selectionInfo.classList.contains('minimized');
        
        if (isMinimized) {
            this.elements.selectionInfo.classList.remove('minimized');
            this.elements.minimizeBtn.textContent = 'Minimize';
        } else {
            this.elements.selectionInfo.classList.add('minimized');
            this.elements.minimizeBtn.textContent = 'Expand';
        }
    }

    /**
     * Métodos de acción (delegados a módulos específicos)
     */
    activateToken() {
        console.log('🎯 StickyPopupManager: Activar token');
        if (window.app && window.app.modules.zero && window.app.modules.zero.activateToken) {
            window.app.modules.zero.activateToken();
        }
    }

    applyTraits() {
        console.log('🎯 StickyPopupManager: Aplicar traits');
        if (window.app && window.app.modules.zero && window.app.modules.zero.applyTraits) {
            window.app.modules.zero.applyTraits();
        }
    }

    openFloppy() {
        console.log('🎯 StickyPopupManager: Abrir floppy');
        if (window.app && window.app.modules.floppy && window.app.modules.floppy.openFloppy) {
            window.app.modules.floppy.openFloppy();
        }
    }

    openPack() {
        console.log('🎯 StickyPopupManager: Abrir pack');
        if (window.app && window.app.modules.zero && window.app.modules.zero.openPack) {
            window.app.modules.zero.openPack();
        }
    }

    useSerum() {
        console.log('🎯 StickyPopupManager: Usar serum');
        if (window.app && window.app.modules.serums && window.app.modules.serums.useSerum) {
            window.app.modules.serums.useSerum();
        }
    }

    refreshMetadata() {
        console.log('🎯 StickyPopupManager: Refrescar metadata');
        if (window.app && window.app.modules.zero && window.app.modules.zero.refreshMetadata) {
            window.app.modules.zero.refreshMetadata();
        }
    }

    approveRename() {
        console.log('🎯 StickyPopupManager: Aprobar rename');
        if (window.app && window.app.modules.zero && window.app.modules.zero.approveRename) {
            window.app.modules.zero.approveRename();
        }
    }

    renameToken() {
        console.log('🎯 StickyPopupManager: Renombrar token');
        if (window.app && window.app.modules.zero && window.app.modules.zero.renameToken) {
            window.app.modules.zero.renameToken();
        }
    }

    /**
     * Mostrar mensaje de estado
     */
    showStatus(message, type, statusElement) {
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `apply-status ${type}`;
            statusElement.style.display = 'block';

            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    statusElement.style.display = 'none';
                }, 5000);
            }
        }
    }

    /**
     * Ocultar mensaje de estado
     */
    hideStatus(statusElement) {
        if (statusElement) {
            statusElement.style.display = 'none';
        }
    }

    /**
     * Aplicar clase .sticky para popup overlay
     */
    applyStickyClass() {
        if (!this.elements.selectionInfo) return;
        
        // Aplicar clase .sticky si hay alguna selección activa
        if (this.selectedERC721 || this.selectedFloppy || this.selectedSerum) {
            this.elements.selectionInfo.classList.add('sticky');
            console.log('🎯 StickyPopupManager: Clase .sticky aplicada para popup overlay');
        } else {
            this.elements.selectionInfo.classList.remove('sticky');
            console.log('🎯 StickyPopupManager: Clase .sticky removida (sin selecciones)');
        }
    }

    /**
     * Debug: mostrar estado actual
     */
    debug() {
        console.log('🔍 Debug StickyPopupManager:');
        console.log('Estado de selección:', {
            selectedERC721: this.selectedERC721?.tokenId,
            selectedERC1155: this.selectedERC1155.map(t => t.tokenId),
            selectedFloppy: this.selectedFloppy?.tokenId,
            selectedSerum: this.selectedSerum?.tokenId,
            currentFilter: this.currentFilter,
            currentTab: this.currentTab
        });
        console.log('Elementos mapeados:', Object.keys(this.elements));
        console.log('Inicializado:', this.isInitialized);
    }
}

// Exportar para uso global
window.StickyPopupManager = StickyPopupManager;
