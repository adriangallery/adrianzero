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
 * Golden Mint can only fire once eligibility has actually resolved — a
 * ticketCount of 0 or an empty proof would revert on-chain (`InvalidProof`)
 * every time, so gate it client-side instead of burning a signature on a
 * guaranteed revert.
 */
export function canClaimGolden(ticketCount: number, proofLength: number): boolean {
  return ticketCount > 0 && proofLength > 0;
}
