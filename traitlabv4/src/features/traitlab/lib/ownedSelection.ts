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
