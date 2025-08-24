/**
 * TRAITLAB - Módulo de Floppy
 * Maneja floppy discs, packs, actionpacks y toda la lógica de opening
 */

class FloppyManager {
    constructor() {
        this.selectedFloppy = null;
        this.currentFilter = null;
        this.eventListeners = new Map();
        
        // Bind methods
        this.openFloppy = this.openFloppy.bind(this);
        this.openSelectedPack = this.openSelectedPack.bind(this);
        this.openPack = this.openPack.bind(this);
        this.openActionPack = this.openActionPack.bind(this);
        this.openActionPack10007 = this.openActionPack10007.bind(this);
        this.openPack10003 = this.openPack10003.bind(this);
        this.setSelectedFloppy = this.setSelectedFloppy.bind(this);
        this.getSelectedFloppy = this.getSelectedFloppy.bind(this);
        this.clearSelection = this.clearSelection.bind(this);
        this.isFloppyToken = this.isFloppyToken.bind(this);
        this.getFloppyDisplayName = this.getFloppyDisplayName.bind(this);
        this.shouldShowOpenPack = this.shouldShowOpenPack.bind(this);
    }

    /**
     * Initialize floppy manager
     */
    init() {
        console.log('🚀 FloppyManager inicializado');
    }

    /**
     * Set selected floppy
     */
    setSelectedFloppy(floppy) {
        this.selectedFloppy = floppy;
        this.emit('floppySelected', { floppy });
    }

    /**
     * Get selected floppy
     */
    getSelectedFloppy() {
        return this.selectedFloppy;
    }

    /**
     * Clear floppy selection
     */
    clearSelection() {
        this.selectedFloppy = null;
        this.emit('floppySelectionCleared');
    }

    /**
     * Check if token is a floppy token
     */
    isFloppyToken(tokenId) {
        return (tokenId >= 10000 && tokenId <= 10007) || 
               (tokenId >= 15000 && tokenId <= 15015);
    }

    /**
     * Get floppy display name
     */
    getFloppyDisplayName(tokenId) {
        switch (tokenId) {
            case 10003:
                return 'GLITCH Floppy';
            case 10004:
                return 'GF Floppy';
            case 10005:
                return 'Golden Floppy';
            case 10007:
                return 'Action Pack 10007';
            default:
                return `Floppy ${tokenId}`;
        }
    }

    /**
     * Check if floppy should show Open Pack button
     */
    shouldShowOpenPack(tokenId) {
        return tokenId === 10003 || tokenId === 10004 || tokenId === 10007 || 
               (tokenId >= 15008 && tokenId <= 15015);
    }

