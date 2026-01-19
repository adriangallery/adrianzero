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
            case 'customise':
                // Customise usa los mismos tokens que adrianzero (ERC721)
                return this.filterAdrianZeroTokens(tokens);
            default:
                console.log(`🔍 Filtro no reconocido: ${filterType}, retornando todos los tokens`);
                return tokens;
        }
    }

    /**
     * Filtrar tokens floppy - SOLO POR ID como en index.html
     */
    filterFloppyTokens(tokens) {
        console.log('🔍 Filtrando floppy tokens por ID...');
        
        const floppyTokens = tokens.filter(token => {
            const tokenId = parseInt(token.tokenId);
            
            // Solo usar rangos específicos de index.html: 10000-10016, 15000-15015, y pack 1123
            const isFloppyById = (tokenId >= 10000 && tokenId <= 10016) || 
                                 (tokenId >= 15000 && tokenId <= 15015) ||
                                 tokenId === 1123;
            
            if (isFloppyById) {
                console.log(`💾 Floppy encontrado por ID: ${tokenId}`);
                
                // Asignar nombre específico según index.html
                if (tokenId === 10003) {
                    token.displayName = 'GLITCH Floppy';
                    token.targetContract = window.TraitLABConfig.NEW_FLOPPY_PACK_CONTRACT;
                } else if (tokenId === 10004) {
                    token.displayName = 'GF Floppy';
                    token.targetContract = window.TraitLABConfig.PACK_TOKEN_MINTER_CONTRACT;
                } else if (tokenId === 10005) {
                    token.displayName = 'Golden Floppy';
                    token.targetContract = window.TraitLABConfig.ADRIAN_FLOPPY_DISCS_CONTRACT;
                } else if (tokenId === 10007) {
                    token.displayName = 'NEONpack';
                    token.targetContract = window.TraitLABConfig.ACTION_PACK_10007_CONTRACT;
                } else if (tokenId === 10008) {
                    token.displayName = 'OPTICALpack';
                    token.targetContract = window.TraitLABConfig.ACTION_PACKS_CONTRACT;
                } else if (tokenId === 10009) {
                    token.displayName = 'PUNKSfloppy';
                    token.targetContract = window.TraitLABConfig.ADRIAN_FLOPPY_DISCS_CONTRACT;
                } else if (tokenId === 10010) {
                    token.displayName = 'ComradesUSB';
                    token.targetContract = window.TraitLABConfig.ADRIAN_FLOPPY_DISCS_CONTRACT;
                } else if (tokenId === 10011) {
                    token.displayName = 'PACK10011';
                    token.targetContract = window.TraitLABConfig.ACTION_PACKS_CONTRACT;
                } else if (tokenId === 10012) {
                    token.displayName = 'PACK10012';
                    token.targetContract = window.TraitLABConfig.ACTION_PACKS_CONTRACT;
                } else if (tokenId === 10013) {
                    token.displayName = 'PACK10013';
                    token.targetContract = window.TraitLABConfig.ACTION_PACKS_CONTRACT;
                } else if (tokenId === 10014) {
                    token.displayName = 'PACK10014';
                    token.targetContract = window.TraitLABConfig.OPENPACK_V4_CONTRACT;
                } else if (tokenId === 10015) {
                    token.displayName = 'XMAS \'25 Floppy';
                    token.targetContract = window.TraitLABConfig.ADRIAN_FLOPPY_DISCS_CONTRACT;
                } else if (tokenId === 10016) {
                    token.displayName = 'PACK10016';
                    token.targetContract = window.TraitLABConfig.ACTION_PACKS_CONTRACT;
                } else if (tokenId === 10018) {
                    token.displayName = 'PACK10018';
                    token.targetContract = window.TraitLABConfig.OPENPACK_V4_CONTRACT;
                } else if (tokenId === 1123) {
                    token.displayName = 'CensorPACK';
                    token.targetContract = window.TraitLABConfig.ACTION_PACKS_CONTRACT;
                } else if (tokenId === 15010) {
                    token.displayName = 'Back to Work';
                    token.targetContract = window.TraitLABConfig.OPENPACK_V4_CONTRACT;
                } else {
                    // Otros floppys usan PACK_TOKEN_MINTER_CONTRACT
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
     * Verificar si un token es floppy - SOLO POR ID
     */
    isFloppyToken(token) {
        const tokenId = parseInt(token.tokenId);
        
        // Solo usar rangos específicos de index.html: 10000-10016, 15000-15015, y pack 1123
        return (tokenId >= 10000 && tokenId <= 10016) || 
               (tokenId >= 15000 && tokenId <= 15015) ||
               tokenId === 1123;
    }

    /**
     * Verificar si un token es serum - SOLO POR ID
     */
    isSerumToken(token) {
        const tokenId = parseInt(token.tokenId);
        
        // Solo usar rango específico de index.html: 262144-262147
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
