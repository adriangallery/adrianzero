// Base Scene Class - Clase base para todas las escenas

// CSS Styles for command buttons and inventory
const baseSceneStyles = `
<style>
/* Command buttons grid layout */
.commands-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4px;
    flex: 1;
    min-height: 0;
}

/* Command button styling */
.command-btn {
    background: rgba(0, 255, 0, 0.1);
    border: 1px solid #00ff00;
    color: #00ff00;
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-family: 'VT323', monospace;
    font-size: 0.7rem;
    transition: all 0.3s ease;
    text-align: center;
}

.command-btn:hover {
    background: rgba(0, 255, 0, 0.2);
    transform: translateY(-1px);
}

.command-btn:active {
    transform: translateY(0);
}

.command-btn.active {
    background: rgba(0, 255, 0, 0.3);
    border: 2px solid #ffff00;
    color: #ffff00;
    transform: scale(1.05);
    box-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
}

/* Commands section styling */
.commands-section {
    flex: 1;
}

/* Inventory grid layout - Responsive */
.inventory-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1px;
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 1px;
    align-items: start;
    max-width: 100%;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 2px;
}

/* Force remove any borders from inventory items */
#inventory-grid-left .inventory-item,
#inventory-grid-right .inventory-item,
.inventory-grid .inventory-item {
    border: none !important;
    outline: none !important;
}

/* Popup styling */
.popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    display: none;
    justify-content: center;
    align-items: flex-start;
    z-index: 1000;
    overflow-y: auto;
    padding: 20px;
}

.popup.active {
    display: flex;
}

.popup-content {
    background: #000;
    border: 2px solid #00ff00;
    border-radius: 8px;
    padding: 20px;
    max-width: 90vw;
    height: calc(100vh - 40px);
    overflow: auto;
    position: relative;
    margin: auto;
    margin-top: 20px;
}

.popup-content.large {
    width: 800px;
    height: calc(100vh - 40px);
}

.popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    border-bottom: 1px solid #00ff00;
    padding-bottom: 10px;
}

.popup-header h2 {
    color: #00ff00;
    margin: 0;
    font-family: 'VT323', monospace;
    font-size: 1.5rem;
}

.close-btn {
    background: none;
    border: 1px solid #00ff00;
    color: #00ff00;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.close-btn:hover {
    background: #00ff00;
    color: #000;
}

.popup-body {
    flex: 1;
    overflow: hidden;
}

.popup-body iframe {
    width: 100%;
    height: 100%;
    border: none;
}

/* Mobile inventory grid - 2 columns - FORCED MOBILE */
@media (min-width: 0px) {
    .inventory-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    /* Mobile popup adjustments */
    .popup {
        padding: 10px;
    }
    
    .popup-content {
        max-width: 95vw;
        height: calc(100vh - 20px);
        margin-top: 10px;
        padding: 15px;
    }
    
    .popup-content.large {
        width: 95vw;
        height: calc(100vh - 20px);
    }
    
    .popup-header h2 {
        font-size: 1.2rem;
    }
    
    .close-btn {
        font-size: 1.2rem;
        padding: 3px 8px;
    }
}

/* Scene background image - Responsive */
.background-container {
    position: absolute;
    top: 60px;        /* Altura del header */
    bottom: 232px;    /* Altura del footer: 200px + 32px padding */
    left: 0;
    right: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.background-container img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    max-width: 100%;
    max-height: 100%;
}

/* Inventory item styling */
.inventory-item {
    background: rgba(0, 255, 0, 0.1);
    border: 1px solid rgba(0, 255, 0, 0.3) !important;
    border-radius: 3px;
    padding: 2px 1px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    height: 40px;
    box-sizing: border-box;
    overflow: hidden;
    min-width: 0;
    margin: 1px;
}

.inventory-item:hover {
    background: rgba(0, 255, 0, 0.2);
    transform: scale(1.05);
}

.inventory-item.selected {
    border: 2px solid #ffff00;
}

.inventory-item img {
    width: 16px;
    height: 16px;
    object-fit: contain;
    margin-bottom: 1px;
    border-radius: 1px;
    flex-shrink: 0;
}

.inventory-item .item-name {
    color: #00ff00;
    font-size: 0.4rem;
    font-weight: bold;
    line-height: 1;
    margin-bottom: 1px;
    font-family: 'VT323', monospace;
    flex-shrink: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
    width: 100%;
}

.inventory-item .item-id {
    color: #888;
    font-size: 0.3rem;
    line-height: 1;
    font-family: 'VT323', monospace;
    flex-shrink: 0;
    width: 100%;
}

.no-items {
    color: #888;
    text-align: center;
    font-style: italic;
    padding: 10px;
    font-family: 'VT323', monospace;
    font-size: 0.6rem;
    grid-column: 1 / -1;
}

/* Mobile responsive adjustments - FORCED MOBILE */
@media (min-width: 0px) {
    .background-container {
        top: 50px;        /* Header más pequeño en móvil */
        bottom: 166px;    /* Footer: 150px + 16px padding */
    }
    
    .commands-grid {
        gap: 2px;
    }
    
    .command-btn {
        padding: 4px 6px;
        font-size: 0.5rem;
    }
    
    .inventory-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1px;
        padding: 1px;
    }
    
    .inventory-item {
        height: 35px;
        padding: 2px 1px;
        margin: 1px;
    }
    
    .inventory-item img {
        width: 14px;
        height: 14px;
        margin-bottom: 1px;
    }
    
    .inventory-item .item-name {
        font-size: 0.25rem;
        margin-bottom: 1px;
        line-height: 1;
    }
    
    .inventory-item .item-id {
        font-size: 0.15rem;
        line-height: 1;
    }
    
    .no-items {
        font-size: 0.4rem;
        padding: 3px;
        line-height: 1.2;
    }
}

/* Desktop responsive adjustments - DISABLED FOR MOBILE FORCE */
@media (min-width: 9999px) {
    .background-container {
        top: 60px;        /* Header estándar en desktop */
        bottom: 232px;    /* Footer: 200px + 32px padding */
    }
    
    .inventory-grid {
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 6px;
        padding: 6px;
    }
    
    .inventory-item {
        height: 70px;
        padding: 8px 4px;
    }
    
    .inventory-item img {
        width: 32px;
        height: 32px;
        margin-bottom: 4px;
    }
    
    .inventory-item .item-name {
        font-size: 0.55rem;
        margin-bottom: 3px;
    }
    
    .inventory-item .item-id {
        font-size: 0.45rem;
    }
}

/* Extra small mobile adjustments - FORCED */
@media (min-width: 0px) {
    .background-container {
        top: 40px;        /* Header muy pequeño */
        bottom: 136px;    /* Footer: 120px + 16px padding */
    }
}
/* Overlays específicos para cada escena - Mismo estilo que indextest.html */
.outside-overlay, .basement-overlay, .upstairs-overlay {
    position: absolute;
    bottom: 20%;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    z-index: 10;
    pointer-events: none;
}

/* Estilos completos para título y subtítulo - Mismo que indextest.html */
.retro-title {
    font-size: 2rem;
    color: #00ff00;
    text-shadow: 2px 2px 0px #000, 4px 4px 0px #003300;
    margin-bottom: 1rem;
    animation: glow 2s ease-in-out infinite alternate;
    transition: opacity 1s ease;
}

.retro-subtitle {
    font-size: 0.8rem;
    color: #ffff00;
    animation: blink 1s infinite;
    transition: opacity 1s ease !important;
}

/* Sobrescribir la animación blink cuando hay fadeout */
.fadeout-overlay .retro-subtitle {
    animation: none !important;
    opacity: 0 !important;
}

@keyframes glow {
    from { text-shadow: 2px 2px 0px #000, 4px 4px 0px #003300; }
    to { text-shadow: 2px 2px 0px #000, 4px 4px 0px #003300, 0 0 10px #00ff00; }
}

@keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
}

.fadeout-overlay .retro-title,
.fadeout-overlay .retro-subtitle {
    opacity: 0;
}
</style>
`;

