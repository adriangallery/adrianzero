/**
 * TRAITLAB - Módulo de Traits
 * Maneja la base de datos de traits, selección, aplicación y generación de imágenes
 */

class TraitsManager {
    constructor() {
        this.traitsDatabase = null;
        this.selectedTraitsByCategory = new Map();
        this.selectedERC1155 = [];
        this.eventListeners = new Map();
        
        // Bind methods
        this.loadTraitsDatabase = this.loadTraitsDatabase.bind(this);
        this.getTraitCategory = this.getTraitCategory.bind(this);
        this.handleTraitSelection = this.handleTraitSelection.bind(this);
        this.generateCombinedImage = this.generateCombinedImage.bind(this);
        this.applyTraitsToNFT = this.applyTraitsToNFT.bind(this);
        this.clearTraitsSelection = this.clearTraitsSelection.bind(this);
        this.getSelectedTraits = this.getSelectedTraits.bind(this);
        this.getSelectedTraitsByCategory = this.getSelectedTraitsByCategory.bind(this);
    }

    /**
     * Initialize traits manager
     */
    async init() {
        await this.loadTraitsDatabase();
    }

    /**
     * Load traits database from JSON
     */
    async loadTraitsDatabase() {
        try {
            console.log('Loading traits database...');
            const response = await fetch('https://adrianlab.vercel.app/labmetadata/traits.json');
            if (!response.ok) {
                throw new Error(`Failed to load traits database: ${response.status}`);
            }
            const data = await response.json();
            this.traitsDatabase = data;
            console.log('Traits database loaded successfully:', data);
            
            // Emit event for other modules
            this.emit('traitsDatabaseLoaded', data);
            
            return data;
        } catch (error) {
            console.error('Error loading traits database:', error);
            this.emit('traitsDatabaseError', error);
            return null;
        }
    }

    /**
     * Get trait category by token ID
     */
    getTraitCategory(tokenId) {
        if (!this.traitsDatabase || !this.traitsDatabase.traits) {
            return null;
        }
        
        const trait = this.traitsDatabase.traits.find(t => t.tokenId === tokenId);
        return trait ? trait.category : null;
    }

    /**
     * Handle trait selection with category management
     */
    handleTraitSelection(token) {
        const category = this.getTraitCategory(token.tokenId);
        
        if (!category) {
            console.log(`No category found for token ${token.tokenId}, treating as regular selection`);
            // Fallback to regular selection logic
            const index = this.selectedERC1155.findIndex(t => t.tokenId === token.tokenId);
            if (index > -1) {
                this.selectedERC1155.splice(index, 1);
                this.emit('traitDeselected', { token, category: null });
                return false; // Token was deselected
            } else {
                this.selectedERC1155.push(token);
                this.emit('traitSelected', { token, category: null });
                return true; // Token was selected
            }
        }
        
        console.log(`Handling trait selection for token ${token.tokenId} in category ${category}`);
        
        // Check if we already have a trait selected for this category
        const existingTrait = this.selectedTraitsByCategory.get(category);
        
        if (existingTrait && existingTrait.tokenId === token.tokenId) {
            // Deselect the same trait
            this.selectedTraitsByCategory.delete(category);
            const index = this.selectedERC1155.findIndex(t => t.tokenId === token.tokenId);
            if (index > -1) {
                this.selectedERC1155.splice(index, 1);
            }
            console.log(`Deselected trait ${token.tokenId} from category ${category}`);
            this.emit('traitDeselected', { token, category });
            
            // Emit event for visual selection update
            this.emit('traitsSelectionUpdated', { 
                selectedTraits: this.selectedERC1155,
                selectedTraitsByCategory: Array.from(this.selectedTraitsByCategory.entries())
            });
            
            return false;
        } else if (existingTrait) {
            // Remove the existing trait from the same category
            const index = this.selectedERC1155.findIndex(t => t.tokenId === existingTrait.tokenId);
            if (index > -1) {
                this.selectedERC1155.splice(index, 1);
            }
            console.log(`Replaced trait ${existingTrait.tokenId} with ${token.tokenId} in category ${category}`);
            
            // Emit event for visual selection update after replacement
            this.emit('traitsSelectionUpdated', { 
                selectedTraits: this.selectedERC1155,
                selectedTraitsByCategory: Array.from(this.selectedTraitsByCategory.entries())
            });
        }
        
        // Add the new trait
        this.selectedTraitsByCategory.set(category, token);
        this.selectedERC1155.push(token);
        console.log(`Selected trait ${token.tokenId} for category ${category}`);
        
        this.emit('traitSelected', { token, category });
        
        // Emit event for visual selection update
        this.emit('traitsSelectionUpdated', { 
            selectedTraits: this.selectedERC1155,
            selectedTraitsByCategory: Array.from(this.selectedTraitsByCategory.entries())
        });
        
        return true;
    }

