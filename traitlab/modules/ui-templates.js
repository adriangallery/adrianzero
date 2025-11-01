/**
 * UI Templates
 * Maneja los templates HTML de la interfaz de TraitLAB v2
 */
class UITemplates {
    constructor() {}

    /**
     * Obtener template del menú de navegación
     */
    getMenuTemplate() {
        return `
            <div id="menu-container">
                <nav class="navbar">
                    <div class="container-fluid">
                        <div class="d-flex align-items-center">
                            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                                <span class="navbar-toggler-icon"></span>
                            </button>
                            <span class="navbar-text token-symbol ms-2">$ADRIAN</span>
                        </div>
                        
                        <div class="d-flex align-items-center">
                            <!-- Espacio reservado para futuras funcionalidades -->
                        </div>

                        <div class="collapse navbar-collapse" id="navbarNav">
                            <ul class="navbar-nav me-auto">
                                <li class="nav-item">
                                    <a class="nav-link" href="https://adrianzero.com">Home</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="https://app.uniswap.org/swap?chain=base&inputCurrency=ETH&outputCurrency=0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea" target="_blank">Buy $ADRIAN</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="https://adrianzero.com/mintwithadrian">Mint with $ADRIAN</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="https://adrianzero.com/roadmaps">Roadmap</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="https://adrianzero.com/traitlab">TraitLAB</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="https://adrianzero.com/ogclaim">OG Claim</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="https://adrianzero.com/">Adventure</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="https://adrianzero.com/shop">TraitSHOP</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="https://adrianzero.com/traitcreator">T-Shit Studio</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="https://adrianzero.com/patientzero">PatientZERO</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="https://adriangallery.com">AdrianGALLERY</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="https://adrianpunks.com">AdrianPUNKS</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="https://discord.gg/ZtyBkXGtwd" target="_blank">DISCORD</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="https://x.com/adriancerda" target="_blank">X</a>
                                </li>
                            </ul>
                        </div>

                        <div class="d-none d-lg-flex align-items-center ms-auto desktop-wallet-section">
                            <!-- Botón de wallet quitado pero dejando el espacio -->
                        </div>
                    </div>
                </nav>
            </div>
        `;
    }

    /**
     * Obtener template del header
     */
    getHeaderTemplate() {
        return `
            <div class="header">
                <h1>
                    <span class="trait">TRAIT</span><span class="lab">LAB</span>
                </h1>
                <div class="subtitle">by HalfXTiger</div>
            </div>
        `;
    }

