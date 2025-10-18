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
        
        try {
            // Wallet Manager - con delay para WalletConnect
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
            
            // UI Manager
            this.app.modules.ui = new window.TraitLABUI();
            this.app.modules.ui.init();
            
            // Zero Manager
            this.app.modules.zero = new window.TraitLABZero();
            this.app.modules.zero.init();
            
            // Sticky Popup Manager (maneja toda la lógica del sticky popup)
            this.app.stickyPopupManager = new window.StickyPopupManager();
            this.app.stickyPopupManager.init();
            
            // Data Manager
            this.app.modules.dataManager = new window.TraitLABDataManager();
            
            // Token Filters
            this.app.modules.filters = new window.TraitLABFilters();
            
            // Display Manager
            this.app.modules.displayManager = new window.TraitLABDisplayManager();
            
            // Token Selection Manager
            this.app.modules.tokenSelection = new window.TokenSelectionManager();
            this.app.modules.tokenSelection.setStickyPopupManager(this.app.stickyPopupManager);
            
            // Traits Manager
            this.app.modules.traits = new window.TraitLABTraits();
            this.app.modules.traits.init();
            
            // Floppy Manager
            this.app.modules.floppy = new window.TraitLABFloppy();
            this.app.modules.floppy.init();
            
            // Serums Manager
            this.app.modules.serums = new window.TraitLABSerums();
            this.app.modules.serums.init();
            
            // Crafting Manager
            this.app.modules.crafting = new window.TraitLABCrafting();
            this.app.modules.crafting.init();
            
            // Lambo Manager
            this.app.modules.lambo = new window.TraitLABLambo();
            this.app.modules.lambo.init();
            
            console.log('✅ AppInitializer: Todos los módulos inicializados');
            
        } catch (error) {
            console.error('❌ AppInitializer: Error inicializando módulos:', error);
            throw error;
        }
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        console.log('🔧 AppInitializer: Configurando event listeners...');
        
        try {
            // Wallet events
            this.app.modules.wallet.on('walletConnected', (data) => this.app.onWalletConnected(data));
            this.app.modules.wallet.on('walletDisconnected', () => this.app.onWalletDisconnected());
            
            // UI events
            this.app.modules.ui.on('tokenSelected', (data) => {
                this.app.modules.tokenSelection.onTokenSelected(data.token, data.filter);
            });
            
            // Lambo events
            this.app.modules.lambo.on('lamboImageGenerated', (data) => {
                this.app.modules.ui.displayLamboImage(data.imageUrl, data.token, data.color);
            });
            
            // Connect button
            const connectBtn = document.getElementById('connectBtn');
            if (connectBtn) {
                connectBtn.addEventListener('click', () => this.app.modules.wallet.connectWallet());
            }
            
            // Disconnect button
            const disconnectBtn = document.getElementById('disconnectBtn');
            if (disconnectBtn) {
                disconnectBtn.addEventListener('click', () => this.app.modules.wallet.disconnectWallet());
            }
            
            console.log('✅ AppInitializer: Event listeners configurados');
            
        } catch (error) {
            console.error('❌ AppInitializer: Error configurando event listeners:', error);
            throw error;
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
                // En lugar de hacer click inmediato, cargar en background
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
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Configurar tabs
            this.setupTabs();
            
            console.log('✅ AppInitializer: Aplicación inicializada correctamente');
            
        } catch (error) {
            console.error('❌ AppInitializer: Error en inicialización:', error);
            throw error;
        }
    }
}

// Exportar para uso global
window.AppInitializer = AppInitializer;

// Debug: Verificar que el módulo se carga
console.log('🔧 AppInitializer: Módulo cargado correctamente');
console.log('🔧 AppInitializer: window.AppInitializer disponible:', !!window.AppInitializer);
