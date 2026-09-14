import { describe, expect, it } from 'vitest';
import { claimView, findClaim, formatZero, type AirdropList } from '../lib/eligibility';

const entry = { amount: '1362000000000000000000', amountZero: '1362.0', souls: 4, proof: ['0x01' as `0x${string}`] };
const list: AirdropList = {
  name: 'test',
  chainId: 8453,
  diamond: '0x542b2B96E9c944260722a86C2ee76166A8e3D0A0',
  root: '0xabc',
  totalRecipients: 1,
  totalAmount: '1362000000000000000000',
  claims: { '0x4adfab529737192e815a56c49fe181a7cb4be2f4': entry },
};

describe('findClaim', () => {
  it('encuentra la wallet sin importar mayúsculas (checksum vs minúsculas)', () => {
    expect(findClaim(list, '0x4AdFaB529737192E815a56c49fE181A7CB4Be2F4')).toEqual(entry);
  });
  it('devuelve null sin lista, sin dirección o fuera de la lista', () => {
    expect(findClaim(undefined, '0x4AdFaB529737192E815a56c49fE181A7CB4Be2F4')).toBeNull();
    expect(findClaim(list, undefined)).toBeNull();
    expect(findClaim(list, '0x000000000000000000000000000000000000dEaD')).toBeNull();
  });
});

describe('formatZero', () => {
  it('agrupa miles y quita decimales', () => {
    expect(formatZero('25000.0')).toBe('25,000');
    expect(formatZero('1362.4')).toBe('1,362');
  });
});

describe('claimView', () => {
  const base = { isConnected: true, isLoading: false, hasError: false, entry, hasClaimed: false, isActive: true, onchainRoot: '0xABC', listRoot: '0xabc' };
  it('recorre los estados en orden de prioridad', () => {
    expect(claimView({ ...base, isConnected: false })).toBe('disconnected');
    expect(claimView({ ...base, hasError: true })).toBe('error');
    expect(claimView({ ...base, isLoading: true })).toBe('loading');
    expect(claimView({ ...base, entry: null })).toBe('not-eligible');
    expect(claimView({ ...base, hasClaimed: true })).toBe('claimed');
    expect(claimView({ ...base, onchainRoot: '0xdef' })).toBe('root-mismatch');
    expect(claimView({ ...base, isActive: false })).toBe('closed');
    expect(claimView(base)).toBe('ready');
  });
  it('ya reclamado gana a «cerrado»', () => {
    expect(claimView({ ...base, hasClaimed: true, isActive: false })).toBe('claimed');
  });
});
