/**
 * Qué se puede equipar en TraitLab y qué no.
 *
 * El inventario ERC-1155 del usuario (walletDataStore) mezcla traits con
 * floppies (packs), serums y logros, y `useTraitsByCategory` los agrupa
 * por la categoría del metadata ("FLOPPY DISCS", "SERUMS", …). El contrato
 * `AdrianTraitsExtensions` rechaza esos tipos al aplicar ("Cannot equip
 * this asset type"), así que no tienen que aparecer como chips de
 * TraitLab (captura de Adrián 13-sep: «FLOPPY DISCS · 2» con dos STARTER
 * Floppy en la rejilla). Los packs se abren en su propia sección (F5).
 *
 * Doble criterio, por si el metadata cambia de nombre: categoría en la
 * lista negra O tokenId fuera del rango de traits (< 10000). Rangos según
 * `features/shop/hooks/useShopItems.ts`: floppies 10000–19999, logros
 * 20000–29999, serums ≥ 262144.
 */

const NON_EQUIPPABLE_CATEGORIES = new Set([
  'FLOPPY DISCS',
  'FLOPPY',
  'FLOPPIES',
  'PACKS',
  'PACK',
  'SERUMS',
  'SERUM',
  'ACHIEVEMENTS',
  'ACHIEVEMENT',
]);

/** Primer tokenId que ya no es un trait equipable (floppies, logros, serums). */
export const FIRST_NON_TRAIT_TOKEN_ID = 10000;

export function isEquippableCategory(category: string | undefined | null): boolean {
  if (!category) return false;
  return !NON_EQUIPPABLE_CATEGORIES.has(category.trim().toUpperCase());
}

export function isEquippableTokenId(tokenId: string | number | bigint): boolean {
  const n = typeof tokenId === 'bigint' ? Number(tokenId) : Number(tokenId);
  return Number.isFinite(n) && n > 0 && n < FIRST_NON_TRAIT_TOKEN_ID;
}

export function isEquippableTrait(trait: { tokenId: string | number; category?: string }): boolean {
  return isEquippableCategory(trait.category) && isEquippableTokenId(trait.tokenId);
}
