/**
 * Nombre e imagen de un pack para la UI (F5): primero el catálogo on-chain
 * (`usePackCatalog`, que trae nombre/imagen de AdrianLAB cuando existe),
 * después el metadata de la wallet (`traitsMetadata`, floppy.json), y si no
 * hay nada, un fallback honesto con el id. La imagen cae al render de AdrianLAB
 * (`/api/render/floppy/<id>.png`), que sirve el GIF o el PNG que tenga cada pack.
 */
import type { CatalogPack } from '../data/types';

export const PACK_IMAGE_FALLBACK = (packId: bigint | string | number) =>
  `https://lab.adrianzero.com/api/render/floppy/${packId}.png`;

export const TRAIT_IMAGE = (traitId: bigint | string | number) =>
  `https://raw.githubusercontent.com/adriangallery/adrianzero/main/traitlabv3/assets/traits/${traitId}.svg`;

/** Fallback para ids sin SVG en traitlabv3 (Studio 30014+, PUNK REWARDS 100001+): el PNG renderizado de AdrianLAB. */
export const TRAIT_IMAGE_FALLBACK = (traitId: bigint | string | number) =>
  `https://raw.githubusercontent.com/adriangallery/AdrianLAB/main/rendered-images/${traitId}.png`;

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
