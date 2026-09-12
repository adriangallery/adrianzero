import { describe, it, expect } from 'vitest';
import { decodeFunctionResult } from 'viem';
import { ZERO_MOVIES_FACET_2_ABI } from '../zeromoviesFacet2.abi';

/**
 * Regression test for the tuple INDICES `useMovies2Catalog.ts` and
 * `useMovie2Actions.ts` read by magic number (`tuple[4]`, `tuple[6]`,
 * `tuple[8]`…). Those two files never call the contract with named-field
 * destructuring — they index into the raw decoded array — so if the ABI's
 * output order ever drifts from `ZEROmoviesFacet2.sol`'s actual return
 * order, those reads silently start reading the WRONG field (e.g.
 * `unpauseAt` where the code expects `lateFeePerDay`) with no type error,
 * since every field happens to be `uint256`/`address`/`bool`.
 *
 * Decodes REAL raw call data recorded from the live Diamond
 * (`0x542b2B96E9c944260722a86C2ee76166A8e3D0A0`, Base mainnet), captured via:
 *   cast call <diamond> "getMovies2Config()" --rpc-url https://mainnet.base.org
 *   cast call <diamond> "getMovie2RentalInfo(uint256)" 1268 --rpc-url https://mainnet.base.org
 * (2026-09-13, no `(types...)` on the signature — that's what makes `cast`
 * hand back raw undecoded hex instead of pre-decoding it for us, so this
 * test exercises the exact same decode path the app does with our ABI, not
 * `cast`'s own independent ABI knowledge.)
 *
 * Only the ORDER is meaningful here, not the specific values — token 1268
 * (movie #28, Bruce Lee) happens to be a `permanent`, never-rented Budokai
 * prize deposit, so `rentedAt`/`isOverdue`/`daysOverdue`/`lateFeeOwed` are
 * all zero. That's fine: this test would still catch an index swap (e.g.
 * `permanent` and `isOverdue` trading places) because they decode to
 * different literal values (`true` vs `false` in the exact right slot) and
 * `movieId` decodes to a distinctive non-zero `28`.
 */

const RAW_GET_MOVIES2_CONFIG =
  '0x000000000000000000000000dc26efc2196d33fb87a57fa197fa88cb4135542c0000000000000000000000006e369bf0e4e0c106192d606fb6d85836d684da750000000000000000000000006190df4949bad254999cab1e620bd524b04e34b40000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010f0cf064dd59200000000000000000000000000000000000000000000000000a968163f0a57b4000000000000000000000000000000000000000000000000000000000000000093a8000000000000000000000000000000000000000000000003635c9adc5dea00000000000000000000000000000000000000000000000000000000000000000138800000000000000000000000000000000000000000000000000000000000007d00000000000000000000000000000000000000000000000000000000000000bb8' as `0x${string}`;

const RAW_GET_MOVIE2_RENTAL_INFO_1268 =
  '0x000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

describe('ZEROmoviesFacet2 ABI — tuple order regression (real on-chain data)', () => {
  it('getMovies2Config(): index 3=paused, 4=unpauseAt, 6=buyPrice, 7=gracePeriod, 8=lateFeePerDay', () => {
    const result = decodeFunctionResult({
      abi: ZERO_MOVIES_FACET_2_ABI,
      functionName: 'getMovies2Config',
      data: RAW_GET_MOVIES2_CONFIG,
    }) as readonly [string, string, string, boolean, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];

    // paused=true, unpauseAt=0 — recorded while S2 is still paused pre-launch.
    expect(result[3]).toBe(true);
    expect(result[4]).toBe(0n);
    // rentPrice 5,000 ZERO / buyPrice 50,000 ZERO — distinctive, unambiguous values.
    expect(result[5]).toBe(5_000n * 10n ** 18n);
    expect(result[6]).toBe(50_000n * 10n ** 18n);
    // gracePeriod = 7 days in seconds.
    expect(result[7]).toBe(7n * 86_400n);
    // lateFeePerDay = 1,000 ZERO — this is exactly the field
    // `useMovies2Catalog.ts` and `useMovie2Actions.ts` read as `tuple[8]`.
    expect(result[8]).toBe(1_000n * 10n ** 18n);
    // burnBps/s1HolderBps/fiftyFiftyBps = 5000/2000/3000 (sum to 10_000 bps).
    expect(result[9]).toBe(5_000n);
    expect(result[10]).toBe(2_000n);
    expect(result[11]).toBe(3_000n);
  });

  it('getMovie2RentalInfo(): index 0=movieId, 3=permanent, 4=isOverdue, 6=lateFeeOwed', () => {
    const result = decodeFunctionResult({
      abi: ZERO_MOVIES_FACET_2_ABI,
      functionName: 'getMovie2RentalInfo',
      data: RAW_GET_MOVIE2_RENTAL_INFO_1268,
    }) as readonly [bigint, bigint, string, boolean, boolean, bigint, bigint];

    // Token 1268 → movie #28 (Bruce Lee), a Budokai prize pre-deposit:
    // permanent=true, never rented, so rentedAt/isOverdue/daysOverdue/lateFeeOwed are 0.
    expect(result[0]).toBe(28n); // movieId
    expect(result[1]).toBe(0n); // rentedAt
    expect(result[3]).toBe(true); // permanent
    expect(result[4]).toBe(false); // isOverdue
    expect(result[5]).toBe(0n); // daysOverdue
    // index 6 = lateFeeOwed — this is exactly the field
    // `useMovie2Actions.upgradeRent2ToBuy` reads as `info[6]` to compute the
    // approve amount. If this ever silently shifted to `daysOverdue` or
    // some other uint256, the approve amount would be wrong in a way no
    // type system catches.
    expect(result[6]).toBe(0n);
  });
});
