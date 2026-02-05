/**
 * AdrianZERO Mint with $ADRIAN ABI
 * Contract for minting AdrianZERO NFTs with $ADRIAN tokens
 */

export const ADRIAN_ZERO_MINT_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'quantity', type: 'uint256' }],
    name: 'mintMultiplePublic',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentBatchInfo',
    outputs: [
      { internalType: 'uint256', name: 'batchId', type: 'uint256' },
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'uint256', name: 'price', type: 'uint256' },
      { internalType: 'uint256', name: 'minted', type: 'uint256' },
      { internalType: 'uint256', name: 'maxSupply', type: 'uint256' },
      { internalType: 'bool', name: 'active', type: 'bool' },
      { internalType: 'uint256', name: 'startTime', type: 'uint256' },
      { internalType: 'uint256', name: 'endTime', type: 'uint256' },
      { internalType: 'bool', name: 'useMerkleWhitelist', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
