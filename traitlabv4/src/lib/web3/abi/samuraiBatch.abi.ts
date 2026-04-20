/**
 * Samurai Batch Deployer ABI
 * Contract for minting SamuraiZERO NFTs with $ADRIAN
 */

export const SAMURAI_BATCH_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'batchId', type: 'uint256' },
      { internalType: 'uint256', name: 'quantity', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'batchId', type: 'uint256' }],
    name: 'getBatchInfo',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'uint256', name: 'price', type: 'uint256' },
          { internalType: 'uint256', name: 'maxSupply', type: 'uint256' },
          { internalType: 'uint256', name: 'minted', type: 'uint256' },
          { internalType: 'bool', name: 'active', type: 'bool' },
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'tag', type: 'string' },
          { internalType: 'uint256', name: 'startTime', type: 'uint256' },
          { internalType: 'uint256', name: 'endTime', type: 'uint256' },
          { internalType: 'uint256', name: 'maxPerWallet', type: 'uint256' },
        ],
        internalType: 'struct BatchDeployer.BatchInfo',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'batchId', type: 'uint256' },
      { internalType: 'address', name: 'user', type: 'address' },
    ],
    name: 'mintedPerWalletPerBatch',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'tag', type: 'string' }],
    name: 'getTokensByTag',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getTokenTag',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
