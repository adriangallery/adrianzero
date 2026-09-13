import { describe, it, expect } from 'vitest';
import { toFunctionSelector } from 'viem';
import { TRAITS_EXTENSIONS_ABI } from '@/lib/web3/abi';
import onchain from '../__fixtures__/traitsExtensions.onchain-selectors.json';

/**
 * Guardia contra funciones fantasma en el ABI (error de producción
 * 13-sep-2026): el front declaraba `getAppliedTraits`, `canApplyTraits` y
 * `removeTrait` en `TRAITS_EXTENSIONS_ABI` — ninguna existe en el
 * bytecode desplegado de `AdrianTraitsExtensions`
 * (0x0995c0dA1ca071b792E852b6Ec531b7cD7d1F8D6, Base), así que cualquier
 * llamada revertía en producción.
 *
 * El fixture `__fixtures__/traitsExtensions.onchain-selectors.json` es un
 * snapshot de los selectores PUSH4 del bytecode real, capturado con:
 *   cast code 0x0995c0dA1ca071b792E852b6Ec531b7cD7d1F8D6 \
 *     --rpc-url https://mainnet.base.org
 * (más un escaneo de opcodes PUSH4 — ver el campo "method" del fixture).
 * Este test computa el selector real de cada función del ABI con
 * `viem#toFunctionSelector` (sin red, determinista) y lo cruza contra ese
 * snapshot. Si el contrato se redespliega, regenerar el fixture con el
 * mismo comando.
 */

const onchainSelectors = new Set(onchain.selectors.map((s) => s.toLowerCase()));

// Funciones de TRAITS_EXTENSIONS_ABI realmente usadas por features/traitlab
// (grep de `functionName:` en hooks/*.ts apuntando a este contrato).
const USED_FUNCTIONS = ['applyTrait', 'applyTraitMultiple', 'getAllEquippedTraits', 'canUserAccessTrait', 'isTraitAvailable'];

// Funciones que este mismo bug introdujo y que NUNCA deben volver al ABI.
const GHOST_FUNCTIONS = ['getAppliedTraits', 'canApplyTraits', 'removeTrait'];

describe('TRAITS_EXTENSIONS_ABI vs. bytecode on-chain (snapshot 13-sep-2026)', () => {
  it.each(USED_FUNCTIONS)('%s existe en el ABI y su selector aparece en el bytecode desplegado', (name) => {
    const item = TRAITS_EXTENSIONS_ABI.find((f) => f.type === 'function' && f.name === name);
    expect(item, `${name} no está declarada en TRAITS_EXTENSIONS_ABI`).toBeTruthy();

    const selector = toFunctionSelector(item as Parameters<typeof toFunctionSelector>[0])
      .slice(2)
      .toLowerCase();

    expect(
      onchainSelectors.has(selector),
      `${name} (selector 0x${selector}) no aparece en el snapshot on-chain — ¿función fantasma?`
    ).toBe(true);
  });

  it.each(GHOST_FUNCTIONS)('%s NO está en el ABI (función fantasma retirada 13-sep-2026)', (name) => {
    const item = TRAITS_EXTENSIONS_ABI.find((f) => f.type === 'function' && f.name === name);
    expect(item, `${name} debería haberse retirado del ABI — no existe en el contrato desplegado`).toBeUndefined();
  });

  it('el fixture on-chain tiene selectores capturados (no está vacío por error)', () => {
    expect(onchain.selectors.length).toBeGreaterThan(20);
  });
});
