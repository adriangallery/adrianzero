import { parseClaimError } from '@/lib/web3/utils/batchReads';

/**
 * Human-readable messages for ZEROmoviesFacet2's custom Solidity errors.
 * wagmi/viem decode a revert's custom error name into `error.message` (e.g.
 * `... reverted with the following reason: MovieCurrentlyRented(27)`), so we
 * match on the error *name* first — most specific, least likely to false-
 * positive — before falling back to the generic wallet/ERC20 parser shared
 * with the rest of the app (`parseClaimError`, `lib/web3/utils/batchReads.ts`).
 */
const CUSTOM_ERROR_MESSAGES: Record<string, string> = {
  RentalCapReached: "You've reached your S1+S2 rental cap — return a tape first or buy permanently.",
  HasOverdueRental: 'You have an overdue rental — return or upgrade it before renting another tape.',
  Paused: 'The videoclub is paused right now.',
  MovieCurrentlyRented: 'Someone just rented this tape — try another one.',
  MoviePermanentlyOwned: 'This tape is already owned permanently by someone.',
  MovieNotFound: 'This movie is not in the catalog.',
  MovieNotActive: 'This movie is not available right now.',
  ReservedForGoldenClaim: 'This tape is reserved for the Golden Mint claim window.',
  MintFailed: 'Mint failed on-chain — please try again.',
  TokenNotMintedHere: "This token wasn't minted by ZEROmovies S2.",
  NotRenter: "You're not the current renter of this tape.",
  AlreadyClaimedGolden: 'This wallet already claimed its Golden Mint.',
  ClaimWindowClosed: 'The Golden Mint claim window has closed.',
  InvalidProof: 'Eligibility proof rejected on-chain — try reconnecting your wallet.',
  NoMoviesAvailableForGolden: 'No movies are available for the Golden Mint right now.',
};

/** ERC20 allowance / balance messages (LibERC20 custom errors, decoded by viem). */
const ERC20_ERROR_PATTERNS: Array<[RegExp, string]> = [
  [/ERC20InsufficientAllowance/i, 'Approval was not enough — try again.'],
  [/ERC20InsufficientBalance/i, 'Not enough $ZERO in your wallet for this.'],
];

export function parseMovie2Error(error: unknown): string {
  if (!(error instanceof Error)) return 'Transaction failed. Please try again.';

  for (const [name, message] of Object.entries(CUSTOM_ERROR_MESSAGES)) {
    if (error.message.includes(name)) return message;
  }
  for (const [pattern, message] of ERC20_ERROR_PATTERNS) {
    if (pattern.test(error.message)) return message;
  }

  // Fall back to the shared wallet/ERC20/rate-limit parser used across the app.
  return parseClaimError(error);
}
