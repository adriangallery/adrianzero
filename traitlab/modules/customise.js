/**
 * TRAITLAB - Módulo de Customise
 * Combina funcionalidades de RENAME y ZOOM IN (closeup/shadow toggles)
 */

class CustomiseManager {
    constructor() {
        this.selectedERC721 = null;
        this.isCloseupMode = false;
        this.isShadowMode = false;
        this.eventListeners = new Map();
        
        // Bind methods
        this.toggleCloseup = this.toggleCloseup.bind(this);
        this.toggleShadow = this.toggleShadow.bind(this);
        this.commit = this.commit.bind(this);
        this.approveRename = this.approveRename.bind(this);
        this.renameToken = this.renameToken.bind(this);
        this.setSelectedERC721 = this.setSelectedERC721.bind(this);
        this.getSelectedERC721 = this.getSelectedERC721.bind(this);
        this.clearSelection = this.clearSelection.bind(this);
    }

    /**
     * Initialize customise manager
     */
    init() {
        console.log('🎨 CustomiseManager inicializado');
    }

    /**
     * Set selected ERC721 token
     */
    setSelectedERC721(token) {
        this.selectedERC721 = token;
        this.emit('tokenSelected', { token });
    }

    /**
     * Get selected ERC721 token
     */
    getSelectedERC721() {
        return this.selectedERC721;
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.selectedERC721 = null;
        this.isCloseupMode = false;
        this.isShadowMode = false;
    }

    /**
     * Toggle closeup mode
     */
    toggleCloseup() {
        if (!this.selectedERC721) {
            console.warn('⚠️ CustomiseManager: No hay AdrianZERO seleccionado para zoom');
            return;
        }

        this.isCloseupMode = !this.isCloseupMode;
        console.log('🔍 CustomiseManager: Closeup mode:', this.isCloseupMode ? 'ON' : 'OFF');
        
        // Actualizar imagen si hay sticky popup manager
        if (window.app?.stickyPopupManager) {
            window.app.stickyPopupManager.updateCustomiseImage();
        }
        
        this.emit('closeupToggled', { isCloseup: this.isCloseupMode });
    }

    /**
     * Toggle shadow mode
     */
    toggleShadow() {
        if (!this.selectedERC721) {
            console.warn('⚠️ CustomiseManager: No hay AdrianZERO seleccionado para shadow');
            return;
        }

        this.isShadowMode = !this.isShadowMode;
        console.log('🌑 CustomiseManager: Shadow mode:', this.isShadowMode ? 'ON' : 'OFF');
        
        // Actualizar imagen si hay sticky popup manager
        if (window.app?.stickyPopupManager) {
            window.app.stickyPopupManager.updateCustomiseImage();
        }
        
        this.emit('shadowToggled', { isShadow: this.isShadowMode });
    }

    /**
     * Get image URL with toggles applied
     */
    getImageUrl(tokenId) {
        let baseUrl = `https://adrianlab.vercel.app/api/render/${tokenId}.png`;
        const params = [];
        
        if (this.isCloseupMode) {
            params.push('closeup=true');
        }
        
        if (this.isShadowMode) {
            params.push('shadow=true');
        }
        
        if (params.length > 0) {
            baseUrl += '?' + params.join('&');
        }
        
        return baseUrl;
    }

