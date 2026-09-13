import { describe, it, expect } from 'vitest';
import { decodeFunctionResult } from 'viem';
import { TRAITS_EXTENSIONS_ABI } from '@/lib/web3/abi';

/**
 * Hotfix de producción 13-sep-2026: `canUserAccessTrait`/`isTraitAvailable`
 * se llamaban con el orden de parámetros equivocado (`tokenId` en el hueco
 * de `traitId`/`requiredAmount`) — mismo selector, resultado real distinto
 * ("Insufficient global supply" siempre). Este test decodifica bytes
 * RAW capturados con `cast call` real contra
 * `0x0995c0dA1ca071b792E852b6Ec531b7cD7d1F8D6` en Base mainnet (13-sep-2026,
 * `cast call <addr> "isTraitAvailable(uint256,uint256)" 444 1
 * --rpc-url https://mainnet.base.org`, sin el sufijo de tipos de retorno
 * para obtener el hex crudo) con `viem#decodeFunctionResult` y el ABI real
 * del front — si el ABI vuelve a declarar los outputs mal (p.ej. solo
 * `bool` en vez de `(bool, string)`, el bug original de este mismo ABI),
 * `decodeFunctionResult` revienta o decodifica basura, no silenciosamente
 * un `false` con motivo inventado.
 */

// isTraitAvailable(444, 1) → caso real disponible.
const IS_TRAIT_AVAILABLE_TRUE_RAW =
  '0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000f547261697420617661696c61626c650000000000000000000000000000000000' as const;

// isTraitAvailable(444, 999999999) → caso real no disponible (requiredAmount absurdo).
const IS_TRAIT_AVAILABLE_FALSE_RAW =
  '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000001a496e73756666696369656e7420676c6f62616c20737570706c79000000000000' as const;

// canUserAccessTrait(0x4943…81C6, 444, 1) → wallet que sí tiene el trait.
const CAN_USER_ACCESS_TRUE_RAW =
  '0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000015557365722063616e206163636573732074726169740000000000000000000000' as const;

// canUserAccessTrait(0x000…dEaD, 444, 1) → wallet sin balance del trait.
const CAN_USER_ACCESS_FALSE_RAW =
  '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000019496e73756666696369656e7420757365722062616c616e636500000000000000' as const;

describe('decodeFunctionResult contra bytes reales de cast call (Base mainnet, 13-sep-2026)', () => {
  it('isTraitAvailable(444, 1) decodifica (true, "Trait available")', () => {
    const [available, reason] = decodeFunctionResult({
      abi: TRAITS_EXTENSIONS_ABI,
      functionName: 'isTraitAvailable',
      data: IS_TRAIT_AVAILABLE_TRUE_RAW,
    });
    expect(available).toBe(true);
    expect(reason).toBe('Trait available');
  });

  it('isTraitAvailable(444, 999999999) decodifica (false, "Insufficient global supply")', () => {
    const [available, reason] = decodeFunctionResult({
      abi: TRAITS_EXTENSIONS_ABI,
      functionName: 'isTraitAvailable',
      data: IS_TRAIT_AVAILABLE_FALSE_RAW,
    });
    expect(available).toBe(false);
    expect(reason).toBe('Insufficient global supply');
  });

  it('canUserAccessTrait(...) con balance decodifica (true, "User can access trait")', () => {
    const [canAccess, reason] = decodeFunctionResult({
      abi: TRAITS_EXTENSIONS_ABI,
      functionName: 'canUserAccessTrait',
      data: CAN_USER_ACCESS_TRUE_RAW,
    });
    expect(canAccess).toBe(true);
    expect(reason).toBe('User can access trait');
  });

  it('canUserAccessTrait(...) sin balance decodifica (false, "Insufficient user balance")', () => {
    const [canAccess, reason] = decodeFunctionResult({
      abi: TRAITS_EXTENSIONS_ABI,
      functionName: 'canUserAccessTrait',
      data: CAN_USER_ACCESS_FALSE_RAW,
    });
    expect(canAccess).toBe(false);
    expect(reason).toBe('Insufficient user balance');
  });
});