    /**
     * Generate combined image from selected traits
     */
    generateCombinedImage(selectedERC721) {
        if (!selectedERC721 || this.selectedERC1155.length === 0) {
            console.log('No ERC721 token or traits selected for image generation');
            return;
        }

        console.log('Generating combined image for token:', selectedERC721.tokenId);
        console.log('Selected traits:', this.selectedERC1155.map(t => t.tokenId));

        // Build query parameters from ERC1155 tokens
        // Use 'trait' as parameter name for all ERC1155 tokens (same as index.html)
        const queryParams = [];
        this.selectedERC1155.forEach(token => {
            console.log('Processing ERC1155 token:', token);
            console.log('Token tokenId:', token.tokenId);
            
            if (token.tokenId) {
                queryParams.push(`trait=${token.tokenId}`);
                console.log(`Added parameter: trait=${token.tokenId}`);
            } else {
                console.log('Token missing tokenId:', token);
            }
        });

        console.log('Query params built:', queryParams);

        if (queryParams.length === 0) {
            console.log('No valid query parameters for image generation');
            return;
        }

        // Create the URL with correct format (same as index.html)
        const baseUrl = 'https://adrianlab.vercel.app/api/render/custom';
        const erc721TokenId = selectedERC721.tokenId;
        const queryString = queryParams.join('&');
        const imageUrl = `${baseUrl}/${erc721TokenId}?${queryString}`;
        
        console.log('Generated combined image URL:', imageUrl);

        // Emit event for UI to display the image
        this.emit('imageGenerated', { 
            imageUrl, 
            tokenId: selectedERC721.tokenId, 
            traitIds: this.selectedERC1155.map(t => t.tokenId),
            queryParams: queryParams
        });
    }

    /**
     * Apply traits to NFT using blockchain contract
     */
    async applyTraitsToNFT(selectedERC721, currentAccount) {
        console.log('applyTraitsToNFT called');
        
        if (!selectedERC721 || this.selectedERC1155.length === 0) {
            throw new Error('Please select both an ERC721 token and ERC1155 traits first.');
        }

        if (!currentAccount) {
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
                        this.executeApplyTraitsTransaction(ethers, selectedERC721, currentAccount)
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
                return await this.executeApplyTraitsTransaction(ethers, selectedERC721, currentAccount);
            }
        } catch (error) {
            console.error('Error in applyTraitsToNFT:', error);
            throw error;
        }
    }

    /**
     * Execute the apply traits transaction
     */
    async executeApplyTraitsTransaction(ethers, selectedERC721, currentAccount) {
        try {
            // Get provider and signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Contract ABI for applyTraitMultiple function
            const contractABI = [
                {
                    "inputs": [
                        {
                            "internalType": "uint256",
                            "name": "tokenId",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256[]",
                            "name": "traitIds",
                            "type": "uint256[]"
                        }
                    ],
                    "name": "applyTraitMultiple",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ];

            // Create contract instance
            const contract = new ethers.Contract(
                window.TraitLABConfig.TRAITS_EXTENSIONS_CONTRACT, 
                contractABI, 
                signer
            );

            // Prepare parameters
            const erc721TokenId = selectedERC721.tokenId;
            const traitIds = this.selectedERC1155.map(token => token.tokenId);

            console.log('Contract address:', window.TraitLABConfig.TRAITS_EXTENSIONS_CONTRACT);
            console.log('ERC721 Token ID:', erc721TokenId);
            console.log('Trait IDs:', traitIds);

            // Call the contract function
            const tx = await contract.applyTraitMultiple(erc721TokenId, traitIds);
            
            console.log('Transaction hash:', tx.hash);

            // Wait for transaction confirmation
            const receipt = await tx.wait();
            
            console.log('Transaction confirmed:', receipt);

            // Clear traits selection after successful application
            this.clearTraitsSelection();

            // Emit success event
            this.emit('traitsApplied', { 
                tokenId: erc721TokenId, 
                traitIds, 
                transactionHash: receipt.transactionHash 
            });

            return receipt;

        } catch (error) {
            console.error('Error in transaction:', error);
            
            let errorMessage = 'Failed to apply traits.';
            
            // Handle specific error cases
            if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                errorMessage = '❌ Transaction was cancelled by user.';
            } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
                // Check for specific revert reasons
                if (error.reason && error.reason.includes('already applied')) {
                    errorMessage = '❌ These traits are already applied to this token!';
                } else if (error.reason && error.reason.includes('not owner')) {
                    errorMessage = '❌ You must own this token to apply traits.';
                } else if (error.reason && error.reason.includes('token does not exist')) {
                    errorMessage = '❌ Token does not exist.';
                } else if (error.reason && error.reason.includes('not authorized')) {
                    errorMessage = '❌ You are not authorized to apply traits to this token.';
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
     * Clear traits selection
     */
    clearTraitsSelection() {
        this.selectedTraitsByCategory.clear();
        this.selectedERC1155 = [];
        this.emit('traitsSelectionCleared');
    }

    /**
     * Get selected traits
     */
    getSelectedTraits() {
        return [...this.selectedERC1155];
    }

    /**
     * Get selected traits by category
     */
    getSelectedTraitsByCategory() {
        return new Map(this.selectedTraitsByCategory);
    }

    /**
     * Check if traits are selected
     */
    hasSelectedTraits() {
        return this.selectedERC1155.length > 0;
    }

    /**
     * Get traits database
     */
    getTraitsDatabase() {
        return this.traitsDatabase;
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
    window.TraitLABTraits = TraitsManager;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TraitsManager;
}
