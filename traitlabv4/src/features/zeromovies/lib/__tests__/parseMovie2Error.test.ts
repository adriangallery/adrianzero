import { describe, it, expect } from 'vitest';
import { parseMovie2Error } from '../parseMovie2Error';

function revertError(name: string, args = ''): Error {
  return new Error(
    `The contract function "rentMovie2" reverted with the following reason:\n${name}${args ? `(${args})` : ''}`
  );
}

describe('parseMovie2Error', () => {
  it('maps known ZEROmoviesFacet2 custom errors to friendly copy', () => {
    expect(parseMovie2Error(revertError('MovieCurrentlyRented', '27'))).toMatch(/just rented/i);
    expect(parseMovie2Error(revertError('MoviePermanentlyOwned', '28'))).toMatch(/permanently/i);
    expect(parseMovie2Error(revertError('HasOverdueRental'))).toMatch(/overdue/i);
    expect(parseMovie2Error(revertError('RentalCapReached', '2'))).toMatch(/rental cap/i);
    expect(parseMovie2Error(revertError('Paused'))).toMatch(/paused/i);
    expect(parseMovie2Error(revertError('AlreadyClaimedGolden'))).toMatch(/already claimed/i);
    expect(parseMovie2Error(revertError('ClaimWindowClosed'))).toMatch(/window has closed/i);
    expect(parseMovie2Error(revertError('InvalidProof'))).toMatch(/proof rejected/i);
    expect(parseMovie2Error(revertError('NotRenter', '1268'))).toMatch(/not the current renter/i);
  });

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
