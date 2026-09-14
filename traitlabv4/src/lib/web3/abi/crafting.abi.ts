/**
 * ABI de AdrianCrafting `0x9ab651F50ac78A13a1612CCDDF5a074B2e570829`.
 *
 * ⚠️ 14-sep-2026 (F6, revisión on-chain): el ABI anterior declaraba
 * `useSpecificRecipe`, `useAnyRecipe` y `canCraft`, que NO existen en el
 * contrato verificado (BaseScan/Blockscout). El hook los llamaba primero y,
 * al fallar, reintentaba con otra función: un rechazo en la wallet
 * provocaba un segundo aviso. Solo quedan las funciones reales.
 */
export const CRAFTING_ABI = [
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
] as const;
