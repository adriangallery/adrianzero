/**
 * TRAITLAB - Módulo de Serums
 * Maneja la selección, uso y aplicación de serums a tokens AdrianZERO
 */

class SerumsManager {
    constructor() {
        this.selectedSerum = null;
        this.eventListeners = new Map();
        
        // Bind methods
        this.useSerum = this.useSerum.bind(this);
        this.setSelectedSerum = this.setSelectedSerum.bind(this);
        this.getSelectedSerum = this.getSelectedSerum.bind(this);
        this.clearSelection = this.clearSelection.bind(this);
        this.isSerumToken = this.isSerumToken.bind(this);
        this.getSerumDisplayName = this.getSerumDisplayName.bind(this);
    }

    /**
     * Initialize serums manager
     */
    init() {
        console.log('🚀 SerumsManager inicializado');
    }

    /**
     * Get correct image path based on environment
     * Based on getImagePath() from index.html
     */
    getImagePath(assetId, extension) {
        // Check if we're running locally (localhost) or online
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocal) {
            // Local development - use relative path from current directory
            return `../components/images/${assetId}${extension}`;
        } else {
            // Production - use adrianzero.com CDN
            return `https://adrianzero.com/components/images/${assetId}${extension}`;
        }
    }

    /**
     * Get serum image URL with local image support
     * Based on serum image logic from index.html
     */
    getSerumImageUrl(tokenId) {
        // Use local images for serums (tokens 262144-262147)
        if (tokenId >= 262144 && tokenId <= 262147) {
            return this.getImagePath(tokenId, '.gif');
        }
        
        // Fallback to default image
        return `https://adrianlab.vercel.app/api/render/${tokenId}.png`;
    }

    /**
     * Set selected serum
     */
    setSelectedSerum(serum) {
        this.selectedSerum = serum;
        this.emit('serumSelected', { serum });
    }

    /**
     * Get selected serum
     */
    getSelectedSerum() {
        return this.selectedSerum;
    }

    /**
     * Clear serum selection
     */
    clearSelection() {
        this.selectedSerum = null;
        this.emit('serumSelectionCleared');
    }

    /**
     * Check if token is a serum token
     */
    isSerumToken(tokenId) {
        return tokenId >= 262144 && tokenId <= 262147;
    }

    /**
     * Get serum display name
     */
    getSerumDisplayName(tokenId) {
        switch (tokenId) {
            case 262144:
                return 'Serum 262144';
            case 262145:
                return 'Serum 262145';
            case 262146:
                return 'Serum 262146';
            case 262147:
                return 'Serum 262147';
            default:
                return `Serum ${tokenId}`;
        }
    }

    /**
     * Use Serum function
     */
    async useSerum(selectedERC721) {
        console.log('🧪 SerumsManager: useSerum called with AdrianZERO:', selectedERC721?.tokenId);
        
        if (!this.selectedSerum) {
            throw new Error('Please select a serum first.');
        }

        if (!selectedERC721) {
            throw new Error('Please select an AdrianZERO token first.');
        }

        if (!window.TraitLABWallet || !window.TraitLABWallet.isWalletConnected()) {
            throw new Error('Please connect your wallet first.');
        }

        // 🚨 NUEVO: Verificar si el token está activado antes de usar el serum
        console.log('🔍 SerumsManager: Verificando si el token está activado...');
        try {
            await this.checkTokenActivationStatus(selectedERC721);
        } catch (activationError) {
            console.warn('⚠️ SerumsManager: Error verificando activación del token:', activationError.message);
            // Continuar con la transacción - el contrato verificará la elegibilidad
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
                        this.executeUseSerumTransaction(ethers, selectedERC721)
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
                return await this.executeUseSerumTransaction(ethers, selectedERC721);
            }
        } catch (error) {
            console.error('Error in useSerum:', error);
            throw error;
        }
    }

    /**
     * Execute the use serum transaction
     */
    async executeUseSerumTransaction(ethers, selectedERC721) {
        try {
            // Get provider and signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // SerumModule contract address
            const SERUM_MODULE_CONTRACT = window.TraitLABConfig.SERUM_MODULE_CONTRACT;

            // Contract ABI for useSerum function
            const contractABI = [
                {
                    "inputs": [
                        {
                            "internalType": "uint256",
                            "name": "serumId",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "tokenId",
                            "type": "uint256"
                        },
                        {
                            "internalType": "string",
                            "name": "narrativeText",
                            "type": "string"
                        }
                    ],
                    "name": "useSerum",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ];

            // Create contract instance
            const contract = new ethers.Contract(SERUM_MODULE_CONTRACT, contractABI, signer);

            // Prepare parameters
            const serumId = this.selectedSerum.tokenId;
            const tokenId = selectedERC721.tokenId;
            const narrativeText = "Drank Serum";

            console.log('Contract address:', SERUM_MODULE_CONTRACT);
            console.log('Serum ID:', serumId);
            console.log('Token ID:', tokenId);
            console.log('Narrative Text:', narrativeText);

            // Call the contract function
            const tx = await contract.useSerum(serumId, tokenId, narrativeText);
            
            console.log('Transaction hash:', tx.hash);

            // Wait for transaction confirmation
            const receipt = await tx.wait();
            
            console.log('Transaction confirmed:', receipt);

            // Clear serum selection after successful use
            this.clearSelection();

            // Emit success event
            this.emit('serumUsed', { 
                serumId, 
                tokenId, 
                narrativeText,
                transactionHash: receipt.transactionHash 
            });

            return receipt;

        } catch (error) {
            console.error('Error in transaction:', error);
            
            let errorMessage = 'Failed to use serum.';
            
            // Handle specific error cases
            if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                errorMessage = '❌ Transaction was cancelled by user.';
            } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
                // Check for specific revert reasons
                if (error.reason && error.reason.includes('already used')) {
                    errorMessage = '❌ This serum has already been used!';
                } else if (error.reason && error.reason.includes('not owner')) {
                    errorMessage = '❌ You must own this token to use the serum.';
                } else if (error.reason && error.reason.includes('token does not exist')) {
                    errorMessage = '❌ Token does not exist.';
                } else if (error.reason && error.reason.includes('not authorized')) {
                    errorMessage = '❌ You are not authorized to use this serum.';
                } else if (error.reason && error.reason.includes('serum not found')) {
                    errorMessage = '❌ Serum not found.';
                } else if (error.reason && error.reason.includes('Token not eligible for mutation')) {
                    errorMessage = '❌ This AdrianZERO token needs to be activated first! Please use "Assign SKIN" button to activate the token before using a serum.';
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
     * Check if serum can be used on token
     */
    canUseSerumOnToken(serum, token) {
        if (!serum || !token) {
            return false;
        }

        // Basic validation
        if (!this.isSerumToken(serum.tokenId)) {
            return false;
        }

        if (token.tokenType !== 'ERC721') {
            return false;
        }

        // Check if user owns the token (basic check)
        // This would need to be enhanced with actual ownership verification
        return true;
    }

    /**
     * Get serum requirements
     */
    getSerumRequirements(serumId) {
        // This could be enhanced with actual serum requirements from contract
        const requirements = {
            262144: { name: 'Serum 262144', description: 'Basic serum for token enhancement' },
            262145: { name: 'Serum 262145', description: 'Advanced serum for token enhancement' },
            262146: { name: 'Serum 262146', description: 'Premium serum for token enhancement' },
            262147: { name: 'Serum 262147', description: 'Ultimate serum for token enhancement' }
        };

        return requirements[serumId] || { name: `Serum ${serumId}`, description: 'Unknown serum' };
    }

    /**
     * Validate serum selection
     */
    validateSerumSelection(serum) {
        if (!serum) {
            return { valid: false, error: 'No serum selected' };
        }

        if (!this.isSerumToken(serum.tokenId)) {
            return { valid: false, error: 'Invalid serum token' };
        }

        if (!serum.balance || serum.balance < 1) {
            return { valid: false, error: 'Insufficient serum balance' };
        }

        return { valid: true, error: null };
    }

    /**
     * Get available serums for user
     */
    async getAvailableSerums(userAddress) {
        // This would typically query the blockchain for user's serum holdings
        // For now, return a mock structure
        return [
            { tokenId: 262144, name: 'Serum 262144', balance: 1, available: true },
            { tokenId: 262145, name: 'Serum 262145', balance: 0, available: false },
            { tokenId: 262146, name: 'Serum 262146', balance: 2, available: true },
            { tokenId: 262147, name: 'Serum 262147', balance: 1, available: true }
        ].filter(serum => serum.available);
    }

    /**
     * Check if token is activated (has SKIN assigned)
     */
    async checkTokenActivationStatus(token) {
        try {
            // Load ethers dynamically if not available
            let ethers = window.ethers;
            if (typeof ethers === 'undefined') {
                console.log('Ethers not available for activation check');
                return false;
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Check if token has SKIN assigned by calling a view function
            // This would need to be implemented based on the actual contract
            // For now, we'll just log and return true to continue with the transaction
            console.log('🔍 SerumsManager: Checking activation status for token:', token.tokenId);
            
            // TODO: Implement actual activation check when contract view function is available
            return true;
            
        } catch (error) {
            console.error('Error checking token activation status:', error);
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
    window.TraitLABSerums = SerumsManager;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SerumsManager;
}
