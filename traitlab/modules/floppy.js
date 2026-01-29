/**
 * TRAITLAB - Módulo de Floppy
 * Maneja floppy discs, packs, actionpacks y toda la lógica de opening
 * Implementación completa basada en index.html original
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
     * Get correct image path based on environment
     * Based on getImagePath() from index.html
     */
    getImagePath(assetId, extension) {
        // Check if we're running locally (localhost) or online
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // For floppy discs (10000-20000 range), use traitlab/assets/traits/ path
        if (assetId >= 10000 && assetId <= 20000) {
            if (isLocal) {
                return `./assets/traits/${assetId}${extension}`;
            } else {
                return `https://adrianzero.com/traitlab/assets/traits/${assetId}${extension}`;
            }
        }
        
        // For other items, use components/images/ path
        if (isLocal) {
            // Local development - use relative path from current directory
            return `../components/images/${assetId}${extension}`;
        } else {
            // Production - use adrianzero.com CDN
            return `https://adrianzero.com/components/images/${assetId}${extension}`;
        }
    }

    /**
     * Get floppy image URL with local image support
     * Based on floppy image logic from index.html
     */
    getFloppyImageUrl(tokenId) {
        // Use local images for floppy discs
        if (tokenId === 10000) {
            return this.getImagePath(10000, '.gif');
        } else if (tokenId === 10001) {
            return this.getImagePath(10001, '.gif');
        } else if (tokenId === 10002) {
            return this.getImagePath(10002, '.gif');
        } else if (tokenId === 10003) {
            return this.getImagePath(10003, '.gif');
        } else if (tokenId === 10004) {
            return this.getImagePath(10004, '.gif');
        } else if (tokenId === 10005) {
            return this.getImagePath(10005, '.gif');
        } else if (tokenId === 10007) {
            return this.getImagePath(10007, '.png');
        } else if (tokenId === 15000) {
            return this.getImagePath(15000, '.gif');
        } else if (tokenId === 15001) {
            return this.getImagePath(15001, '.gif');
        } else if (tokenId === 15002) {
            return this.getImagePath(15002, '.gif');
        } else if (tokenId === 15003) {
            return this.getImagePath(15003, '.gif');
        } else if (tokenId === 15004) {
            return this.getImagePath(15004, '.gif');
        } else if (tokenId === 15005) {
            return this.getImagePath(15005, '.gif');
        } else if (tokenId === 15006) {
            return this.getImagePath(15006, '.gif');
        } else if (tokenId === 15007) {
            return this.getImagePath(15007, '.gif');
        } else if (tokenId === 15008) {
            return this.getImagePath(15008, '.png');
        } else if (tokenId === 15009) {
            return this.getImagePath(15009, '.png');
        } else if (tokenId === 15010) {
            return this.getImagePath(15010, '.png');
        } else if (tokenId === 15011) {
            return this.getImagePath(15011, '.png');
        } else if (tokenId === 15012) {
            return this.getImagePath(15012, '.png');
        } else if (tokenId === 15013) {
            return this.getImagePath(15013, '.png');
        } else if (tokenId === 15014) {
            return this.getImagePath(15014, '.png');
        } else if (tokenId === 15015) {
            return this.getImagePath(15015, '.png');
        } else if (tokenId === 10008) {
            return this.getImagePath(10008, '.gif');
        } else if (tokenId === 10009) {
            return this.getImagePath(10009, '.gif');
        } else if (tokenId === 10010) {
            return this.getImagePath(10010, '.gif');
        } else if (tokenId === 10011) {
            return this.getImagePath(10011, '.gif');
        } else if (tokenId === 10018) {
            return this.getImagePath(10018, '.gif');
        } else if (tokenId === 10012) {
            return this.getImagePath(10012, '.gif');
        } else if (tokenId === 10013) {
            return this.getImagePath(10013, '.gif');
        } else if (tokenId === 10014) {
            return this.getImagePath(10014, '.gif');
        } else if (tokenId === 10015) {
            return this.getImagePath(10015, '.gif');
        } else if (tokenId === 10016) {
            return this.getImagePath(10016, '.gif');
        } else if (tokenId === 10017) {
            return this.getImagePath(10017, '.gif');
        } else if (tokenId === 10019) {
            return this.getImagePath(10019, '.png');
        } else if (tokenId === 1123) {
            // CensorPACK: intentar .gif primero, luego .png como fallback
            const gifPath = this.getImagePath(1123, '.gif');
            const pngPath = this.getImagePath(1123, '.png');
            // Retornar ambos paths - el código que lo use debería intentar gif primero
            // Por ahora retornamos png ya que sabemos que existe
            return pngPath;
        }

        // Fallback to default image
        return `https://adrianlab.vercel.app/api/render/${tokenId}.png`;
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
     * Rangos: 10000-10019 (packs/floppys), 15000-15015 (floppys especiales)
     */
    isFloppyToken(tokenId) {
        return (tokenId >= 10000 && tokenId <= 10019) ||
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
                return 'NEONpack';
            case 10008:
                return 'OPTICALpack';
            case 10009:
                return 'PUNKSfloppy';
            case 10010:
                return 'ComradesUSB';
            case 10011:
                return 'PACK10011';
            case 10012:
                return 'PACK10012';
            case 10018:
                return 'PACK10018';
            default:
                return `Floppy ${tokenId}`;
        }
    }

    /**
     * Check if floppy should show Open Pack button
     */
    shouldShowOpenPack(tokenId) {
        return tokenId === 10000 || tokenId === 10001 || tokenId === 10002 || tokenId === 10003 || tokenId === 10004 || tokenId === 10007 || 
               tokenId === 10008 || tokenId === 10009 || tokenId === 10010 || tokenId === 10011 || tokenId === 10012 || tokenId === 10013 ||
               tokenId === 10014 || tokenId === 10016 || tokenId === 10018 ||
               (tokenId >= 15008 && tokenId <= 15015);
    }

    /**
     * Determine which contract to use for a specific floppy
     * Updated to use OpenPackV4 for specified packs
     */
    getContractForFloppy(tokenId) {
        // OpenPackV4 handles: 10000, 10001, 10002, 10003, 10004, 10005, 10009, 10010, 10013, 10014, 10015, 10018, 15010
        if (tokenId === 10000 || tokenId === 10001 || tokenId === 10002 || 
            tokenId === 10003 || tokenId === 10004 || tokenId === 10005 || 
            tokenId === 10009 || tokenId === 10010 || tokenId === 10013 || 
            tokenId === 10014 || tokenId === 10015 || tokenId === 10018 || tokenId === 15010) {
            return {
                address: window.TraitLABConfig.OPENPACK_V4_CONTRACT,
                type: 'pack',
                name: 'OpenPackV4',
                function: 'openPacks'
            };
        } else if (tokenId === 10007) {
            // Action Pack 10007 - ActionPack
            return {
                address: window.TraitLABConfig.ACTION_PACK_10007_CONTRACT,
                type: 'pack',
                name: 'Action Pack 10007'
            };
        } else if (tokenId >= 15008 && tokenId <= 15015 && tokenId !== 15010) {
            // Action Packs 15008-15015 (except 15010 which uses OpenPackV4)
            return {
                address: window.TraitLABConfig.ACTION_PACKS_CONTRACT,
                type: 'pack',
                name: 'Action Pack'
            };
        } else if (tokenId === 10008) {
            // OPTICALpack - ActionPack contract
            return {
                address: window.TraitLABConfig.ACTION_PACKS_CONTRACT,
                type: 'pack',
                name: 'OPTICALpack'
            };
        } else if (tokenId === 10011) {
            // PACK10011 - ActionPack contract (same as 10008)
            return {
                address: window.TraitLABConfig.ACTION_PACKS_CONTRACT,
                type: 'pack',
                name: 'PACK10011'
            };
        } else if (tokenId === 10012) {
            // PACK10012 - ActionPack contract (same as 10008)
            return {
                address: window.TraitLABConfig.ACTION_PACKS_CONTRACT,
                type: 'pack',
                name: 'PACK10012'
            };
        } else if (tokenId === 10016) {
            // PACK10016 - ActionPack contract
            return {
                address: window.TraitLABConfig.ACTION_PACKS_CONTRACT,
                type: 'pack',
                name: 'PACK10016'
            };
        } else if (tokenId === 10019) {
            // PACK10019 - ActionPack contract
            return {
                address: window.TraitLABConfig.ACTION_PACKS_CONTRACT,
                type: 'pack',
                name: 'PACK10019'
            };
        } else if (tokenId === 1123) {
            // CensorPACK - ActionPack contract
            return {
                address: window.TraitLABConfig.ACTION_PACKS_CONTRACT,
                type: 'pack',
                name: 'CensorPACK'
            };
        } else if (tokenId === 10009) {
            // PUNKSfloppy - now uses OpenPackV4 contract
            return {
                address: window.TraitLABConfig.OPENPACK_V4_CONTRACT,
                type: 'pack',
                name: 'OpenPackV4',
                function: 'openPacks'
            };
        } else if (tokenId === 10006) {
            // Golden Floppy - ADRIAN_FLOPPY_DISCS_CONTRACT
            return {
                address: window.TraitLABConfig.ADRIAN_FLOPPY_DISCS_CONTRACT,
                type: 'floppy',
                name: 'Floppy'
            };
        } else {
            // Default fallback
            return {
                address: window.TraitLABConfig.ADRIAN_FLOPPY_DISCS_CONTRACT,
                type: 'floppy',
                name: 'Floppy'
            };
        }
    }

    /**
     * Wrapper para decidir qué contrato usar al abrir un pack
     * Updated to handle OpenPackV4
     */
    async openSelectedPack() {
        if (!this.selectedFloppy) {
            throw new Error('Please select a pack first.');
        }
        
        console.log('openSelectedPack: selectedFloppy.tokenId =', this.selectedFloppy.tokenId);
        const tokenId = parseInt(this.selectedFloppy.tokenId);
        console.log('openSelectedPack: tokenId (parsed) =', tokenId);
        
        // Check if this pack uses OpenPackV4
        const contractInfo = this.getContractForFloppy(tokenId);
        if (contractInfo.function === 'openPacks') {
            console.log('Redirecting to openPackV4() for token', tokenId);
            return await this.openPackV4();
        } else if (tokenId === 10007) {
            console.log('Redirecting to openActionPack10007() for token', this.selectedFloppy.tokenId);
            return await this.openActionPack10007();
        } else if (tokenId === 10008) {
            console.log('Redirecting to openActionPack() for OPTICALpack', tokenId);
            return await this.openActionPack();
        } else if (tokenId === 10011) {
            console.log('Redirecting to openActionPack() for PACK10011', tokenId);
            return await this.openActionPack();
        } else if (tokenId === 10012) {
            console.log('Redirecting to openActionPack() for PACK10012', tokenId);
            return await this.openActionPack();
        } else if (tokenId === 10016) {
            console.log('Redirecting to openActionPack() for PACK10016', tokenId);
            return await this.openActionPack();
        } else if (tokenId === 10019) {
            console.log('Redirecting to openActionPack() for PACK10019', tokenId);
            return await this.openActionPack();
        } else if (tokenId === 1123) {
            console.log('Redirecting to openActionPack() for PACK1123', tokenId);
            return await this.openActionPack();
        } else if (tokenId >= 15008 && tokenId <= 15015 && tokenId !== 15010) {
            console.log('Redirecting to openActionPack() for token', tokenId);
            return await this.openActionPack();
        } else if (tokenId === 10006) {
            console.log('Redirecting to openFloppy() for floppy token', tokenId);
            return await this.openFloppy();
        } else {
            console.log('Redirecting to openPack() for token', tokenId);
            return await this.openPack();
        }
    }

    /**
     * Open Pack V4 function for OpenPackV4 contract
     * Handles packs: 10000, 10001, 10002, 10003, 10004, 10005, 10009, 10010, 10013, 10014, 10015, 10018, 15010
     */
    async openPackV4() {
        console.log('openPackV4 called');
        if (!this.selectedFloppy) {
            throw new Error('Please select a pack first.');
        }
        
        // Check if this pack is supported by OpenPackV4
        const supportedPacks = [10000, 10001, 10002, 10003, 10004, 10005, 10009, 10010, 10013, 10014, 10015, 10018, 15010];
        if (!supportedPacks.includes(this.selectedFloppy.tokenId)) {
            throw new Error('This pack is not supported by OpenPackV4.');
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
                        this.executeOpenPackV4Transaction(ethers)
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
                return await this.executeOpenPackV4Transaction(ethers);
            }
        } catch (error) {
            console.error('Error in openPackV4:', error);
            throw error;
        }
    }

    /**
     * Open Pack V4 with custom quantity
     * Opens multiple packs (1-4) of the same packId
     */
    async openPackV4WithQuantity(quantity) {
        console.log('openPackV4WithQuantity called with quantity:', quantity);
        if (!this.selectedFloppy) {
            throw new Error('Please select a pack first.');
        }
        
        if (quantity < 1 || quantity > 4) {
            throw new Error('Quantity must be between 1 and 4.');
        }
        
        // Check if this pack is supported by OpenPackV4
        const supportedPacks = [10000, 10001, 10002, 10003, 10004, 10005, 10009, 10010, 10013, 10014, 10015, 10018, 15010];
        if (!supportedPacks.includes(this.selectedFloppy.tokenId)) {
            throw new Error('This pack is not supported by OpenPackV4.');
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
                        this.executeOpenPackV4Transaction(ethers, quantity)
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
                return await this.executeOpenPackV4Transaction(ethers, quantity);
            }
        } catch (error) {
            console.error('Error in openPackV4WithQuantity:', error);
            throw error;
        }
    }

    /**
     * Execute the open pack V4 transaction
     */
    async executeOpenPackV4Transaction(ethers, quantity = 1) {
        try {
            // Get provider and signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // OpenPackV4 ABI - función openPacks
            const openPackV4ABI = [
                'function openPacks(uint256 packId, uint32 quantity) external'
            ];

            // Create contract instance
            const contract = new ethers.Contract(
                window.TraitLABConfig.OPENPACK_V4_CONTRACT, 
                openPackV4ABI, 
                signer
            );

            // Prepare parameters
            const packId = this.selectedFloppy.tokenId;

            console.log('Contract address:', window.TraitLABConfig.OPENPACK_V4_CONTRACT);
            console.log('Pack ID:', packId);
            console.log('Quantity:', quantity);

            // Call the contract function
            const tx = await contract.openPacks(packId, quantity);
            
            console.log('Transaction hash:', tx.hash);

            // Wait for transaction confirmation
            const receipt = await tx.wait();
            
            console.log('Transaction confirmed:', receipt);

            // Emit success event
            this.emit('floppyOpened', { 
                tokenId: packId, 
                quantity: quantity,
                transactionHash: receipt.transactionHash,
                receipt 
            });

            return receipt;

        } catch (error) {
            console.error('Error in transaction:', error);
            
            let errorMessage = 'Failed to open pack.';
            
            // Handle specific error cases
            if (error.code === 4001) {
                errorMessage = 'Transaction was rejected by user.';
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Open Pack function for token 10004 (PackTokenMinter contract)
     * Basado en openPack() del index.html original
     */
    async openPack() {
        console.log('openPack called');
        if (!this.selectedFloppy) {
            throw new Error('Please select a pack first.');
        }
        // This function is now only for legacy packs not handled by OpenPackV4
        const openPackV4Packs = [10000, 10001, 10002, 10003, 10004, 10005, 10009, 10010, 10013, 10014, 10015, 10018, 15010];
        if (openPackV4Packs.includes(this.selectedFloppy.tokenId)) {
            throw new Error('This pack is now handled by OpenPackV4. Please use the correct function.');
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
     * Basado en executeOpenPack() del index.html original
     */
    async executeOpenPackTransaction(ethers) {
        try {
            // Get provider and signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // PackTokenMinter ABI - solo la función openPack
            const packMinterABI = [
                'function openPack(uint256 packId) external'
            ];

            // Create contract instance
            const contract = new ethers.Contract(
                window.TraitLABConfig.PACK_TOKEN_MINTER_CONTRACT, 
                packMinterABI, 
                signer
            );

            // Prepare parameters
            const packId = this.selectedFloppy.tokenId;

            console.log('Contract address:', window.TraitLABConfig.PACK_TOKEN_MINTER_CONTRACT);
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
                transactionHash: receipt.transactionHash,
                receipt 
            });

            return receipt;

        } catch (error) {
            console.error('Error in transaction:', error);
            
            let errorMessage = 'Failed to open pack.';
            
            // Handle specific error cases
            if (error.code === 4001) {
                errorMessage = 'Transaction was rejected by user.';
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Open Pack 10003 function (GLITCH Floppy)
     * Basado en openPack10003() del index.html original
     */
    async openPack10003() {
        console.log('openPack10003 called');
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
     * Basado en executeOpenPack10003() del index.html original
     */
    async executeOpenPack10003Transaction(ethers) {
        try {
            // Get provider and signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // NEW_FLOPPY_PACK_CONTRACT ABI - solo la función openPack
            const abi = [
                'function openPack(uint256 packId) external'
            ];

            // Create contract instance
            const contract = new ethers.Contract(
                window.TraitLABConfig.NEW_FLOPPY_PACK_CONTRACT, 
                abi, 
                signer
            );

            // Prepare parameters
            const packId = this.selectedFloppy.tokenId; // 10003

            console.log('Contract address:', window.TraitLABConfig.NEW_FLOPPY_PACK_CONTRACT);
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
                transactionHash: receipt.transactionHash,
                receipt 
            });

            return receipt;

        } catch (error) {
            console.error('Error in transaction:', error);
            
            let errorMessage = 'Failed to open pack.';
            
            // Handle specific error cases
            if (error.code === 4001) {
                errorMessage = 'Transaction was rejected by user.';
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Open ActionPack function para tokens 15008-15015 (ActionPacks contract)
     * Basado en openActionPack() del index.html original
     */
    async openActionPack() {
        console.log('openActionPack called for token:', this.selectedFloppy?.tokenId);

        if (!this.selectedFloppy) {
            throw new Error('Please select a pack first.');
        }
        if (!(this.selectedFloppy.tokenId === 10008 || this.selectedFloppy.tokenId === 10011 || this.selectedFloppy.tokenId === 10012 || this.selectedFloppy.tokenId === 10016 || this.selectedFloppy.tokenId === 10019 || this.selectedFloppy.tokenId === 1123 || (this.selectedFloppy.tokenId >= 15008 && this.selectedFloppy.tokenId <= 15015))) {
            throw new Error('This function is only available for Action Packs (10008, 10011, 10012, 10016, 10019, 1123, 15008-15015).');
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
     * Basado en executeOpenActionPack() del index.html original
     */
    async executeOpenActionPackTransaction(ethers) {
        try {
            // Get provider and signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // ActionPacks ABI completo
            const actionPacksABI = [
                'function openPack(uint256 packId) external',
                'function canOpenPack(address user, uint256 packId) view returns (bool canOpen, string reason)',
                'function packConfigs(uint256 packId) view returns (uint256 id, bool active)'
            ];

            // Create contract instance
            const contract = new ethers.Contract(
                window.TraitLABConfig.ACTION_PACKS_CONTRACT, 
                actionPacksABI, 
                signer
            );

            // Prepare parameters
            const packId = this.selectedFloppy.tokenId;

            console.log('Contract address:', window.TraitLABConfig.ACTION_PACKS_CONTRACT);
            console.log('Pack ID:', packId);

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

            // Wait for transaction confirmation
            const receipt = await tx.wait();
            
            console.log('Transaction confirmed:', receipt);

            // Emit success event
            this.emit('floppyOpened', { 
                tokenId: packId, 
                transactionHash: receipt.transactionHash,
                receipt 
            });

            return receipt;

        } catch (error) {
            console.error('Error opening action pack:', error);
            
            let errorMessage = 'Failed to open pack.';
            if (error.code === 4001) {
                errorMessage = 'Transaction was rejected by user.';
            } else if (error.message && error.message.includes('state histories haven\'t been fully indexed yet')) {
                errorMessage = '⏳ Network is still syncing. Please wait a few minutes and try again.';
            } else if (error.message && error.message.includes('CALL_EXCEPTION')) {
                errorMessage = '❌ Contract call failed. The pack may not be active or you may not be eligible.';
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Open Action Pack function específica para token 10007
     * Basado en openActionPack10007() del index.html original
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
     * Basado en executeOpenActionPack10007() del index.html original
     */
    async executeOpenActionPack10007Transaction(ethers) {
        try {
            // Get provider and signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // ActionPacks ABI para token 10007
            const actionPacksABI = [
                'function openPack(uint256 packId) external',
                'function canOpenPack(address user, uint256 packId) view returns (bool canOpen, string reason)',
                'function packConfigs(uint256 packId) view returns (uint256 id, bool active)'
            ];

            // Create contract instance
            const contract = new ethers.Contract(
                window.TraitLABConfig.ACTION_PACK_10007_CONTRACT, 
                actionPacksABI, 
                signer
            );

            // Prepare parameters
            const packId = this.selectedFloppy.tokenId;

            console.log('Contract address:', window.TraitLABConfig.ACTION_PACK_10007_CONTRACT);
            console.log('Pack ID:', packId);

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

            // Wait for transaction confirmation
            const receipt = await tx.wait();
            
            console.log('Transaction confirmed:', receipt);

            // Emit success event
            this.emit('floppyOpened', { 
                tokenId: packId, 
                transactionHash: receipt.transactionHash,
                receipt 
            });

            return receipt;

        } catch (error) {
            console.error('Error opening action pack 10007:', error);
            
            let errorMessage = 'Failed to open pack.';
            if (error.code === 4001) {
                errorMessage = 'Transaction was rejected by user.';
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Open floppy using blockchain contract
     * Función genérica para floppies que no son packs
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
     * Para floppies que no son packs (tokens 10000, 10001, 10002, 10005, 10006)
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
            const contractInfo = this.getContractForFloppy(this.selectedFloppy.tokenId);
            console.log('Contract info for floppy:', contractInfo);
            
            // For Open Floppy, we need to use the correct contract based on floppy type
            let contractAddress;
            
            // Check if this floppy should use Open Pack instead of Open Floppy
            if (contractInfo.type === 'pack') {
                throw new Error(`This floppy (${this.selectedFloppy.tokenId}) should use "Open Pack" instead of "Open Floppy". Please use the correct button.`);
            }
            
            // Use the contract determined by getContractForFloppy
            contractAddress = contractInfo.address;
            console.log('Using contract from getContractForFloppy:', contractAddress);
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
            const packId = this.selectedFloppy.tokenId;
            
            console.log('Confirming transaction in your wallet...');
            console.log('Pack ID:', packId);
            
            // Call openPack function
            const tx = await contractWithSigner.openPack(packId);
            
            console.log('Transaction sent:', tx.hash);
            
            // Wait for confirmation
            console.log('Transaction sent! Waiting for confirmation...');
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);
            
            // Emit success event
            this.emit('floppyOpened', { 
                packId, 
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
