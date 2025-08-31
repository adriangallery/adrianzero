/**
 * TRAITLAB - Módulo de Filtros
 * Maneja el filtrado de tokens por tipo (floppy, serum, traits, etc.)
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
            default:
                console.log(`🔍 Filtro no reconocido: ${filterType}, retornando todos los tokens`);
                return tokens;
        }
    }

    /**
     * Filtrar tokens floppy
     */
    filterFloppyTokens(tokens) {
        console.log('🔍 Debug: Tokens para filtrar floppy:', tokens.slice(0, 3).map(t => ({
            id: t.tokenId,
            name: t.name,
            title: t.title,
            tokenType: t.tokenType
        })));
        
        const floppyTokens = tokens.filter(token => {
            // Verificar si el nombre contiene "FLOPPY"
            if (token.name && token.name.includes('FLOPPY')) {
                console.log('💾 Floppy encontrado por nombre:', token.name);
                return true;
            }
            
            // Verificar si el título contiene "FLOPPY"
            if (token.title && token.title.includes('FLOPPY')) {
                console.log('💾 Floppy encontrado por título:', token.title);
                return true;
            }
            
            // Verificar IDs específicos de floppy según index.html
            const tokenId = parseInt(token.tokenId);
            
            // Rango principal de floppys: 10000-10007, 15000-15015
            const isFloppyById = (tokenId >= 10000 && tokenId <= 10007) || 
                                 (tokenId >= 15000 && tokenId <= 15015);
            
            if (isFloppyById) {
                console.log('💾 Floppy encontrado por ID:', tokenId);
                
                // Asignar nombre específico según index.html
                if (tokenId === 10003) {
                    token.displayName = 'GLITCH Floppy';
                    token.targetContract = window.TraitLABConfig.NEW_FLOPPY_PACK_CONTRACT;
                    console.log('💾 GLITCH Floppy (10003) - Contrato:', token.targetContract);
                } else if (tokenId === 10004) {
                    token.displayName = 'GF Floppy';
                    token.targetContract = window.TraitLABConfig.PACK_TOKEN_MINTER_CONTRACT;
                    console.log('💾 GF Floppy (10004) - Contrato:', token.targetContract);
                } else if (tokenId === 10005) {
                    token.displayName = 'Golden Floppy';
                    token.targetContract = window.TraitLABConfig.ADRIAN_FLOPPY_DISCS_CONTRACT;
                    console.log('💾 Golden Floppy (10005) - Contrato:', token.targetContract);
                } else if (tokenId === 10007) {
                    token.displayName = 'Action Pack 10007';
                    token.targetContract = window.TraitLABConfig.ACTION_PACK_10007_CONTRACT;
                    console.log('💾 Action Pack 10007 - Contrato:', token.targetContract);
                } else {
                    // Otros floppys usan PACK_TOKEN_MINTER_CONTRACT
                    token.targetContract = window.TraitLABConfig.PACK_TOKEN_MINTER_CONTRACT;
                    console.log('💾 Floppy estándar - Contrato:', token.targetContract);
                }
            }
            
            return isFloppyById;
        });

        console.log(`💾 Floppy tokens encontrados: ${floppyTokens.length}`);
        return floppyTokens;
    }

    /**
     * Filtrar tokens serum
     */
    filterSerumTokens(tokens) {
        const serumTokens = tokens.filter(token => {
            // Verificar si el nombre contiene "SERUM" o "Serum"
            if (token.name && (token.name.includes('SERUM') || token.name.includes('Serum'))) {
                return true;
            }
            
            // Verificar si el título contiene "SERUM" o "Serum"
            if (token.title && (token.title.includes('SERUM') || token.title.includes('Serum'))) {
                return true;
            }
            
            // Verificar IDs específicos de serum
            const tokenId = parseInt(token.tokenId);
            return tokenId >= 262144 && tokenId <= 262147;
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
     * Verificar si un token es floppy
     */
    isFloppyToken(token) {
        if (token.name && token.name.includes('FLOPPY')) {
            return true;
        }
        if (token.title && token.title.includes('FLOPPY')) {
            return true;
        }
        
        const tokenId = parseInt(token.tokenId);
        return (tokenId >= 10000 && tokenId <= 10007) || 
               (tokenId >= 15000 && tokenId <= 15015) ||
               (tokenId >= 30000 && tokenId <= 30006);
    }

    /**
     * Verificar si un token es serum
     */
    isSerumToken(token) {
        if (token.name && (token.name.includes('SERUM') || token.name.includes('Serum'))) {
            return true;
        }
        if (token.title && (token.title.includes('SERUM') || token.title.includes('Serum'))) {
            return true;
        }
        
        const tokenId = parseInt(token.tokenId);
        return tokenId >= 262144 && tokenId <= 262147;
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
