/**
 * TraitLab ilimitado (18-sep-2026): Adrián y el artista diseñan ZEROs para marketing con el
 * 100 % de los traits y skins, los tengan o no, y descargan el render con los cambios.
 *
 * Es solo diseño en el navegador: el contrato sigue exigiendo poseer el trait para aplicarlo,
 * así que aquí no se abre ningún permiso on-chain — un trait no poseído solo sirve para el
 * preview y la descarga. Añadir una wallet = añadirla a la lista (en minúsculas).
 */

import { traitImageFor } from '@/stores/walletDataStore';
import type { Trait } from '@/types/nft.types';

const UNLIMITED_WALLETS = new Set([
  '0x4943407105999e3e97efa2035f5cbc64d72581c6', // Adrián (c6)
  '0x51e7c89d5f38a30dc85fcea7c2840f8e8792bd25', // Adrián (iPhone)
  '0x13fcbbbdb6033b6fdd805cc24940a8c05f717f23', // HalfxTiger (artista)
]);

export function isUnlimitedWallet(address: string | null | undefined): boolean {
  return !!address && UNLIMITED_WALLETS.has(address.toLowerCase());
}

interface CatalogEntry {
  tokenId: string;
  name: string;
  category: string;
  fileName: string;
  maxSupply: number;
  rarity?: Trait['rarity'];
}

/**
 * Catálogo completo (traits.json + ogpunks.json) con los traits de la wallet encima: los que
 * posee conservan su balance real (y se pueden aplicar); el resto entra con balance 0.
 */
export function mergeFullCatalog(owned: Trait[], catalog: Record<string, CatalogEntry> | null): Trait[] {
  if (!catalog) return owned;
  const byId = new Map(owned.map((t) => [t.tokenId, t]));
  for (const meta of Object.values(catalog)) {
    if (byId.has(meta.tokenId)) continue;
    byId.set(meta.tokenId, {
      tokenId: meta.tokenId,
      name: meta.name,
      category: meta.category.toUpperCase(),
      fileName: meta.fileName,
      maxSupply: meta.maxSupply,
      balance: 0,
      rarity: meta.rarity,
      image: traitImageFor(meta.tokenId),
    });
  }
  return [...byId.values()];
}

// Safari solo abre la hoja de compartir si llega pegada al toque; bajar el PNG en ese momento
// (2–3 s si el render no está en caché) la hace fallar. Por eso se pide en cuanto el preview
// está listo y el botón usa el blob ya descargado.
const blobCache = new Map<string, Promise<Blob>>();

function fetchBlob(url: string): Promise<Blob> {
  let p = blobCache.get(url);
  if (!p) {
    p = fetch(url, { mode: 'cors' }).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.blob();
    });
    p.catch(() => blobCache.delete(url));
    if (blobCache.size > 20) blobCache.delete(blobCache.keys().next().value as string);
    blobCache.set(url, p);
  }
  return p;
}

export function prefetchRender(url: string): void {
  void fetchBlob(url).catch(() => {});
}

/**
 * Descarga el PNG que se está viendo (con los cambios). En iPhone abre la hoja de compartir
 * («Guardar imagen» → Fotos); en escritorio baja el fichero. Si el navegador no deja leer la
 * imagen, la abre en otra pestaña para guardarla a mano.
 */
export async function downloadRender(url: string, fileName: string): Promise<void> {
  try {
    const blob = await fetchBlob(url);
    const file = new File([blob], fileName, { type: blob.type || 'image/png' });
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file] });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return; // cerró la hoja: no es un error
      }
    }
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  } catch {
    window.open(url, '_blank', 'noopener');
  }
}
