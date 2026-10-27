import { describe, it, expect } from 'vitest';
import { decodeFunctionResult } from 'viem';
import { ZOMBIE_MINT_FACET_ABI } from '../zombieMintFacet.abi';

/**
 * Raw `zombieGetConfig()` return captured from the live Diamond on Base
 * (27-oct-2026, facet 0x1A9e…64e8, paused):
 *   cast call 0x542b2B96E9c944260722a86C2ee76166A8e3D0A0 "zombieGetConfig()" --rpc-url https://mainnet.base.org
 * Guards the tuple order useZombieConfig reads by index (data[1] paused … data[4] maxPerWallet).
 */
const RAW =
  '0x000000000000000000000000dc26efc2196d33fb87a57fa197fa88cb4135542c0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e8000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000070000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000003';

describe('ZombieMintFacet ABI vs live Diamond', () => {
  it('decodes zombieGetConfig in the expected order', () => {
    const r = decodeFunctionResult({ abi: ZOMBIE_MINT_FACET_ABI, functionName: 'zombieGetConfig', data: RAW });
    expect(r[0].toLowerCase()).toBe('0xdc26efc2196d33fb87a57fa197fa88cb4135542c');
    expect(r[1]).toBe(true); // paused
    expect(r[2]).toBe(0n); // totalMinted
    expect(r[3]).toBe(1000n); // maxSupply
    expect(r[4]).toBe(3n); // maxPerWallet
    expect(r[5]).toEqual([7, 2, 1, 4, 3]); // slotCounts = options per slot in zombie-spec.json
  });
});
