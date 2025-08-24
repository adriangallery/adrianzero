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
                        this.executeOpenFloppy(ethers)
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
                return await this.executeOpenFloppy(ethers);
            }
        } catch (error) {
            console.error('Error in openFloppy:', error);
            throw error;
        }
    }

    /**
     * Execute the open floppy transaction
     */
    async executeOpenFloppy(ethers) {
        try {
            // Get provider and signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Check if we're on the correct network (Base)
            const network = await provider.getNetwork();
            console.log('Current network:', network);
            
            if (network.chainId !== 8453) { // Base mainnet
                throw new Error('Please switch to Base network to use this feature.');
            }
            
            // Determine which contract to use based on floppy type
            let contractAddress;
            let contractABI;
            
            if (this.selectedFloppy.tokenId === 10007) {
                // ActionPack 10007 uses different contract
                contractAddress = window.TraitLABConfig.ACTION_PACKS_CONTRACT;
                contractABI = window.TraitLABConfig.ACTION_PACKS_ABI;
            } else if (this.selectedFloppy.tokenId === 10003) {
                // GLITCH Floppy uses PackTokenMinter
                contractAddress = window.TraitLABConfig.PACK_TOKEN_MINTER_CONTRACT;
                contractABI = window.TraitLABConfig.PACK_TOKEN_MINTER_ABI;
            } else if (this.selectedFloppy.tokenId === 10004) {
                // GF Floppy uses PackTokenMinter
                contractAddress = window.TraitLABConfig.PACK_TOKEN_MINTER_CONTRACT;
                contractABI = window.TraitLABConfig.PACK_TOKEN_MINTER_ABI;
            } else if (this.selectedFloppy.tokenId >= 15008 && this.selectedFloppy.tokenId <= 15015) {
                // Pack tokens use PackTokenMinter
                contractAddress = window.TraitLABConfig.PACK_TOKEN_MINTER_CONTRACT;
                contractABI = window.TraitLABConfig.PACK_TOKEN_MINTER_ABI;
            } else {
                // Default floppy contract
                contractAddress = window.TraitLABConfig.FLOPPY_CONTRACT;
                contractABI = window.TraitLABConfig.FLOPPY_ABI;
            }
            
            console.log('Using contract:', contractAddress);
            console.log('Contract ABI:', contractABI);
            
            // Check if contract exists
            const code = await provider.getCode(contractAddress);
            if (code === '0x') {
                throw new Error('Contract not found at specified address');
            }
            
            // Create contract instance
            const contract = new ethers.Contract(contractAddress, contractABI, provider);
            
            // Prepare transaction
            console.log('Preparing transaction...');
            const signer = provider.getSigner();
            const userAddress = await signer.getAddress();
            
            // Create contract instance with signer
            const contractWithSigner = new ethers.Contract(contractAddress, contractABI, signer);
            
            // Prepare transaction parameters
            const floppyId = this.selectedFloppy.tokenId;
            
            console.log('Confirming transaction in your wallet...');
            console.log('Floppy ID:', floppyId);
            
            let tx;
            
            // Call appropriate function based on floppy type
            if (floppyId === 10007) {
                // ActionPack 10007
                tx = await contractWithSigner.openActionPack(floppyId);
            } else if (floppyId === 10003 || floppyId === 10004) {
                // GLITCH/GF Floppy
                tx = await contractWithSigner.openPack(floppyId);
            } else if (floppyId >= 15008 && floppyId <= 15015) {
                // Pack tokens
                tx = await contractWithSigner.openPack(floppyId);
            } else {
                // Default floppy
                tx = await contractWithSigner.openFloppy(floppyId);
            }
            
            console.log('Transaction sent:', tx.hash);
            
            // Wait for confirmation
            console.log('Transaction sent! Waiting for confirmation...');
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);
            
            // Emit success event
            this.emit('floppyOpened', { 
                floppyId, 
                transactionHash: receipt.transactionHash,
                receipt 
            });
            
            return receipt;
            
        } catch (error) {
            console.error('Error in executeOpenFloppy:', error);
            
            // Handle specific error cases
            let errorMessage = 'Failed to open floppy.';
            if (error.code === 4001) {
                errorMessage = 'Transaction was rejected by user.';
            } else if (error.reason) {
                if (error.reason.includes('not owner')) {
                    errorMessage = '❌ You must own this floppy to open it.';
                } else if (error.reason.includes('already opened')) {
                    errorMessage = '❌ This floppy has already been opened.';
                } else if (error.reason.includes('insufficient balance')) {
                    errorMessage = '❌ Insufficient floppy balance.';
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
     * Open Pack 10003 function (GLITCH Floppy)
     */
    async openPack10003() {
        console.log('openPack10003 called');
        if (!this.selectedFloppy) {
            throw new Error('Please select a pack first.');
        }
        if (this.selectedFloppy.tokenId !== 10003) {
            throw new Error('This function is only available for GLITCH Floppy token 10003.');
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
     * Open ActionPack function for tokens 15008-15015
     */
    async openActionPack() {
        console.log('openActionPack called');
        if (!this.selectedFloppy) {
            throw new Error('Please select a pack first.');
        }
        if (this.selectedFloppy.tokenId < 15008 || this.selectedFloppy.tokenId > 15015) {
            throw new Error('This function is only available for ActionPack tokens 15008-15015.');
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
            // Get provider and signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Contract ABI for openActionPack function
            const contractABI = [
                {
                    "inputs": [
                        {
                            "internalType": "uint256",
                            "name": "packId",
                            "type": "uint256"
                        }
                    ],
                    "name": "openActionPack",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ];

            // Create contract instance
            const contract = new ethers.Contract(
                window.TraitLABConfig.ACTION_PACKS_CONTRACT, 
                contractABI, 
                signer
            );

            // Prepare parameters
            const packId = this.selectedFloppy.tokenId;

            console.log('Contract address:', window.TraitLABConfig.ACTION_PACKS_CONTRACT);
            console.log('Pack ID:', packId);

            // Call the contract function
            const tx = await contract.openActionPack(packId);
            
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
            
            let errorMessage = 'Failed to open action pack.';
            
            // Handle specific error cases
            if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                errorMessage = '❌ Transaction was cancelled by user.';
            } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
                // Check for specific revert reasons
                if (error.reason && error.reason.includes('already opened')) {
                    errorMessage = '❌ This action pack has already been opened!';
                } else if (error.reason && error.reason.includes('not owner')) {
                    errorMessage = '❌ You must own this action pack to open it.';
                } else if (error.reason && error.reason.includes('not authorized')) {
                    errorMessage = '❌ You are not authorized to open this action pack.';
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
     * Open ActionPack 10007 function
     */
    async openActionPack10007() {
        console.log('openActionPack10007 called');
        if (!this.selectedFloppy) {
            throw new Error('Please select a pack first.');
        }
        if (this.selectedFloppy.tokenId !== 10007) {
            throw new Error('This function is only available for ActionPack token 10007.');
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
            // Get provider and signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Contract ABI for openActionPack function
            const contractABI = [
                {
                    "inputs": [
                        {
                            "internalType": "uint256",
                            "name": "packId",
                            "type": "uint256"
                        }
                    ],
                    "name": "openActionPack",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ];

            // Create contract instance
            const contract = new ethers.Contract(
                window.TraitLABConfig.ACTION_PACKS_CONTRACT, 
                contractABI, 
                signer
            );

            // Prepare parameters
            const packId = this.selectedFloppy.tokenId;

            console.log('Contract address:', window.TraitLABConfig.ACTION_PACKS_CONTRACT);
            console.log('Pack ID:', packId);

            // Call the contract function
            const tx = await contract.openActionPack(packId);
            
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
            
            let errorMessage = 'Failed to open action pack.';
            
            // Handle specific error cases
            if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                errorMessage = '❌ Transaction was cancelled by user.';
            } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
                // Check for specific revert reasons
                if (error.reason && error.reason.includes('already opened')) {
                    errorMessage = '❌ This action pack has already been opened!';
                } else if (error.reason && error.reason.includes('not owner')) {
                    errorMessage = '❌ You must own this action pack to open it.';
                } else if (error.reason && error.reason.includes('not authorized')) {
                    errorMessage = '❌ You are not authorized to open this action pack.';
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
