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
                <div class="subtitle">Modular & Clean Architecture</div>
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
                        <div class="wallet-address" id="walletAddress"></div>
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
                    <button class="contract-btn" data-contract="0x90546848474fb3c9fda3fdad887969bb244e7e58" data-filter="floppy">Floppy</button>
                    <button class="contract-btn" data-contract="0x90546848474fb3c9fda3fdad887969bb244e7e58" data-filter="serum">Serum</button>
                    <button class="contract-btn" data-contract="0x90546848474fb3c9fda3fdad887969bb244e7e58" data-filter="crafting">Crafting</button>
                    <button class="contract-btn" data-contract="0x90546848474fb3c9fda3fdad887969bb244e7e58" data-filter="rename">RENAME</button>
                </div>
                
                <div id="tokens-grid" class="tokens-grid"></div>
                
                <div id="loading" class="loading" style="display: none;">
                    <div class="spinner"></div>
                    <p>Loading tokens...</p>
                </div>
                
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
            <div id="selection-info" class="selection-info" style="display: none;">
                <div class="selection-text"></div>
                
                <div class="generated-image" style="display: none;">
                    <div class="image-loading-overlay">
                        <div class="spinner"></div>
                        <p>Generating image...</p>
                    </div>
                    <img src="" alt="Generated" style="display: none;">
                </div>
                
                <div class="side-emoji-menu">
                    <button class="emoji-btn" onclick="window.app.stickyManager.toggleSticky()">📌</button>
                    <button class="emoji-btn" onclick="window.app.stickyManager.minimize()">➖</button>
                </div>
                
                <!-- ERC721 Actions -->
                <div id="erc721-actions-section" class="traits-actions-section" style="display: none;">
                    <button class="action-btn" onclick="window.app.modules.zero.activateToken()">Activate Token</button>
                    <button class="action-btn" onclick="window.app.modules.zero.renameToken()">Rename Token</button>
                    <button class="action-btn" onclick="window.app.modules.zero.openPack()">Open Pack</button>
                </div>
                
                <!-- Traits Actions -->
                <div id="traits-actions-section" class="traits-actions-section" style="display: none;">
                    <button class="action-btn" onclick="window.app.modules.zero.applyTraits()">Apply Traits</button>
                    <button class="action-btn" onclick="window.app.modules.zero.refreshMetadata()">Refresh Metadata</button>
                </div>
                
                <!-- Use Serum -->
                <div id="use-serum-section" class="traits-actions-section" style="display: none;">
                    <button class="action-btn" onclick="window.app.modules.serums.useSerum()">Use Serum</button>
                </div>
                
                <!-- Open Floppy -->
                <div id="open-floppy-section" class="traits-actions-section" style="display: none;">
                    <button class="action-btn" onclick="window.app.modules.floppy.openFloppy()">Open Floppy</button>
                </div>
                
                <!-- Open Pack -->
                <div id="open-pack-section" class="traits-actions-section" style="display: none;">
                    <button class="action-btn" onclick="window.app.modules.zero.openPack()">Open Pack</button>
                </div>
                
                <!-- Activate Token -->
                <div id="activate-token-section" class="traits-actions-section" style="display: none;">
                    <button class="action-btn" onclick="window.app.modules.zero.activateToken()">Activate Token</button>
                </div>
                
                <!-- Rename -->
                <div id="rename-section" class="traits-actions-section" style="display: none;">
                    <button class="action-btn" onclick="window.app.modules.zero.renameToken()">Rename Token</button>
                </div>
                
                <!-- Apply Traits -->
                <div id="apply-traits-section" class="traits-actions-section" style="display: none;">
                    <button class="action-btn" onclick="window.app.modules.zero.applyTraits()">Apply Traits</button>
                </div>
                
                <!-- Refresh Metadata -->
                <div id="refresh-metadata-section" class="traits-actions-section" style="display: none;">
                    <button class="action-btn" onclick="window.app.modules.zero.refreshMetadata()">Refresh Metadata</button>
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
            
            // Renderizar información de selección
            container.innerHTML += this.getSelectionInfoTemplate();
            
            // Cerrar contenedor principal
            container.innerHTML += '</div>';
            
            console.log('✅ UITemplates: Todos los templates renderizados correctamente');
            
        } catch (error) {
            console.error('❌ UITemplates: Error renderizando templates:', error);
            throw error;
        }
    }
}

// Exportar para uso global
window.UITemplates = UITemplates;
