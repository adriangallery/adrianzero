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
     * Check if token is a floppy usando PackConfig
     */
    isFloppyToken(tokenId) {
        return window.PackConfig.isFloppyToken(tokenId);
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
     * Determine which contract to use for a specific floppy usando PackConfig
     */
    getContractForFloppy(tokenId) {
        // Obtener configuración desde PackConfig (single source of truth)
        const config = window.PackConfig.getPackConfig(tokenId);

        if (!config) {
            // Fallback para packs sin configuración explícita
            return {
                address: window.TraitLABConfig.PACK_TOKEN_MINTER_CONTRACT,
                type: 'pack',
                name: 'PackTokenMinter'
            };
        }

        // Construir respuesta desde configuración
        return {
            address: window.TraitLABConfig[config.contract + '_CONTRACT'],
            type: 'pack',
            name: config.contract,
            function: config.method === 'openPacks' ? 'openPacks' : null
        };
    }

    /**
     * Wrapper para decidir qué método usar al abrir un pack usando PackConfig
     */
    async openSelectedPack() {
        if (!this.selectedFloppy) {
            throw new Error('Please select a pack first.');
        }

        const tokenId = parseInt(this.selectedFloppy.tokenId);
        console.log('openSelectedPack: tokenId =', tokenId);

        // Obtener info del contrato desde getContractForFloppy (que usa PackConfig)
        const contractInfo = this.getContractForFloppy(tokenId);
        const config = window.PackConfig.getPackConfig(tokenId);

        // Routing basado en el tipo de contrato
        if (contractInfo.function === 'openPacks') {
            console.log('→ openPackV4() for token', tokenId);
            return await this.openPackV4();
        } else if (config && config.contract === 'ACTION_PACK_10007') {
            console.log('→ openActionPack10007() for token', tokenId);
            return await this.openActionPack10007();
        } else if (config && (config.contract === 'ACTION_PACKS' || config.contract === 'ACTION_PACK_10007')) {
            console.log('→ openActionPack() for token', tokenId);
            return await this.openActionPack();
        } else if (contractInfo.type === 'floppy') {
            console.log('→ openFloppy() for token', tokenId);
            return await this.openFloppy();
        } else {
            console.log('→ openPack() for token', tokenId);
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
        const packId = this.selectedFloppy.tokenId;

        return await window.ContractUtils.executeContractTransaction({
            contractAddress: window.TraitLABConfig.OPENPACK_V4_CONTRACT,
            abi: window.TraitLABConfig.CONTRACT_ABIS.OPENPACK_V4,
            methodName: 'openPacks',
            methodParams: [packId, quantity],
            onSuccess: (receipt) => {
                this.emit('floppyOpened', {
                    tokenId: packId,
                    quantity: quantity,
                    transactionHash: receipt.transactionHash,
                    receipt
                });
            }
        });
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
        const packId = this.selectedFloppy.tokenId;

        return await window.ContractUtils.executeContractTransaction({
            contractAddress: window.TraitLABConfig.PACK_TOKEN_MINTER_CONTRACT,
            abi: window.TraitLABConfig.CONTRACT_ABIS.PACK_TOKEN_MINTER,
            methodName: 'openPack',
            methodParams: [packId],
            onSuccess: (receipt) => {
                this.emit('floppyOpened', {
                    tokenId: packId,
                    transactionHash: receipt.transactionHash,
                    receipt
                });
            }
        });
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
        const packId = this.selectedFloppy.tokenId;

        return await window.ContractUtils.executeContractTransaction({
            contractAddress: window.TraitLABConfig.ACTION_PACKS_CONTRACT,
            abi: window.TraitLABConfig.CONTRACT_ABIS.ACTION_PACKS,
            methodName: 'openPack',
            methodParams: [packId],
            validateBefore: (contract, signer) => {
                return window.ContractUtils.validateActionPack(contract, signer, packId);
            },
            onSuccess: (receipt) => {
                this.emit('floppyOpened', {
                    tokenId: packId,
                    transactionHash: receipt.transactionHash,
                    receipt
                });
            }
        });
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
        const packId = this.selectedFloppy.tokenId;

        return await window.ContractUtils.executeContractTransaction({
            contractAddress: window.TraitLABConfig.ACTION_PACK_10007_CONTRACT,
            abi: window.TraitLABConfig.CONTRACT_ABIS.ACTION_PACKS,
            methodName: 'openPack',
            methodParams: [packId],
            validateBefore: (contract, signer) => {
                return window.ContractUtils.validateActionPack(contract, signer, packId);
            },
            onSuccess: (receipt) => {
                this.emit('floppyOpened', {
                    tokenId: packId,
                    transactionHash: receipt.transactionHash,
                    receipt
                });
            }
        });
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
        // Network validation
        const ethersLib = await window.ContractUtils.loadEthers();
        const provider = new ethersLib.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();

        console.log('Current network:', network);
        if (network.chainId !== 8453) { // Base mainnet
            throw new Error('Please switch to Base network to use this feature.');
        }

        // Determine which contract to use based on floppy type
        const contractInfo = this.getContractForFloppy(this.selectedFloppy.tokenId);
        console.log('Contract info for floppy:', contractInfo);

        // Check if this floppy should use Open Pack instead of Open Floppy
        if (contractInfo.type === 'pack') {
            throw new Error(`This floppy (${this.selectedFloppy.tokenId}) should use "Open Pack" instead of "Open Floppy". Please use the correct button.`);
        }

        // Check if contract exists
        const code = await provider.getCode(contractInfo.address);
        if (code === '0x') {
            throw new Error('Contract not found at specified address');
        }

        const packId = this.selectedFloppy.tokenId;

        return await window.ContractUtils.executeContractTransaction({
            contractAddress: contractInfo.address,
            abi: window.TraitLABConfig.CONTRACT_ABIS.FLOPPY_DISCS,
            methodName: 'openPack',
            methodParams: [packId],
            onSuccess: (receipt) => {
                this.emit('floppyOpened', {
                    packId,
                    transactionHash: receipt.transactionHash,
                    receipt
                });
            }
        });
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
