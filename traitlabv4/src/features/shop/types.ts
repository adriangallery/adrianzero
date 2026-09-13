/**
 * Tipos de la Shop (F8): la compra es por ítem desde la hoja de compra
 * (maqueta Shop.dc.html), sin carrito — el ShopFacet sigue aceptando un
 * lote, así que `PurchaseRequest[]` queda por si vuelve el multi-ítem.
 */
export type PaymentToken = 'ZERO' | 'ADRIAN';

export interface PurchaseRequest {
  assetId: number;
  quantity: number;
  /** Reclamar una unidad gratis (freePerWallet) en vez de pagar. */
  useFree: boolean;
}
