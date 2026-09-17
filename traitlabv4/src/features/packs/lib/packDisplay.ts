/**
 * Nombre e imagen de un pack para la UI (F5): primero el catálogo on-chain
 * (`usePackCatalog`, que trae nombre/imagen de AdrianLAB cuando existe),
 * después el metadata de la wallet (`traitsMetadata`, floppy.json), y si no
 * hay nada, un fallback honesto con el id. La imagen es el arte original del pack en
 * `labimages/` de AdrianLAB: primero `<id>.gif` y, si no existe, `<id>.png` (10019, 1123).
 * NO usar `/api/render/floppy/<id>.png`: devuelve la tarjeta de OpenSea con marco ZEROLAB,
 * no el arte del floppy (17-sep-2026, Adrián).
 */
import type { CatalogPack } from '../data/types';

const LAB_IMAGES = 'https://lab.adrianzero.com/labimages';

export const PACK_IMAGE = (packId: bigint | string | number) => `${LAB_IMAGES}/${packId}.gif`;

export const PACK_IMAGE_FALLBACK = (packId: bigint | string | number) => `${LAB_IMAGES}/${packId}.png`;

/** Mismo SVG que usa la rejilla de TraitLab; lo escribe `launch-items.mjs` para cada trait nuevo
 *  (la copia vieja de traitlabv3 no tenía los traits posteriores, p. ej. PROMPTED 1184–1193). */
export const TRAIT_IMAGE = (traitId: bigint | string | number) => `${LAB_IMAGES}/${traitId}.svg`;

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
  const image = fromCatalog?.image ?? PACK_IMAGE(key);
  return { name, image };
}

/** «Rare · Top» en la tarjeta del reveal (maqueta Packs.dc.html). */
export function traitSubtitle(meta: { category?: string; rarity?: string } | undefined): string {
  const parts: string[] = [];
  if (meta?.rarity) parts.push(meta.rarity.charAt(0).toUpperCase() + meta.rarity.slice(1).toLowerCase());
  if (meta?.category) parts.push(meta.category.charAt(0).toUpperCase() + meta.category.slice(1).toLowerCase());
  return parts.join(' · ');
}
