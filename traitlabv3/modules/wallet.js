/**
 * TRAITLAB - Módulo de Wallet
 * Maneja la conexión, desconexión y gestión de estado de wallet
 */

class WalletManager {
    constructor() {
        this.currentAccount = null;
        this.currentContract = null;
        this.isConnected = false;
        this.eventListeners = new Map();
        
        // Maintain a global singleton for cross-module static helpers
        // This allows calls like window.TraitLABWallet.isWalletConnected()
        // even if the class was not instantiated in that context yet.
        if (typeof window !== 'undefined') {
            window.__TRAITLAB_WALLET_SINGLETON = this;
        }
        
        // Bind methods
        this.connectWallet = this.connectWallet.bind(this);
        this.disconnectWallet = this.disconnectWallet.bind(this);
        this.checkConnection = this.checkConnection.bind(this);
        this.updateUIForConnectedWallet = this.updateUIForConnectedWallet.bind(this);
        this.handleParentMessage = this.handleParentMessage.bind(this);
    }

    /**
     * Initialize wallet manager
     */
    init() {
        // Check if wallet is already connected
        // Usar setTimeout para asegurar que el DOM esté listo
        setTimeout(() => {
            this.checkConnection();
        }, 100);
        
        // Listen for messages from parent window (AdrianLab)
        window.addEventListener('message', this.handleParentMessage);
        
        // Listen for WalletConnect ready event
        this.setupWalletConnectListener();
    }
    
    /**
     * Setup WalletConnect specific listeners
     */
    setupWalletConnectListener() {
        // Escuchar cuando la página esté completamente cargada
        window.addEventListener('load', () => {
            console.log('WalletConnect listener: Page loaded, checking for WalletConnect...');
            
            // Verificar si es WalletConnect
            if (this.isWalletConnect()) {
                console.log('WalletConnect detected, setting up specific handlers...');
                
                // Añadir delay adicional para WalletConnect
                setTimeout(() => {
                    this.checkConnection();
                }, 1000);
            }
        });
        
        // Escuchar cambios en window.ethereum (para WalletConnect)
        if (window.ethereum) {
            window.ethereum.on('connect', () => {
                console.log('WalletConnect: Connected event received');
                this.checkConnection();
            });
            
            window.ethereum.on('disconnect', () => {
                console.log('WalletConnect: Disconnected event received');
                this.disconnectWallet();
            });
        }
    }
    
    /**
     * Detect if current wallet is WalletConnect
     */
    isWalletConnect() {
        return window.ethereum && (
            window.ethereum.isWalletConnect || 
            window.ethereum.isWalletConnect === true ||
            (window.ethereum.provider && window.ethereum.provider.isWalletConnect) ||
            window.ethereum.connector ||
            window.ethereum.wc ||
            (window.ethereum._state && window.ethereum._state.isWalletConnect)
        );
    }