// Inject styles into document head
if (!document.querySelector('#base-scene-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'base-scene-styles';
    styleElement.innerHTML = baseSceneStyles;
    document.head.appendChild(styleElement);
}

class BaseScene {
    constructor(sceneId, sceneName) {
        this.sceneId = sceneId;
        this.sceneName = sceneName;
        this.hotspots = [];
        this.imagePath = '';
        this.overlayText = {
            title: '',
            subtitle: ''
        };
    }

    // Inicializar la escena
    initialize() {
        console.log(`Initializing scene: ${this.sceneName}`);
        this.setupHotspots();
        this.setupEventListeners();
    }

    // Configurar hotspots (debe ser implementado por cada escena)
    setupHotspots() {
        throw new Error('setupHotspots must be implemented by subclass');
    }

    // Configurar event listeners (debe ser implementado por cada escena)
    setupEventListeners() {
        throw new Error('setupEventListeners must be implemented by subclass');
    }

    // Asegurar que el popup de mint existe
    ensureMintPopupExists() {
        let mintPopup = document.getElementById('mint-popup');
        
        if (!mintPopup) {
            console.log('Creating mint popup...');
            mintPopup = document.createElement('div');
            mintPopup.id = 'mint-popup';
            mintPopup.className = 'popup';
            mintPopup.innerHTML = `
                <div class="popup-content large">
                    <div class="popup-header">
                        <h2>AdrianLAB - Starter Mint</h2>
                        <button id="close-popup" class="close-btn">×</button>
                    </div>
                    <div class="popup-body">
                        <iframe 
                            src="startermint.html" 
                            frameborder="0" 
                            width="100%" 
                            height="600px"
                            allow="clipboard-write"
                            title="AdrianLAB Starter Mint">
                        </iframe>
                    </div>
                </div>
            `;
            document.body.appendChild(mintPopup);
            
            // Configurar event listener para cerrar popup
            const closeBtn = mintPopup.querySelector('#close-popup');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    mintPopup.classList.remove('active');
                });
            }
            
            console.log('Mint popup created and configured');
        }
    }

    // Manejar click en la escena - Solución optimizada
    handleClick(event) {
        console.log(`handleClick called for scene: ${this.sceneId}`);
        
        // Obtener el contenedor del click (click-area)
        const clickArea = event.currentTarget;
        const clickRect = clickArea.getBoundingClientRect();
        console.log('Click area rect:', clickRect);
        
        // Obtener la imagen de fondo con múltiples selectores
        let backgroundImage = document.querySelector(`#${this.sceneId}-bg`);
        
        // Si no se encuentra con el ID específico, buscar en el contenedor
        if (!backgroundImage) {
            console.log(`Image not found with ID #${this.sceneId}-bg, searching in container...`);
            const sceneElement = document.getElementById(this.sceneId);
            if (sceneElement) {
                backgroundImage = sceneElement.querySelector('img');
                console.log('Found image in scene container:', backgroundImage);
            }
        }
        
        if (!backgroundImage) {
            console.error('Background image not found with any method');
            return;
        }
        
        console.log('Background image found:', backgroundImage);
        console.log('Image src:', backgroundImage.src);
        console.log('Image complete:', backgroundImage.complete);
        console.log('Image natural dimensions:', backgroundImage.naturalWidth, 'x', backgroundImage.naturalHeight);
        
        // Verificar que la imagen esté cargada y tenga dimensiones naturales
        if (!backgroundImage.complete || backgroundImage.naturalWidth <= 0 || backgroundImage.naturalHeight <= 0) {
            console.error('Image not fully loaded or has invalid natural dimensions');
            return;
        }
        
        // Usar dimensiones naturales como método principal (más confiable)
        const naturalAspectRatio = backgroundImage.naturalWidth / backgroundImage.naturalHeight;
        const containerWidth = clickRect.width;
        const containerHeight = clickRect.height;
        
        console.log('Container dimensions:', containerWidth, 'x', containerHeight);
        console.log('Natural aspect ratio:', naturalAspectRatio);
        
        // Calcular dimensiones de la imagen basadas en el contenedor y aspect ratio
        let imageWidth, imageHeight;
        if (containerWidth / containerHeight > naturalAspectRatio) {
            // Contenedor más ancho que la imagen - ajustar por altura
            imageHeight = containerHeight;
            imageWidth = containerHeight * naturalAspectRatio;
        } else {
            // Contenedor más alto que la imagen - ajustar por ancho
            imageWidth = containerWidth;
            imageHeight = containerWidth / naturalAspectRatio;
        }
        
        console.log('Calculated image dimensions:', imageWidth, 'x', imageHeight);
        
        // Calcular offset para centrar la imagen
        const imageLeft = clickRect.left + (containerWidth - imageWidth) / 2;
        const imageTop = clickRect.top + (containerHeight - imageHeight) / 2;
        
        console.log('Image offset:', imageLeft, imageTop);
        
        // Calcular coordenadas del click relativas a la imagen
        const imageX = event.clientX - imageLeft;
        const imageY = event.clientY - imageTop;
        
        console.log('Click coordinates relative to image:', imageX, imageY);
        
        // Verificar que el click esté dentro de los límites de la imagen
        if (imageX < 0 || imageX > imageWidth || imageY < 0 || imageY > imageHeight) {
            console.log(`Click outside image bounds: ${imageX.toFixed(1)}, ${imageY.toFixed(1)}`);
            return;
        }
        
        // Convertir a porcentajes relativos a la imagen
        const xPercent = (imageX / imageWidth) * 100;
        const yPercent = (imageY / imageHeight) * 100;
        
        console.log(`${this.sceneName} click at: ${xPercent.toFixed(1)}%, ${yPercent.toFixed(1)}%`);
        
        // Verificar si el click está en algún hotspot
        const hotspot = this.getHotspotAt(xPercent, yPercent);
        
        if (hotspot) {
            this.handleHotspotClick(hotspot, xPercent, yPercent);
        } else {
            this.handleGeneralClick(xPercent, yPercent);
        }
    }

    // Obtener hotspot en las coordenadas especificadas - Rango expandido para mejor usabilidad
    getHotspotAt(x, y) {
        console.log(`Checking hotspots for coordinates: ${x.toFixed(1)}%, ${y.toFixed(1)}%`);
        console.log('Available hotspots:', this.hotspots);
        
        // Margen expandido para hacer los clicks más permisivos (2% en cada dirección)
        const clickMargin = 2.0;
        
        // Búsqueda con margen expandido - las coordenadas ya son porcentajes de la imagen
        const foundHotspot = this.hotspots.find(hotspot => 
            x >= (hotspot.x[0] - clickMargin) && x <= (hotspot.x[1] + clickMargin) &&
            y >= (hotspot.y[0] - clickMargin) && y <= (hotspot.y[1] + clickMargin)
        );
        
        if (foundHotspot) {
            console.log(`Found hotspot: ${foundHotspot.name} at expanded range x[${(foundHotspot.x[0] - clickMargin).toFixed(1)}-${(foundHotspot.x[1] + clickMargin).toFixed(1)}], y[${(foundHotspot.y[0] - clickMargin).toFixed(1)}-${(foundHotspot.y[1] + clickMargin).toFixed(1)}]`);
        } else {
            console.log('No hotspot found at these coordinates');
        }
        
        return foundHotspot;
    }

    // Manejar click en hotspot
    handleHotspotClick(hotspot, x, y) {
        console.log(`Hotspot clicked: ${hotspot.name} with command: ${getCurrentCommand()}`);
        
        const command = getCurrentCommand();
        
        switch (command) {
            case 'explore':
                this.handleExploreCommand(hotspot, x, y);
                break;
            case 'use':
                this.handleUseCommand(hotspot, x, y);
                break;
            case 'take':
                this.handleTakeCommand(hotspot, x, y);
                break;
            case 'open':
                this.handleOpenCommand(hotspot, x, y);
                break;
            default:
                this.handleExploreCommand(hotspot, x, y);
        }
    }

    // Manejar click general (fuera de hotspots)
    handleGeneralClick(x, y) {
        const command = getCurrentCommand();
        
        // if (command === 'explore') {
            // showNotification(`You clicked at ${x.toFixed(1)}%, ${y.toFixed(1)}%`);
        if (command === 'close') {
            showFloatingText(`💬 Nothing to close here`, x, y);
        }
    }

    // Comandos base (pueden ser sobrescritos por escenas específicas)
    handleExploreCommand(hotspot, x, y) {
        if (hotspot.message) {
            showFloatingText(hotspot.message, x, y);
        } else {
            showFloatingText(`💬 You interact with ${hotspot.name}`, x, y);
        }
    }

    handleUseCommand(hotspot, x, y) {
        showFloatingText(`💬 You can't use ${hotspot.name}`, x, y);
    }

    handleTakeCommand(hotspot, x, y) {
        showFloatingText(`💬 You can't take ${hotspot.name}`, x, y);
    }

    handleOpenCommand(hotspot, x, y) {
        showFloatingText(`💬 You can't open ${hotspot.name}`, x, y);
    }

    // Crear elemento HTML de la escena
    createSceneElement() {
        const sceneElement = document.createElement('div');
        sceneElement.id = this.sceneId;
        sceneElement.className = 'screen';
        
        sceneElement.innerHTML = `
            <div class="background-container">
                <img src="${this.imagePath}" alt="${this.sceneName}" id="${this.sceneId}-bg" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            
            <!-- Header with wallet -->
            <header class="retro-header">
                <div class="logo">AdrianLAB - ${this.sceneName}</div>
                <button id="connect-wallet-${this.sceneId}" class="retro-button">Connect Wallet</button>
                <button id="mute-button-${this.sceneId}" class="retro-button small">🔊</button>
            </header>

            <!-- Main clickable area -->
            <div id="click-area-${this.sceneId}" class="click-area">
                <div class="pixel-cursor"></div>
            </div>

            <!-- Overlay text -->
            <div class="${this.sceneId}-overlay">
                <h1 class="retro-title">${this.overlayText.title}</h1>
                <p class="retro-subtitle">${this.overlayText.subtitle}</p>
            </div>

            <!-- Footer with Inventory -->
            <footer class="retro-footer">
                <div class="footer-sections">
                    <!-- Left section: Commands -->
                    <div class="footer-section commands-section">
                        <div class="section-header">Commands</div>
                        <div class="commands-grid">
                            <button class="command-btn">EXPLORE</button>
                            <button class="command-btn">USE</button>
                            <button class="command-btn">TAKE</button>
                            <button class="command-btn">OPEN</button>
                        </div>
                    </div>
                    
                    <!-- Middle section: Inventory Left -->
                    <div class="footer-section inventory-section-left">
                        <div class="section-header">Inventory</div>
                        <div id="inventory-grid-left" class="inventory-grid">
                            <div class="no-items">Connect wallet to load inventory.</div>
                        </div>
                    </div>
                    
                    <!-- Right section: Inventory Right -->
                    <div class="footer-section inventory-section-right">
                        <div class="section-header">Items</div>
                        <div id="inventory-grid-right" class="inventory-grid">
                            <div class="no-items">No items found.</div>
                        </div>
                    </div>
                </div>
            </footer>
        `;
        
        return sceneElement;
    }

    // Mostrar la escena
    show() {
        console.log(`Showing scene: ${this.sceneName}`);
        console.log(`Scene ID: ${this.sceneId}`);
        
        // Crear popup si no existe
        this.ensureMintPopupExists();
        
        // Ocultar solo las escenas del juego (no intro, floppy, etc.)
        document.querySelectorAll('#intro-screen, #main-screen, #floppy-screen, #outside, #basement, #upstairs').forEach(screen => {
            screen.style.display = 'none';
            screen.classList.remove('active');
            console.log(`Hidden screen: ${screen.id}`);
        });
        
        // Mostrar esta escena
        const sceneElement = document.getElementById(this.sceneId);
        console.log(`Looking for scene element with ID: ${this.sceneId}`);
        console.log(`Scene element found:`, sceneElement);
        
        if (sceneElement) {
            sceneElement.style.display = 'block';
            sceneElement.classList.add('active');
            console.log(`Scene element display set to: ${sceneElement.style.display}`);
            console.log(`Scene element classes: ${sceneElement.className}`);
            
            // Verificar que la imagen de fondo existe
            const bgImage = sceneElement.querySelector(`#${this.sceneId}-bg`);
            console.log(`Background image element:`, bgImage);
            if (bgImage) {
                console.log(`Background image src: ${bgImage.src}`);
            }
        } else {
            console.error(`Scene element not found for ID: ${this.sceneId}`);
        }
        
        // Configurar MenuManager para esta escena
        menuManager.setupSceneEventListeners(this.sceneId);
        menuManager.initializeCommandSystem(this.sceneId);
        
        // ✅ Solo actualizar display si ya hay items cargados, no recargar
        setTimeout(() => {
            console.log('Updating inventory for new scene');
            
            // ✅ Solo actualizar display si ya hay items cargados, no recargar
            if (menuManager.inventoryItems && menuManager.inventoryItems.length > 0) {
                menuManager.displayInventory();
            } else if (menuManager.isWalletConnected) {
                // Solo mostrar loading si no hay items pero hay wallet conectado
                menuManager.showInventoryLoading();
            }
        }, 100);

        // Fadeout automático para título y subtítulo
        const overlay = document.querySelector(`.${this.sceneId}-overlay`);
        if (overlay) {
            overlay.classList.remove('fadeout-overlay');
            setTimeout(() => {
                overlay.classList.add('fadeout-overlay');
            }, 3000);
        }
    }

    // Ocultar la escena
    hide() {
        const sceneElement = document.getElementById(this.sceneId);
        if (sceneElement) {
            sceneElement.style.display = 'none';
            sceneElement.classList.remove('active');
        }
    }
}