    /**
     * Open floppy using blockchain contract
     */
    async openFloppy() {
        console.log('openFloppy called');
        
        if (!this.selectedFloppy) {
            throw new Error('Please select a floppy disc first.');
        }

        if (!window.TraitLABWallet || !window.TraitLABWallet.isWalletConnected()) {
            throw new Error('Please connect your wallet first.');
        }

        try {
            // Load ethers dynamically only when needed
            let ethers;
            if (typeof window.ethers === 'undefined') {
                // Load ethers from CDN
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        ethers = window.ethers;
                        console.log('Ethers loaded successfully');
                        this.executeOpenFloppyTransaction(ethers)
                            .then(resolve)
                            .catch(reject);
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load ethers library. Please refresh the page.'));
                    };
                    document.head.appendChild(script);
                });
            } else {
                ethers = window.ethers;
                return await this.executeOpenFloppyTransaction(ethers);
            }
        } catch (error) {
            console.error('Error in openFloppy:', error);
            throw error;
        }
    }

    /**
     * Execute the open floppy transaction
     */
    async executeOpenFloppyTransaction(ethers) {
        try {
            // Get provider and signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Contract ABI for openPack function
            const contractABI = [
                {
                    "inputs": [
                        {
                            "internalType": "uint256",
                            "name": "packId",
                            "type": "uint256"
                        }
                    ],
                    "name": "openPack",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ];

            // Create contract instance
            const contract = new ethers.Contract(
                window.TraitLABConfig.ADRIAN_FLOPPY_DISCS_CONTRACT, 
                contractABI, 
                signer
            );

            // Prepare parameters
            const packId = this.selectedFloppy.tokenId;

            console.log('Contract address:', window.TraitLABConfig.ADRIAN_FLOPPY_DISCS_CONTRACT);
            console.log('Pack ID:', packId);

            // Call the contract function
            const tx = await contract.openPack(packId);
            
            console.log('Transaction hash:', tx.hash);

            // Wait for transaction confirmation
            const receipt = await tx.wait();
            
            console.log('Transaction confirmed:', receipt);

            // Emit success event
            this.emit('floppyOpened', { 
                tokenId: packId, 
                transactionHash: receipt.transactionHash 
            });

            return receipt;

        } catch (error) {
            console.error('Error in transaction:', error);
            
            let errorMessage = 'Failed to open floppy.';
            
            // Handle specific error cases
            if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                errorMessage = '❌ Transaction was cancelled by user.';
            } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
                // Check for specific revert reasons
                if (error.reason && error.reason.includes('already opened')) {
                    errorMessage = '❌ This floppy has already been opened!';
                } else if (error.reason && error.reason.includes('not owner')) {
                    errorMessage = '❌ You must own this floppy to open it.';
                } else if (error.reason && error.reason.includes('not authorized')) {
                    errorMessage = '❌ You are not authorized to open this floppy.';
                } else {
                    errorMessage = `❌ Transaction failed: ${error.reason}`;
                }
            } else if (error.code === 'INSUFFICIENT_FUNDS') {
                errorMessage = '❌ Insufficient funds for gas fees.';
            } else if (error.message) {
                errorMessage = `❌ Error: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Wrapper para decidir qué contrato usar al abrir un pack
     */
    async openSelectedPack() {
        if (!this.selectedFloppy) {
            throw new Error('Please select a pack first.');
        }
        
        console.log('openSelectedPack: selectedFloppy.tokenId =', this.selectedFloppy.tokenId);
        
        if (this.selectedFloppy.tokenId === 10003) {
            console.log('Redirecting to openPack10003()');
            return await this.openPack10003();
        } else if (this.selectedFloppy.tokenId === 10007) {
            console.log('Redirecting to openActionPack10007() for token', this.selectedFloppy.tokenId);
            return await this.openActionPack10007();
        } else if (this.selectedFloppy.tokenId >= 15008 && this.selectedFloppy.tokenId <= 15015) {
            console.log('Redirecting to openActionPack() for token', this.selectedFloppy.tokenId);
            return await this.openActionPack();
        } else {
            console.log('Redirecting to openPack() for token', this.selectedFloppy.tokenId);
            return await this.openPack();
        }
    }

    /**
     * Open Pack function for token 10004 (PackTokenMinter contract)
     */
    async openPack() {
        console.log('openPack called');
        if (!this.selectedFloppy) {
            throw new Error('Please select a pack first.');
        }
        if (this.selectedFloppy.tokenId !== 10004) {
            throw new Error('This function is only available for Pack token 10004.');
        }
        if (!window.TraitLABWallet || !window.TraitLABWallet.isWalletConnected()) {
            throw new Error('Please connect your wallet first.');
        }

        try {
            // Load ethers dynamically only when needed
            let ethers;
            if (typeof window.ethers === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        ethers = window.ethers;
                        console.log('Ethers loaded successfully');
                        this.executeOpenPackTransaction(ethers)
                            .then(resolve)
                            .catch(reject);
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load ethers library. Please refresh the page.'));
                    };
                    document.head.appendChild(script);
                });
            } else {
                ethers = window.ethers;
                return await this.executeOpenPackTransaction(ethers);
            }
        } catch (error) {
            console.error('Error in openPack:', error);
            throw error;
        }
    }

    /**
     * Execute the open pack transaction
     */
    async executeOpenPackTransaction(ethers) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            const packMinterABI = [
                'function openPack(uint256 packId) external'
            ];
            
            const contract = new ethers.Contract(
                window.TraitLABConfig.PACK_TOKEN_MINTER_CONTRACT, 
                packMinterABI, 
                signer
            );
            
            const packId = this.selectedFloppy.tokenId;
            
            console.log('Opening pack with ID:', packId);
            
            const tx = await contract.openPack(packId);
            const receipt = await tx.wait();
            
            console.log('Pack opened successfully:', receipt);
            
            // Emit success event
            this.emit('packOpened', { 
                tokenId: packId, 
                transactionHash: receipt.transactionHash,
                contract: 'PackTokenMinter'
            });
            
            return receipt;
            
        } catch (error) {
            console.error('Error opening pack (10004):', error);
            throw error;
        }
    }

    /**
     * Open Action Pack function para tokens 15008-15015 (ActionPacks contract)
     */
    async openActionPack() {
        console.log('openActionPack called for token:', this.selectedFloppy?.tokenId);

        if (!this.selectedFloppy) {
            throw new Error('Please select a pack first.');
        }
        if (!(this.selectedFloppy.tokenId >= 15008 && this.selectedFloppy.tokenId <= 15015)) {
            throw new Error('This function is only available for Action Packs (15008-15015).');
        }
        if (!window.TraitLABWallet || !window.TraitLABWallet.isWalletConnected()) {
            throw new Error('Please connect your wallet first.');
        }

        try {
            // Load ethers dynamically only when needed
            let ethers;
            if (typeof window.ethers === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        ethers = window.ethers;
                        console.log('Ethers loaded successfully');
                        this.executeOpenActionPackTransaction(ethers)
                            .then(resolve)
                            .catch(reject);
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load ethers library. Please refresh the page.'));
                    };
                    document.head.appendChild(script);
                });
            } else {
                ethers = window.ethers;
                return await this.executeOpenActionPackTransaction(ethers);
            }
        } catch (error) {
            console.error('Error in openActionPack:', error);
            throw error;
        }
    }

    /**
     * Execute the open action pack transaction
     */
    async executeOpenActionPackTransaction(ethers) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // ActionPacks ABI completo
            const actionPacksABI = [
                'function openPack(uint256 packId) external',
                'function canOpenPack(address user, uint256 packId) view returns (bool canOpen, string reason)',
                'function packConfigs(uint256 packId) view returns (uint256 id, bool active)'
            ];

            const contract = new ethers.Contract(
                window.TraitLABConfig.ACTION_PACKS_CONTRACT, 
                actionPacksABI, 
                signer
            );
            
            const packId = this.selectedFloppy.tokenId;

            // Pre-chequeo 1: Verificar si el pack está activo
            try {
                const packConfig = await contract.packConfigs(packId);
                if (!packConfig.active) {
                    throw new Error(`Pack ${packId} is not active. Please try again later.`);
                }
            } catch (error) {
                console.log(`Could not check pack config for ${packId}:`, error);
            }

            // Pre-chequeo 2: canOpenPack(user, packId)
            const user = await signer.getAddress();
            const [canOpen, reason] = await contract.canOpenPack(user, packId);
            if (!canOpen) {
                throw new Error(`Cannot open pack: ${reason || 'Not eligible or inactive'}`);
            }

            console.log('Opening action pack for pack ID:', packId);

            // Llamar openPack(uint256 packId) con un solo parámetro
            const tx = await contract.openPack(packId);

            console.log('Transaction hash:', tx.hash);

            const receipt = await tx.wait();
            
            console.log('Transaction confirmed:', receipt);
            
            // Emit success event
            this.emit('actionPackOpened', { 
                tokenId: packId, 
                transactionHash: receipt.transactionHash,
                contract: 'ActionPacks'
            });

            return receipt;

        } catch (error) {
            console.error('Error opening action pack:', error);
            throw error;
        }
    }

    /**
     * Open Action Pack function específica para token 10007
     */
    async openActionPack10007() {
        console.log('openActionPack10007 called for token:', this.selectedFloppy?.tokenId);

        if (!this.selectedFloppy) {
            throw new Error('Please select a pack first.');
        }
        if (this.selectedFloppy.tokenId !== 10007) {
            throw new Error('This function is only available for Action Pack 10007.');
        }
        if (!window.TraitLABWallet || !window.TraitLABWallet.isWalletConnected()) {
            throw new Error('Please connect your wallet first.');
        }

        try {
            // Load ethers dynamically only when needed
            let ethers;
            if (typeof window.ethers === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        ethers = window.ethers;
                        console.log('Ethers loaded successfully');
                        this.executeOpenActionPack10007Transaction(ethers)
                            .then(resolve)
                            .catch(reject);
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load ethers library. Please refresh the page.'));
                    };
                    document.head.appendChild(script);
                });
            } else {
                ethers = window.ethers;
                return await this.executeOpenActionPack10007Transaction(ethers);
            }
        } catch (error) {
            console.error('Error in openActionPack10007:', error);
            throw error;
        }
    }

    /**
     * Execute the open action pack 10007 transaction
     */
    async executeOpenActionPack10007Transaction(ethers) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // ActionPacks ABI para token 10007
            const actionPacksABI = [
                'function openPack(uint256 packId) external',
                'function canOpenPack(address user, uint256 packId) view returns (bool canOpen, string reason)',
                'function packConfigs(uint256 packId) view returns (uint256 id, bool active)'
            ];

            const contract = new ethers.Contract(
                window.TraitLABConfig.ACTION_PACK_10007_CONTRACT, 
                actionPacksABI, 
                signer
            );
            
            const packId = this.selectedFloppy.tokenId;

            // Pre-chequeo 1: Verificar si el pack está activo
            try {
                const packConfig = await contract.packConfigs(packId);
                if (!packConfig.active) {
                    throw new Error(`Pack ${packId} is not active. Please try again later.`);
                }
            } catch (error) {
                console.log(`Could not check pack config for ${packId}:`, error);
            }

            // Pre-chequeo 2: canOpenPack(user, packId)
            const user = await signer.getAddress();
            const [canOpen, reason] = await contract.canOpenPack(user, packId);
            if (!canOpen) {
                throw new Error(`Cannot open pack: ${reason || 'Not eligible or inactive'}`);
            }

            console.log('Opening action pack 10007 for pack ID:', packId);

            // Llamar openPack(uint256 packId) con un solo parámetro
            const tx = await contract.openPack(packId);

            console.log('Transaction hash:', tx.hash);

            const receipt = await tx.wait();
            
            console.log('Transaction confirmed:', receipt);
            
            // Emit success event
            this.emit('actionPack10007Opened', { 
                tokenId: packId, 
                transactionHash: receipt.transactionHash,
                contract: 'ActionPack10007'
            });

            return receipt;

        } catch (error) {
            console.error('Error opening action pack 10007:', error);
            throw error;
        }
    }

    /**
     * Open Pack function para token 10003 (NEW_FLOPPY_PACK_CONTRACT)
     */
    async openPack10003() {
        console.log('openPack10003 called for token:', this.selectedFloppy?.tokenId);

        if (!this.selectedFloppy) {
            throw new Error('Please select a pack first.');
        }
        if (this.selectedFloppy.tokenId !== 10003) {
            throw new Error('This function is only available for Pack token 10003.');
        }
        if (!window.TraitLABWallet || !window.TraitLABWallet.isWalletConnected()) {
            throw new Error('Please connect your wallet first.');
        }

        try {
            // Load ethers dynamically only when needed
            let ethers;
            if (typeof window.ethers === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        ethers = window.ethers;
                        console.log('Ethers loaded successfully');
                        this.executeOpenPack10003Transaction(ethers)
                            .then(resolve)
                            .catch(reject);
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load ethers library. Please refresh the page.'));
                    };
                    document.head.appendChild(script);
                });
            } else {
                ethers = window.ethers;
                return await this.executeOpenPack10003Transaction(ethers);
            }
        } catch (error) {
            console.error('Error in openPack10003:', error);
            throw error;
        }
    }

    /**
     * Execute the open pack 10003 transaction
     */
    async executeOpenPack10003Transaction(ethers) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Contract ABI for openPack function
            const contractABI = [
                'function openPack(uint256 packId) external'
            ];

            const contract = new ethers.Contract(
                window.TraitLABConfig.NEW_FLOPPY_PACK_CONTRACT, 
                contractABI, 
                signer
            );
            
            const packId = this.selectedFloppy.tokenId;

            console.log('Opening pack 10003 with ID:', packId);

            const tx = await contract.openPack(packId);
            const receipt = await tx.wait();
            
            console.log('Pack 10003 opened successfully:', receipt);
            
            // Emit success event
            this.emit('pack10003Opened', { 
                tokenId: packId, 
                transactionHash: receipt.transactionHash,
                contract: 'NEW_FLOPPY_PACK_CONTRACT'
            });
            
            return receipt;
            
        } catch (error) {
            console.error('Error opening pack 10003:', error);
            throw error;
        }
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
    window.TraitLABFloppy = FloppyManager;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FloppyManager;
}
