/**
 * Estado visual de una tarjeta de trait en el grid del editor TraitLab.
 * Función pura (sin React, sin wagmi) para poder testearla sin DOM — ver
 * `__tests__/traitCardState.test.ts`.
 *
 * Estados de la maqueta (`design/adrianzero-redesign/Main.dc.html`):
 * probando (borde acento + check), equipado, ×N (más de una copia sin
 * equipar), bloqueado (opacidad + motivo). No hay estado "quitando":
 * el contrato `AdrianTraitsExtensions` no tiene forma de desequipar
 * (13-sep-2026, ver `lib/changes.ts`), así que una vez equipado solo se
 * sustituye aplicando otro trait encima.
 */

export type TraitCardState =
  | { kind: 'testing' }
  | { kind: 'equipped' }
  | { kind: 'owned'; count: number }
  | { kind: 'locked'; reason: string };

export interface TraitCardStateInput {
  /** Balance ERC1155 del usuario para este trait (0 si no lo posee — no debería llegar a la grid). */
  balance: number;
  /** true si `getAllEquippedTraits(tokenId)` incluye este trait ahora mismo on-chain. */
  isEquipped: boolean;
  /** true si el usuario lo ha seleccionado en el editor para esta categoría (puede coincidir con isEquipped). */
  isSelected: boolean;
  /** motivo de bloqueo si `canUserAccessTrait`/`isTraitAvailable` (o una simulación) ya lo descartó; null/undefined = aún no se sabe o no aplica. */
  lockedReason?: string | null;
}

export function computeTraitCardState(input: TraitCardStateInput): TraitCardState {
  const { balance, isEquipped, isSelected, lockedReason } = input;

  if (lockedReason) {
    return { kind: 'locked', reason: lockedReason };
  }
  if (isSelected && !isEquipped) {
    return { kind: 'testing' };
  }
  if (isEquipped) {
    return { kind: 'equipped' };
  }
  return { kind: 'owned', count: Math.max(balance, 1) };
}
