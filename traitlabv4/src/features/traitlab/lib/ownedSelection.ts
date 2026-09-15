/**
 * Qué ZERO enseñar al conectar la wallet en TraitLab (feedback de Adrián, 14-sep-2026:
 * «confusión con el ZERO por defecto al conectar; debería mostrar tus ZEROs directamente»).
 *
 * Sin wallet la app enseña un ZERO de ejemplo (#146) y puede recordar el último usado
 * en el navegador. Al conectar, si lo seleccionado no es de la wallet:
 *  - con 1 ZERO propio → se selecciona ese;
 *  - con varios → se abre la hoja con los propios, sin nada preseleccionado;
 *  - sin ZEROs → hoja vacía con «Mint your first ZERO».
 */

export type OwnedSelectionAction =
  | { kind: 'keep' }
  | { kind: 'select'; tokenId: string }
  | { kind: 'choose' };

export function resolveOwnedSelection(selectedTokenId: string | null, ownedTokenIds: readonly string[]): OwnedSelectionAction {
  if (selectedTokenId && ownedTokenIds.includes(selectedTokenId)) return { kind: 'keep' };
  if (ownedTokenIds.length === 1) return { kind: 'select', tokenId: ownedTokenIds[0] };
  return { kind: 'choose' };
}

export interface OwnedSelectionReadiness {
  /** Wallet conectada (null si no hay) */
  address: string | null;
  isLoading: boolean;
  /** Wallet para la que se cargó la lista de ZEROs (walletDataStore.zerosCachedFor) */
  cachedFor: string | null;
  /** Momento de la última carga de esa lista (walletDataStore.zerosFetchedAt) */
  fetchedAt: number | null;
  /** Wallet para la que ya se decidió la selección en esta visita */
  resolvedFor: string | null;
  /** El usuario ya eligió un ZERO en la hoja */
  userPicked: boolean;
}

/**
 * Cuándo aplicar resolveOwnedSelection. Bug de producción 15-sep-2026 («tengo que elegir 2 veces mi ZERO»):
 * el efecto se ejecutaba con la lista vacía de antes de cargar (al conectar, `isLoading` aún es false) y en
 * cada recarga de la lista, así que borraba el ZERO recién elegido y reabría la hoja. Ahora se decide una
 * sola vez por wallet, con su lista ya cargada, y nunca encima de lo que el usuario eligió en la hoja.
 */
export function shouldResolveOwnedSelection(s: OwnedSelectionReadiness): boolean {
  if (!s.address || s.isLoading || s.userPicked) return false;
  const addr = s.address.toLowerCase();
  if (s.resolvedFor && s.resolvedFor.toLowerCase() === addr) return false;
  return Boolean(s.fetchedAt) && Boolean(s.cachedFor) && (s.cachedFor as string).toLowerCase() === addr;
}