    /**
     * Connect wallet using MetaMask/WalletConnect
     */
    async connectWallet() {
        console.log('connectWallet called');
        
        // Verificación más robusta para WalletConnect
        if (!window.ethereum || !window.ethereum.request) {
            this.showError('Wallet not detected. Please install MetaMask or connect via WalletConnect.');
            return;
        }

        try {
            this.showLoading();
            
            // Retry logic para WalletConnect
            let accounts = null;
            let retries = 3;
            
            while (retries > 0) {
                try {
                    // Verificar que ethereum esté disponible antes de cada intento
                    if (!window.ethereum || !window.ethereum.request) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        retries--;
                        continue;
                    }
                    
                    // Request account access
                    accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    break; // Si llegamos aquí, el request fue exitoso
                    
                } catch (error) {
                    console.log(`Intento de conexión fallido, reintentando... (${retries} intentos restantes)`);
                    if (retries > 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        retries--;
                        continue;
                    } else {
                        throw error; // Si es el último intento, lanzar el error
                    }
                }
            }
            
            if (!accounts || accounts.length === 0) {
                this.showError('No accounts found. Please unlock your wallet.');
                return;
            }

            const account = accounts[0];
            console.log('Connected account:', account);
            
            // Check if we're on the correct network
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            console.log('Current chain ID:', chainId);
            
            if (chainId !== '0x2105') { // Base mainnet
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x2105' }],
                    });
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        try {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [window.TraitLABConfig.BASE_NETWORK],
                            });
                        } catch (addError) {
                            console.error('Error adding Base network:', addError);
                            this.showError('Failed to add Base network to MetaMask.');
                            return;
                        }
                    } else {
                        console.error('Error switching to Base network:', switchError);
                        this.showError('Failed to switch to Base network.');
                        return;
                    }
                }
            }
            
            // Set current account and contract
            this.currentAccount = account;
            this.currentContract = window.TraitLABConfig.CONTRACTS.ERC721; // AdrianZERO by default
            this.isConnected = true;
            
            // Update UI
            this.updateUIForConnectedWallet();
            
            // Emit connection event
            this.emit('walletConnected', { account, contract: this.currentContract });
            
            this.showSuccess(`Wallet connected: ${account.substring(0, 6)}...${account.substring(38)}`);
            
        } catch (error) {
            console.error('Error connecting wallet:', error);
            
            if (error.code === 4001) {
                this.showError('Connection rejected by user.');
            } else if (error.code === -32002) {
                this.showError('Please check your wallet for pending connection request.');
            } else if (error.code === -32603) {
                this.showError('Network error. Please try again in a moment.');
            } else if (error.message && error.message.includes('state histories haven\'t been fully indexed yet')) {
                this.showError('Network is still indexing. Please wait a moment and try again.');
            } else if (error.message && error.message.includes('WalletConnect')) {
                this.showError('WalletConnect connection failed. Please try again.');
            } else {
                this.showError(`Connection failed: ${error.message || 'Unknown error'}`);
            }
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Disconnect wallet
     */
    disconnectWallet() {
        console.log('disconnectWallet called');
        
        // Clear state
        this.currentAccount = null;
        this.currentContract = null;
        this.isConnected = false;
        
        // Update UI
        this.updateUIForConnectedWallet();
        
        // Emit disconnection event
        this.emit('walletDisconnected');
        
        this.showSuccess('Wallet disconnected successfully.');
    }

    /**
     * Check if wallet is already connected
     */
    async checkConnection() {
        if (!window.ethereum || !window.ethereum.request) {
            console.log('Wallet not available for connection check');
            return;
        }

        try {
            // Retry logic para WalletConnect
            let accounts = null;
            let retries = 2;
            
            while (retries > 0) {
                try {
                    accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    break;
                } catch (error) {
                    console.log(`Error checking accounts, retrying... (${retries} attempts left)`);
                    if (retries > 1) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        retries--;
                        continue;
                    } else {
                        throw error;
                    }
                }
            }
            
            if (accounts && accounts.length > 0) {
                const account = accounts[0];
                console.log('Found existing connection:', account);
                
                this.currentAccount = account;
                this.currentContract = window.TraitLABConfig.CONTRACTS.ERC721;
                this.isConnected = true;
                
                this.updateUIForConnectedWallet();
                
                // 🚨 CRÍTICO: Emitir evento de forma asíncrona para no bloquear
                // Usar setTimeout para asegurar que el listener esté configurado
                setTimeout(() => {
                    this.emit('walletConnected', { account, contract: this.currentContract });
                }, 100);
            } else {
                console.log('No existing wallet connection found');
            }
        } catch (error) {
            console.error('Error checking connection:', error);
            // No mostrar error al usuario en checkConnection, solo log
        }
    }

    /**
     * Update UI for connected wallet
     */
    updateUIForConnectedWallet() {
        const connectSection = document.getElementById('connect-section');
        const accountSection = document.getElementById('account-section');
        const walletAddress = document.getElementById('walletAddress');
        const tokensSection = document.getElementById('tokens-section');
        const connectBtn = document.getElementById('connectBtn');
        
        console.log('🔍 Wallet: updateUIForConnectedWallet - isConnected:', this.isConnected, 'account:', this.currentAccount);
        console.log('🔍 Wallet: Elementos encontrados - connectSection:', !!connectSection, 'accountSection:', !!accountSection, 'connectBtn:', !!connectBtn);
        
        if (this.isConnected && this.currentAccount) {
            // Show account section, hide connect section
            if (connectSection) {
                console.log('🔍 Wallet: Ocultando connect-section');
                connectSection.style.display = 'none';
            }
            if (accountSection) {
                console.log('🔍 Wallet: Mostrando account-section');
                accountSection.style.display = 'block';
            }
            if (tokensSection) tokensSection.style.display = 'block';
            if (walletAddress) {
                walletAddress.textContent = `${this.currentAccount.substring(0, 6)}...${this.currentAccount.substring(38)}`;
            }
            
            // Asegurar que el botón tenga pointer-events incluso si está oculto
            // (por si el usuario quiere desconectar y volver a conectar)
            if (connectBtn) {
                connectBtn.style.pointerEvents = 'auto';
                connectBtn.style.cursor = 'pointer';
            }
            
            // Emit event for other modules
            this.emit('uiUpdate', { 
                type: 'walletConnected', 
                account: this.currentAccount,
                contract: this.currentContract 
            });
        } else {
            // Show connect section, hide account section
            if (connectSection) {
                console.log('🔍 Wallet: Mostrando connect-section');
                connectSection.style.display = 'block';
            }
            if (accountSection) {
                console.log('🔍 Wallet: Ocultando account-section');
                accountSection.style.display = 'none';
            }
            if (tokensSection) tokensSection.style.display = 'none';
            if (walletAddress) walletAddress.textContent = '';
            
            // Asegurar que el botón sea clickeable
            if (connectBtn) {
                connectBtn.style.pointerEvents = 'auto';
                connectBtn.style.cursor = 'pointer';
                connectBtn.style.display = 'inline-block';
            }
            
            // Emit event for other modules
            this.emit('uiUpdate', { 
                type: 'walletDisconnected' 
            });
        }
        
        // Verificar estado final del botón
        if (connectBtn) {
            const computedStyle = window.getComputedStyle(connectBtn);
            console.log('🔍 Wallet: Estado final del botón - display:', computedStyle.display, 'visibility:', computedStyle.visibility, 'pointer-events:', computedStyle.pointerEvents);
            
            // Si el botón está oculto pero debería ser clickeable, hacerlo visible temporalmente
            // o asegurar que tenga pointer-events
            if (computedStyle.display === 'none' && !this.isConnected) {
                console.log('⚠️ Wallet: Botón está oculto pero wallet no está conectada, haciendo visible...');
                connectSection.style.display = 'block';
            }
        }
    }

    /**
     * Handle messages from parent window (AdrianLab)
     */
    handleParentMessage(event) {
        if (event.data && event.data.type) {
            console.log('Received message from parent:', event.data);
            
            switch (event.data.type) {
                case 'WALLET_CONNECTED':
                    if (event.data.address && !this.currentAccount) {
                        console.log('Connecting wallet from parent message:', event.data.address);
                        this.currentAccount = event.data.address;
                        this.currentContract = window.TraitLABConfig.CONTRACTS.ERC721;
                        this.isConnected = true;
                        
                        this.updateUIForConnectedWallet();
                        this.emit('walletConnected', { 
                            account: this.currentAccount, 
                            contract: this.currentContract 
                        });
                    }
                    break;
                    
                case 'WALLET_DISCONNECTED':
                    if (this.currentAccount) {
                        console.log('Disconnecting wallet from parent message');
                        this.disconnectWallet();
                    }
                    break;
            }
        }
    }

    /**
     * Get current account
     */
    getCurrentAccount() {
        return this.currentAccount;
    }

    /**
     * Get current contract
     */
    getCurrentContract() {
        return this.currentContract;
    }

    /**
     * Set current contract
     */
    setCurrentContract(contract) {
        this.currentContract = contract;
        this.emit('contractChanged', { contract });
    }

    /**
     * Check if wallet is connected
     */
    isWalletConnected() {
        return this.isConnected;
    }

    /**
     * Static helper for legacy calls:
     * window.TraitLABWallet.isWalletConnected()
     * - If a singleton instance exists, delegate to it.
     * - Else, try to infer from window.ethereum.selectedAddress (best-effort).
     */
    static isWalletConnected() {
        try {
            const inst = (typeof window !== 'undefined')
              ? window.__TRAITLAB_WALLET_SINGLETON
              : null;
            if (inst && typeof inst.isWalletConnected === 'function') {
                return inst.isWalletConnected();
            }
            if (typeof window !== 'undefined' &&
                window.ethereum &&
                (window.ethereum.selectedAddress ||
                 (window.ethereum._state && Array.isArray(window.ethereum._state.accounts) && window.ethereum._state.accounts[0]))) {
                return true;
            }
        } catch (_) { /* no-op */ }
        return false;
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

    /**
     * UI Helper methods (will be replaced by UI module)
     */
    showLoading() {
        // Placeholder - will be replaced by UI module
        console.log('Loading...');
    }

    hideLoading() {
        // Placeholder - will be replaced by UI module
        console.log('Loading finished');
    }

    showError(message) {
        // Placeholder - will be replaced by UI module
        console.error('Error:', message);
    }

    showSuccess(message) {
        // Placeholder - will be replaced by UI module
        console.log('Success:', message);
    }
}

// Export for browser environment
if (typeof window !== 'undefined') {
    window.TraitLABWallet = WalletManager; // keep as class export (constructor)
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletManager;
}
