/**
 * Image Loader Utility Module
 * Centralized helper for loading trait images with local assets priority
 */

class TraitImageLoader {
    constructor() {
        // Cache para verificar existencia de archivos (opcional, para optimización futura)
        this.fileExistenceCache = new Map();
    }

    /**
     * Get trait image URL with local priority
     * @param {number|string} tokenId - The trait token ID
     * @param {string} fallbackUrl - Fallback URL (Alchemy metadata or render API)
     * @returns {Object} Object with localUrl and fallbackUrl
     */
    getTraitImageUrl(tokenId, fallbackUrl = null) {
        const tokenIdInt = parseInt(tokenId);
        
        // Determinar ruta local según el tokenId
        let localPath;
        if (tokenIdInt >= 100001) {
            // OG Punks van en subdirectorio ogpunks
            localPath = `./assets/traits/ogpunks/${tokenIdInt}.svg`;
        } else {
            // Traits normales van en el directorio principal
            localPath = `./assets/traits/${tokenIdInt}.svg`;
        }
        
        // Si no se proporciona fallback, usar render API por defecto
        const defaultFallback = fallbackUrl || `https://adrianlab.vercel.app/api/render/floppy/${tokenIdInt}.png`;
        
        return {
            localUrl: localPath,
            fallbackUrl: defaultFallback
        };
    }

    /**
     * Load trait image with automatic fallback
     * @param {HTMLImageElement} imgElement - The image element to load
     * @param {number|string} tokenId - The trait token ID
     * @param {string} fallbackUrl - Fallback URL (optional, will use render API if not provided)
     * @param {Function} onLoad - Callback when image loads successfully
     * @param {Function} onError - Callback when both local and fallback fail
     */
    loadTraitImageWithFallback(imgElement, tokenId, fallbackUrl = null, onLoad = null, onError = null) {
        if (!imgElement) {
            console.warn('TraitImageLoader: No image element provided');
            if (onError) onError();
            return;
        }

        const { localUrl, fallbackUrl: finalFallbackUrl } = this.getTraitImageUrl(tokenId, fallbackUrl);
        
        console.log('🖼️ TraitImageLoader: Loading image for trait', tokenId, {
            localUrl,
            fallbackUrl: finalFallbackUrl
        });

        // Crear imagen temporal para verificar si existe localmente
        const img = new Image();
        
        // Intentar primero con asset local
        img.onload = () => {
            imgElement.src = localUrl;
            console.log('✅ TraitImageLoader: Image loaded from local assets:', localUrl);
            if (onLoad) onLoad(localUrl);
        };
        
        img.onerror = () => {
            // Si falla local, usar fallback
            console.warn('⚠️ TraitImageLoader: Local asset not found, using fallback:', finalFallbackUrl);
            const fallbackImg = new Image();
            
            fallbackImg.onload = () => {
                imgElement.src = finalFallbackUrl;
                console.log('✅ TraitImageLoader: Image loaded from fallback:', finalFallbackUrl);
                if (onLoad) onLoad(finalFallbackUrl);
            };
            
            fallbackImg.onerror = () => {
                console.error('❌ TraitImageLoader: Both local and fallback failed for trait', tokenId);
                if (onError) onError();
            };
            
            fallbackImg.src = finalFallbackUrl;
        };
        
        img.src = localUrl;
    }

    /**
     * Get local URL only (for cases where we want to try local first but handle fallback differently)
     * @param {number|string} tokenId - The trait token ID
     * @returns {string} Local asset URL
     */
    getLocalTraitImageUrl(tokenId) {
        const tokenIdInt = parseInt(tokenId);
        
        if (tokenIdInt >= 100001) {
            return `./assets/traits/ogpunks/${tokenIdInt}.svg`;
        } else {
            return `./assets/traits/${tokenIdInt}.svg`;
        }
    }
}

// Export for browser environment
if (typeof window !== 'undefined') {
    window.TraitImageLoader = TraitImageLoader;
    
    // Crear instancia global singleton
    if (!window.traitImageLoader) {
        window.traitImageLoader = new TraitImageLoader();
    }
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TraitImageLoader;
}

