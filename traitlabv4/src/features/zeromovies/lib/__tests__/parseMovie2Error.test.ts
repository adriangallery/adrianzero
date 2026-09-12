import { describe, it, expect } from 'vitest';
import { parseMovie2Error, CUSTOM_ERROR_MESSAGES } from '../parseMovie2Error';

function revertError(name: string, args = ''): Error {
  return new Error(
    `The contract function "rentMovie2" reverted with the following reason:\n${name}${args ? `(${args})` : ''}`
  );
}

describe('parseMovie2Error — every declared ZEROmoviesFacet2 custom error', () => {
  it('maps EVERY entry in CUSTOM_ERROR_MESSAGES to its own exact message (full-coverage guard)', () => {
    // Loops the map instead of hand-picking a subset, so a new error added
    // to CUSTOM_ERROR_MESSAGES without a matching assertion here can't
    // silently ship un-tested, and a typo'd error NAME (which only matches
    // by substring) can't silently fall through to a neighbour's message.
    for (const [name, expectedMessage] of Object.entries(CUSTOM_ERROR_MESSAGES)) {
      expect(parseMovie2Error(revertError(name))).toBe(expectedMessage);
    }
  });

  // M3c follow-up (coordinator, 2026-09-13): explicit dedicated cases for
  // the Golden Mint errors and the two "this movie is taken" equivalents
  // `ZEROmoviesFacet2.sol` actually declares (there is no literal
  // `MovieTaken` in the contract — `MovieCurrentlyRented` covers an active
  // rental, `MoviePermanentlyOwned` covers a permanent buy/Golden Mint).
  it('InvalidProof — Golden Mint / cross-season claim proof rejected on-chain', () => {
    expect(parseMovie2Error(revertError('InvalidProof'))).toBe(
      'Eligibility proof rejected on-chain — try reconnecting your wallet.'
    );
  });

  it('AlreadyClaimedGolden — one-shot Golden Mint already redeemed by this wallet', () => {
    expect(parseMovie2Error(revertError('AlreadyClaimedGolden'))).toBe(
      'This wallet already claimed its Golden Mint.'
    );
  });

  it('ClaimWindowClosed — 7-day Golden Mint claim window has elapsed', () => {
    expect(parseMovie2Error(revertError('ClaimWindowClosed'))).toBe(
      'The Golden Mint claim window has closed.'
    );
  });

  it('MovieCurrentlyRented — the ".sol" equivalent of "this movie is taken" (active rental)', () => {
    expect(parseMovie2Error(revertError('MovieCurrentlyRented', '27'))).toBe(
      'Someone just rented this tape — try another one.'
    );
  });

  it('MoviePermanentlyOwned — the ".sol" equivalent of "this movie is taken" (bought/golden-minted)', () => {
    expect(parseMovie2Error(revertError('MoviePermanentlyOwned', '28'))).toBe(
      'This tape is already owned permanently by someone.'
    );
  });

  it('matches by error NAME even with extra revert framing/args around it', () => {
    expect(parseMovie2Error(revertError('HasOverdueRental'))).toMatch(/overdue/i);
    expect(parseMovie2Error(revertError('RentalCapReached', '2'))).toMatch(/rental cap/i);
    expect(parseMovie2Error(revertError('Paused'))).toMatch(/paused/i);
    expect(parseMovie2Error(revertError('NotRenter', '1268'))).toMatch(/not the current renter/i);
  });
});

describe('parseMovie2Error — non-custom-error fallbacks', () => {
  it('maps ERC20 allowance/balance errors', () => {
    expect(parseMovie2Error(new Error('ERC20InsufficientAllowance(0x1,0,5000)'))).toMatch(/approval/i);
    expect(parseMovie2Error(new Error('ERC20InsufficientBalance(0x1,0,5000)'))).toMatch(/not enough \$zero/i);
  });

  it('falls back to the shared wallet/rate-limit parser for generic errors', () => {
    expect(parseMovie2Error(new Error('User rejected the request'))).toBe('Transaction cancelled');
    expect(parseMovie2Error(new Error('insufficient funds for gas'))).toMatch(/insufficient funds/i);
    expect(parseMovie2Error(new Error('429 Too Many Requests'))).toMatch(/too many requests/i);
  });

  it('never throws on non-Error input and returns a generic message', () => {
    expect(parseMovie2Error('not an error')).toBe('Transaction failed. Please try again.');
    expect(parseMovie2Error(undefined)).toBe('Transaction failed. Please try again.');
  });
});
