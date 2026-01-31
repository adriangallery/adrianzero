export const CRAFTING_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'recipeId', type: 'uint256' }],
    name: 'craft',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'recipeId', type: 'uint256' }],
    name: 'getRecipe',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'uint256[]', name: 'inputs', type: 'uint256[]' },
          { internalType: 'uint256', name: 'output', type: 'uint256' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct Recipe',
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
  {
    inputs: [],
    name: 'getActiveRecipes',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
