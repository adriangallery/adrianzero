import { usePackRegistry } from './usePackRegistry';
import type { CatalogPack } from './types';

/**
 * Packs a la venta, leídos on-chain (FloppyDiscs.getPackConfig +
 * FloppyETH/FloppyMerkle.getBatchSummary) — nada de `PACK_METADATA` a
 * mano. `OpenPack v4`/`ActionPacks` no aparecen aquí porque no venden
 * (solo abren, ver `packRegistry.ts`); un pack de esos que el usuario ya
 * tenga sale en `useMyPacks`, no en el catálogo.
 */
export function usePackCatalog() {
  const registry = usePackRegistry();

  return {
    ...registry,
    data: (registry.data?.catalog ?? []) as CatalogPack[],
  };
}
