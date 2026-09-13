/**
 * Capa de datos de Packs (F5, PLAN_ADRIANZERO_2026-09.md §5.1) — viem +
 * wagmi + react-query, sin UI. Ver `packRegistry.ts` para el porqué del
 * diseño (nada de listas de packId a mano).
 */
export { usePackCatalog } from './usePackCatalog';
export { useMyPacks } from './useMyPacks';
export { useBuyPack } from './useBuyPack';
export type { BuyPackParams, BuyPackResult } from './useBuyPack';
export { useOpenPack } from './useOpenPack';
export type { OpenPackParams } from './useOpenPack';
export { usePackRegistry } from './usePackRegistry';
export { resolvePackOpenContract, buildPackRegistry } from './packRegistry';
export type {
  CatalogPack,
  OwnedPack,
  OpenPackResult,
  PackPrice,
  PackCurrency,
  PackSaleContractName,
  PackOpenContractName,
} from './types';
