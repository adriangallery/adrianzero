import { describe, it, expect } from 'vitest';
import { computeTraitCardState } from '../lib/traitCardState';

const base = {
  balance: 1,
  isEquipped: false,
  isSelected: false,
  lockedReason: null,
};

describe('computeTraitCardState', () => {
  it('testing: seleccionado pero no equipado on-chain', () => {
    expect(computeTraitCardState({ ...base, isSelected: true })).toEqual({ kind: 'testing' });
  });

  it('equipped: equipado on-chain y sin cambios', () => {
    expect(computeTraitCardState({ ...base, isEquipped: true })).toEqual({ kind: 'equipped' });
  });

  it('equipped: equipado y vuelto a seleccionar (sin cambio neto)', () => {
    expect(computeTraitCardState({ ...base, isEquipped: true, isSelected: true })).toEqual({ kind: 'equipped' });
  });

  it('owned ×N: no equipado, con más de una copia', () => {
    expect(computeTraitCardState({ ...base, balance: 3 })).toEqual({ kind: 'owned', count: 3 });
  });

  it('owned ×1: no equipado, una sola copia', () => {
    expect(computeTraitCardState({ ...base, balance: 1 })).toEqual({ kind: 'owned', count: 1 });
  });

  it('locked: motivo presente gana a cualquier otro estado', () => {
    expect(
      computeTraitCardState({ ...base, isEquipped: true, isSelected: true, lockedReason: 'Solo Gen 2' })
    ).toEqual({ kind: 'locked', reason: 'Solo Gen 2' });
  });
});
