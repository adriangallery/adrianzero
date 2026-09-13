/**
 * Qué se puede equipar en TraitLab y qué no.
 *
 * El inventario ERC-1155 del usuario (walletDataStore) mezcla traits con
 * floppies (packs), serums y logros, y `useTraitsByCategory` los agrupa
 * por la categoría del metadata ("FLOPPY DISCS", "PAGERS", "SERUMS", …).
 * El contrato `AdrianTraitsExtensions` rechaza esos tipos al aplicar
 * ("Cannot equip this asset type"), así que no tienen que aparecer como
 * chips de TraitLab (captura de Adrián 13-sep: «FLOPPY DISCS · 2» con dos
 * STARTER Floppy en la rejilla). Los packs se abren en su sección (F5).
 *
 * SOLO lista negra por categoría. La primera versión descartaba además
 * cualquier tokenId ≥ 10000 y el crítico cazó que dejaba fuera traits
 * legítimos: los diseños del T-Shit Studio (30014–35000, categoría
 * sintética 'STUDIO', on-chain SWAG, `canEquipAsset=true`) y los PUNK
 * REWARDS (100001+, on-chain TOP). En `traits.json` todo id ≥ 10000 es un
 * pack (FLOPPY DISCS 10000–10002, PAGERS 15000–15006, ACTION PACKS 15005,
 * `getCategory`="PACKS", `canEquipAsset=false`), y eso lo cubre la lista.
 */

const NON_EQUIPPABLE_CATEGORIES = new Set([
  'FLOPPY DISCS',
  'FLOPPY',
  'FLOPPIES',
  'PACKS',
  'PACK',
  'ACTION PACKS',
  'ACTION PACK',
  'PAGERS',
  'PAGER',
  'SERUMS',
  'SERUM',
  'ACHIEVEMENTS',
  'ACHIEVEMENT',
]);

export function isEquippableCategory(category: string | undefined | null): boolean {
  if (!category) return false;
  return !NON_EQUIPPABLE_CATEGORIES.has(category.trim().toUpperCase());
}

export function isEquippableTrait(trait: { tokenId: string | number; category?: string }): boolean {
  return isEquippableCategory(trait.category);
}
