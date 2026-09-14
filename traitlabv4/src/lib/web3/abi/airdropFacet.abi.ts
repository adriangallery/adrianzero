/**
 * AirdropFacet del Diamond $ZERO (0x542b…D0A0) — plan A4b-2.
 * Firmas y errores sacados de ZEROtoken/zero-diamond/src/facets/AirdropFacet.sol
 * e interfaces/IAirdropFacet.sol (14-sep-2026).
 */
export const AIRDROP_FACET_ABI = [
  {
    type: 'function',
    name: 'claim',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'proof', type: 'bytes32[]' },
    ],
    outputs: [],
  },
  { type: 'function', name: 'hasClaimed', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'isAirdropActive', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'airdropPool', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'merkleRoot', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'bytes32' }] },
  { type: 'error', name: 'AirdropNotActive', inputs: [] },
  { type: 'error', name: 'AlreadyClaimed', inputs: [] },
  { type: 'error', name: 'InvalidProof', inputs: [] },
  { type: 'error', name: 'InsufficientAirdropPool', inputs: [] },
  {
    type: 'event',
    name: 'AirdropClaimed',
    inputs: [
      { name: 'account', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;
