export const SERUM_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'serumId', type: 'uint256' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'string', name: 'narrativeText', type: 'string' },
    ],
    name: 'useSerum',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'serumId', type: 'uint256' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'serumUsedOnToken',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'hasSuccessfulSerumApplications',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  // F6 (14-sep): verificado en BaseScan → (string targetMutation, uint256 potency)
  {
    inputs: [{ internalType: 'uint256', name: 'serumId', type: 'uint256' }],
    name: 'getSerumInfo',
    outputs: [
      { internalType: 'string', name: 'targetMutation', type: 'string' },
      { internalType: 'uint256', name: 'potency', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
