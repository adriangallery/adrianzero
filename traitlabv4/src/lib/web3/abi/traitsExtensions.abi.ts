/**
 * ABI de AdrianTraitsExtensions (0x0995c0dA1ca071b792E852b6Ec531b7cD7d1F8D6, Base).
 *
 * ⚠️ 13-sep-2026: el ABI declaraba `getAppliedTraits`, `canApplyTraits` y
 * `removeTrait` — NINGUNA existe en el bytecode desplegado (verificado con
 * `cast code` + escaneo de selectores PUSH4; snapshot en
 * `features/traitlab/__fixtures__/traitsExtensions.onchain-selectors.json`,
 * guardia en `features/traitlab/__tests__/abiSelectors.test.ts`). Causaban
 * reverts en producción (F4). Las funciones reales usadas por el front:
 * `applyTrait`, `applyTraitMultiple`, `getAllEquippedTraits`,
 * `canUserAccessTrait`, `isTraitAvailable` — las 5 confirmadas presentes en
 * el bytecode. El contrato NO tiene forma de desequipar (no hay
 * `removeTrait`/`unequip`/similar entre los ~45 selectors del dispatcher).
 */
export const TRAITS_EXTENSIONS_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'uint256', name: 'traitId', type: 'uint256' },
    ],
    name: 'applyTrait',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'uint256[]', name: 'traitIds', type: 'uint256[]' },
    ],
    name: 'applyTraitMultiple',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getAllEquippedTraits',
    outputs: [
      { internalType: 'string[]', name: 'categories', type: 'string[]' },
      { internalType: 'uint256[]', name: 'traitIds', type: 'uint256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'uint256', name: 'traitId', type: 'uint256' },
    ],
    name: 'canUserAccessTrait',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'uint256', name: 'traitId', type: 'uint256' },
    ],
    name: 'isTraitAvailable',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
