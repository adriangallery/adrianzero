/**
 * App Initializer
 * Maneja la inicialización y configuración de TraitLAB v2
 */
class AppInitializer {
    constructor(app) {
        this.app = app;
    }

    /**
     * Inicializar todos los módulos
     */
    async initializeModules() {
        console.log('🔧 AppInitializer: Inicializando módulos...');
        
        // Módulos críticos (la app no funciona sin ellos)
        const criticalModules = ['wallet', 'zero', 'ui'];
        
        // Módulos opcionales (la app puede funcionar sin ellos)
        const optionalModules = ['traits', 'floppy', 'serums', 'crafting', 'lambo', 'customise'];
        
        // Inicializar Wallet primero (especial por WalletConnect)
        try {
            console.log('🔧 Inicializando Wallet Manager...');
            this.app.modules.wallet = new window.TraitLABWallet();
            
            // Delay adicional para WalletConnect
            if (window.ethereum && (
                window.ethereum.isWalletConnect || 
                window.ethereum.isWalletConnect === true ||
                (window.ethereum.provider && window.ethereum.provider.isWalletConnect) ||
                window.ethereum.connector ||
                window.ethereum.wc
            )) {
                console.log('🔧 WalletConnect detectado, añadiendo delay...');
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
            
            await this.app.modules.wallet.init();
            console.log('✅ Wallet Manager inicializado correctamente');
        } catch (error) {
            console.error('❌ Error crítico inicializando wallet:', error);
            throw error; // Si wallet falla, detener inicialización
        }
        
        // Inicializar módulos críticos restantes
        for (const moduleName of ['zero', 'ui']) {
            try {
                await this.initializeModule(moduleName);
            } catch (error) {
                console.error(`❌ Error crítico inicializando ${moduleName}:`, error);
                throw error; // Si un módulo crítico falla, detener inicialización
            }
        }
        
        // Data Manager - después de zero y wallet
        try {
            this.app.modules.dataManager = new window.TraitLABDataManager();
            console.log('✅ DataManager creado (se inicializará después)');
        } catch (error) {
            console.error('❌ Error creando DataManager:', error);
            // Continuar aunque falle, se puede inicializar después
        }
        
        // Inicializar módulos auxiliares (no críticos pero importantes)
        try {
            this.app.stickyPopupManager = new window.StickyPopupManager();
            this.app.modules.stickyPopupManager = this.app.stickyPopupManager; // También en modules para consistencia
            this.app.stickyPopupManager.init();
            console.log('✅ StickyPopupManager inicializado');
        } catch (error) {
            console.warn('⚠️ Error inicializando StickyPopupManager:', error);
        }
        
        try {
            this.app.modules.filters = new window.TraitLABFilters();
            console.log('✅ Filters inicializado');
        } catch (error) {
            console.warn('⚠️ Error inicializando Filters:', error);
        }
        
        try {
            this.app.modules.displayManager = new window.TraitLABDisplayManager();
            console.log('✅ DisplayManager inicializado');
        } catch (error) {
            console.warn('⚠️ Error inicializando DisplayManager:', error);
        }
        
        try {
            this.app.modules.tokenSelection = new window.TokenSelectionManager();
            // Configurar stickyPopupManager en tokenSelection si está disponible
            // stickyPopupManager se inicializa antes, así que debería estar disponible
            const stickyPopupManager = this.app.stickyPopupManager || this.app.modules?.stickyPopupManager;
            if (stickyPopupManager) {
                this.app.modules.tokenSelection.setStickyPopupManager(stickyPopupManager);
                console.log('✅ TokenSelectionManager: stickyPopupManager configurado');
            } else {
                console.warn('⚠️ TokenSelectionManager: stickyPopupManager no disponible al inicializar');
            }
            console.log('✅ TokenSelectionManager inicializado');
        } catch (error) {
            console.warn('⚠️ Error inicializando TokenSelectionManager:', error);
        }
        
        // Inicializar módulos opcionales
        for (const moduleName of optionalModules) {
            try {
                await this.initializeModule(moduleName);
            } catch (error) {
                console.warn(`⚠️ Error inicializando módulo opcional ${moduleName}:`, error);
                // Continuar aunque falle
            }
        }
        
        // 🚨 CRÍTICO: Configurar listeners de traits en sticky-popup-manager DESPUÉS de que traits se inicialice
        if (this.app.modules.stickyPopupManager && this.app.modules.traits) {
            console.log('🔧 Configurando listeners de traits en sticky-popup-manager...');
            this.app.modules.stickyPopupManager.setupTraitsEventListeners();
        } else {
            console.warn('⚠️ No se pueden configurar listeners de traits: stickyPopupManager o traits no disponible');
        }
        
        // Inicializar DataManager después de que todos los módulos estén listos
        if (this.app.modules.dataManager) {
            try {
                await this.app.modules.dataManager.init();
                console.log('✅ DataManager inicializado correctamente');
            } catch (error) {
                console.error('❌ Error inicializando DataManager:', error);
                // Continuar aunque falle, no es crítico para la app
            }
        }
        
        console.log('✅ AppInitializer: Todos los módulos inicializados');
    }

    /**
     * Inicializar un módulo individual
     */
    async initializeModule(moduleName) {
        const moduleMap = {
            'zero': async () => {
                this.app.modules.zero = new window.TraitLABZero();
                await this.app.modules.zero.init();
            },
            'ui': () => {
                this.app.modules.ui = new window.TraitLABUI();
                this.app.modules.ui.init();
            },
            'traits': async () => {
                this.app.modules.traits = new window.TraitLABTraits();
                await this.app.modules.traits.init();
            },
            'floppy': () => {
                this.app.modules.floppy = new window.TraitLABFloppy();
                this.app.modules.floppy.init();
            },
            'serums': () => {
                this.app.modules.serums = new window.TraitLABSerums();
                this.app.modules.serums.init();
            },
            'crafting': () => {
                this.app.modules.crafting = new window.TraitLABCrafting();
                this.app.modules.crafting.init();
            },
            'lambo': () => {
                this.app.modules.lambo = new window.TraitLABLambo();
                this.app.modules.lambo.init();
            },
            'customise': () => {
                this.app.modules.customise = new window.TraitLABCustomise();
                this.app.modules.customise.init();
            }
        };
        
        const initFunction = moduleMap[moduleName];
        if (!initFunction) {
            throw new Error(`Módulo ${moduleName} no encontrado en moduleMap`);
        }
        
        console.log(`🔧 Inicializando ${moduleName}...`);
        await initFunction();
        console.log(`✅ ${moduleName} inicializado correctamente`);
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        console.log('🔧 AppInitializer: Configurando event listeners...');
        
        try {
            // Wallet events
            this.app.modules.wallet.on('walletConnected', (data) => {
                console.log('🔗 AppInitializer: Evento walletConnected recibido:', data);
                this.app.onWalletConnected(data);
            });
            this.app.modules.wallet.on('walletDisconnected', () => {
                console.log('🔗 AppInitializer: Evento walletDisconnected recibido');
                this.app.onWalletDisconnected();
            });
            
            // 🚨 CRÍTICO: Si la wallet ya está conectada al inicializar, cargar datos
            // Esperar un poco para asegurar que los listeners estén configurados
            setTimeout(() => {
                const currentAccount = this.app.modules.wallet.getCurrentAccount();
                if (currentAccount) {
                    console.log('🔗 AppInitializer: Wallet ya conectada al inicializar, cargando datos...');
                    this.app.loadDataInBackground(currentAccount);
                }
            }, 200);
            
            // UI events
            this.app.modules.ui.on('tokenSelected', (data) => {
                this.app.modules.tokenSelection.onTokenSelected(data.token, data.filter);
            });
            
            // Packs selection changed event
            this.app.modules.ui.on('packsSelectionChanged', (data) => {
                // Actualizar sticky popup manager
                if (this.app.stickyPopupManager) {
                    this.app.stickyPopupManager.configureFloppyButtons();
                    this.app.stickyPopupManager.updateSelectionInfo();
                }
            });
            
            // Lambo events
            this.app.modules.lambo.on('lamboImageGenerated', (data) => {
                this.app.modules.ui.displayLamboImage(data.imageUrl, data.token, data.color);
            });
            
            // Connect button
            const connectBtn = document.getElementById('connectBtn');
            if (connectBtn) {
                const computedStyle = window.getComputedStyle(connectBtn);
                console.log('✅ AppInitializer: Botón connectBtn encontrado, configurando listener...');
                console.log('🔍 AppInitializer: Estado del botón - display:', computedStyle.display);
                console.log('🔍 AppInitializer: Estado del botón - visibility:', computedStyle.visibility);
                console.log('🔍 AppInitializer: Estado del botón - pointer-events:', computedStyle.pointerEvents);
                console.log('🔍 AppInitializer: Estado del botón - opacity:', computedStyle.opacity);
                
                // Agregar listener directamente
                connectBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Click en botón Connect Wallet detectado');
                    if (this.app.modules.wallet) {
                        this.app.modules.wallet.connectWallet();
                    } else {
                        console.error('❌ Wallet module no disponible');
                    }
                }, { once: false, capture: false });
                
                // Marcar como configurado
                connectBtn.setAttribute('data-listener-attached', 'true');
                console.log('✅ AppInitializer: Listener configurado en botón connectBtn');
            } else {
                console.warn('⚠️ AppInitializer: Botón connectBtn NO encontrado en el DOM');
            }
            
            // Disconnect button
            const disconnectBtn = document.getElementById('disconnectBtn');
            if (disconnectBtn) {
                console.log('✅ AppInitializer: Botón disconnectBtn encontrado, configurando listener...');
                disconnectBtn.addEventListener('click', () => {
                    console.log('🖱️ Click en botón Disconnect detectado');
                    if (this.app.modules.wallet) {
                        this.app.modules.wallet.disconnectWallet();
                    } else {
                        console.error('❌ Wallet module no disponible');
                    }
                });
            } else {
                console.warn('⚠️ AppInitializer: Botón disconnectBtn NO encontrado en el DOM');
            }
            
            console.log('✅ AppInitializer: Event listeners configurados');
            
        } catch (error) {
            console.error('❌ AppInitializer: Error configurando event listeners:', error);
            throw error;
        }
    }

    /**
     * Configurar listeners para eventos opcionales
     */
    setupOptionalEventListeners() {
        console.log('🔧 AppInitializer: Configurando listeners opcionales...');
        
        try {
            // Traits events
            if (this.app.modules.traits) {
                this.app.modules.traits.on('traitsDatabaseLoaded', (data) => {
                    console.log('✅ Traits database cargada:', data);
                });
                
                this.app.modules.traits.on('traitsDatabaseError', (error) => {
                    console.error('❌ Error cargando traits database:', error);
                });
            }
            
            // DataManager events - escuchar cuando tokens están listos
            if (this.app.modules.dataManager) {
                this.app.modules.dataManager.on('adrianLabTokensReady', ({ floppys, serums, traits }) => {
                    console.log('✅ DataManager: Tokens AdrianLAB listos:', { 
                        floppys: floppys.length, 
                        serums: serums.length, 
                        traits: traits.length 
                    });
                    
                    // Si estamos en el tab de traits y no hay tokens mostrados, mostrar ahora
                    if (this.app.currentFilter === 'traits' && traits.length > 0) {
                        console.log('🎨 Mostrando traits automáticamente después de carga...');
                        if (this.app.modules.ui) {
                            this.app.modules.ui.displayTokens(traits, { filter: 'traits' });
                        }
                    }
                });
                
                this.app.modules.dataManager.on('adrianZeroReady', ({ tokens }) => {
                    console.log('✅ DataManager: Tokens AdrianZERO listos:', tokens.length);
                    
                    // Si estamos en el tab de adrianzero y no hay tokens mostrados, mostrar ahora
                    if ((this.app.currentFilter === 'adrianzero' || !this.app.currentFilter) && tokens.length > 0) {
                        console.log('🎨 Mostrando AdrianZERO automáticamente después de carga...');
                        if (this.app.modules.ui) {
                            this.app.modules.ui.displayTokens(tokens, { filter: 'adrianzero' });
                        }
                    }
                });
            }
            
            // UI events
            if (this.app.modules.ui) {
                this.app.modules.ui.on('selectionInfoUpdate', () => {
                    // Este evento es informativo, no requiere acción
                    console.log('ℹ️ Selection info actualizada');
                });
            }
            
            // Zero events (ya configurados en setupProgressiveLoading, pero asegurar que está configurado)
            if (this.app.modules.zero) {
                this.app.modules.zero.on('tokensReadyForDisplay', (data) => {
                    // Ya manejado en setupProgressiveLoading, pero asegurar que está configurado
                    console.log('🎯 Tokens listos para mostrar:', data.tokens?.length || 0);
                });
            }
            
            console.log('✅ AppInitializer: Listeners opcionales configurados');
        } catch (error) {
            console.error('❌ AppInitializer: Error configurando listeners opcionales:', error);
            // No lanzar error, estos listeners son opcionales
        }
    }

    /**
     * Configurar tabs
     */
    setupTabs() {
        console.log('🔧 AppInitializer: Configurando tabs...');
        
        try {
            const contractBtns = document.querySelectorAll('.contract-btn');
            
            contractBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // 🚨 NUEVO: Cancelar procesos en background cuando cambia el tab
                    this.app.loadingCancelled = true;
                    
                    // Resetear flag después de un breve delay
                    setTimeout(() => {
                        this.app.loadingCancelled = false;
                    }, 100);
                    
                    // Remove active class from all buttons
                    contractBtns.forEach(b => b.classList.remove('active'));
                    
                    // Add active class to clicked button
                    e.target.classList.add('active');
                    
                    // Update current contract and filter
                    this.app.currentContract = e.target.dataset.contract;
                    this.app.currentFilter = e.target.dataset.filter;
                    
                    // 🚨 NUEVO: Reset flag cuando cambia de tab
                    this.app.tokensAlreadyDisplayed = false;
                    console.log('🔄 Flag tokensAlreadyDisplayed reseteado por cambio de tab');
                    
                    // Load tokens for the selected tab
                    this.app.loadTokensForTab();
                });
            });
            
            // Auto-click first tab if wallet is connected
            if (contractBtns.length > 0 && this.app.modules.wallet.getCurrentAccount()) {
                // Establecer tab por defecto (adrianzero)
                const firstBtn = contractBtns[0];
                if (firstBtn) {
                    this.app.currentContract = firstBtn.dataset.contract;
                    this.app.currentFilter = firstBtn.dataset.filter || 'adrianzero';
                    firstBtn.classList.add('active');
                    console.log('🎯 Tab por defecto establecido:', this.app.currentFilter);
                }
                
                // Cargar en background (mostrará tokens cuando estén listos)
                this.app.loadDataInBackground(this.app.modules.wallet.getCurrentAccount());
            }
            
            console.log('✅ AppInitializer: Tabs configurados');
            
        } catch (error) {
            console.error('❌ AppInitializer: Error configurando tabs:', error);
            throw error;
        }
    }

    /**
     * Inicializar aplicación completa
     */
    async initialize() {
        console.log('🚀 AppInitializer: Iniciando inicialización completa...');
        
        try {
            // Inicializar módulos
            await this.initializeModules();
            
            // Configurar event listeners (con retry si los botones no están disponibles)
            this.setupEventListeners();
            
            // Retry para botones de wallet - SIEMPRE intentar después de un delay
            // porque la wallet puede detectarse automáticamente y ocultar el botón
            setTimeout(() => {
                console.log('🔄 AppInitializer: Reintentando configurar botones de wallet (retry 1)...');
                this.setupWalletButtons();
            }, 500);
            
            // Segundo retry después de más tiempo (por si el DOM aún no está listo)
            setTimeout(() => {
                const connectBtn = document.getElementById('connectBtn');
                if (connectBtn) {
                    const hasListener = connectBtn.getAttribute('data-listener-attached');
                    if (!hasListener) {
                        console.log('🔄 AppInitializer: Segundo retry para botones de wallet (retry 2)...');
                        this.setupWalletButtons();
                    }
                }
            }, 1500);
            
            // 🚨 NUEVO: Configurar listeners opcionales
            this.setupOptionalEventListeners();
            
            // Configurar tabs
            this.setupTabs();
            
            console.log('✅ AppInitializer: Aplicación inicializada correctamente');
            
        } catch (error) {
            console.error('❌ AppInitializer: Error en inicialización:', error);
            throw error;
        }
    }
    
    /**
     * Configurar botones de wallet (método auxiliar para retry)
     */
    setupWalletButtons() {
        // Connect button
        const connectBtn = document.getElementById('connectBtn');
        if (connectBtn) {
            // Verificar si ya tiene listener
            if (connectBtn.getAttribute('data-listener-attached') === 'true') {
                console.log('ℹ️ AppInitializer: Botón connectBtn ya tiene listener, saltando...');
                return;
            }
            
            const computedStyle = window.getComputedStyle(connectBtn);
            console.log('✅ AppInitializer: Botón connectBtn encontrado (retry)');
            console.log('🔍 AppInitializer: Estado del botón - display:', computedStyle.display);
            console.log('🔍 AppInitializer: Estado del botón - visibility:', computedStyle.visibility);
            console.log('🔍 AppInitializer: Estado del botón - pointer-events:', computedStyle.pointerEvents);
            console.log('🔍 AppInitializer: Estado del botón - opacity:', computedStyle.opacity);
            
            // Si el botón está oculto, hacerlo visible temporalmente para poder hacer click
            if (computedStyle.display === 'none') {
                console.log('⚠️ AppInitializer: Botón está oculto (display: none), pero configurando listener de todas formas');
            }
            
            // Agregar listener directamente (sin clonar, para no perder referencias)
            connectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Click en botón Connect Wallet detectado (retry listener)');
                if (this.app.modules.wallet) {
                    this.app.modules.wallet.connectWallet();
                } else {
                    console.error('❌ Wallet module no disponible');
                }
            }, { once: false, capture: false });
            
            // Marcar como configurado
            connectBtn.setAttribute('data-listener-attached', 'true');
            console.log('✅ AppInitializer: Listener configurado en botón connectBtn (retry)');
        } else {
            console.warn('⚠️ AppInitializer: Botón connectBtn NO encontrado en el DOM (retry)');
        }
        
        // Disconnect button
        const disconnectBtn = document.getElementById('disconnectBtn');
        if (disconnectBtn) {
            if (disconnectBtn.getAttribute('data-listener-attached') === 'true') {
                console.log('ℹ️ AppInitializer: Botón disconnectBtn ya tiene listener, saltando...');
                return;
            }
            
            console.log('✅ AppInitializer: Botón disconnectBtn encontrado (retry), configurando listener...');
            disconnectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Click en botón Disconnect detectado (retry listener)');
                if (this.app.modules.wallet) {
                    this.app.modules.wallet.disconnectWallet();
                } else {
                    console.error('❌ Wallet module no disponible');
                }
            }, { once: false, capture: false });
            
            disconnectBtn.setAttribute('data-listener-attached', 'true');
        } else {
            console.warn('⚠️ AppInitializer: Botón disconnectBtn NO encontrado en el DOM (retry)');
        }
    }
}

// Exportar para uso global
window.AppInitializer = AppInitializer;

// Debug: Verificar que el módulo se carga
console.log('🔧 AppInitializer: Módulo cargado correctamente');
console.log('🔧 AppInitializer: window.AppInitializer disponible:', !!window.AppInitializer);
