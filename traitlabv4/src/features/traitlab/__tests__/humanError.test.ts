import { describe, it, expect } from 'vitest';
import { humanError, isUserRejection } from '@/lib/web3/humanError';

describe('humanError', () => {
  it('reconoce el rechazo del usuario en la wallet', () => {
    expect(humanError(new Error('User rejected the request'))).toBe('Transaction cancelled');
    expect(isUserRejection(new Error('User rejected the request'))).toBe(true);
  });

  it('distingue fondos insuficientes', () => {
    expect(humanError(new Error('insufficient funds for gas'))).toBe('Insufficient funds for gas');
  });

  it('distingue el rate limit de Alchemy/RPC', () => {
    expect(humanError(new Error('429 Too Many Requests'))).toBe('Too many requests, please wait');
  });

  it('cae a un mensaje genérico y seguro cuando no reconoce el patrón', () => {
    expect(humanError(new Error('revert: 0x1234'))).toBe('Transaction failed. Please try again.');
  });

  it('no revienta con valores no-Error', () => {
    expect(() => humanError(undefined)).not.toThrow();
    expect(() => humanError('plain string user rejected')).not.toThrow();
    expect(humanError('plain string user rejected')).toBe('Transaction cancelled');
  });

  it('isUserRejection es false para otros errores', () => {
    expect(isUserRejection(new Error('insufficient funds'))).toBe(false);
  });
});
