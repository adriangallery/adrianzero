/**
 * Pure decision/amount math used by `useMovie2Actions`, pulled out of the
 * hook so it's testable without a wagmi/React runtime (no wallet, no DOM).
 * Every function here mirrors a check `ZEROmoviesFacet2.sol` also makes —
 * getting these wrong either double-approves for no reason or lets a tx
 * revert on-chain after the user already signed.
 */

/** True when the live on-chain allowance is short of what the action needs. */
export function needsApproval(currentAllowanceWei: bigint, amountWei: bigint): boolean {
  if (amountWei <= 0n) return false;
  return currentAllowanceWei < amountWei;
}

/**
 * Total $ZERO an `upgradeRent2ToBuy` call will pull: the buy/rent price
 * diff plus whatever late fee is owed *right now*. Mirrors the contract's
 * own `diff + lateFee` in `upgradeRent2ToBuy` — must be computed from a
 * FRESH on-chain `getMovie2RentalInfo` read, not a client-side estimate,
 * because the late fee accrues per elapsed day and a stale estimate can
 * undershoot the approve amount by the time the tx lands.
 */
export function computeUpgradeTotalWei(buyPriceWei: bigint, rentPriceWei: bigint, lateFeeOwedWei: bigint): bigint {
  return buyPriceWei - rentPriceWei + lateFeeOwedWei;
}

/**
 * Approval amount for `upgradeRent2ToBuy` — the exact total PLUS one extra
 * day's late fee as a finite buffer.
 *
 * Why: `ensureAllowance` reads `getMovie2RentalInfo` and approves the exact
 * `lateFeeOwed` at that moment, but there's a real gap between that read and
 * the `upgradeRent2ToBuy` tx actually landing (user reviews the confirm
 * sheet, wallet popup, block time). If a day boundary (`gracePeriod` +
 * N*1 day) is crossed in that gap, the contract's own `elapsed/1 days` calc
 * bumps `daysOverdue` by one and charges more than what was approved —
 * `LibERC20._spendAllowance` reverts with `ERC20InsufficientAllowance`
 * instead of silently overspending, so the user's tx fails for a reason
 * they can't see in the UI.
 *
 * Approving `exactTotalWei + lateFeePerDayWei` absorbs exactly one such
 * crossing without granting unlimited/infinite allowance — `_spendAllowance`
 * only ever pulls what the contract actually computes, so any unused buffer
 * just stays as leftover allowance for next time. If MORE than one day
 * boundary is crossed (multi-day delay signing a wallet popup), the tx can
 * still revert — that's an explicit, narrow tradeoff over infinite approval.
 */
export function computeUpgradeApprovalWei(exactTotalWei: bigint, lateFeePerDayWei: bigint): bigint {
  return exactTotalWei + lateFeePerDayWei;
}

/**
 * Golden Mint can only fire once eligibility has actually resolved — a
 * ticketCount of 0 or an empty proof would revert on-chain (`InvalidProof`)
 * every time, so gate it client-side instead of burning a signature on a
 * guaranteed revert.
 */
export function canClaimGolden(ticketCount: number, proofLength: number): boolean {
  return ticketCount > 0 && proofLength > 0;
}
