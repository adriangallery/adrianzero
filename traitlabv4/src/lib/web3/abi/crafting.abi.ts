export const CRAFTING_ABI = [
  // Get specific recipe (burn exact trait IDs)
  {
    inputs: [{ internalType: 'uint256', name: 'recipeId', type: 'uint256' }],
    name: 'getSpecificRecipe',
    outputs: [
      {
        components: [
          { internalType: 'uint256[]', name: 'burnIds', type: 'uint256[]' },
          { internalType: 'uint256[]', name: 'burnAmounts', type: 'uint256[]' },
          { internalType: 'uint256', name: 'outId', type: 'uint256' },
          { internalType: 'uint256', name: 'outAmount', type: 'uint256' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct SpecificRecipe',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Get any recipe (burn any N traits)
  {
    inputs: [{ internalType: 'uint256', name: 'recipeId', type: 'uint256' }],
    name: 'getAnyRecipe',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'burnTotal', type: 'uint256' },
          { internalType: 'uint256', name: 'outId', type: 'uint256' },
          { internalType: 'uint256', name: 'outAmount', type: 'uint256' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct AnyRecipe',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Craft functions
  {
    inputs: [{ internalType: 'uint256', name: 'recipeId', type: 'uint256' }],
    name: 'craftSpecific',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'recipeId', type: 'uint256' },
      { internalType: 'uint256[]', name: 'burnIds', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'burnAmounts', type: 'uint256[]' },
    ],
    name: 'craftAny',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Can craft check
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'uint256', name: 'recipeId', type: 'uint256' },
    ],
    name: 'canCraft',
    outputs: [
      { internalType: 'bool', name: 'can', type: 'bool' },
      { internalType: 'string', name: 'reason', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
