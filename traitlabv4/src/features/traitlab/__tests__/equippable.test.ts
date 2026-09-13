import { describe, expect, it } from 'vitest';
import { isEquippableCategory, isEquippableTrait } from '../lib/equippable';

describe('equippable (qué entra en TraitLab)', () => {
  it('excluye packs, pagers, serums y logros por categoría (sin importar mayúsculas)', () => {
    for (const c of ['FLOPPY DISCS', 'floppy discs', 'Packs', 'ACTION PACKS', 'PAGERS', 'SERUMS', 'ACHIEVEMENTS']) {
      expect(isEquippableCategory(c)).toBe(false);
    }
    expect(isEquippableCategory(undefined)).toBe(false);
  });

  it('acepta las categorías reales del contrato', () => {
    for (const c of ['BACKGROUND', 'EYES', 'MOUTH', 'HEAD', 'EAR', 'NECK', 'SKINTRAIT', 'SWAG', 'NOSE', 'GEAR', 'BEARD', 'RANDOMSHIT', 'TOP', 'HAIR', 'HAT']) {
      expect(isEquippableCategory(c)).toBe(true);
    }
  });

  it('caso real: STARTER Floppy (FLOPPY DISCS) no se equipa', () => {
    expect(isEquippableTrait({ tokenId: '10001', category: 'FLOPPY DISCS' })).toBe(false);
  });

  it('no descarta por rango: Studio T-Shit (30301, SWAG on-chain) y PUNK REWARDS (100001, TOP) sí se equipan', () => {
    expect(isEquippableTrait({ tokenId: '30301', category: 'STUDIO' })).toBe(true);
    expect(isEquippableTrait({ tokenId: 100001, category: 'PUNK REWARDS' })).toBe(true);
    expect(isEquippableTrait({ tokenId: '444', category: 'BACKGROUND' })).toBe(true);
  });
});
