/**
 * OGCLAIM Contract ABI
 * Contract: 0x31D66caBC1D6E65a4947D19ed22FB63ee2C8D84b
 */

export const OGCLAIM_ABI = [
  {
    inputs: [{ name: 'punkId', type: 'uint256' }],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'punkIds', type: 'uint256[]' }],
    name: 'claimBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'punkId', type: 'uint256' }],
    name: 'isClaimed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getClaimedCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
