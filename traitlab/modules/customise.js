/**
 * TRAITLAB - Módulo de Customise
 * Combina funcionalidades de RENAME y ZOOM IN (closeup/shadow toggles)
 */

class CustomiseManager {
    constructor() {
        this.selectedERC721 = null;
        this.isCloseupMode = false;
        this.isShadowMode = false;
        this.isGlowMode = false;
        this.isBnMode = false;
        this.eventListeners = new Map();
        
        // Bind methods
        this.toggleCloseup = this.toggleCloseup.bind(this);
        this.toggleShadow = this.toggleShadow.bind(this);
        this.toggleGlow = this.toggleGlow.bind(this);
        this.toggleBn = this.toggleBn.bind(this);
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
        this.isGlowMode = false;
        this.isBnMode = false;
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
     * Toggle glow mode
     */
    toggleGlow() {
        if (!this.selectedERC721) {
            console.warn('⚠️ CustomiseManager: No hay AdrianZERO seleccionado para glow');
            return;
        }

        this.isGlowMode = !this.isGlowMode;
        console.log('✨ CustomiseManager: Glow mode:', this.isGlowMode ? 'ON' : 'OFF');
        
        // Actualizar imagen si hay sticky popup manager
        if (window.app?.stickyPopupManager) {
            window.app.stickyPopupManager.updateCustomiseImage();
        }
        
        this.emit('glowToggled', { isGlow: this.isGlowMode });
    }

    /**
     * Toggle black and white mode
     */
    toggleBn() {
        if (!this.selectedERC721) {
            console.warn('⚠️ CustomiseManager: No hay AdrianZERO seleccionado para BN');
            return;
        }

        this.isBnMode = !this.isBnMode;
        console.log('⚫⚪ CustomiseManager: BN mode:', this.isBnMode ? 'ON' : 'OFF');
        
        // Actualizar imagen si hay sticky popup manager
        if (window.app?.stickyPopupManager) {
            window.app.stickyPopupManager.updateCustomiseImage();
        }
        
        this.emit('bnToggled', { isBn: this.isBnMode });
    }

    /**
     * Get image URL with toggles applied
     * Usa URLs combinadas según los IDs de toggle combinados
     */
    getImageUrl(tokenId) {
        let baseUrl = `https://adrianlab.vercel.app/api/render/${tokenId}.png`;
        const params = [];
        
        // Determinar si usar URL combinada o individual
        // Combinaciones específicas con IDs combinados:
        
        // ID 10: glow+bn+closeup
        if (this.isGlowMode && this.isBnMode && this.isCloseupMode && !this.isShadowMode) {
            params.push('closeup=true', 'glow=true', 'bn=true');
        }
        // ID 9: glow+bn
        else if (this.isGlowMode && this.isBnMode && !this.isCloseupMode && !this.isShadowMode) {
            params.push('glow=true', 'bn=true');
        }
        // ID 8: glow+closeup
        else if (this.isGlowMode && this.isCloseupMode && !this.isBnMode && !this.isShadowMode) {
            params.push('closeup=true', 'glow=true');
        }
        // ID 7: shadow+closeup
        else if (this.isShadowMode && this.isCloseupMode && !this.isGlowMode && !this.isBnMode) {
            params.push('closeup=true', 'shadow=true');
        }
        // ID 6: bn+shadow+closeup
        else if (this.isBnMode && this.isShadowMode && this.isCloseupMode && !this.isGlowMode) {
            params.push('closeup=true', 'bn=true', 'shadow=true');
        }
        // ID 5: bn+shadow
        else if (this.isBnMode && this.isShadowMode && !this.isCloseupMode && !this.isGlowMode) {
            params.push('bn=true', 'shadow=true');
        }
        // Toggles individuales (IDs 1-4)
        else {
            if (this.isCloseupMode) {
                params.push('closeup=true');
            }
            
            if (this.isShadowMode) {
                params.push('shadow=true');
            }
            
            if (this.isGlowMode) {
                params.push('glow=true');
            }
            
            if (this.isBnMode) {
                params.push('bn=true');
            }
        }
        
        if (params.length > 0) {
            baseUrl += '?' + params.join('&');
        }
        
        return baseUrl;
    }
    
    /**
     * Determinar el toggleId combinado basado en los toggles activos
     * Retorna el ID combinado si existe, o null si hay que usar IDs individuales
     */
    getCombinedToggleId() {
        // ID 10: glow+bn+closeup (sin shadow)
        if (this.isGlowMode && this.isBnMode && this.isCloseupMode && !this.isShadowMode) {
            return 10;
        }
        // ID 9: glow+bn (sin closeup, sin shadow)
        else if (this.isGlowMode && this.isBnMode && !this.isCloseupMode && !this.isShadowMode) {
            return 9;
        }
        // ID 8: glow+closeup (sin bn, sin shadow)
        else if (this.isGlowMode && this.isCloseupMode && !this.isBnMode && !this.isShadowMode) {
            return 8;
        }
        // ID 7: shadow+closeup (sin glow, sin bn)
        else if (this.isShadowMode && this.isCloseupMode && !this.isGlowMode && !this.isBnMode) {
            return 7;
        }
        // ID 6: bn+shadow+closeup (sin glow)
        else if (this.isBnMode && this.isShadowMode && this.isCloseupMode && !this.isGlowMode) {
            return 6;
        }
        // ID 5: bn+shadow (sin closeup, sin glow)
        else if (this.isBnMode && this.isShadowMode && !this.isCloseupMode && !this.isGlowMode) {
            return 5;
        }
        // No hay combinación específica, retornar null para usar IDs individuales
        return null;
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
                        this.approveAndCommit(ethers).then(resolve).catch(reject);
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load ethers library. Please refresh the page.'));
                    };
                    document.head.appendChild(script);
                });
            } else {
                ethers = window.ethers;
                return await this.approveAndCommit(ethers);
            }
        } catch (error) {
            console.error('Error in commit:', error);
            throw error;
        }
    }

    /**
     * Approve ADRIAN tokens and execute commit
     */
    async approveAndCommit(ethers) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const userAddress = await signer.getAddress();

            // Verificar red
            const network = await provider.getNetwork();
            if (network.chainId !== 8453) {
                throw new Error('Please switch to Base network to use this feature.');
            }

            // Cargar ABI del contrato de toggles
            const response = await fetch('./zoom-toggle-abi.json');
            if (!response.ok) {
                throw new Error('Failed to load contract ABI');
            }
            const contractABI = await response.json();

            const toggleContract = new ethers.Contract(
                window.TraitLABConfig.ZOOM_TOGGLE_CONTRACT,
                contractABI,
                signer
            );

            // Obtener precio del toggle
            // Primero verificar si hay un toggle combinado, si no usar el precio máximo de los individuales
            let togglePrice = ethers.BigNumber.from(0);
            if (this.isCloseupMode || this.isShadowMode || this.isGlowMode || this.isBnMode) {
                try {
                    // Verificar si hay combinación y obtener su precio
                    const combinedToggleId = this.getCombinedToggleId();
                    if (combinedToggleId !== null) {
                        // Usar precio del toggle combinado
                        togglePrice = await toggleContract.getTogglePrice(combinedToggleId);
                        console.log(`💰 Toggle price (combinado ID=${combinedToggleId}):`, ethers.utils.formatEther(togglePrice));
                    } else {
                        // Usar precio máximo entre los toggles individuales activos
                        const priceCloseup = this.isCloseupMode ? await toggleContract.getTogglePrice(1) : ethers.BigNumber.from(0);
                        const priceShadow = this.isShadowMode ? await toggleContract.getTogglePrice(2) : ethers.BigNumber.from(0);
                        const priceGlow = this.isGlowMode ? await toggleContract.getTogglePrice(3) : ethers.BigNumber.from(0);
                        const priceBn = this.isBnMode ? await toggleContract.getTogglePrice(4) : ethers.BigNumber.from(0);
                        togglePrice = priceCloseup.gt(priceShadow) ? priceCloseup : priceShadow;
                        togglePrice = togglePrice.gt(priceGlow) ? togglePrice : priceGlow;
                        togglePrice = togglePrice.gt(priceBn) ? togglePrice : priceBn;
                        console.log('💰 Toggle price (individual):', ethers.utils.formatEther(togglePrice));
                    }
                } catch (error) {
                    console.warn('⚠️ Could not get toggle price, assuming approval needed:', error.message);
                    // Si no podemos obtener el precio, usar un monto alto para asegurar suficiente allowance
                    togglePrice = ethers.utils.parseEther('1000'); // 1000 ADRIAN como máximo
                }
            }

            // Si hay precio, verificar y aprobar ADRIAN tokens
            if (togglePrice.gt(0)) {
                // ERC20 ABI mínimo para approve y allowance
                const erc20ABI = [
                    "function approve(address spender, uint256 amount) external returns (bool)",
                    "function allowance(address owner, address spender) external view returns (uint256)"
                ];

                const adrianTokenContract = new ethers.Contract(
                    window.TraitLABConfig.ADRIAN_TOKEN,
                    erc20ABI,
                    signer
                );

                // Verificar allowance actual
                let currentAllowance;
                try {
                    currentAllowance = await adrianTokenContract.allowance(
                        userAddress,
                        window.TraitLABConfig.ZOOM_TOGGLE_CONTRACT
                    );
                } catch (error) {
                    console.warn('⚠️ Cannot check allowance (RPC may have issues), proceeding with approval:', error.message);
                    currentAllowance = ethers.BigNumber.from(0);
                }

                console.log('Current allowance:', ethers.utils.formatEther(currentAllowance));
                console.log('Required amount:', ethers.utils.formatEther(togglePrice));

                // Si no hay suficiente allowance, aprobar
                if (currentAllowance.lt(togglePrice)) {
                    console.log('💳 Approving ADRIAN tokens for toggle contract...');
                    // Aprobar un monto mayor para evitar múltiples aprobaciones
                    const approveAmount = ethers.utils.parseEther('10000'); // 10k ADRIAN
                    const approveTx = await adrianTokenContract.approve(
                        window.TraitLABConfig.ZOOM_TOGGLE_CONTRACT,
                        approveAmount
                    );
                    console.log('⏳ Waiting for approval transaction...');
                    await approveTx.wait();
                    console.log('✅ ADRIAN tokens approved for toggle contract');
                } else {
                    console.log('✅ Sufficient allowance already exists');
                }
            }

            // Ejecutar commit después del approve
            return await this.executeCommit(ethers);
        } catch (error) {
            console.error('Error in approveAndCommit:', error);
            throw error;
        }
    }

    /**
     * Execute commit transaction
     * Usa IDs combinados (5-10) cuando corresponda, o IDs individuales (1-4)
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

            // Verificar si hay combinación específica
            const combinedToggleId = this.getCombinedToggleId();
            
            if (this.isCloseupMode === false && this.isShadowMode === false && 
                this.isGlowMode === false && this.isBnMode === false) {
                // Todos desactivados: enviar toggleId 0 para desactivar todo
                console.log('💾 CustomiseManager: Todos los toggles desactivados, enviando toggleId 0');
                const tx = await contract.setToggle(tokenId, 0);
                const receipt = await tx.wait();
                receipts.push({ toggleId: 0, receipt });
                console.log('✅ CustomiseManager: Todos los toggles desactivados');
            } else if (combinedToggleId !== null) {
                // Usar ID combinado
                const toggleNames = {
                    5: 'BN+Shadow',
                    6: 'BN+Shadow+Closeup',
                    7: 'Shadow+Closeup',
                    8: 'Glow+Closeup',
                    9: 'Glow+BN',
                    10: 'Glow+BN+Closeup'
                };
                const toggleName = toggleNames[combinedToggleId] || `Combined (ID=${combinedToggleId})`;
                console.log(`💾 CustomiseManager: Commiteando toggle combinado ${toggleName} (ID=${combinedToggleId})`);
                const tx = await contract.setToggle(tokenId, combinedToggleId);
                const receipt = await tx.wait();
                receipts.push({ toggleId: combinedToggleId, receipt });
                console.log(`✅ CustomiseManager: ${toggleName} toggle commiteado`);
            } else {
                // Usar IDs individuales en orden descendente (4, 3, 2, 1)
                const activeToggles = [];
                if (this.isBnMode) activeToggles.push(4);
                if (this.isGlowMode) activeToggles.push(3);
                if (this.isShadowMode) activeToggles.push(2);
                if (this.isCloseupMode) activeToggles.push(1);
                
                for (const toggleId of activeToggles) {
                    const toggleName = toggleId === 4 ? 'BN' : toggleId === 3 ? 'Glow' : toggleId === 2 ? 'Shadow' : 'Closeup';
                    console.log(`💾 CustomiseManager: Commiteando ${toggleName} toggle (ID=${toggleId})`);
                    const tx = await contract.setToggle(tokenId, toggleId);
                    const receipt = await tx.wait();
                    receipts.push({ toggleId, receipt });
                    console.log(`✅ CustomiseManager: ${toggleName} toggle commiteado`);
                }
            }

            const toggleIdsSent = receipts.map(r => r.toggleId);
            console.log('💾 CustomiseManager: Ejecutando commit:', {
                tokenId,
                isCloseupMode: this.isCloseupMode,
                isShadowMode: this.isShadowMode,
                isGlowMode: this.isGlowMode,
                isBnMode: this.isBnMode,
                combinedToggleId: combinedToggleId,
                toggleIdsSent: toggleIdsSent
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

