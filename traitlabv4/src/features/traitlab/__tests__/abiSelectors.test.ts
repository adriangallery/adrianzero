import { describe, it, expect } from 'vitest';
import { toFunctionSelector } from 'viem';
import { TRAITS_EXTENSIONS_ABI, ADRIAN_LAB_ABI } from '@/lib/web3/abi';
import traitsExtensionsOnchain from '../__fixtures__/traitsExtensions.onchain-selectors.json';
import adrianLabOnchain from '../__fixtures__/adrianLab.onchain-selectors.json';

/**
 * Guardia contra funciones fantasma en el ABI (error de producción
 * 13-sep-2026): el front declaraba `getAppliedTraits`, `canApplyTraits` y
 * `removeTrait` en `TRAITS_EXTENSIONS_ABI` — ninguna existe en el
 * bytecode desplegado de `AdrianTraitsExtensions`
 * (0x0995c0dA1ca071b792E852b6Ec531b7cD7d1F8D6, Base), así que cualquier
 * llamada revertía en producción.
 *
 * Cubre las 6 `functionName` que `features/traitlab` usa contra DOS
 * contratos distintos — el crítico señaló que el primer pase (13-sep)
 * solo cubría los 5 de TraitsExtensions y dejaba fuera el approval del
 * ERC1155 (`ADRIAN_LAB`, `isApprovedForAll`/`setApprovalForAll` en
 * `useApplyTraitlabChanges.ts`, ya usado en prod por `useApplyTraits.ts`
 * pero nunca cazado por esta guardia):
 *
 *   TraitsExtensions (0x0995c0dA…): applyTrait, applyTraitMultiple,
 *     getAllEquippedTraits, canUserAccessTrait, isTraitAvailable.
 *   ADRIAN_LAB (0x905468484…, ERC1155 de traits): isApprovedForAll,
 *     setApprovalForAll.
 *
 * Los fixtures `__fixtures__/*.onchain-selectors.json` son snapshots de
 * los selectores PUSH4 del bytecode real, capturados con:
 *   cast code <address> --rpc-url https://mainnet.base.org
 * (más un escaneo de opcodes PUSH4 — ver el campo "method" de cada
 * fixture). Este test computa el selector real de cada función del ABI
 * con `viem#toFunctionSelector` (sin red, determinista) y lo cruza contra
 * el snapshot correspondiente. Si alguno de los dos contratos se
 * redespliega, regenerar su fixture con el mismo comando.
 */

const USED_TRAITS_EXTENSIONS_FUNCTIONS = [
  'applyTrait',
  'applyTraitMultiple',
  'getAllEquippedTraits',
  'canUserAccessTrait',
  'isTraitAvailable',
];

const USED_ADRIAN_LAB_FUNCTIONS = ['isApprovedForAll', 'setApprovalForAll'];

// Funciones que este mismo bug introdujo y que NUNCA deben volver al ABI.
const GHOST_FUNCTIONS = ['getAppliedTraits', 'canApplyTraits', 'removeTrait'];

function expectSelectorOnchain(abi: readonly unknown[], name: string, onchainSelectors: Set<string>) {
  const item = (abi as any[]).find((f) => f.type === 'function' && f.name === name);
  expect(item, `${name} no está declarada en el ABI`).toBeTruthy();

  const selector = toFunctionSelector(item as Parameters<typeof toFunctionSelector>[0])
    .slice(2)
    .toLowerCase();

  expect(
    onchainSelectors.has(selector),
    `${name} (selector 0x${selector}) no aparece en el snapshot on-chain — ¿función fantasma?`
  ).toBe(true);
}

describe('TRAITS_EXTENSIONS_ABI vs. bytecode on-chain (snapshot 13-sep-2026)', () => {
  const onchainSelectors = new Set(traitsExtensionsOnchain.selectors.map((s) => s.toLowerCase()));

  it.each(USED_TRAITS_EXTENSIONS_FUNCTIONS)('%s existe en el ABI y su selector aparece en el bytecode desplegado', (name) => {
    expectSelectorOnchain(TRAITS_EXTENSIONS_ABI, name, onchainSelectors);
  });

  it.each(GHOST_FUNCTIONS)('%s NO está en el ABI (función fantasma retirada 13-sep-2026)', (name) => {
    const item = TRAITS_EXTENSIONS_ABI.find((f) => f.type === 'function' && f.name === name);
    expect(item, `${name} debería haberse retirado del ABI — no existe en el contrato desplegado`).toBeUndefined();
  });

  it('el fixture on-chain tiene selectores capturados (no está vacío por error)', () => {
    expect(traitsExtensionsOnchain.selectors.length).toBeGreaterThan(20);
  });
});

describe('ADRIAN_LAB_ABI (approval del ERC1155) vs. bytecode on-chain', () => {
  const onchainSelectors = new Set(adrianLabOnchain.selectors.map((s) => s.toLowerCase()));

  it.each(USED_ADRIAN_LAB_FUNCTIONS)('%s existe en el ABI y su selector aparece en el bytecode desplegado', (name) => {
    expectSelectorOnchain(ADRIAN_LAB_ABI, name, onchainSelectors);
  });

  it('el fixture on-chain tiene selectores capturados (no está vacío por error)', () => {
    expect(adrianLabOnchain.selectors.length).toBeGreaterThan(20);
  });
});
