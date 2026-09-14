import { describe, expect, it } from 'vitest';
import { resolveOwnedSelection } from '../lib/ownedSelection';

describe('resolveOwnedSelection', () => {
  it('mantiene la selección si el ZERO es de la wallet', () => {
    expect(resolveOwnedSelection('12', ['5', '12'])).toEqual({ kind: 'keep' });
  });

  it('con un solo ZERO propio lo selecciona (aunque hubiera el de ejemplo)', () => {
    expect(resolveOwnedSelection('146', ['777'])).toEqual({ kind: 'select', tokenId: '777' });
    expect(resolveOwnedSelection(null, ['777'])).toEqual({ kind: 'select', tokenId: '777' });
  });

  it('con varios ZEROs y selección ajena pide elegir', () => {
    expect(resolveOwnedSelection('146', ['1', '2'])).toEqual({ kind: 'choose' });
  });

  it('sin ZEROs pide elegir (la hoja muestra «Mint your first ZERO»)', () => {
    expect(resolveOwnedSelection('146', [])).toEqual({ kind: 'choose' });
  });
});
