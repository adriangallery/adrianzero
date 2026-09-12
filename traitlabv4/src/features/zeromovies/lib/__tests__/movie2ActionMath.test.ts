import { describe, it, expect } from 'vitest';
import { needsApproval, computeUpgradeTotalWei, canClaimGolden } from '../movie2ActionMath';

const ZERO = 0n;
const ONE_ZERO = 10n ** 18n;

describe('needsApproval', () => {
  it('is false for a free action (amount 0)', () => {
    expect(needsApproval(ZERO, ZERO)).toBe(false);
    expect(needsApproval(1_000_000n, ZERO)).toBe(false);
  });

  it('is true when the current allowance is strictly below the amount', () => {
    expect(needsApproval(ZERO, 5_000n * ONE_ZERO)).toBe(true);
    expect(needsApproval(4_999n * ONE_ZERO, 5_000n * ONE_ZERO)).toBe(true);
  });

  it('is false once the allowance covers the amount exactly or with room to spare', () => {
    expect(needsApproval(5_000n * ONE_ZERO, 5_000n * ONE_ZERO)).toBe(false);
    expect(needsApproval(6_000n * ONE_ZERO, 5_000n * ONE_ZERO)).toBe(false);
  });
});

describe('computeUpgradeTotalWei', () => {
  const rentPriceWei = 5_000n * ONE_ZERO;
  const buyPriceWei = 50_000n * ONE_ZERO;

  it('is just the buy/rent diff when there is no late fee', () => {
    expect(computeUpgradeTotalWei(buyPriceWei, rentPriceWei, ZERO)).toBe(45_000n * ONE_ZERO);
  });

  it('adds the exact on-chain late fee owed on top of the diff', () => {
    const lateFeeOwed = 3_000n * ONE_ZERO; // e.g. 3 days overdue * 1k ZERO/day
    expect(computeUpgradeTotalWei(buyPriceWei, rentPriceWei, lateFeeOwed)).toBe(48_000n * ONE_ZERO);
  });
});

describe('canClaimGolden', () => {
  it('requires both a positive ticket count and a non-empty proof', () => {
    expect(canClaimGolden(1, 2)).toBe(true);
    expect(canClaimGolden(0, 2)).toBe(false);
    expect(canClaimGolden(1, 0)).toBe(false);
    expect(canClaimGolden(0, 0)).toBe(false);
  });
});
