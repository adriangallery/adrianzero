// OpenPack V4 ABI
export const OPENPACK_V4_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'packId', type: 'uint256' },
      { internalType: 'uint32', name: 'quantity', type: 'uint32' },
    ],
    name: 'openPacks',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Pack Token Minter ABI
export const PACK_TOKEN_MINTER_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'packId', type: 'uint256' }],
    name: 'openPack',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Action Packs ABI
export const ACTION_PACKS_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'packId', type: 'uint256' }],
    name: 'openPack',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'uint256', name: 'packId', type: 'uint256' },
    ],
    name: 'canOpenPack',
    outputs: [
      { internalType: 'bool', name: 'canOpen', type: 'bool' },
      { internalType: 'string', name: 'reason', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'packId', type: 'uint256' }],
    name: 'packConfigs',
    outputs: [
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'bool', name: 'active', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Floppy Discs ABI
export const FLOPPY_DISCS_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'packId', type: 'uint256' }],
    name: 'openPack',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