// Exportar la clase base
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseScene;
}

// Contract constants for OpenPack functionality
const PACK_TOKEN_MINTER_CONTRACT = "0x673bE1968A12470F93BE374AAB529a89d5D607d5";

// OpenPack functionality for floppy discs
async function openPack(selectedItem) {
    console.log('openPack called for item:', selectedItem);
    
    if (!selectedItem) {
        showNotification('Please select a floppy disc first.', 'error');
        return;
    }

    // Check if it's a floppy disc (tokens 10000-10005)
    const tokenId = parseInt(selectedItem.tokenId);
    if (tokenId < 10000 || tokenId > 10005) {
        showNotification('This function is only available for floppy discs.', 'error');
        return;
    }

    if (!window.ethereum?.selectedAddress) {
        showNotification('Please connect your wallet first.', 'error');
        return;
    }

    try {
        showNotification('Loading ethers library...', 'loading');

        let ethers;
        if (typeof window.ethers === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
            script.onload = () => {
                ethers = window.ethers;
                console.log('Ethers loaded successfully');
                executeOpenPack(selectedItem);
            };
            script.onerror = () => {
                showNotification('Failed to load ethers library. Please refresh the page.', 'error');
            };
            document.head.appendChild(script);
        } else {
            ethers = window.ethers;
            executeOpenPack(selectedItem);
        }

        async function executeOpenPack(selectedItem) {
            try {
                showNotification('Preparing transaction...', 'loading');

                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();

                // PackTokenMinter contract ABI (simplified for openPack function)
                const packMinterABI = [
                    "function openPack(uint256 tokenId) external"
                ];

                const contract = new ethers.Contract(PACK_TOKEN_MINTER_CONTRACT, packMinterABI, signer);
                const tokenId = selectedItem.tokenId;

                console.log('Opening pack for token ID:', tokenId);

                showNotification('Confirming transaction in your wallet...', 'loading');

                const tx = await contract.openPack(tokenId);
                
                showNotification('Transaction sent! Waiting for confirmation...', 'loading');
                console.log('Transaction hash:', tx.hash);

                const receipt = await tx.wait();
                
                showNotification(`✅ Pack opened successfully! Transaction: ${receipt.transactionHash}`, 'success');
                console.log('Transaction confirmed:', receipt);

                // Refresh inventory after successful pack opening
                setTimeout(() => {
                    if (window.menuManager) {
                        window.menuManager.loadInventory();
                    }
                }, 2000);

            } catch (error) {
                console.error('Error opening pack:', error);
                
                let errorMessage = 'Failed to open pack.';
                if (error.code === 4001) {
                    errorMessage = 'Transaction was rejected by user.';
                } else if (error.message) {
                    errorMessage = `Error: ${error.message}`;
                }
                
                showNotification(errorMessage, 'error');
            }
        }

    } catch (error) {
        console.error('Error opening pack:', error);
        showNotification('Failed to load ethers library. Please refresh the page.', 'error');
    }
}

