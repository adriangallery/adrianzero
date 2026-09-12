/**
 * Estado visual de una tarjeta de trait en el grid del editor TraitLab.
 * Función pura (sin React, sin wagmi) para poder testearla sin DOM — ver
 * `__tests__/traitCardState.test.ts`.
 *
 * Estados de la maqueta (`design/adrianzero-redesign/Main.dc.html`):
 * probando (borde acento + check), equipado, ×N (más de una copia sin
 * equipar), bloqueado (opacidad + motivo), "Conseguir más en Shop".
 */

export type TraitCardState =
  | { kind: 'testing' }
  | { kind: 'equipped' }
  | { kind: 'owned'; count: number }
  | { kind: 'locked'; reason: string };

export interface TraitCardStateInput {
  /** Balance ERC1155 del usuario para este trait (0 si no lo posee — no debería llegar a la grid). */
  balance: number;
  /** true si `getAppliedTraits(tokenId)` incluye este trait ahora mismo on-chain. */
  isEquipped: boolean;
  /** true si el usuario lo ha seleccionado en el editor para esta categoría (puede coincidir con isEquipped). */
  isSelected: boolean;
  /** true si este trait ESTABA equipado y el usuario acaba de quitarlo (pending remove). */
  isPendingRemoval: boolean;
  /** motivo de bloqueo si `canApplyTraits`/una regla local ya lo descartó; null/undefined = aún no se sabe o no aplica. */
  lockedReason?: string | null;
}

export function computeTraitCardState(input: TraitCardStateInput): TraitCardState {
  const { balance, isEquipped, isSelected, isPendingRemoval, lockedReason } = input;

  if (lockedReason) {
    return { kind: 'locked', reason: lockedReason };
  }
  if (isPendingRemoval) {
    // Ya no cuenta como equipado tras la quita provisional: vuelve a "owned".
    return { kind: 'owned', count: Math.max(balance, 1) };
  }
  if (isSelected && !isEquipped) {
    return { kind: 'testing' };
  }
  if (isEquipped) {
    return { kind: 'equipped' };
  }
  return { kind: 'owned', count: Math.max(balance, 1) };
}
