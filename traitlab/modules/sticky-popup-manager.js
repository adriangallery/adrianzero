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
        this.currentFilter = 'adrianzero';
        this.currentTab = 'adrianzero';
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
        const sideMenu = document.querySelector('.sticky-side-menu-popup .side-emoji-menu');
        if (!sideMenu) {
            console.warn('⚠️ StickyPopupManager: Side menu no encontrado (nueva estructura)');
            return;
        }

        const contractBtns = sideMenu.querySelectorAll('.contract-btn');
        contractBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Obtener datos del botón
                const filter = e.target.dataset.filter;
                
                if (filter) {
                    // Cambiar filter y actualizar estados
                    this.changeFilter(filter);
                    
                    // Actualizar UI según el filter
                    this.updateUIForFilter(filter);
                }
                
                console.log('🎯 StickyPopupManager: Botón del side menu clickeado:', { filter });
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
     * Actualizar UI según el filter seleccionado
     */
    updateUIForFilter(filter) {
        // Ocultar todas las secciones
        this.hideAllSections();
        
        // Mostrar secciones según el filter
        switch (filter) {
            case 'adrianzero':
                if (this.selectedERC721) {
                    this.showERC721Actions();
                    this.showBaseAdrianZeroImage();
                }
                break;
            case 'traits':
                if (this.selectedERC721 && this.selectedERC1155.length > 0) {
                    this.showTraitsActions();
                    this.generateCombinedImage();
                }
                break;
            case 'floppy':
                if (this.selectedFloppy) {
                    this.showFloppyActions();
                }
                break;
            case 'serum':
                if (this.selectedSerum) {
                    this.showSerumActions();
                }
                break;
            case 'crafting':
                // Mostrar sección de crafting si está disponible
                break;
            case 'rename':
                if (this.selectedERC721) {
                    this.showRenameSection();
                }
                break;
        }
        
        // Actualizar texto de selección
        this.updateSelectionText();
        
        console.log('🎯 StickyPopupManager: UI actualizada para filter:', filter);
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
        // 🚨 NUEVO: Determinar qué botón mostrar según el tipo de floppy
        if (this.selectedFloppy) {
            const contractInfo = window.app?.modules?.floppy?.getContractForFloppy?.(this.selectedFloppy.tokenId);
            
            if (contractInfo) {
                if (contractInfo.type === 'pack') {
                    // Mostrar botón "Open Pack"
                    if (this.elements.openPackSection) {
                        this.elements.openPackSection.style.display = 'block';
                    }
                    console.log('🎯 Mostrando botón Open Pack para floppy tipo pack:', this.selectedFloppy.tokenId);
                } else {
                    // Mostrar botón "Open Floppy"
                    if (this.elements.openFloppySection) {
                        this.elements.openFloppySection.style.display = 'block';
                    }
                    console.log('🎯 Mostrando botón Open Floppy para floppy tipo floppy:', this.selectedFloppy.tokenId);
                }
            } else {
                // Fallback: mostrar Open Floppy por defecto
                if (this.elements.openFloppySection) {
                    this.elements.openFloppySection.style.display = 'block';
                }
                console.log('🎯 Mostrando botón Open Floppy por defecto');
            }
        }
        
        // Mostrar imagen del floppy en lugar de la imagen del AdrianZERO
        this.showFloppyImage();
    }

    /**
     * Mostrar acciones de serum
     */
    showSerumActions() {
        if (this.elements.useSerumSection) {
            this.elements.useSerumSection.style.display = 'block';
        }
        
        // Mostrar imagen del serum en lugar de la imagen del AdrianZERO
        this.showSerumImage();
    }

    /**
     * Mostrar imagen del floppy seleccionado
     */
    showFloppyImage() {
        if (!this.elements.generatedImage || !this.elements.combinedImage || !this.selectedFloppy) return;

        // Obtener URL de imagen del floppy usando el módulo floppy
        let floppyImageUrl;
        if (window.app && window.app.modules.floppy) {
            floppyImageUrl = window.app.modules.floppy.getFloppyImageUrl(parseInt(this.selectedFloppy.tokenId));
        } else {
            // Fallback si no hay módulo floppy
            floppyImageUrl = `https://adrianlab.vercel.app/api/render/${this.selectedFloppy.tokenId}.png`;
        }

        console.log('💾 Mostrando imagen de floppy:', {
            tokenId: this.selectedFloppy.tokenId,
            imageUrl: floppyImageUrl
        });

        // MOSTRAR loading overlay
        if (this.elements.imageLoadingOverlay) {
            this.elements.imageLoadingOverlay.style.display = 'flex';
        }

        // Cargar imagen del floppy
        this.elements.combinedImage.src = floppyImageUrl;
        
        // Ocultar loading cuando la imagen esté lista
        this.elements.combinedImage.onload = () => {
            if (this.elements.imageLoadingOverlay) {
                this.elements.imageLoadingOverlay.style.display = 'none';
            }
            console.log('✅ Imagen de floppy cargada');
        };
        
        this.elements.combinedImage.onerror = () => {
            if (this.elements.imageLoadingOverlay) {
                this.elements.imageLoadingOverlay.style.display = 'none';
            }
            console.error('❌ Error cargando imagen de floppy');
        };
    }

    /**
     * Mostrar imagen del serum seleccionado
     */
    showSerumImage() {
        if (!this.elements.generatedImage || !this.elements.combinedImage || !this.selectedSerum) return;

        // Obtener URL de imagen del serum usando el módulo serums
        let serumImageUrl;
        if (window.app && window.app.modules.serums) {
            serumImageUrl = window.app.modules.serums.getSerumImageUrl(parseInt(this.selectedSerum.tokenId));
        } else {
            // Fallback si no hay módulo serums
            serumImageUrl = `https://adrianlab.vercel.app/api/render/${this.selectedSerum.tokenId}.png`;
        }

        console.log('🧪 Mostrando imagen de serum:', {
            tokenId: this.selectedSerum.tokenId,
            imageUrl: serumImageUrl
        });

        // MOSTRAR loading overlay
        if (this.elements.imageLoadingOverlay) {
            this.elements.imageLoadingOverlay.style.display = 'flex';
        }

        // Cargar imagen del serum
        this.elements.combinedImage.src = serumImageUrl;
        
        // Ocultar loading cuando la imagen esté lista
        this.elements.combinedImage.onload = () => {
            if (this.elements.imageLoadingOverlay) {
                this.elements.imageLoadingOverlay.style.display = 'none';
            }
            console.log('✅ Imagen de serum cargada');
        };
        
        this.elements.combinedImage.onerror = () => {
            if (this.elements.imageLoadingOverlay) {
                this.elements.imageLoadingOverlay.style.display = 'none';
            }
            console.error('❌ Error cargando imagen de serum');
        };
    }

    /**
     * Mostrar imagen base del AdrianZERO
     */
    showBaseAdrianZeroImage() {
        if (!this.elements.generatedImage || !this.elements.combinedImage) return;

        const baseImageUrl = this.selectedERC721.image || 
                           this.selectedERC721.imageUrl || 
                           `https://adrianlab.vercel.app/api/render/${this.selectedERC721.tokenId}.png`;

        // MOSTRAR loading overlay SIN mover elementos
        if (this.elements.imageLoadingOverlay) {
            this.elements.imageLoadingOverlay.style.display = 'flex';
            // NO cambiar display de otros elementos
        }

        // Cargar imagen (mantener loading overlay visible)
        this.elements.combinedImage.src = baseImageUrl;
        
        // Solo ocultar loading cuando la imagen esté lista
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

        // MOSTRAR loading overlay SIN mover elementos
        if (this.elements.imageLoadingOverlay) {
            this.elements.imageLoadingOverlay.style.display = 'flex';
            // NO cambiar display de otros elementos
        }

        // Generar URL de imagen combinada usando el formato correcto
        const baseTokenId = this.selectedERC721.tokenId;
        
        // Construir URL con formato correcto: /custom/{tokenId}?trait={trait1}&trait={trait2}
        let combinedImageUrl = `https://adrianlab.vercel.app/api/render/custom/${baseTokenId}`;
        
        if (this.selectedERC1155.length > 0) {
            const traitParams = this.selectedERC1155.map(t => `trait=${t.tokenId}`).join('&');
            combinedImageUrl += `?${traitParams}`;
        }
        
        console.log('🖼️ StickyPopupManager: Generando imagen combinada:', {
            baseTokenId,
            selectedERC1155: this.selectedERC1155,
            traitIds: this.selectedERC1155.map(t => t.tokenId),
            url: combinedImageUrl
        });
        
        // Debug: verificar que no haya traits duplicados o incorrectos
        const uniqueTraitIds = [...new Set(this.selectedERC1155.map(t => t.tokenId))];
        if (uniqueTraitIds.length !== this.selectedERC1155.length) {
            console.warn('⚠️ Traits duplicados detectados:', {
                original: this.selectedERC1155.map(t => t.tokenId),
                unique: uniqueTraitIds
            });
        }

        // Cargar imagen combinada (mantener loading overlay visible)
        this.elements.combinedImage.src = combinedImageUrl;
        
        // Solo ocultar loading cuando la imagen esté lista
        this.elements.combinedImage.onload = () => {
            if (this.elements.imageLoadingOverlay) {
                this.elements.imageLoadingOverlay.style.display = 'none';
            }
            console.log('✅ Imagen combinada generada y cargada correctamente');
        };

        this.elements.combinedImage.onerror = () => {
            if (this.elements.imageLoadingOverlay) {
                this.elements.imageLoadingOverlay.style.display = 'none';
            }
            console.error('❌ Error generando imagen combinada:', combinedImageUrl);
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

        // Traits no se muestran en el popup - solo se usan para generar imagen combinada

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
        if (window.app && window.app.modules.traits && window.app.modules.traits.applyTraitsToNFT) {
            const selectedERC721 = this.selectedERC721;
            const currentAccount = window.app.modules.wallet ? window.app.modules.wallet.getCurrentAccount() : null;
            
            if (selectedERC721 && currentAccount) {
                window.app.modules.traits.applyTraitsToNFT(selectedERC721, currentAccount)
                    .then(() => {
                        console.log('✅ Traits aplicados correctamente');
                        this.showStatus('✅ Traits aplicados correctamente!', 'success', this.elements.applyStatus);
                    })
                    .catch((error) => {
                        console.error('❌ Error aplicando traits:', error);
                        this.showStatus(error.message, 'error', this.elements.applyStatus);
                    });
            } else {
                this.showStatus('❌ Selecciona un AdrianZERO y conecta tu wallet', 'error', this.elements.applyStatus);
            }
        }
    }

    openFloppy() {
        console.log('🎯 StickyPopupManager: Abrir floppy');
        if (window.app && window.app.modules.floppy && window.app.modules.floppy.openFloppy) {
            window.app.modules.floppy.openFloppy();
        }
    }

    showRenameSection() {
        console.log('🎯 StickyPopupManager: Mostrar sección de rename');
        if (this.elements.renameSection) {
            this.elements.renameSection.style.display = 'block';
        }
    }

    openPack() {
        console.log('🎯 StickyPopupManager: Abrir pack');
        if (window.app && window.app.modules.floppy && window.app.modules.floppy.openPack) {
            window.app.modules.floppy.openPack();
        } else {
            console.error('❌ Módulo floppy no disponible para openPack');
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
        
        // Obtener el nombre del input
        const newName = this.elements.newTokenName?.value?.trim();
        if (!newName) {
            console.error('❌ No se proporcionó un nombre para el token');
            this.showError('Por favor ingresa un nombre para el token');
            return;
        }
        
        if (window.app && window.app.modules.zero && window.app.modules.zero.renameToken) {
            console.log('🔍 Llamando a zero.renameToken con nombre:', newName);
            window.app.modules.zero.renameToken(newName);
        } else {
            console.error('❌ Módulo zero no disponible para renameToken');
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
            // Pequeño delay para asegurar que todos los elementos estén renderizados
            setTimeout(() => {
                if (this.elements.selectionInfo) {
                    console.log('🎯 StickyPopupManager: ANTES de aplicar clases:', this.elements.selectionInfo.className);
                    this.elements.selectionInfo.classList.add('sticky', 'show');
                    console.log('🎯 StickyPopupManager: DESPUÉS de aplicar clases:', this.elements.selectionInfo.className);
                    console.log('🎯 StickyPopupManager: Clases .sticky y .show aplicadas para popup overlay');
                    
                    // Actualizar estados de botones
                    this.updateButtonStates();
                }
            }, 50);
        } else {
            this.elements.selectionInfo.classList.remove('sticky', 'show');
            console.log('🎯 StickyPopupManager: Clases .sticky y .show removidas (sin selecciones)');
        }
    }

    /**
     * Actualizar estados de botones de la botonera lateral
     */
    updateButtonStates() {
        if (!this.elements.sideEmojiMenu) return;
        
        const buttons = this.elements.sideEmojiMenu.querySelectorAll('.contract-btn');
        buttons.forEach(button => {
            const filter = button.getAttribute('data-filter');
            if (filter === this.currentFilter) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        console.log('🎯 StickyPopupManager: Estados de botones actualizados para filter:', this.currentFilter);
    }

    /**
     * Cambiar filter actual
     */
    changeFilter(newFilter) {
        if (this.currentFilter === newFilter) return;
        
        this.currentFilter = newFilter;
        this.currentTab = newFilter;
        
        // Actualizar estados de botones
        this.updateButtonStates();
        
        // Emitir evento para otros módulos
        window.dispatchEvent(new CustomEvent('filterChanged', {
            detail: { filter: newFilter }
        }));
        
        console.log('🎯 StickyPopupManager: Filter cambiado a:', newFilter);
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
