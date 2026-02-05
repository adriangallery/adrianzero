/**
 * Adrian Shop ABI
 * Contract for purchasing traits, floppies, and serums with $ADRIAN
 */

export const ADRIAN_SHOP_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'offset', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getActiveItems',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'assetId', type: 'uint256' },
          { internalType: 'uint256', name: 'price', type: 'uint256' },
          { internalType: 'uint256', name: 'quantityAvailable', type: 'uint256' },
          { internalType: 'uint256', name: 'sold', type: 'uint256' },
          { internalType: 'uint256', name: 'startTime', type: 'uint256' },
          { internalType: 'uint256', name: 'endTime', type: 'uint256' },
          { internalType: 'bool', name: 'active', type: 'bool' },
          { internalType: 'uint256', name: 'maxPerWallet', type: 'uint256' },
          { internalType: 'bool', name: 'canPurchase', type: 'bool' },
          { internalType: 'string', name: 'purchaseError', type: 'string' },
          { internalType: 'bool', name: 'hasAllowlist', type: 'bool' },
          { internalType: 'uint256', name: 'freePerWallet', type: 'uint256' },
          { internalType: 'uint256', name: 'freeUsedByUser', type: 'uint256' },
          { internalType: 'uint256', name: 'freeRemaining', type: 'uint256' },
          { internalType: 'bool', name: 'isAllowlisted', type: 'bool' },
        ],
        internalType: 'struct AdrianShop.ShopItemView[]',
        name: 'items',
        type: 'tuple[]',
      },
      { internalType: 'uint256', name: 'totalActive', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'assetId', type: 'uint256' },
      { internalType: 'address', name: 'user', type: 'address' },
    ],
    name: 'getShopItemView',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'assetId', type: 'uint256' },
          { internalType: 'uint256', name: 'price', type: 'uint256' },
          { internalType: 'uint256', name: 'quantityAvailable', type: 'uint256' },
          { internalType: 'uint256', name: 'sold', type: 'uint256' },
          { internalType: 'uint256', name: 'startTime', type: 'uint256' },
          { internalType: 'uint256', name: 'endTime', type: 'uint256' },
          { internalType: 'bool', name: 'active', type: 'bool' },
          { internalType: 'uint256', name: 'maxPerWallet', type: 'uint256' },
          { internalType: 'bool', name: 'canPurchase', type: 'bool' },
          { internalType: 'string', name: 'purchaseError', type: 'string' },
          { internalType: 'bool', name: 'hasAllowlist', type: 'bool' },
          { internalType: 'uint256', name: 'freePerWallet', type: 'uint256' },
          { internalType: 'uint256', name: 'freeUsedByUser', type: 'uint256' },
          { internalType: 'uint256', name: 'freeRemaining', type: 'uint256' },
          { internalType: 'bool', name: 'isAllowlisted', type: 'bool' },
        ],
        internalType: 'struct AdrianShop.ShopItemView',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'assetId', type: 'uint256' },
      { internalType: 'uint256', name: 'quantity', type: 'uint256' },
      { internalType: 'bool', name: 'useFree', type: 'bool' },
    ],
    name: 'purchaseItem',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'uint256', name: 'assetId', type: 'uint256' },
          { internalType: 'uint256', name: 'quantity', type: 'uint256' },
          { internalType: 'bool', name: 'useFree', type: 'bool' },
        ],
        internalType: 'struct AdrianShop.PurchaseRequest[]',
        name: 'requests',
        type: 'tuple[]',
      },
    ],
    name: 'batchPurchase',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'assetId', type: 'uint256' },
      { internalType: 'uint256', name: 'quantity', type: 'uint256' },
    ],
    name: 'claimFreeItem',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