// Make openPack globally available
window.openPack = openPack;

// Global functions for mint popup functionality
function notifyIframeWalletConnected() {
    const iframe = document.querySelector('#mint-popup iframe');
    if (iframe && iframe.contentWindow) {
        try {
            iframe.contentWindow.postMessage({
                type: 'WALLET_CONNECTED',
                address: window.ethereum.selectedAddress,
                chainId: window.ethereum.chainId
            }, '*');
        } catch (error) {
            console.log('Could not notify iframe:', error);
        }
    }
}

function notifyIframeWalletDisconnected() {
    const iframe = document.querySelector('#mint-popup iframe');
    if (iframe && iframe.contentWindow) {
        try {
            iframe.contentWindow.postMessage({
                type: 'WALLET_DISCONNECTED'
            }, '*');
        } catch (error) {
            console.log('Could not notify iframe:', error);
        }
    }
}

function closeMintPopup() {
    const mintPopup = document.getElementById('mint-popup');
    if (mintPopup) {
        mintPopup.classList.remove('active');
    }
}

// Make functions globally available
window.notifyIframeWalletConnected = notifyIframeWalletConnected;
window.notifyIframeWalletDisconnected = notifyIframeWalletDisconnected;
window.closeMintPopup = closeMintPopup;

// Nueva función para abrir popup de traitlab
function openTraitLabPopup() {
    console.log('Opening TraitLab popup...');
    
    // Crear popup si no existe
    let traitLabPopup = document.getElementById('traitlab-popup');
    
    if (!traitLabPopup) {
        console.log('Creating TraitLab popup...');
        traitLabPopup = document.createElement('div');
        traitLabPopup.id = 'traitlab-popup';
        traitLabPopup.className = 'popup';
        traitLabPopup.innerHTML = `
            <div class="popup-content large">
                <div class="popup-header">
                    <h2>AdrianLAB - TraitLab</h2>
                    <button id="close-traitlab-popup" class="close-btn">×</button>
                </div>
                <div class="popup-body">
                    <iframe 
                        src="traitlab/index.html" 
                        frameborder="0" 
                        width="100%" 
                        height="600px"
                        allow="clipboard-write"
                        title="AdrianLAB TraitLab">
                    </iframe>
                </div>
            </div>
        `;
        document.body.appendChild(traitLabPopup);
        
        // Configurar event listener para cerrar popup
        const closeBtn = traitLabPopup.querySelector('#close-traitlab-popup');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                traitLabPopup.classList.remove('active');
                console.log('TraitLab popup closed via X button');
            });
        }
        
        // Cerrar popup al hacer click fuera del contenido
        traitLabPopup.addEventListener('click', (e) => {
            if (e.target === traitLabPopup) {
                traitLabPopup.classList.remove('active');
                console.log('TraitLab popup closed via outside click');
            }
        });
        
        // Cerrar popup con tecla ESC
        const handleEscKey = (e) => {
            if (e.key === 'Escape' && traitLabPopup.classList.contains('active')) {
                traitLabPopup.classList.remove('active');
                console.log('TraitLab popup closed via ESC key');
            }
        };
        document.addEventListener('keydown', handleEscKey);
        
        // Limpiar event listener cuando se cierre el popup
        traitLabPopup.addEventListener('transitionend', () => {
            if (!traitLabPopup.classList.contains('active')) {
                document.removeEventListener('keydown', handleEscKey);
            }
        });
        
        console.log('TraitLab popup created and configured');
    }
    
    // Mostrar el popup
    traitLabPopup.classList.add('active');
    console.log('TraitLab popup activated');
}

// Función para cerrar TraitLab popup
function closeTraitLabPopup() {
    const traitLabPopup = document.getElementById('traitlab-popup');
    if (traitLabPopup) {
        traitLabPopup.classList.remove('active');
        console.log('TraitLab popup closed');
    }
}

// Make new functions globally available
window.openTraitLabPopup = openTraitLabPopup;
window.closeTraitLabPopup = closeTraitLabPopup; 