    /**
     * Obtener template de la sección de wallet
     */
    getWalletSectionTemplate() {
        return `
            <div class="wallet-section">
                <div id="connect-section" class="connect-section">
                    <button id="connectBtn" class="connect-btn">Connect Wallet</button>
                </div>
                <div id="account-section" class="account-section" style="display: none;">
                    <div class="wallet-info">
                        <div>
                            <strong>Connected Wallet:</strong>
                            <span id="walletAddress" class="wallet-address"></span>
                        </div>
                        <button id="disconnectBtn" class="disconnect-btn">Disconnect</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Obtener template de la sección de tokens
     */
    getTokensSectionTemplate() {
        return `
            <div id="tokens-section" class="tokens-section" style="display: none;">
                <h2 class="section-title">Your Tokens</h2>
                
                <div class="contract-filter">
                    <button class="contract-btn active" data-contract="0x6e369bf0e4e0c106192d606fb6d85836d684da75" data-filter="adrianzero">AdrianZERO</button>
                    <button class="contract-btn" data-contract="0x90546848474fb3c9fda3fdad887969bb244e7e58" data-filter="traits">Traits</button>
                    <button class="contract-btn" data-contract="0x90546848474fb3c9fda3fdad887969bb244e7e58" data-filter="floppy">Packs</button>
                    <button class="contract-btn" data-contract="0x90546848474fb3c9fda3fdad887969bb244e7e58" data-filter="serum">Serum</button>
                    <button class="contract-btn" data-contract="0x90546848474fb3c9fda3fdad887969bb244e7e58" data-filter="crafting">Crafting</button>
                    <button class="contract-btn" data-contract="0x6e369bf0e4e0c106192d606fb6d85836d684da75" data-filter="customise">Customise</button>
                    <button class="contract-btn" data-contract="0x6e369bf0e4e0c106192d606fb6d85836d684da75" data-filter="lambo">Lambo</button>
                </div>
                
                <div id="tokens-grid" class="tokens-grid"></div>
                
                <!-- Loading element removed - using background loading message instead -->
                
                <div id="error" class="error" style="display: none;"></div>
                <div id="success" class="success" style="display: none;"></div>
            </div>
        `;
    }

    /**
     * Obtener template de la información de selección
     */
    getSelectionInfoTemplate() {
        return `
            <!-- MODAL PRINCIPAL CON DOS POPUPS LADO A LADO -->
            <div id="selection-info" class="sticky-modal-container" style="display: none;">
                <!-- POPUP IZQUIERDO: Menú lateral -->
                <div class="sticky-side-menu-popup">
                    <div class="side-emoji-menu">
                        <button class="contract-btn active" data-filter="adrianzero">🧑‍🔬</button>
                        <button class="contract-btn" data-filter="traits">🎭</button>
                        <button class="contract-btn" data-filter="floppy">📦</button>
                        <button class="contract-btn" data-filter="serum">🧪</button>
                        <button class="contract-btn" data-filter="crafting">⚒️</button>
                        <button class="contract-btn" data-filter="customise">✍️</button>
                        <button class="contract-btn" data-filter="lambo">🚗</button>
                    </div>
                </div>
                
                <!-- POPUP DERECHO: Contenido principal -->
                <div class="sticky-content-popup">
                    <!-- Sección de texto -->
                    <div id="selection-text" class="sticky-text"></div>
                    
                    <!-- Sección de imagen (con espacio fijo) -->
                    <div id="generated-image" class="sticky-image">
                        <img id="combined-image" src="" alt="Generated Image">
                        <!-- Loading overlay con posición absoluta para no mover elementos -->
                        <div id="image-loading-overlay" class="sticky-loading-overlay">
                            <div class="pixelated-spinner"></div>
                            <p>Generating image...</p>
                        </div>
                    </div>
                    
                    <!-- Sección de acciones (con espacio fijo) -->
                    <div class="sticky-actions">
                        <!-- ERC721 Actions -->
                        <div id="erc721-actions-section" class="action-section" style="display: none;">
                            <button id="activateTokenBtn" class="action-btn">Assign SKIN</button>
                            <button id="showRenameSectionBtn" class="action-btn">Rename Token</button>
                            <div class="zoom-commit-buttons">
                                <button id="zoomInBtn" class="action-btn zoom-btn">🔍 Zoom in</button>
                                <button id="commitBtn" class="action-btn commit-btn">Commit</button>
                            </div>
                            <div id="commit-status" class="apply-status" style="display: none;"></div>
                        </div>
                        
                        <!-- Traits Actions -->
                        <div id="traits-actions-section" class="action-section" style="display: none;">
                            <button id="applyTraitsBtn" class="action-btn">Apply Traits</button>
                        </div>
                        
                        <!-- Use Serum -->
                        <div id="use-serum-section" class="action-section" style="display: none;">
                            <button id="useSerumBtn" class="action-btn">🧪 Drink Serum</button>
                            <div id="use-serum-status" class="apply-status" style="display: none;"></div>
                        </div>
                        
                        <!-- Open Floppy -->
                        <div id="open-floppy-section" class="action-section" style="display: none;">
                            <button id="openFloppyBtn" class="action-btn">Open Floppy</button>
                            <div id="open-floppy-status" class="apply-status" style="display: none;"></div>
                        </div>
                        
                        <!-- Open Pack -->
                        <div id="open-pack-section" class="action-section" style="display: none;">
                            <button id="openPackBtn" class="action-btn">Open Pack</button>
                            <div style="margin-top: 15px; display: flex; gap: 10px; align-items: stretch;">
                                <input type="number" id="pack-quantity" min="1" max="4" value="1" style="flex: 0 0 auto; width: 80px; padding: 10px; border: 2px solid #333; border-radius: 5px; background: rgba(255, 255, 255, 0.1); color: #fff; font-size: 14px; text-align: center; font-weight: bold; cursor: pointer; -moz-appearance: textfield;">
                                <button id="openMultiplePacksBtn" class="action-btn" style="flex: 1 1 auto; margin: 0;">Open x Packs</button>
                            </div>
                            <style>
                                #pack-quantity::-webkit-inner-spin-button,
                                #pack-quantity::-webkit-outer-spin-button {
                                    -webkit-appearance: none;
                                    margin: 0;
                                }
                                #pack-quantity:hover {
                                    background: rgba(255, 255, 255, 0.15);
                                }
                                #pack-quantity:focus {
                                    outline: none;
                                    border-color: #00ff00;
                                }
                            </style>
                            <div id="open-pack-status" class="apply-status" style="display: none;"></div>
                        </div>
                        
                        <!-- Activate Token -->
                        <div id="activate-token-section" class="action-section" style="display: none;">
                            <button id="activateTokenBtn" class="action-btn">Asignar SKIN</button>
                            <div id="activate-token-status" class="apply-status" style="display: none;"></div>
                        </div>
                        
                        <!-- Apply Traits Section -->
                        <div id="apply-traits-section" class="action-section" style="display: none;">
                            <div id="apply-status" class="apply-status" style="display: none;"></div>
                        </div>
                        
                        <!-- Refresh Metadata Section -->
                        <div id="refresh-metadata-section" class="action-section" style="display: none;">
                            <button id="refreshMetadataBtn" class="action-btn">Refresh Metadata</button>
                            <div id="open-pack-status" class="apply-status" style="display: none;"></div>
                        </div>
                        
                        <!-- Rename Section -->
                        <div id="rename-section" class="action-section" style="display: none;">
                            <div style="margin-bottom: 8px;">
                                <input type="text" id="newTokenName" placeholder="Ingresa el nuevo nombre para tu AdrianZERO" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; font-size: 14px;">
                            </div>
                            <button id="approveRenameBtn" class="action-btn" style="margin-right: 10px;">Approve $ADRIAN</button>
                            <button id="renameTokenBtn" class="action-btn">Rename Token</button>
                            <div id="rename-status" class="apply-status" style="display: none;"></div>
                        </div>
                        
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Obtener template del modal de Lambo
     */
    getLamboModalTemplate() {
        return `
            <!-- Modal específico para Lambo -->
            <div id="lambo-modal" class="lambo-modal" style="display: none;">
                <div class="lambo-modal-content">
                    <div class="lambo-modal-header">
                        <h3>🚗 Select your AdrianZERO + Lambo Color</h3>
                        <button class="lambo-modal-close">&times;</button>
                    </div>
                    
                    <div class="lambo-modal-body">
                        <div class="selected-token-info">
                            <strong>Selected AdrianZERO:</strong> <span id="lambo-selected-token">None</span>
                        </div>
                        
                        <div class="lambo-color-grid">
                            <!-- Color buttons will be generated dynamically -->
                        </div>
                        
                        <div class="lambo-preview">
                            <img id="lambo-preview-image" src="" alt="Lambo Preview" style="display: none;">
                            <div id="lambo-loading" class="lambo-loading" style="display: none;">
                                <div class="pixelated-spinner"></div>
                                <p>Generating Lambo image...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Obtener template del modal de Customise
     */
    getCustomiseModalTemplate() {
        return `
            <!-- Modal específico para Customise -->
            <div id="customise-modal" class="customise-modal" style="display: none;">
                <div class="customise-modal-content">
                    <div class="customise-modal-header">
                        <h3>🎨 Customise your AdrianZERO</h3>
                        <button class="customise-modal-close">&times;</button>
                    </div>
                    
                    <div class="customise-modal-body">
                        <div class="selected-token-info">
                            <strong>Selected AdrianZERO:</strong> <span id="customise-selected-token">None</span>
                        </div>
                        
                        <!-- Preview Image -->
                        <div class="customise-preview">
                            <img id="customise-preview-image" src="" alt="Customise Preview">
                            <div id="customise-loading" class="customise-loading" style="display: none;">
                                <div class="pixelated-spinner"></div>
                                <p>Loading image...</p>
                            </div>
                        </div>
                        
                        <!-- Toggles Section -->
                        <div class="customise-toggles">
                            <h4>Visual Options</h4>
                            <div class="toggle-buttons">
                                <button type="button" id="customise-zoomBtn" class="action-btn zoom-btn">🔍 Zoom in</button>
                                <button type="button" id="customise-shadowBtn" class="action-btn">🌑 Shadow OFF</button>
                                <button type="button" id="customise-commitBtn" class="action-btn commit-btn">Commit Toggles</button>
                            </div>
                            <div id="customise-commit-status" class="apply-status" style="display: none;"></div>
                        </div>
                        
                        <!-- Rename Section -->
                        <div class="customise-rename">
                            <h4>Rename Token</h4>
                            <div class="rename-input">
                                <input type="text" id="customise-newTokenName" placeholder="Enter a new name for your AdrianZERO" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; font-size: 14px;">
                            </div>
                            <div class="rename-buttons">
                                <button type="button" id="customise-renameTokenBtn" class="action-btn">Rename Token</button>
                            </div>
                            <div id="customise-rename-status" class="apply-status" style="display: none;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar todos los templates en el contenedor
     */
    renderAllTemplates(container) {
        if (!container) {
            console.error('❌ UITemplates: Contenedor no encontrado');
            return;
        }

        try {
            // Renderizar menú
            container.innerHTML = this.getMenuTemplate();
            
            // Agregar spacer
            container.innerHTML += '<div class="menu-spacer"></div>';
            
            // Agregar contenedor principal
            container.innerHTML += '<div class="container">';
            
            // Renderizar header
            container.innerHTML += this.getHeaderTemplate();
            
            // Renderizar sección de wallet
            container.innerHTML += this.getWalletSectionTemplate();
            
            // Renderizar sección de tokens
            container.innerHTML += this.getTokensSectionTemplate();
            
            // Cerrar contenedor principal
            container.innerHTML += '</div>';
            
            // Renderizar información de selección INMEDIATAMENTE después del container (como en indexref.html)
            container.innerHTML += this.getSelectionInfoTemplate();
            
            // Renderizar modal de Lambo
            container.innerHTML += this.getLamboModalTemplate();
            
            // Renderizar modal de Customise
            container.innerHTML += this.getCustomiseModalTemplate();
            
            // Agregar footer
            container.innerHTML += '<div class="footer">Powered by $ADRIAN</div>';
            
            console.log('✅ UITemplates: Todos los templates renderizados correctamente');
            
        } catch (error) {
            console.error('❌ UITemplates: Error renderizando templates:', error);
            throw error;
        }
    }
}

// Exportar para uso global
window.UITemplates = UITemplates;
