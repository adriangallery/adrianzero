export const CRAFTING_ABI = [
  // Get specific recipe (returns multiple values, not a tuple)
  {
    inputs: [{ internalType: 'uint256', name: 'recipeId', type: 'uint256' }],
    name: 'getSpecificRecipe',
    outputs: [
      { internalType: 'bool', name: 'active', type: 'bool' },
      { internalType: 'uint256[]', name: 'burnIds', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'burnAmounts', type: 'uint256[]' },
      { internalType: 'uint256', name: 'outId', type: 'uint256' },
      { internalType: 'uint256', name: 'outAmount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Get any recipe (returns multiple values, not a tuple)
  {
    inputs: [{ internalType: 'uint256', name: 'recipeId', type: 'uint256' }],
    name: 'getAnyRecipe',
    outputs: [
      { internalType: 'bool', name: 'active', type: 'bool' },
      { internalType: 'uint256', name: 'burnTotal', type: 'uint256' },
      { internalType: 'uint256', name: 'outId', type: 'uint256' },
      { internalType: 'uint256', name: 'outAmount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Craft functions (try multiple variants as in traitlabold)
  {
    inputs: [{ internalType: 'uint256', name: 'recipeId', type: 'uint256' }],
    name: 'useSpecificRecipe',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
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
    name: 'useAnyRecipe',
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
