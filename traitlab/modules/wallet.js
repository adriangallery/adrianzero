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
        this.checkConnection();
        
        // Listen for messages from parent window (AdrianLab)
        window.addEventListener('message', this.handleParentMessage);
    }

    /**
     * Connect wallet using MetaMask
     */
    async connectWallet() {
        console.log('connectWallet called');
        
        if (typeof window.ethereum === 'undefined') {
            this.showError('MetaMask is not installed. Please install MetaMask to use this feature.');
            return;
        }

        try {
            this.showLoading();
            
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            if (accounts.length === 0) {
                this.showError('No accounts found. Please unlock MetaMask.');
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
                this.showError('Please check MetaMask for pending connection request.');
            } else {
                this.showError(`Connection failed: ${error.message}`);
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
        if (typeof window.ethereum === 'undefined') {
            return;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            
            if (accounts.length > 0) {
                const account = accounts[0];
                console.log('Found existing connection:', account);
                
                this.currentAccount = account;
                this.currentContract = window.TraitLABConfig.CONTRACTS.ERC721;
                this.isConnected = true;
                
                this.updateUIForConnectedWallet();
                this.emit('walletConnected', { account, contract: this.currentContract });
            }
        } catch (error) {
            console.error('Error checking connection:', error);
        }
    }

    /**
     * Update UI for connected wallet
     */
    updateUIForConnectedWallet() {
        if (this.isConnected && this.currentAccount) {
            // Show account section, hide connect section
            this.emit('uiUpdate', { 
                type: 'walletConnected', 
                account: this.currentAccount,
                contract: this.currentContract 
            });
        } else {
            // Show connect section, hide account section
            this.emit('uiUpdate', { 
                type: 'walletDisconnected' 
            });
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
    window.TraitLABWallet = WalletManager;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletManager;
}
