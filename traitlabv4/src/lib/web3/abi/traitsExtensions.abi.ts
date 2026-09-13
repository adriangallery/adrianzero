/**
 * ABI de AdrianTraitsExtensions (0x0995c0dA1ca071b792E852b6Ec531b7cD7d1F8D6, Base).
 *
 * ⚠️ 13-sep-2026 (F4): el ABI declaraba `getAppliedTraits`, `canApplyTraits` y
 * `removeTrait` — NINGUNA existe en el bytecode desplegado (verificado con
 * `cast code` + escaneo de selectores PUSH4; snapshot en
 * `features/traitlab/__fixtures__/traitsExtensions.onchain-selectors.json`,
 * guardia en `features/traitlab/__tests__/abiSelectors.test.ts`). Causaban
 * reverts en producción. Sustituidas por `applyTrait`, `applyTraitMultiple`,
 * `getAllEquippedTraits`, `canUserAccessTrait`, `isTraitAvailable` — las 5
 * confirmadas presentes en el bytecode. El contrato NO tiene forma de
 * desequipar (no hay `removeTrait`/`unequip`/similar entre los ~45
 * selectors del dispatcher).
 *
 * ⚠️ HOTFIX 13-sep-2026 (producción, encontrado por el crítico con `cast`):
 * `canUserAccessTrait`/`isTraitAvailable` tenían el ORDEN DE PARÁMETROS
 * equivocado — mismo selector que la firma real (por eso `abiSelectors.test.ts`
 * no lo cazó: compara selectores, no tipos/orden de argumentos) pero el ABI
 * declaraba `canUserAccessTrait(address, tokenId, traitId)` cuando la firma
 * real, verificada contra el ABI de Blockscout
 * (https://base.blockscout.com/api/v2/smart-contracts/0x0995c0da1ca071b792e852b6ec531b7cd7d1f8d6),
 * es `canUserAccessTrait(address user, uint256 traitId, uint256
 * requiredAmount)`; e `isTraitAvailable(tokenId, traitId)` cuando es
 * `isTraitAvailable(uint256 traitId, uint256 requiredAmount)`. Con el orden
 * equivocado, cada tap con wallet conectada leía "Insufficient global
 * supply" (falso) en vez del resultado real — `cast call` con el orden
 * correcto da `(true, "Trait available")`. Ambas devuelven además
 * `(bool, string reason)`, no solo `bool` — el ABI anterior también
 * truncaba ese motivo. Fixture del ABI verificado y test de
 * inputs/outputs (no solo selector) en `abiCrossCheck.test.ts`.
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
      { internalType: 'uint256', name: 'traitId', type: 'uint256' },
      { internalType: 'uint256', name: 'requiredAmount', type: 'uint256' },
    ],
    name: 'canUserAccessTrait',
    outputs: [
      { internalType: 'bool', name: 'canAccess', type: 'bool' },
      { internalType: 'string', name: 'reason', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'traitId', type: 'uint256' },
      { internalType: 'uint256', name: 'requiredAmount', type: 'uint256' },
    ],
    name: 'isTraitAvailable',
    outputs: [
      { internalType: 'bool', name: 'available', type: 'bool' },
      { internalType: 'string', name: 'reason', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
