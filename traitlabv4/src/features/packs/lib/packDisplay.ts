/**
 * Nombre e imagen de un pack para la UI (F5): primero el catálogo on-chain
 * (`usePackCatalog`, que trae nombre/imagen de AdrianLAB cuando existe),
 * después el metadata de la wallet (`traitsMetadata`, floppy.json), y si no
 * hay nada, un fallback honesto con el id. La imagen cae al GIF de
 * `public/labimages/<id>.gif` de AdrianLAB, que es donde viven los packs.
 */
import type { CatalogPack } from '../data/types';

export const PACK_IMAGE_FALLBACK = (packId: bigint | string | number) =>
  `https://raw.githubusercontent.com/adriangallery/AdrianLAB/main/public/labimages/${packId}.gif`;

export const TRAIT_IMAGE = (traitId: bigint | string | number) =>
  `https://raw.githubusercontent.com/adriangallery/adrianzero/main/traitlabv3/assets/traits/${traitId}.svg`;

export interface PackDisplay {
  name: string;
  image: string;
}

export function packDisplay(
  packId: bigint,
  catalog: readonly CatalogPack[] | undefined,
  metadata: Record<string, { name?: string }> | null | undefined
): PackDisplay {
  const key = packId.toString();
  const fromCatalog = catalog?.find((p) => p.packId === packId);
  const name =
    (fromCatalog?.name && !/^pack\s*#?\d+$/i.test(fromCatalog.name) ? fromCatalog.name : undefined) ??
    metadata?.[key]?.name ??
    fromCatalog?.name ??
    `Pack #${key}`;
  const image = fromCatalog?.image ?? PACK_IMAGE_FALLBACK(key);
  return { name, image };
}

/** «Rare · Top» en la tarjeta del reveal (maqueta Packs.dc.html). */
export function traitSubtitle(meta: { category?: string; rarity?: string } | undefined): string {
  const parts: string[] = [];
  if (meta?.rarity) parts.push(meta.rarity.charAt(0).toUpperCase() + meta.rarity.slice(1).toLowerCase());
  if (meta?.category) parts.push(meta.category.charAt(0).toUpperCase() + meta.category.slice(1).toLowerCase());
  return parts.join(' · ');
}