    /**
     * Commit closeup toggle to blockchain (shadow es solo visual/URL)
     */
    async commit() {
        if (!this.selectedERC721) {
            console.warn('⚠️ CustomiseManager: No hay AdrianZERO seleccionado para commit');
            return;
        }

        if (!window.TraitLABWallet || !window.TraitLABWallet.isWalletConnected()) {
            throw new Error('Please connect your wallet first.');
        }

        try {
            // Load ethers dynamically if needed
            let ethers;
            if (typeof window.ethers === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        ethers = window.ethers;
                        this.executeCommit(ethers).then(resolve).catch(reject);
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load ethers library. Please refresh the page.'));
                    };
                    document.head.appendChild(script);
                });
            } else {
                ethers = window.ethers;
                return await this.executeCommit(ethers);
            }
        } catch (error) {
            console.error('Error in commit:', error);
            throw error;
        }
    }

    /**
     * Execute commit transaction (closeup ID=1, shadow ID=2)
     */
    async executeCommit(ethers) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Verificar red
            const network = await provider.getNetwork();
            if (network.chainId !== 8453) {
                throw new Error('Please switch to Base network to use this feature.');
            }

            // ZOOM_TOGGLE_CONTRACT ABI - cargar desde archivo local (mismo path que sticky-popup-manager)
            const response = await fetch('./zoom-toggle-abi.json');
            if (!response.ok) {
                throw new Error('Failed to load contract ABI');
            }
            const contractABI = await response.json();

            const contract = new ethers.Contract(
                window.TraitLABConfig.ZOOM_TOGGLE_CONTRACT,
                contractABI,
                signer
            );

            const tokenId = this.selectedERC721.tokenId;
            const receipts = [];

            // Commit closeup toggle (ID=1)
            if (this.isCloseupMode) {
                console.log('💾 CustomiseManager: Commiteando closeup toggle (ID=1)');
                const txCloseup = await contract.setToggle(tokenId, 1);
                const receiptCloseup = await txCloseup.wait();
                receipts.push({ toggleId: 1, receipt: receiptCloseup });
                console.log('✅ CustomiseManager: Closeup toggle commiteado');
            } else {
                // Si closeup está OFF, necesitamos desactivarlo (toggleId = 0)
                console.log('💾 CustomiseManager: Desactivando closeup toggle (ID=1 -> 0)');
                const txCloseup = await contract.setToggle(tokenId, 0);
                const receiptCloseup = await txCloseup.wait();
                receipts.push({ toggleId: 0, receipt: receiptCloseup });
                console.log('✅ CustomiseManager: Closeup toggle desactivado');
            }

            // Commit shadow toggle (ID=2)
            if (this.isShadowMode) {
                console.log('💾 CustomiseManager: Commiteando shadow toggle (ID=2)');
                const txShadow = await contract.setToggle(tokenId, 2);
                const receiptShadow = await txShadow.wait();
                receipts.push({ toggleId: 2, receipt: receiptShadow });
                console.log('✅ CustomiseManager: Shadow toggle commiteado');
            } else {
                // Si shadow está OFF, necesitamos desactivarlo (pero primero verificar si estaba activo)
                // Por ahora, si shadow está OFF, no hacemos nada para evitar desactivar si nunca estuvo activo
                // TODO: Verificar estado actual del toggle antes de desactivar si es necesario
                console.log('💾 CustomiseManager: Shadow toggle está OFF (no se commitea)');
            }

            console.log('💾 CustomiseManager: Ejecutando commit:', {
                tokenId,
                isCloseupMode: this.isCloseupMode,
                isShadowMode: this.isShadowMode,
                toggleIds: [this.isCloseupMode ? 1 : null, this.isShadowMode ? 2 : null].filter(x => x !== null)
            });

            this.emit('commitCompleted', { tokenId, receipts });

            return receipts[0]?.receipt || receipts[receipts.length - 1]?.receipt;
        } catch (error) {
            console.error('Error in commit transaction:', error);
            throw error;
        }
    }

    /**
     * Approve $ADRIAN tokens for rename
     */
    async approveRename() {
        if (!window.app?.modules?.zero) {
            throw new Error('Zero module not available');
        }

        // Sincronizar selectedERC721 con zero module
        if (this.selectedERC721 && window.app.modules.zero.setSelectedERC721) {
            window.app.modules.zero.setSelectedERC721(this.selectedERC721);
        }

        return await window.app.modules.zero.approveRename();
    }

    /**
     * Rename token
     */
    async renameToken(newName) {
        if (!window.app?.modules?.zero) {
            throw new Error('Zero module not available');
        }

        if (!newName || !newName.trim()) {
            throw new Error('Please provide a name for the token');
        }

        // Sincronizar selectedERC721 con zero module
        if (this.selectedERC721 && window.app.modules.zero.setSelectedERC721) {
            window.app.modules.zero.setSelectedERC721(this.selectedERC721);
        }

        return await window.app.modules.zero.renameToken(newName);
    }

    /**
     * Event system
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
    window.TraitLABCustomise = CustomiseManager;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomiseManager;
}

