import { describe, expect, it } from 'vitest';
import { isEquippableCategory, isEquippableTokenId, isEquippableTrait } from '../lib/equippable';

describe('equippable (qué entra en TraitLab)', () => {
  it('excluye packs, serums y logros por categoría (sin importar mayúsculas)', () => {
    expect(isEquippableCategory('FLOPPY DISCS')).toBe(false);
    expect(isEquippableCategory('floppy discs')).toBe(false);
    expect(isEquippableCategory('Packs')).toBe(false);
    expect(isEquippableCategory('SERUMS')).toBe(false);
    expect(isEquippableCategory('ACHIEVEMENTS')).toBe(false);
    expect(isEquippableCategory(undefined)).toBe(false);
  });

  it('acepta las categorías reales del contrato', () => {
    for (const c of ['BACKGROUND', 'EYES', 'MOUTH', 'HEAD', 'EAR', 'NECK', 'SKINTRAIT', 'SWAG', 'NOSE', 'GEAR', 'BEARD', 'RANDOMSHIT', 'TOP', 'HAIR', 'HAT']) {
      expect(isEquippableCategory(c)).toBe(true);
    }
  });

  it('excluye por rango de tokenId aunque la categoría venga con otro nombre', () => {
    expect(isEquippableTokenId(444)).toBe(true);
    expect(isEquippableTokenId('9999')).toBe(true);
    expect(isEquippableTokenId(10000)).toBe(false); // STARTER Floppy y cía.
    expect(isEquippableTokenId(20001)).toBe(false); // logros
    expect(isEquippableTokenId(262144n)).toBe(false); // serums
    expect(isEquippableTokenId(0)).toBe(false);
  });

  it('caso real: STARTER Floppy con categoría FLOPPY DISCS no se equipa', () => {
    expect(isEquippableTrait({ tokenId: '10001', category: 'FLOPPY DISCS' })).toBe(false);
    expect(isEquippableTrait({ tokenId: '444', category: 'BACKGROUND' })).toBe(true);
  });
});
