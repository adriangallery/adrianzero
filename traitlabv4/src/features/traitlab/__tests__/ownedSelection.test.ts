import { describe, expect, it } from 'vitest';
import { resolveOwnedSelection, shouldResolveOwnedSelection } from '../lib/ownedSelection';

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

describe('shouldResolveOwnedSelection (bug 15-sep: «tengo que elegir 2 veces mi ZERO»)', () => {
  const A = '0x4943407105999e3E97EFA2035F5cbC64D72581C6';
  const base = { address: A, isLoading: false, cachedFor: A.toLowerCase(), fetchedAt: 1, resolvedFor: null, userPicked: false };

  it('decide cuando la lista de esa wallet ya está cargada', () => {
    expect(shouldResolveOwnedSelection(base)).toBe(true);
  });

  it('no decide con la lista vacía de antes de cargar (sin fecha ni wallet)', () => {
    expect(shouldResolveOwnedSelection({ ...base, cachedFor: null, fetchedAt: null })).toBe(false);
  });

  it('no decide mientras carga ni con la lista de otra wallet', () => {
    expect(shouldResolveOwnedSelection({ ...base, isLoading: true })).toBe(false);
    expect(shouldResolveOwnedSelection({ ...base, cachedFor: '0x000000000000000000000000000000000000dead' })).toBe(false);
  });

  it('no vuelve a decidir para la misma wallet cuando la lista se recarga', () => {
    expect(shouldResolveOwnedSelection({ ...base, resolvedFor: A.toLowerCase(), fetchedAt: 2 })).toBe(false);
  });

  it('nunca pisa un ZERO elegido en la hoja', () => {
    expect(shouldResolveOwnedSelection({ ...base, userPicked: true })).toBe(false);
  });

  it('sin wallet no decide', () => {
    expect(shouldResolveOwnedSelection({ ...base, address: null })).toBe(false);
  });
});
