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
        this.isCloseupMode = false;
        
        // Propiedades para ocultar durante scroll en móviles
        this.scrollHideTimeout = null;
        this.isScrolling = false;
        this.isMobile = false;
        this.scrollThrottle = null;
        this.handleScroll = null;
        this.handleResize = null;
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
            
            // Configurar comportamiento de ocultar durante scroll en móviles
            this.setupScrollHideBehavior();
            
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
            zoomInBtn: document.getElementById('zoomInBtn'),
            commitBtn: document.getElementById('commitBtn'),
            applyTraitsBtn: document.getElementById('applyTraitsBtn'),
            openFloppyBtn: document.getElementById('openFloppyBtn'),
            openMultiplePacksBtn: document.getElementById('openMultiplePacksBtn'),
            packQuantity: document.getElementById('pack-quantity'),
            useSerumBtn: document.getElementById('useSerumBtn'),
            approveRenameBtn: document.getElementById('approveRenameBtn'),
            renameTokenBtn: document.getElementById('renameTokenBtn'),
            refreshMetadataBtn: document.getElementById('refreshMetadataBtn'),
            
            // Inputs
            newTokenName: document.getElementById('newTokenName'),
            customiseNewTokenName: document.getElementById('customise-newTokenName'),
            
            // Customise modal elements
            customiseModal: document.getElementById('customise-modal'),
            customiseModalClose: document.querySelector('.customise-modal-close'),
            customiseSelectedToken: document.getElementById('customise-selected-token'),
            customisePreviewImage: document.getElementById('customise-preview-image'),
            customiseLoading: document.getElementById('customise-loading'),
            
            // Customise buttons
            customiseZoomBtn: document.getElementById('customise-zoomBtn'),
            customiseShadowBtn: document.getElementById('customise-shadowBtn'),
            customiseGlowBtn: document.getElementById('customise-glowBtn'),
            customiseBnBtn: document.getElementById('customise-bnBtn'),
            customiseCommitBtn: document.getElementById('customise-commitBtn'),
            customiseRenameTokenBtn: document.getElementById('customise-renameTokenBtn'),
            
            // Status elements
            applyStatus: document.getElementById('apply-status'),
            openFloppyStatus: document.getElementById('open-floppy-status'),
            openPackStatus: document.getElementById('open-pack-status'),
            useSerumStatus: document.getElementById('use-serum-status'),
            activateTokenStatus: document.getElementById('activate-token-status'),
            renameStatus: document.getElementById('rename-status'),
            customiseCommitStatus: document.getElementById('customise-commit-status'),
            customiseRenameStatus: document.getElementById('customise-rename-status'),
            refreshMetadataStatus: document.getElementById('refresh-metadata-status'),
            commitStatus: document.getElementById('commit-status')
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

        if (this.elements.zoomInBtn) {
            this.elements.zoomInBtn.addEventListener('click', () => this.toggleCloseup());
        }

        if (this.elements.commitBtn) {
            this.elements.commitBtn.addEventListener('click', () => this.commit());
        }

        if (this.elements.applyTraitsBtn) {
            this.elements.applyTraitsBtn.addEventListener('click', () => this.applyTraits());
        }

        if (this.elements.openFloppyBtn) {
            this.elements.openFloppyBtn.addEventListener('click', () => this.openFloppy());
        }

        if (this.elements.openMultiplePacksBtn) {
            this.elements.openMultiplePacksBtn.addEventListener('click', () => this.openMultiplePacks());
        }

        if (this.elements.packQuantity) {
            this.elements.packQuantity.addEventListener('input', () => {
                // Validar que no exceda el máximo
                const max = parseInt(this.elements.packQuantity.max) || 4;
                const value = parseInt(this.elements.packQuantity.value) || 1;
                if (value > max) {
                    this.elements.packQuantity.value = max;
                } else if (value < 1) {
                    this.elements.packQuantity.value = 1;
                }
                this.updateMultiplePacksButtonText();
            });
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

        // Customise modal event listeners will be set up when modal opens (see setupCustomiseModalEvents)

        console.log('✅ StickyPopupManager: Event listeners configured');
    }

    /**
     * Configurar comportamiento de ocultar popup durante scroll en móviles
     */
    setupScrollHideBehavior() {
        // Remover listeners anteriores si existen
        if (this.handleScroll) {
            window.removeEventListener('scroll', this.handleScroll);
            this.handleScroll = null;
        }
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
            this.handleResize = null;
        }
        
        // Detectar si es móvil
        this.isMobile = window.innerWidth <= 767;
        
        // Solo configurar en móviles
        if (!this.isMobile) {
            return;
        }
        
        // Listener para cambios de tamaño de ventana
        this.handleResize = () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 767;
            
            // Si cambió de móvil a desktop o viceversa, reconfigurar
            if (wasMobile !== this.isMobile) {
                this.setupScrollHideBehavior();
            }
        };
        window.addEventListener('resize', this.handleResize);
        
        // Añadir listener de scroll con throttling
        this.handleScroll = this.throttleScroll(() => {
            if (!this.elements.selectionInfo) return;
            
            // Solo ocultar si el popup está visible (tiene clase .show)
            if (this.elements.selectionInfo.classList.contains('show')) {
                this.hidePopupDuringScroll();
            }
        }, 100);
        
        window.addEventListener('scroll', this.handleScroll, { passive: true });
        
        console.log('✅ StickyPopupManager: Scroll hide behavior configurado para móviles');
    }

    /**
     * Throttle para el evento de scroll
     */
    throttleScroll(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        return function(...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }

    /**
     * Ocultar popup durante scroll (solo CSS, no remover clase .show)
     */
    hidePopupDuringScroll() {
        if (!this.elements.selectionInfo) return;
        
        // Marcar que está scrollando
        this.isScrolling = true;
        
        // Añadir clase para ocultar
        this.elements.selectionInfo.classList.add('scrolling-hidden');
        
        // Limpiar timeout anterior si existe
        if (this.scrollHideTimeout) {
            clearTimeout(this.scrollHideTimeout);
        }
        
        // Configurar timeout para mostrar después de 1 segundo sin scroll
        this.scrollHideTimeout = setTimeout(() => {
            this.showPopupAfterScroll();
        }, 1000);
    }

    /**
     * Mostrar popup después de que el scroll se detenga
     */
    showPopupAfterScroll() {
        if (!this.elements.selectionInfo) return;
        
        // Marcar que ya no está scrollando
        this.isScrolling = false;
        
        // Remover clase de ocultar
        this.elements.selectionInfo.classList.remove('scrolling-hidden');
        
        // Limpiar timeout
        this.scrollHideTimeout = null;
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

        console.log('✅ StickyPopupManager: Side menu buttons configured');
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
        // 🚨 NUEVO: Guardar el filter actual para uso en updateUI()
        this.currentFilter = filter;
        
        // Ocultar todas las secciones
        this.hideAllSections();
        
        // Mostrar secciones según el filter
        switch (filter) {
            case 'adrianzero':
                if (this.selectedERC721) {
                    this.showERC721Actions();
                    this.showBaseAdrianZeroImage();
                    // En tab AdrianZERO: ocultar UI de rename
                    if (this.elements.renameSection) this.elements.renameSection.style.display = 'none';
                    if (this.elements.showRenameSectionBtn) this.elements.showRenameSectionBtn.style.display = 'none';
                }
                break;
            case 'traits':
                if (this.selectedERC721 && this.selectedERC1155.length > 0) {
                    // 🚨 NUEVO: Solo mostrar Apply Traits, ocultar Assign SKIN y Rename
                    this.showTraitsActionsOnly();
                    this.generateCombinedImage();
                }
                break;
            case 'floppy':
                if (this.selectedFloppy) {
                    // 🚨 NUEVO: Solo mostrar acciones de floppy, ocultar Assign SKIN y Rename
                    this.showFloppyActionsOnly();
                    this.showFloppyImage();
                }
                break;
            case 'serum':
                if (this.selectedSerum && this.selectedERC721) {
                    // 🚨 NUEVO: Solo mostrar acciones si hay AdrianZERO y Serum seleccionados
                    console.log('🎯 StickyPopupManager: Filter serum - mostrando acciones con ambos tokens seleccionados');
                    this.showSerumActions();
                } else if (this.selectedSerum && !this.selectedERC721) {
                    // 🚨 NUEVO: Mostrar mensaje de error si solo hay Serum
                    console.log('⚠️ StickyPopupManager: Filter serum - mostrando error sin AdrianZERO');
                    this.showSerumError();
                } else {
                    console.log('ℹ️ StickyPopupManager: Filter serum - no hay serum seleccionado');
                }
                break;
            case 'crafting':
                // Mostrar sección de crafting si está disponible
                break;
            case 'rename':
                if (this.selectedERC721) {
                    // En tab Rename: ocultar acciones ERC721 (Assign SKIN) y mostrar rename
                    if (this.elements.erc721ActionsSection) this.elements.erc721ActionsSection.style.display = 'none';
                    this.showRenameSection();
                    if (this.elements.showRenameSectionBtn) this.elements.showRenameSectionBtn.style.display = 'none';
                    // Limpiar selección y UI de floppy/serum/traits
                    this.selectedFloppy = null;
                    this.selectedSerum = null;
                    this.selectedERC1155 = [];
                    if (this.elements.openFloppySection) this.elements.openFloppySection.style.display = 'none';
                    if (this.elements.openPackSection) this.elements.openPackSection.style.display = 'none';
                    // Mostrar imagen del AdrianZERO
                    this.showBaseAdrianZeroImage();
                    // Precargar precio del nombre
                    if (window.app?.modules?.zero?.loadNamePrice) {
                        window.app.modules.zero.loadNamePrice().catch(() => {});
                    }
                }
                break;
            case 'customise':
                if (this.selectedERC721) {
                    // Abrir modal de Customise
                    this.openCustomiseModal();
                } else {
                    // Si no hay token seleccionado, ocultar sticky popup
                    if (this.elements.selectionInfo) {
                        this.elements.selectionInfo.style.display = 'none';
                    }
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

        // 🚨 NUEVO: Verificar si tenemos tanto AdrianZERO como serum seleccionados
        if (this.selectedERC721 && this.selectedSerum) {
            console.log('🎯 StickyPopupManager: Ambos tokens seleccionados - AdrianZERO y Serum');
        }

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
            // Si estamos en tab rename, solo mostrar rename y ocultar acciones ERC721
            if (this.currentFilter === 'rename') {
                if (this.elements.erc721ActionsSection) this.elements.erc721ActionsSection.style.display = 'none';
                this.showRenameSection();
                // Asegurar que no aparezca info de floppy/serum y la imagen sea la del AdrianZERO
                this.selectedFloppy = null;
                this.selectedSerum = null;
                this.selectedERC1155 = [];
                if (this.elements.openFloppySection) this.elements.openFloppySection.style.display = 'none';
                if (this.elements.openPackSection) this.elements.openPackSection.style.display = 'none';
                this.showBaseAdrianZeroImage();
                // No continuar con flujo normal
            } else if (this.currentFilter === 'customise') {
                // En tab customise, abrir modal
                this.openCustomiseModal();
            } else
            // 🚨 NUEVO: Verificar si estamos en tab traits para mostrar botones correctos
            if (this.currentFilter === 'traits') {
                // En tab traits, solo mostrar Apply Traits si hay traits seleccionados
                if (this.selectedERC1155.length > 0) {
                    this.showTraitsActionsOnly();
                    this.generateCombinedImage();
                } else {
                    this.showBaseAdrianZeroImage();
                }
            } else {
                // En otros tabs, mostrar botones normales de ERC721
                this.showERC721Actions();
                // Si estamos en AdrianZERO, ocultar el botón de Rename
                if (this.currentFilter === 'adrianzero') {
                    if (this.elements.showRenameSectionBtn) this.elements.showRenameSectionBtn.style.display = 'none';
                    if (this.elements.renameSection) this.elements.renameSection.style.display = 'none';
                }
                
                // Si no hay traits seleccionados, mostrar imagen base del AdrianZERO
                if (this.selectedERC1155.length === 0) {
                    this.showBaseAdrianZeroImage();
                } else {
                    this.showTraitsActions();
                    this.generateCombinedImage();
                }
            }
        }

        if (this.selectedFloppy) {
            // 🚨 NUEVO: Verificar si estamos en tab floppy para mostrar botones correctos
            if (this.currentFilter === 'floppy') {
                this.showFloppyActionsOnly();
                this.showFloppyImage();
            } else {
                this.showFloppyActions();
                this.showFloppyImage();
            }
        }

        if (this.selectedSerum) {
            // 🚨 NUEVO: Verificar si hay AdrianZERO seleccionado para serum
            if (this.selectedERC721) {
                console.log('🎯 StickyPopupManager: Mostrando acciones de serum con AdrianZERO seleccionado');
                this.showSerumActions();
            } else {
                console.log('⚠️ StickyPopupManager: Mostrando error de serum sin AdrianZERO');
                this.showSerumError();
            }
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
            
            // Ocultar botones Zoom in y Commit en el tab adrianzero
            if (this.currentFilter === 'adrianzero') {
                const zoomCommitButtons = this.elements.erc721ActionsSection.querySelector('.zoom-commit-buttons');
                if (zoomCommitButtons) {
                    zoomCommitButtons.style.display = 'none';
                }
            } else {
                // Mostrar botones si estamos en otro tab
                const zoomCommitButtons = this.elements.erc721ActionsSection.querySelector('.zoom-commit-buttons');
                if (zoomCommitButtons) {
                    zoomCommitButtons.style.display = 'flex';
                }
            }
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
     * 🚨 NUEVO: Mostrar solo acciones de traits (sin Assign SKIN ni Rename)
     */
    showTraitsActionsOnly() {
        // Ocultar botones de ERC721 (Assign SKIN y Rename)
        if (this.elements.erc721ActionsSection) {
            this.elements.erc721ActionsSection.style.display = 'none';
        }
        
        // Mostrar solo Apply Traits
        if (this.elements.traitsActionsSection) {
            this.elements.traitsActionsSection.style.display = 'block';
        }
        
        console.log('🎯 Mostrando solo Apply Traits (ocultando Assign SKIN y Rename)');
    }

    /**
     * 🚨 NUEVO: Mostrar solo acciones de floppy (sin Assign SKIN ni Rename)
     */
    showFloppyActionsOnly() {
        // Ocultar botones de ERC721 (Assign SKIN y Rename)
        if (this.elements.erc721ActionsSection) {
            this.elements.erc721ActionsSection.style.display = 'none';
        }
        
        // Mostrar solo acciones de floppy
        if (this.elements.floppyActionsSection) {
            this.elements.floppyActionsSection.style.display = 'block';
        }
        
        // 🚨 NUEVO: Configurar botones específicos (Open Pack/Open Floppy)
        this.configureFloppyButtons();
        
        console.log('🎯 Mostrando solo Floppy Actions (ocultando Assign SKIN y Rename)');
    }

    /**
     * 🚨 NUEVO: Configurar botones específicos de floppy (Open Pack/Open Floppy)
     */
    async configureFloppyButtons() {
        if (this.selectedFloppy) {
            const contractInfo = window.app?.modules?.floppy?.getContractForFloppy?.(this.selectedFloppy.tokenId);
            
            if (contractInfo) {
                if (contractInfo.type === 'pack') {
                    // Mostrar botón "Open Pack"
                    if (this.elements.openPackSection) {
                        this.elements.openPackSection.style.display = 'block';
                    }
                    // Ocultar botón "Open Floppy"
                    if (this.elements.openFloppySection) {
                        this.elements.openFloppySection.style.display = 'none';
                    }
                    
                    // Obtener balance del usuario para este pack
                    let userBalance = this.selectedFloppy.balance || 0;
                    const maxQuantity = Math.min(userBalance, 4);
                    
                    // Actualizar el input de cantidad
                    if (this.elements.packQuantity) {
                        this.elements.packQuantity.max = maxQuantity;
                        const currentValue = parseInt(this.elements.packQuantity.value) || 1;
                        if (currentValue > maxQuantity) {
                            this.elements.packQuantity.value = maxQuantity;
                        }
                    }
                    
                    // Actualizar el texto del botón con la cantidad (solo si es OpenPackV4)
                    const contractInfo = window.app?.modules?.floppy?.getContractForFloppy?.(this.selectedFloppy.tokenId);
                    const isOpenPackV4 = contractInfo && contractInfo.function === 'openPacks';
                    
                    if (isOpenPackV4 && maxQuantity > 1) {
                        // Si puede abrir múltiples, mostrar selector y actualizar texto
                        if (this.elements.packQuantity) {
                            this.elements.packQuantity.style.display = 'block';
                        }
                        this.updateMultiplePacksButtonText();
                    } else {
                        // Si solo puede abrir 1, ocultar selector y mostrar texto simple
                        if (this.elements.packQuantity) {
                            this.elements.packQuantity.style.display = 'none';
                        }
                        if (this.elements.openMultiplePacksBtn) {
                            this.elements.openMultiplePacksBtn.textContent = 'Open Pack';
                        }
                    }
                    
                    console.log('🎯 Mostrando botón Open Pack para floppy tipo pack:', this.selectedFloppy.tokenId, 'Balance:', userBalance, 'Max:', maxQuantity);
                } else {
                    // Mostrar botón "Open Floppy"
                    if (this.elements.openFloppySection) {
                        this.elements.openFloppySection.style.display = 'block';
                    }
                    // Ocultar botón "Open Pack"
                    if (this.elements.openPackSection) {
                        this.elements.openPackSection.style.display = 'none';
                    }
                    console.log('🎯 Mostrando botón Open Floppy para floppy tipo floppy:', this.selectedFloppy.tokenId);
                }
            } else {
                // Fallback: mostrar Open Floppy por defecto
                if (this.elements.openFloppySection) {
                    this.elements.openFloppySection.style.display = 'block';
                }
                if (this.elements.openPackSection) {
                    this.elements.openPackSection.style.display = 'none';
                }
                console.log('🎯 Mostrando botón Open Floppy por defecto');
            }
        }
    }

    /**
     * Mostrar acciones de floppy
     */
    showFloppyActions() {
        // Mostrar sección de floppy
        if (this.elements.floppyActionsSection) {
            this.elements.floppyActionsSection.style.display = 'block';
        }
        
        // Configurar botones específicos
        this.configureFloppyButtons();
        
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
        
        // 🚨 NUEVO: Mostrar imagen del AdrianZERO seleccionado (no del serum)
        if (this.selectedERC721) {
            this.showBaseAdrianZeroImage();
        } else {
            console.warn('⚠️ StickyPopupManager: Intentando mostrar acciones de serum sin AdrianZERO seleccionado');
        }
    }

    /**
     * 🚨 NUEVO: Mostrar error cuando se selecciona serum sin AdrianZERO
     */
    showSerumError() {
        // Ocultar sección de serum
        if (this.elements.useSerumSection) {
            this.elements.useSerumSection.style.display = 'none';
        }
        
        // Mostrar mensaje de error
        if (this.elements.generatedImage && this.elements.combinedImage) {
            this.elements.generatedImage.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ff6b6b;">
                    <div style="font-size: 2rem; margin-bottom: 20px;">⚠️</div>
                    <div style="font-size: 1.2rem; margin-bottom: 10px;">Select an AdrianZERO first</div>
                    <div style="font-size: 1rem; color: #888;">Choose an AdrianZERO token to use this serum</div>
                </div>
            `;
        }
        
        console.log('⚠️ Serum seleccionado sin AdrianZERO - mostrando mensaje de error');
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

        let baseImageUrl = this.selectedERC721.image || 
                          this.selectedERC721.imageUrl || 
                          `https://adrianlab.vercel.app/api/render/${this.selectedERC721.tokenId}.png`;

        // Añadir ?closeup=true si está en modo closeup
        if (this.isCloseupMode) {
            // Si la URL ya tiene parámetros, añadir con &
            if (baseImageUrl.includes('?')) {
                baseImageUrl += '&closeup=true';
            } else {
                baseImageUrl += '?closeup=true';
            }
        }

        console.log('🔍 StickyPopupManager: Mostrando imagen AdrianZERO:', {
            tokenId: this.selectedERC721.tokenId,
            isCloseupMode: this.isCloseupMode,
            url: baseImageUrl
        });

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

        // En tab rename, no mostrar info de floppy/serum
        const hideOtherInfo = this.currentFilter === 'rename';

        if (!hideOtherInfo && this.selectedFloppy) {
            let floppyDisplayName = this.selectedFloppy.title;
            if (this.selectedFloppy.tokenId === 10003) {
                floppyDisplayName = 'GLITCH Floppy';
            } else if (this.selectedFloppy.tokenId === 10004) {
                floppyDisplayName = 'GF Floppy';
            } else if (this.selectedFloppy.tokenId === 10005) {
                floppyDisplayName = 'Golden Floppy';
            } else if (this.selectedFloppy.tokenId === 10007) {
                floppyDisplayName = 'NEONpack';
            }
            text += `<h4 class="selected-floppy-title">${floppyDisplayName}</h4>`;
        }

        if (!hideOtherInfo && this.selectedSerum) {
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
        // Ocultar botón de approve si existe, ya que haremos la cascada en Rename
        if (this.elements.approveRenameBtn) {
            this.elements.approveRenameBtn.style.display = 'none';
        }
        // Asegurar que el botón de rename esté visible
        if (this.elements.renameTokenBtn) {
            this.elements.renameTokenBtn.style.display = 'inline-block';
        }
    }

    async openMultiplePacks() {
        console.log('🎯 StickyPopupManager: Abrir pack(s)');
        
        if (!this.selectedFloppy) {
            this.showStatus('❌ Selecciona un pack primero', 'error', this.elements.openPackStatus);
            return;
        }

        // Obtener cantidad del input
        const quantityInput = this.elements.packQuantity;
        let quantity = 1;
        
        if (quantityInput) {
            quantity = parseInt(quantityInput.value) || 1;
            const max = parseInt(quantityInput.max) || 4;
            if (quantity < 1 || quantity > max) {
                this.showStatus(`❌ La cantidad debe estar entre 1 y ${max}`, 'error', this.elements.openPackStatus);
                return;
            }
        }

        // Verificar si el pack es compatible con OpenPackV4
        const contractInfo = window.app?.modules?.floppy?.getContractForFloppy?.(this.selectedFloppy.tokenId);
        const isOpenPackV4 = contractInfo && contractInfo.type === 'pack' && contractInfo.function === 'openPacks';
        
        if (isOpenPackV4 && window.app && window.app.modules.floppy && window.app.modules.floppy.openPackV4WithQuantity) {
            // Usar OpenPackV4 para packs compatibles (puede abrir múltiples)
            try {
                this.showStatus('⏳ Abriendo packs...', 'success', this.elements.openPackStatus);
                await window.app.modules.floppy.openPackV4WithQuantity(quantity);
                this.showStatus(`✅ ${quantity} pack(s) abierto(s) correctamente!`, 'success', this.elements.openPackStatus);
            } catch (error) {
                console.error('❌ Error abriendo packs:', error);
                this.showStatus(`❌ Error: ${error.message}`, 'error', this.elements.openPackStatus);
            }
        } else if (quantity === 1 && window.app && window.app.modules.floppy && window.app.modules.floppy.openSelectedPack) {
            // Para packs que no son OpenPackV4 o cuando quantity es 1, usar la función original
            try {
                this.showStatus('⏳ Abriendo pack...', 'success', this.elements.openPackStatus);
                await window.app.modules.floppy.openSelectedPack();
                this.showStatus('✅ Pack abierto correctamente!', 'success', this.elements.openPackStatus);
            } catch (error) {
                console.error('❌ Error abriendo pack:', error);
                this.showStatus(`❌ Error: ${error.message}`, 'error', this.elements.openPackStatus);
            }
        } else {
            if (quantity > 1) {
                this.showStatus('❌ Este tipo de pack solo permite abrir 1 a la vez', 'error', this.elements.openPackStatus);
            } else {
                console.error('❌ Módulo floppy no disponible');
                this.showStatus('❌ Función no disponible', 'error', this.elements.openPackStatus);
            }
        }
    }

    updateMultiplePacksButtonText() {
        if (this.elements.openMultiplePacksBtn && this.elements.packQuantity) {
            const quantity = parseInt(this.elements.packQuantity.value) || 1;
            if (quantity === 1) {
                this.elements.openMultiplePacksBtn.textContent = 'Open Pack';
            } else {
                this.elements.openMultiplePacksBtn.textContent = `Open ${quantity} Packs`;
            }
        }
    }

    useSerum() {
        console.log('🎯 StickyPopupManager: Usar serum');
        if (window.app && window.app.modules.serums && window.app.modules.serums.useSerum) {
            // Pasar el AdrianZERO seleccionado como parámetro
            const selectedERC721 = this.selectedERC721;
            if (selectedERC721) {
                console.log('🎯 StickyPopupManager: Usando serum en AdrianZERO:', selectedERC721.tokenId);
                window.app.modules.serums.useSerum(selectedERC721);
            } else {
                console.error('❌ StickyPopupManager: No hay AdrianZERO seleccionado para usar el serum');
                this.showStatus('❌ Selecciona un AdrianZERO primero', 'error', this.elements.useSerumStatus);
            }
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

    async renameToken() {
        console.log('🎯 StickyPopupManager: Renombrar token (cascada approve → rename)');
        
        // Get name from input
        const newName = this.elements.newTokenName?.value?.trim();
        if (!newName) {
            console.error('❌ No name provided for token');
            this.showError('Please enter a name for the token');
            return;
        }
        
        const zero = window.app?.modules?.zero;
        if (!zero) {
            console.error('❌ Zero module not available for renameToken');
            return;
        }

        // 🎯 Ensure zero has the token selected
        if (this.selectedERC721 && zero.setSelectedERC721) {
            console.log('🎯 StickyPopupManager: Syncing selectedERC721 with zero module');
            zero.setSelectedERC721(this.selectedERC721);
        }
        
        try {
            // Disable button to prevent double clicks
            if (this.elements.renameTokenBtn) this.elements.renameTokenBtn.disabled = true;
            
            // Ensure price is loaded
            if (!zero.namePrice && zero.loadNamePrice) {
                this.showStatus('⏳ Loading name price...', 'success', this.elements.renameStatus);
                try { await zero.loadNamePrice(); } catch (e) { /* continue */ }
            }
            
            // Step 1: Approve if needed
            this.showStatus('🪙 Approving ADRIAN spending...', 'success', this.elements.renameStatus);
            await zero.approveRename();
            
            // Step 2: Execute rename
            this.showStatus('✍️ Executing rename on blockchain...', 'success', this.elements.renameStatus);
            const receipt = await zero.renameToken(newName);
            
            // Success
            this.showStatus(`✅ Rename completed! TX: ${receipt?.transactionHash || ''}`, 'success', this.elements.renameStatus);
        } catch (error) {
            console.error('❌ Error en cascada de rename:', error);
            this.showStatus(error?.message || '❌ Error en rename', 'error', this.elements.renameStatus);
        } finally {
            if (this.elements.renameTokenBtn) this.elements.renameTokenBtn.disabled = false;
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
     * Toggle closeup mode para AdrianZERO
     */
    toggleCloseup() {
        if (!this.selectedERC721) {
            console.warn('⚠️ StickyPopupManager: No hay AdrianZERO seleccionado para zoom');
            return;
        }

        this.isCloseupMode = !this.isCloseupMode;
        
        // Actualizar texto del botón
        if (this.elements.zoomInBtn) {
            this.elements.zoomInBtn.textContent = this.isCloseupMode ? '🔍 Zoom out' : '🔍 Zoom in';
        }

        console.log('🔍 StickyPopupManager: Closeup mode:', this.isCloseupMode ? 'ON' : 'OFF');

        // Refrescar la imagen con el nuevo modo
        this.showBaseAdrianZeroImage();
    }

    /**
     * Commit toggle para AdrianZERO
     */
    async commit() {
        if (!this.selectedERC721) {
            console.warn('⚠️ StickyPopupManager: No hay AdrianZERO seleccionado para commit');
            this.showStatus('❌ Selecciona un AdrianZERO primero', 'error', this.elements.commitStatus);
            return;
        }

        try {
            // Deshabilitar botón para evitar dobles clics
            if (this.elements.commitBtn) {
                this.elements.commitBtn.disabled = true;
                this.elements.commitBtn.textContent = '⏳ Processing...';
            }

            // Mostrar estado de carga
            this.showStatus('⏳ Procesando commit...', 'success', this.elements.commitStatus);

            // Cargar ethers si no está disponible
            let ethers = window.ethers;
            if (typeof ethers === 'undefined') {
                await this.loadEthers();
                ethers = window.ethers;
            }

            // Crear provider y signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Verificar red
            const network = await provider.getNetwork();
            if (network.chainId !== 8453) {
                throw new Error('Please switch to Base network to use this feature.');
            }

            // Cargar ABI del contrato
            const response = await fetch('./zoom-toggle-abi.json');
            if (!response.ok) {
                throw new Error('Failed to load contract ABI');
            }
            const contractABI = await response.json();

            // Crear instancia del contrato
            const contract = new ethers.Contract(
                window.TraitLABConfig.ZOOM_TOGGLE_CONTRACT,
                contractABI,
                signer
            );

            // Determinar toggleId basado en isCloseupMode
            const toggleId = this.isCloseupMode ? 1 : 0;
            const tokenId = this.selectedERC721.tokenId;

            console.log('💾 StickyPopupManager: Ejecutando commit:', {
                tokenId,
                toggleId,
                isCloseupMode: this.isCloseupMode
            });

            // Update status
            this.showStatus('📝 Executing transaction...', 'success', this.elements.commitStatus);

            // Call contract
            const tx = await contract.setToggle(tokenId, toggleId);
            
            // Update status
            this.showStatus('⏳ Waiting for confirmation...', 'success', this.elements.commitStatus);

            // Wait for confirmation
            const receipt = await tx.wait();

            // Success
            this.showStatus(`✅ Commit successful! TX: ${receipt.transactionHash}`, 'success', this.elements.commitStatus);
            
            console.log('✅ StickyPopupManager: Commit completado:', {
                tokenId,
                toggleId,
                txHash: receipt.transactionHash
            });

        } catch (error) {
            console.error('❌ StickyPopupManager: Error en commit:', error);
            this.showStatus(`❌ Error: ${error.message}`, 'error', this.elements.commitStatus);
        } finally {
            // Rehabilitar botón
            if (this.elements.commitBtn) {
                this.elements.commitBtn.disabled = false;
                this.elements.commitBtn.textContent = 'Commit';
            }
        }
    }

    /**
     * Cargar ethers dinámicamente
     */
    async loadEthers() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
            script.onload = () => {
                console.log('✅ Ethers cargado para commit');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load ethers library'));
            };
            document.head.appendChild(script);
        });
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
            currentTab: this.currentTab,
            isCloseupMode: this.isCloseupMode
        });
        console.log('Elementos mapeados:', Object.keys(this.elements));
        console.log('Inicializado:', this.isInitialized);
    }

    /**
     * 🎨 Customise: Update buttons state
     */
    updateCustomiseButtonsState() {
        if (!window.app?.modules?.customise) return;

        const customiseModule = window.app.modules.customise;
        
        // Actualizar botón zoom
        if (this.elements.customiseZoomBtn) {
            this.elements.customiseZoomBtn.textContent = customiseModule.isCloseupMode ? '🔍 Zoom out' : '🔍 Zoom in';
        }
        
        // Actualizar botón shadow (Shadow ON cuando está desactivado - para activarlo)
        if (this.elements.customiseShadowBtn) {
            // Shadow ON cuando está desactivado (para activarlo), Shadow OFF cuando está activado (para desactivarlo)
            this.elements.customiseShadowBtn.textContent = customiseModule.isShadowMode ? '🌑 Shadow OFF' : '🌑 Shadow ON';
        }
        
        // Actualizar botón glow (GLOW ON cuando está desactivado - para activarlo)
        if (this.elements.customiseGlowBtn) {
            // GLOW ON cuando está desactivado (para activarlo), GLOW OFF cuando está activado (para desactivarlo)
            this.elements.customiseGlowBtn.textContent = customiseModule.isGlowMode ? '✨ GLOW OFF' : '✨ GLOW ON';
        }
        
        // Actualizar botón BN (BN ON cuando está desactivado - para activarlo)
        if (this.elements.customiseBnBtn) {
            // BN ON cuando está desactivado (para activarlo), BN OFF cuando está activado (para desactivarlo)
            this.elements.customiseBnBtn.textContent = customiseModule.isBnMode ? '⚫⚪ BN OFF' : '⚫⚪ BN ON';
        }
    }

    /**
     * 🎨 Customise: Setup modal event listeners
     */
    setupCustomiseModalEvents() {
        // Re-map modal elements to ensure they exist
        const modal = document.getElementById('customise-modal');
        if (!modal) {
            console.error('❌ Customise modal not found');
            return;
        }

        // Update elements reference
        this.elements.customiseModal = modal;
        this.elements.customiseModalClose = modal.querySelector('.customise-modal-close');
        this.elements.customiseSelectedToken = document.getElementById('customise-selected-token');
        this.elements.customisePreviewImage = document.getElementById('customise-preview-image');
        this.elements.customiseLoading = document.getElementById('customise-loading');
        this.elements.customiseZoomBtn = document.getElementById('customise-zoomBtn');
        this.elements.customiseShadowBtn = document.getElementById('customise-shadowBtn');
        this.elements.customiseGlowBtn = document.getElementById('customise-glowBtn');
        this.elements.customiseBnBtn = document.getElementById('customise-bnBtn');
        this.elements.customiseCommitBtn = document.getElementById('customise-commitBtn');
        this.elements.customiseRenameTokenBtn = document.getElementById('customise-renameTokenBtn');
        this.elements.customiseCommitStatus = document.getElementById('customise-commit-status');
        this.elements.customiseRenameStatus = document.getElementById('customise-rename-status');
        this.elements.customiseNewTokenName = document.getElementById('customise-newTokenName');

        // Setup close button
        if (this.elements.customiseModalClose) {
            this.elements.customiseModalClose.onclick = () => this.closeCustomiseModal();
        }

        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeCustomiseModal();
            }
        };

        // Setup button event listeners (remove old ones first to avoid duplicates)
        if (this.elements.customiseZoomBtn) {
            this.elements.customiseZoomBtn.onclick = () => this.toggleCustomiseCloseup();
        }

        if (this.elements.customiseShadowBtn) {
            this.elements.customiseShadowBtn.onclick = () => this.toggleCustomiseShadow();
        }

        if (this.elements.customiseGlowBtn) {
            this.elements.customiseGlowBtn.onclick = () => this.toggleCustomiseGlow();
        }

        if (this.elements.customiseBnBtn) {
            this.elements.customiseBnBtn.onclick = () => this.toggleCustomiseBn();
        }

        if (this.elements.customiseCommitBtn) {
            this.elements.customiseCommitBtn.onclick = () => this.customiseCommit();
        }

        if (this.elements.customiseRenameTokenBtn) {
            this.elements.customiseRenameTokenBtn.onclick = () => this.customiseRenameToken();
        }

        console.log('✅ Customise modal event listeners set up');
    }

    /**
     * 🎨 Customise: Abrir modal
     */
    openCustomiseModal() {
        if (!this.selectedERC721) {
            console.warn('⚠️ StickyPopupManager: No AdrianZERO selected for customise');
            return;
        }

        // Setup event listeners first
        this.setupCustomiseModalEvents();

        if (!this.elements.customiseModal) {
            console.error('❌ StickyPopupManager: Customise modal not found');
            return;
        }

        // Sincronizar con customise module
        if (window.app?.modules?.customise) {
            window.app.modules.customise.setSelectedERC721(this.selectedERC721);
            // Actualizar estado visual de los botones
            this.updateCustomiseButtonsState();
        }

        // Actualizar información del token seleccionado
        if (this.elements.customiseSelectedToken) {
            this.elements.customiseSelectedToken.textContent = `Token #${this.selectedERC721.tokenId}`;
        }

        // Mostrar imagen con toggles
        this.updateCustomiseImage();

        // Precargar precio del nombre
        if (window.app?.modules?.zero?.loadNamePrice) {
            window.app.modules.zero.loadNamePrice().catch(() => {});
        }

        // Mostrar modal
        this.elements.customiseModal.style.display = 'flex';
        
        console.log('🎨 StickyPopupManager: Customise modal opened');
    }

    /**
     * 🎨 Customise: Cerrar modal
     */
    closeCustomiseModal() {
        if (this.elements.customiseModal) {
            this.elements.customiseModal.style.display = 'none';
            console.log('🎨 StickyPopupManager: Customise modal closed');
        }
    }

    /**
     * 🎨 Customise: Toggle closeup
     */
    toggleCustomiseCloseup() {
        if (!window.app?.modules?.customise) return;
        
        window.app.modules.customise.toggleCloseup();
        
        // Actualizar texto del botón
        if (this.elements.customiseZoomBtn) {
            const isCloseup = window.app.modules.customise.isCloseupMode;
            this.elements.customiseZoomBtn.textContent = isCloseup ? '🔍 Zoom out' : '🔍 Zoom in';
        }
        
        // Actualizar imagen
        this.updateCustomiseImage();
    }

    /**
     * 🎨 Customise: Toggle shadow
     */
    toggleCustomiseShadow() {
        if (!window.app?.modules?.customise) return;
        
        window.app.modules.customise.toggleShadow();
        
        // Actualizar texto del botón (Shadow ON cuando está desactivado - para activarlo)
        if (this.elements.customiseShadowBtn) {
            const isShadow = window.app.modules.customise.isShadowMode;
            // Shadow ON cuando está desactivado (para activarlo), Shadow OFF cuando está activado (para desactivarlo)
            this.elements.customiseShadowBtn.textContent = isShadow ? '🌑 Shadow OFF' : '🌑 Shadow ON';
        }
        
        // Actualizar imagen
        this.updateCustomiseImage();
    }

    /**
     * 🎨 Customise: Toggle glow
     */
    toggleCustomiseGlow() {
        if (!window.app?.modules?.customise) return;
        
        window.app.modules.customise.toggleGlow();
        
        // Actualizar texto del botón (GLOW ON cuando está desactivado - para activarlo)
        if (this.elements.customiseGlowBtn) {
            const isGlow = window.app.modules.customise.isGlowMode;
            // GLOW ON cuando está desactivado (para activarlo), GLOW OFF cuando está activado (para desactivarlo)
            this.elements.customiseGlowBtn.textContent = isGlow ? '✨ GLOW OFF' : '✨ GLOW ON';
        }
        
        // Actualizar imagen
        this.updateCustomiseImage();
    }

    /**
     * 🎨 Customise: Toggle black and white
     */
    toggleCustomiseBn() {
        if (!window.app?.modules?.customise) return;
        
        window.app.modules.customise.toggleBn();
        
        // Actualizar texto del botón (BN ON cuando está desactivado - para activarlo)
        if (this.elements.customiseBnBtn) {
            const isBn = window.app.modules.customise.isBnMode;
            // BN ON cuando está desactivado (para activarlo), BN OFF cuando está activado (para desactivarlo)
            this.elements.customiseBnBtn.textContent = isBn ? '⚫⚪ BN OFF' : '⚫⚪ BN ON';
        }
        
        // Actualizar imagen
        this.updateCustomiseImage();
    }

    /**
     * 🎨 Customise: Update image with toggles
     */
    updateCustomiseImage() {
        if (!this.selectedERC721 || !window.app?.modules?.customise) return;
        if (!this.elements.customisePreviewImage) return;

        const imageUrl = window.app.modules.customise.getImageUrl(this.selectedERC721.tokenId);
        
        console.log('🎨 StickyPopupManager: Actualizando imagen customise:', {
            tokenId: this.selectedERC721.tokenId,
            url: imageUrl
        });

        // Mostrar loading
        if (this.elements.customiseLoading) {
            this.elements.customiseLoading.style.display = 'flex';
        }
        if (this.elements.customisePreviewImage) {
            this.elements.customisePreviewImage.style.display = 'none';
        }

        // Cargar imagen
        this.elements.customisePreviewImage.src = imageUrl;
        
        // Ocultar loading cuando esté lista
        this.elements.customisePreviewImage.onload = () => {
            if (this.elements.customiseLoading) {
                this.elements.customiseLoading.style.display = 'none';
            }
            if (this.elements.customisePreviewImage) {
                this.elements.customisePreviewImage.style.display = 'block';
            }
            console.log('✅ Imagen customise cargada');
        };

        this.elements.customisePreviewImage.onerror = () => {
            if (this.elements.customiseLoading) {
                this.elements.customiseLoading.style.display = 'none';
            }
            console.error('❌ Error cargando imagen customise');
        };
    }

    /**
     * 🎨 Customise: Commit toggles
     */
    async customiseCommit() {
        if (!window.app?.modules?.customise) {
            this.showStatus('❌ Customise module not available', 'error', this.elements.customiseCommitStatus);
            return;
        }

        try {
            if (this.elements.customiseCommitBtn) {
                this.elements.customiseCommitBtn.disabled = true;
                this.elements.customiseCommitBtn.textContent = '⏳ Processing...';
            }

            const customiseModule = window.app.modules.customise;
            const hasCloseup = customiseModule.isCloseupMode;
            const hasShadow = customiseModule.isShadowMode;
            const hasGlow = customiseModule.isGlowMode;
            const hasBn = customiseModule.isBnMode;
            
            if (!hasCloseup && !hasShadow && !hasGlow && !hasBn) {
                this.showStatus('⚠️ Please activate at least one toggle (Closeup, Shadow, GLOW, or BN) before committing', 'error', this.elements.customiseCommitStatus);
                if (this.elements.customiseCommitBtn) {
                    this.elements.customiseCommitBtn.disabled = false;
                    this.elements.customiseCommitBtn.textContent = 'Commit';
                }
                return;
            }

            this.showStatus('📝 Executing transaction(s)...', 'success', this.elements.customiseCommitStatus);

            const receipt = await window.app.modules.customise.commit();

            // Mostrar todas las transacciones si hay múltiples
            const txHashes = receipt?.receipt?.transactionHash || receipt?.transactionHash;
            const statusMsg = txHashes ? 
                `✅ Commit successful! TX: ${Array.isArray(txHashes) ? txHashes.join(', ') : txHashes}` :
                `✅ Commit successful!`;
            
            this.showStatus(statusMsg, 'success', this.elements.customiseCommitStatus);
        } catch (error) {
            console.error('❌ Error en customise commit:', error);
            this.showStatus(`❌ Error: ${error.message}`, 'error', this.elements.customiseCommitStatus);
        } finally {
            if (this.elements.customiseCommitBtn) {
                this.elements.customiseCommitBtn.disabled = false;
                this.elements.customiseCommitBtn.textContent = 'Commit';
            }
        }
    }

    /**
     * 🎨 Customise: Rename token
     */
    async customiseRenameToken() {
        if (!window.app?.modules?.customise) {
            this.showStatus('❌ Customise module not available', 'error', this.elements.customiseRenameStatus);
            return;
        }

        const newName = this.elements.customiseNewTokenName?.value?.trim();
        if (!newName) {
            this.showStatus('❌ Please enter a name for the token', 'error', this.elements.customiseRenameStatus);
            return;
        }

        try {
            if (this.elements.customiseRenameTokenBtn) {
                this.elements.customiseRenameTokenBtn.disabled = true;
            }

            // Ensure customise has the token selected
            if (this.selectedERC721 && window.app.modules.customise.setSelectedERC721) {
                window.app.modules.customise.setSelectedERC721(this.selectedERC721);
            }

            // Ensure price is loaded
            if (window.app?.modules?.zero?.loadNamePrice && !window.app.modules.zero.namePrice) {
                this.showStatus('⏳ Loading name price...', 'success', this.elements.customiseRenameStatus);
                try {
                    await window.app.modules.zero.loadNamePrice();
                } catch (e) {
                    // Continue
                }
            }

            // Step 1: Approve if needed
            this.showStatus('🪙 Approving ADRIAN spending...', 'success', this.elements.customiseRenameStatus);
            await window.app.modules.customise.approveRename();

            // Step 2: Execute rename
            this.showStatus('✍️ Executing rename on blockchain...', 'success', this.elements.customiseRenameStatus);
            const receipt = await window.app.modules.customise.renameToken(newName);

            // Success
            this.showStatus(`✅ Rename completed! TX: ${receipt?.transactionHash || ''}`, 'success', this.elements.customiseRenameStatus);
        } catch (error) {
            console.error('❌ Error en customise rename:', error);
            this.showStatus(error?.message || '❌ Error en rename', 'error', this.elements.customiseRenameStatus);
        } finally {
            if (this.elements.customiseRenameTokenBtn) {
                this.elements.customiseRenameTokenBtn.disabled = false;
            }
        }
    }
}

// Exportar para uso global
window.StickyPopupManager = StickyPopupManager;
