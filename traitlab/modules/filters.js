/**
 * TRAITLAB - Módulo de Filtros
 * Maneja el filtrado de tokens por tipo (floppy, serum, traits, etc.)
 * Updated: 2026-01-29 - Refactorizado para usar pack-config.js (FASE 3)
 *
 * Usa window.PackConfig como single source of truth para configuración de packs
 */

class TokenFilters {
    constructor() {
        console.log('🔍 TokenFilters inicializado');
    }

    /**
     * Filtrar tokens por tipo
     */
    filterTokensByType(tokens, filterType) {
        if (!tokens || !Array.isArray(tokens)) {
            console.warn('🔍 No hay tokens para filtrar');
            return [];
        }

        console.log(`🔍 Filtrando ${tokens.length} tokens por tipo: ${filterType}`);

        switch (filterType) {
            case 'floppy':
                return this.filterFloppyTokens(tokens);
            case 'serum':
                return this.filterSerumTokens(tokens);
            case 'traits':
                return this.filterTraitTokens(tokens);
            case 'adrianzero':
                return this.filterAdrianZeroTokens(tokens);
            case 'customise':
                // Customise usa los mismos tokens que adrianzero (ERC721)
                return this.filterAdrianZeroTokens(tokens);
            default:
                console.log(`🔍 Filtro no reconocido: ${filterType}, retornando todos los tokens`);
                return tokens;
        }
    }

    /**
     * Filtrar tokens floppy usando pack-config.js (single source of truth)
     */
    filterFloppyTokens(tokens) {
        console.log('🔍 Filtrando floppy tokens usando PackConfig...');

        const floppyTokens = tokens.filter(token => {
            const tokenId = parseInt(token.tokenId);

            // Usar PackConfig para verificar si es floppy
            if (window.PackConfig.isFloppyToken(tokenId)) {
                console.log(`💾 Floppy encontrado: ${tokenId}`);

                // Obtener configuración del pack desde single source of truth
                const config = window.PackConfig.getPackConfig(tokenId);
                if (config) {
                    token.displayName = config.name;
                    token.targetContract = window.TraitLABConfig[config.contract + '_CONTRACT'];
                } else {
                    // Fallback para packs sin configuración explícita
                    token.targetContract = window.TraitLABConfig.PACK_TOKEN_MINTER_CONTRACT;
                }

                return true;
            }

            return false;
        });

        console.log(`💾 Floppy tokens encontrados: ${floppyTokens.length}`);
        return floppyTokens;
    }

    /**
     * Filtrar tokens serum - SOLO POR ID como en index.html
     */
    filterSerumTokens(tokens) {
        console.log('🔍 Filtrando serum tokens por ID...');
        
        const serumTokens = tokens.filter(token => {
            const tokenId = parseInt(token.tokenId);
            
            // Solo usar rango específico de index.html: 262144-262147
            const isSerumById = tokenId >= 262144 && tokenId <= 262147;
            
            if (isSerumById) {
                console.log(`🧪 Serum encontrado por ID: ${tokenId}`);
                return true;
            }
            
            return false;
        });

        console.log(`🧪 Serum tokens encontrados: ${serumTokens.length}`);
        return serumTokens;
    }

    /**
     * Filtrar tokens de traits (ERC1155 del contrato AdrianLAB)
     */
    filterTraitTokens(tokens) {
        const traitTokens = tokens.filter(token => {
            // Verificar que sea ERC1155
            if (token.tokenType !== 'ERC1155' && token.type !== 'ERC1155') {
                return false;
            }
            
            // Verificar que no sea floppy ni serum
            if (this.isFloppyToken(token) || this.isSerumToken(token)) {
                return false;
            }
            
            return true;
        });

        console.log(`🎭 Trait tokens encontrados: ${traitTokens.length}`);
        return traitTokens;
    }

    /**
     * Filtrar tokens AdrianZERO (ERC721)
     */
    filterAdrianZeroTokens(tokens) {
        const adrianZeroTokens = tokens.filter(token => {
            return token.tokenType === 'ERC721' || token.type === 'ERC721';
        });

        console.log(`🧑‍🔬 AdrianZERO tokens encontrados: ${adrianZeroTokens.length}`);
        return adrianZeroTokens;
    }

    /**
     * Verificar si un token es floppy usando PackConfig
     */
    isFloppyToken(token) {
        return window.PackConfig.isFloppyToken(token.tokenId);
    }

    /**
     * Verificar si un token es serum usando PackConfig
     */
    isSerumToken(token) {
        return window.PackConfig.isSerumToken(token.tokenId);
    }

    /**
     * Obtener estadísticas de tokens
     */
    getTokenStats(tokens) {
        if (!tokens || !Array.isArray(tokens)) {
            return { total: 0, floppy: 0, serum: 0, traits: 0, adrianzero: 0 };
        }

        const stats = {
            total: tokens.length,
            floppy: this.filterFloppyTokens(tokens).length,
            serum: this.filterSerumTokens(tokens).length,
            traits: this.filterTraitTokens(tokens).length,
            adrianzero: this.filterAdrianZeroTokens(tokens).length
        };

        console.log('📊 Estadísticas de tokens:', stats);
        return stats;
    }
}

// Exportar para uso global
window.TraitLABFilters = TokenFilters;
