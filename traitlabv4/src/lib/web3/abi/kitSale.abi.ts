/**
 * Kit Sale Contract ABI
 * Contract: 0x20700BE61f2b94E08B16ebD82eE0BA46189B7305
 * Used for purchasing SubZERO (FREE) and AdrianZERO (PAID) kits
 */

export const KIT_SALE_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'kitId', type: 'uint256' }],
    name: 'buyKit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'kitId', type: 'uint256' },
      { internalType: 'uint256', name: 'quantity', type: 'uint256' },
    ],
    name: 'buyMultipleKits',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'kitId', type: 'uint256' }],
    name: 'getKitInfo',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'uint256', name: 'priceInETH', type: 'uint256' },
          { internalType: 'uint256', name: 'adrianTokenAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'floppyTokenId', type: 'uint256' },
          { internalType: 'uint256', name: 'erc721Amount', type: 'uint256' },
          { internalType: 'uint256', name: 'maxPerWallet', type: 'uint256' },
          { internalType: 'uint256', name: 'maxSupply', type: 'uint256' },
          { internalType: 'uint256', name: 'sold', type: 'uint256' },
          { internalType: 'bool', name: 'active', type: 'bool' },
          { internalType: 'string', name: 'tag', type: 'string' },
        ],
        internalType: 'struct KitSale.KitInfo',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'uint256', name: 'kitId', type: 'uint256' },
      { internalType: 'uint256', name: 'quantity', type: 'uint256' },
    ],
    name: 'userCanBuyKit',
    outputs: [
      { internalType: 'bool', name: '', type: 'bool' },
      { internalType: 'string', name: '', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'kitSalePaused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'maxKitsPerTransaction',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAdrianTokenBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
