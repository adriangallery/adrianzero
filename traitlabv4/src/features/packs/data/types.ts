/**
 * Tipos de la capa de datos de Packs (F5, PLAN_ADRIANZERO_2026-09.md §5.1).
 *
 * Todo lo que hay aquí se rellena leyendo el contrato en vivo — nada de
 * `PACK_METADATA`/listas id→nombre/contrato a mano (ese fue el origen de
 * `PACKS_FLOPPIES_MISMATCH_REPORT.md`: nombres y rutas de apertura que se
 * desincronizaban del contrato real).
 */

/** Los 3 contratos que venden packs directamente al usuario. */
export type PackSaleContractName = 'FLOPPY_DISCS' | 'FLOPPY_ETH' | 'FLOPPY_MERKLE';

/** Los 3 contratos que pueden abrir (quemar pack → mintear traits). */
export type PackOpenContractName = 'FLOPPY_DISCS' | 'OPENPACK_V4' | 'ACTION_PACKS';

/** Moneda real leída del contrato — nunca asumida. */
export type PackCurrency = 'ETH' | 'ERC20';

export interface PackPrice {
  currency: PackCurrency;
  /** Address del ERC20 si currency === 'ERC20'; null si es ETH. */
  tokenAddress: `0x${string}` | null;
  /** Precio en unidad mínima (wei / unidad ERC20 con sus decimales). */
  amount: bigint;
}

/** Una entrada del catálogo — un pack que se puede comprar hoy (o que se pudo, con active=false). */
export interface CatalogPack {
  packId: bigint;
  /** Nombre — de AdrianLAB si hay endpoint que lo sirva, si no un fallback genérico con el id. */
  name: string;
  image: string | null;
  /**
   * 1 o 2 entradas: `FloppyDiscs` solo vende en su `paymentToken()` (hoy
   * $ADRIAN — ver discrepancia D-packs en el PR); `FloppyETH`/`FloppyMerkle`
   * pueden aceptar ETH Y token a la vez en el mismo batch (`priceWei` y
   * `priceToken` ambos > 0), así que el precio no es un valor único.
   */
  prices: PackPrice[];
  maxSupply: bigint | null; // null = sin tope conocido en este contrato
  minted: bigint;
  remaining: bigint | null;
  active: boolean;
  saleContract: PackSaleContractName;
  saleContractAddress: `0x${string}`;
  /** batchId en FloppyETH/FloppyMerkle (null en FloppyDiscs, donde packId ES el id de venta). */
  saleBatchId: bigint | null;
}

/** Un pack sin abrir que el usuario ya tiene. */
export interface OwnedPack {
  packId: bigint;
  balance: bigint;
  /** Contrato que puede abrirlo hoy — resuelto en vivo, null si ninguno de los 3 lo tiene configurado. */
  openContract: PackOpenContractName | null;
  openContractAddress: `0x${string}` | null;
}

/** Resultado de abrir un pack: lo obtenido, decodificado del evento real del receipt. */
export interface OpenPackResult {
  txHash: `0x${string}`;
  packId: bigint;
  /** IDs de trait/asset obtenidos (assetIds en FloppyDiscs/ActionPacks, rewards en OpenPack v4). */
  traitIds: bigint[];
  /** Cantidades por traitId cuando el contrato las expone (FloppyDiscs/ActionPacks); OpenPack v4 no las emite (1 c/u). */
  amounts: bigint[] | null;
}
