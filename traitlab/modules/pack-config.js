/**
 * TRAITLAB - Pack Configuration (Single Source of Truth)
 * Centraliza TODA la configuración de packs, floppys y serums
 *
 * Para agregar un nuevo pack:
 * 1. Agregar 1 línea en PACK_CONFIGS con tokenId, name, contract, method
 * 2. Actualizar rango en TOKEN_RANGES si es necesario
 * 3. Agregar imagen en assets/traits/
 *
 * ¡ESO ES TODO! No más 7+ lugares a actualizar.
 */

// ============================================
// RANGOS DE TOKENS
// ============================================

export const TOKEN_RANGES = {
    FLOPPYS: {
        PRIMARY: { min: 10000, max: 10019 },
        SECONDARY: { min: 15000, max: 15015 },
        SPECIAL: [1123]  // CensorPACK
    },
    SERUMS: {
        PRIMARY: { min: 262144, max: 262147 }
    }
};

// ============================================
// CONFIGURACIÓN DE PACKS (21 packs)
// ============================================

export const PACK_CONFIGS = {
    // ===== OpenPackV4 Contract (13 packs) =====
    10000: { name: null, contract: 'OPENPACK_V4', method: 'openPacks' },
    10001: { name: null, contract: 'OPENPACK_V4', method: 'openPacks' },
    10002: { name: null, contract: 'OPENPACK_V4', method: 'openPacks' },
    10003: { name: 'GLITCH Floppy', contract: 'OPENPACK_V4', method: 'openPacks' },
    10004: { name: 'GF Floppy', contract: 'OPENPACK_V4', method: 'openPacks' },
    10005: { name: 'Golden Floppy', contract: 'OPENPACK_V4', method: 'openPacks' },
    10009: { name: 'PUNKSfloppy', contract: 'OPENPACK_V4', method: 'openPacks' },
    10010: { name: 'ComradesUSB', contract: 'OPENPACK_V4', method: 'openPacks' },
    10013: { name: 'PACK10013', contract: 'OPENPACK_V4', method: 'openPacks' },
    10014: { name: 'PACK10014', contract: 'OPENPACK_V4', method: 'openPacks' },
    10015: { name: "XMAS '25 Floppy", contract: 'OPENPACK_V4', method: 'openPacks' },
    10018: { name: 'PACK10018', contract: 'OPENPACK_V4', method: 'openPacks' },
    15010: { name: 'Back to Work', contract: 'OPENPACK_V4', method: 'openPacks' },

    // ===== ActionPacks Contract (7 packs) =====
    10007: { name: 'NEONpack', contract: 'ACTION_PACK_10007', method: 'openPack' },
    10008: { name: 'OPTICALpack', contract: 'ACTION_PACKS', method: 'openPack' },
    10011: { name: 'PACK10011', contract: 'ACTION_PACKS', method: 'openPack' },
    10012: { name: 'PACK10012', contract: 'ACTION_PACKS', method: 'openPack' },
    10016: { name: 'PACK10016', contract: 'ACTION_PACKS', method: 'openPack' },
    10019: { name: 'PACK10019', contract: 'ACTION_PACKS', method: 'openPack' },
    1123: { name: 'CensorPACK', contract: 'ACTION_PACKS', method: 'openPack' },

    // ===== FloppyDiscs Contract (1 pack) =====
    10006: { name: null, contract: 'ADRIAN_FLOPPY_DISCS', method: 'openPack' }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Verifica si un tokenId es un floppy/pack
 * @param {number|string} tokenId - ID del token
 * @returns {boolean} - true si es floppy
 */
export function isFloppyToken(tokenId) {
    const id = parseInt(tokenId);
    return (id >= TOKEN_RANGES.FLOPPYS.PRIMARY.min &&
            id <= TOKEN_RANGES.FLOPPYS.PRIMARY.max) ||
           (id >= TOKEN_RANGES.FLOPPYS.SECONDARY.min &&
            id <= TOKEN_RANGES.FLOPPYS.SECONDARY.max) ||
           TOKEN_RANGES.FLOPPYS.SPECIAL.includes(id);
}

/**
 * Verifica si un tokenId es un serum
 * @param {number|string} tokenId - ID del token
 * @returns {boolean} - true si es serum
 */
export function isSerumToken(tokenId) {
    const id = parseInt(tokenId);
    return id >= TOKEN_RANGES.SERUMS.PRIMARY.min &&
           id <= TOKEN_RANGES.SERUMS.PRIMARY.max;
}

/**
 * Obtiene la configuración de un pack
 * @param {number|string} tokenId - ID del token
 * @returns {object|null} - Config del pack o null
 */
export function getPackConfig(tokenId) {
    return PACK_CONFIGS[parseInt(tokenId)] || null;
}

/**
 * Verifica si un tokenId es un trait (ERC1155 que no es floppy ni serum)
 * @param {number|string} tokenId - ID del token
 * @returns {boolean} - true si es trait
 */
export function isTraitToken(tokenId) {
    return !isFloppyToken(tokenId) && !isSerumToken(tokenId);
}

// ============================================
// EXPORTAR COMO GLOBAL (para compatibilidad)
// ============================================

if (typeof window !== 'undefined') {
    window.PackConfig = {
        TOKEN_RANGES,
        PACK_CONFIGS,
        isFloppyToken,
        isSerumToken,
        getPackConfig,
        isTraitToken
    };
    console.log('✅ PackConfig: Single source of truth cargado');
}
