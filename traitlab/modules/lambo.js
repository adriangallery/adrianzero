/**
 * TRAITLAB - Módulo de Lambo
 * Maneja la funcionalidad de selección de AdrianZERO + color de Lambo
 */

class LamboManager {
    constructor() {
        this.selectedAdrianZero = null;
        this.selectedLamboColor = null;
        this.eventListeners = new Map();
        
        // Colores disponibles de Lambo
        this.lamboColors = [
            { name: 'Lambo_Variant_Yellow', display: 'Amarillo', emoji: '🟡' },
            { name: 'Lambo_Variant_Red', display: 'Rojo', emoji: '🔴' },
            { name: 'Lambo_Variant_Blue', display: 'Azul', emoji: '🔵' },
            { name: 'Lambo_Variant_Cyan', display: 'Cian', emoji: '🔵' },
            { name: 'Lambo_Variant_Green', display: 'Verde', emoji: '🟢' },
            { name: 'Lambo_Variant_Indigo', display: 'Índigo', emoji: '🟣' },
            { name: 'Lambo_Variant_Lila', display: 'Lila', emoji: '🟣' },
            { name: 'Lambo_Variant_Orange', display: 'Naranja', emoji: '🟠' },
            { name: 'Lambo_Variant_Pink', display: 'Rosa', emoji: '🩷' },
            { name: 'Lambo_Variant_Purple', display: 'Púrpura', emoji: '🟣' },
            { name: 'Lambo_Rainbow', display: 'Arcoíris', emoji: '🌈' }
        ];
        
        // Bind methods
        this.loadAdrianZeroTokens = this.loadAdrianZeroTokens.bind(this);
        this.selectAdrianZero = this.selectAdrianZero.bind(this);
        this.selectLamboColor = this.selectLamboColor.bind(this);
        this.generateLamboImage = this.generateLamboImage.bind(this);
        this.clearSelection = this.clearSelection.bind(this);
    }

    /**
     * Initialize lambo manager
     */
    init() {
        console.log('🚗 LamboManager inicializado');
    }

    /**
     * Load AdrianZERO tokens for Lambo selection
     */
    async loadAdrianZeroTokens(userAddress) {
        console.log('🚗 Cargando AdrianZERO tokens para Lambo...');
        
        if (!userAddress) {
            throw new Error('User address is required');
        }

        try {
            // Use the zero module to load AdrianZERO tokens
            if (window.app && window.app.modules.zero) {
                const tokens = await window.app.modules.zero.loadTokens(
                    userAddress, 
                    window.TraitLABConfig.CONTRACTS.ERC721, 
                    'adrianzero'
                );
                
                console.log(`🚗 Cargados ${tokens.length} AdrianZERO tokens para Lambo`);
                this.emit('adrianZeroTokensLoaded', { tokens });
                return tokens;
            } else {
                throw new Error('Zero module not available');
            }
        } catch (error) {
            console.error('Error loading AdrianZERO tokens for Lambo:', error);
            this.emit('adrianZeroTokensLoadError', { error: error.message });
            throw error;
        }
    }

    /**
     * Select AdrianZERO token for Lambo
     */
    selectAdrianZero(token) {
        console.log('🚗 AdrianZERO seleccionado para Lambo:', token);
        this.selectedAdrianZero = token;
        this.emit('adrianZeroSelected', { token });
    }

    /**
     * Select Lambo color
     */
    selectLamboColor(colorName) {
        console.log('🚗 Color de Lambo seleccionado:', colorName);
        this.selectedLamboColor = colorName;
        this.emit('lamboColorSelected', { colorName });
        
        // Generate image if both are selected
        if (this.selectedAdrianZero && this.selectedLamboColor) {
            this.generateLamboImage();
        }
    }

    /**
     * Generate Lambo image URL
     */
    generateLamboImage() {
        if (!this.selectedAdrianZero || !this.selectedLamboColor) {
            console.log('🚗 No se puede generar imagen: faltan selecciones');
            return;
        }

        const tokenId = this.selectedAdrianZero.tokenId;
        const lamboUrl = `https://adrianlab.vercel.app/api/render/lambo/${tokenId}?lambo=${this.selectedLamboColor}`;
        
        console.log('🚗 Generando imagen de Lambo:', lamboUrl);
        
        this.emit('lamboImageGenerated', { 
            tokenId, 
            color: this.selectedLamboColor,
            imageUrl: lamboUrl,
            token: this.selectedAdrianZero
        });
    }

    /**
     * Get available Lambo colors
     */
    getLamboColors() {
        return this.lamboColors;
    }

    /**
     * Get selected AdrianZERO
     */
    getSelectedAdrianZero() {
        return this.selectedAdrianZero;
    }

    /**
     * Get selected Lambo color
     */
    getSelectedLamboColor() {
        return this.selectedLamboColor;
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectedAdrianZero = null;
        this.selectedLamboColor = null;
        this.emit('selectionCleared');
    }

    /**
     * Check if both selections are made
     */
    isReadyToGenerate() {
        return this.selectedAdrianZero && this.selectedLamboColor;
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
    window.TraitLABLambo = LamboManager;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LamboManager;
}
