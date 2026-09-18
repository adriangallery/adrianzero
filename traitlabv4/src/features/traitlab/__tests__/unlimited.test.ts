import { describe, expect, it } from 'vitest';
import { isUnlimitedWallet, mergeFullCatalog } from '../lib/unlimited';
import type { Trait } from '@/types/nft.types';

describe('TraitLab ilimitado', () => {
  it('solo lo tienen las wallets de la lista, sin importar mayúsculas', () => {
    expect(isUnlimitedWallet('0x4943407105999e3E97EFA2035F5cbC64D72581C6')).toBe(true);
    expect(isUnlimitedWallet('0x13FCBBBDB6033B6FDD805CC24940A8C05F717F23')).toBe(true);
    expect(isUnlimitedWallet('0x0000000000000000000000000000000000000001')).toBe(false);
    expect(isUnlimitedWallet(undefined)).toBe(false);
  });

  it('añade todo el catálogo con balance 0 y respeta los que ya tiene la wallet', () => {
    const owned = [{ tokenId: '7', name: 'Mine', category: 'EYES', fileName: '7.svg', maxSupply: 10, balance: 3 }] as Trait[];
    const catalog = {
      '7': { tokenId: '7', name: 'Mine', category: 'eyes', fileName: '7.svg', maxSupply: 10 },
      '8': { tokenId: '8', name: 'Skin', category: 'skintrait', fileName: '8.svg', maxSupply: 5 },
    };
    const merged = mergeFullCatalog(owned, catalog);
    expect(merged).toHaveLength(2);
    expect(merged.find((t) => t.tokenId === '7')?.balance).toBe(3);
    const skin = merged.find((t) => t.tokenId === '8');
    expect(skin?.balance).toBe(0);
    expect(skin?.category).toBe('SKINTRAIT');
    expect(skin?.image?.cachedUrl).toContain('8.svg');
  });

  it('sin catálogo cargado devuelve lo que tiene la wallet', () => {
    const owned = [{ tokenId: '1', balance: 1 }] as Trait[];
    expect(mergeFullCatalog(owned, null)).toBe(owned);
  });
});
