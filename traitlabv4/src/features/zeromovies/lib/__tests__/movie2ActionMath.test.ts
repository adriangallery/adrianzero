import { describe, it, expect } from 'vitest';
import {
  needsApproval,
  computeUpgradeTotalWei,
  computeUpgradeApprovalWei,
  canClaimGolden,
} from '../movie2ActionMath';

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

describe('computeUpgradeApprovalWei', () => {
  const rentPriceWei = 5_000n * ONE_ZERO;
  const buyPriceWei = 50_000n * ONE_ZERO;
  const lateFeePerDayWei = 1_000n * ONE_ZERO;

  it('pads the exact total by exactly one day of late fee (the day-boundary race buffer)', () => {
    const exactTotal = computeUpgradeTotalWei(buyPriceWei, rentPriceWei, ZERO); // 45,000 ZERO
    // Regression for the day-boundary allowance race (M3c, coordinator
    // 2026-09-13): approving the EXACT total read from a stale
    // getMovie2RentalInfo can undershoot if a day boundary passes before
    // the tx lands — the contract then charges one more day's late fee
    // than what was approved, and _spendAllowance reverts instead of
    // silently overspending. The fix pads the approval by ONE extra day
    // (finite, not infinite) so that single-day race is absorbed.
    expect(computeUpgradeApprovalWei(exactTotal, lateFeePerDayWei)).toBe(exactTotal + 1_000n * ONE_ZERO);
    expect(computeUpgradeApprovalWei(exactTotal, lateFeePerDayWei)).toBe(46_000n * ONE_ZERO);
  });

  it('still pads by one day even when the exact total already includes accrued late fees', () => {
    const lateFeeOwed = 3_000n * ONE_ZERO; // already 3 days overdue
    const exactTotal = computeUpgradeTotalWei(buyPriceWei, rentPriceWei, lateFeeOwed); // 48,000 ZERO
    expect(computeUpgradeApprovalWei(exactTotal, lateFeePerDayWei)).toBe(49_000n * ONE_ZERO);
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
