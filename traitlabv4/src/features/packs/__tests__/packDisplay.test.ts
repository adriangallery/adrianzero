import { describe, expect, it } from 'vitest';
import { packDisplay, traitSubtitle, PACK_IMAGE } from '../lib/packDisplay';
import type { CatalogPack } from '../data/types';

const cat = (packId: bigint, name: string, image: string | null = null): CatalogPack => ({
  packId,
  name,
  image,
  prices: [],
  maxSupply: null,
  minted: 0n,
  remaining: null,
  active: true,
  saleContract: 'FLOPPY_DISCS',
  saleContractAddress: '0x56b3fcc1417f269138cb7eba1272e8ccfee8ffc8',
  saleBatchId: null,
});

describe('packDisplay', () => {
  it('prefiere el nombre real del catálogo y su imagen', () => {
    const d = packDisplay(10010n, [cat(10010n, 'Comrades USB', 'https://x/10010.gif')], { '10010': { name: 'otro' } });
    expect(d).toEqual({ name: 'Comrades USB', image: 'https://x/10010.gif' });
  });
  it('si el catálogo solo tiene un nombre genérico, usa el metadata de la wallet', () => {
    const d = packDisplay(10001n, [cat(10001n, 'Pack #10001')], { '10001': { name: 'STARTER Floppy' } });
    expect(d.name).toBe('STARTER Floppy');
    expect(d.image).toBe(PACK_IMAGE('10001'));
  });
  it('sin nada, fallback honesto con el id', () => {
    expect(packDisplay(15003n, [], null).name).toBe('Pack #15003');
  });
  it('traitSubtitle → «Rare · Top»', () => {
    expect(traitSubtitle({ rarity: 'rare', category: 'TOP' })).toBe('Rare · Top');
    expect(traitSubtitle({ category: 'EYES' })).toBe('Eyes');
    expect(traitSubtitle(undefined)).toBe('');
  });
});
