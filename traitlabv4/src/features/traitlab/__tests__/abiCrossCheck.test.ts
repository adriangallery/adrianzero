import { describe, it, expect } from 'vitest';
import { TRAITS_EXTENSIONS_ABI, ADRIAN_LAB_ABI } from '@/lib/web3/abi';
import traitsExtensionsVerified from '../__fixtures__/traitsExtensions.verified-abi.json';
import adrianLabVerified from '../__fixtures__/adrianLab.verified-abi.json';

/**
 * Guardia contra desajustes de ABI que `abiSelectors.test.ts` NO puede ver
 * (hotfix de producción 13-sep-2026): `canUserAccessTrait`/`isTraitAvailable`
 * tenían el orden de parámetros equivocado en el ABI del front —
 * `canUserAccessTrait(address, tokenId, traitId)` en vez de
 * `canUserAccessTrait(address, traitId, requiredAmount)` — pero como los
 * TIPOS en esa posición son los mismos (uint256, uint256), el SELECTOR
 * (name + tipos) sale idéntico y `abiSelectors.test.ts` no detecta nada
 * raro. El resultado: cada lectura devolvía `(false, "Insufficient global
 * supply")` sin revertir — un fallo silencioso, no un error.
 *
 * Este test compara, para cada `functionName` que usa `features/traitlab`,
 * el ABI declarado en el front contra el ABI VERIFICADO de Blockscout
 * (`__fixtures__/{traitsExtensions,adrianLab}.verified-abi.json`, campo
 * `abi` de
 * https://base.blockscout.com/api/v2/smart-contracts/<address>):
 *
 *  - nº de inputs y outputs,
 *  - tipo de cada uno EN ORDEN,
 *  - y además el NOMBRE de cada uno en orden — porque, como se ve arriba,
 *    dos parámetros del mismo tipo en posiciones distintas comparten
 *    selector; el nombre es la única señal (aparte de una llamada real)
 *    que expone que el front está leyendo el hueco equivocado. Esto SÍ
 *    habría cazado este bug exacto.
 *
 * Si el contrato se redespliega, regenerar los fixtures desde Blockscout.
 */

const USED_TRAITS_EXTENSIONS_FUNCTIONS = [
  'applyTrait',
  'applyTraitMultiple',
  'getAllEquippedTraits',
  'canUserAccessTrait',
  'isTraitAvailable',
];

const USED_ADRIAN_LAB_FUNCTIONS = ['isApprovedForAll', 'setApprovalForAll'];

interface AbiParam {
  name: string;
  type: string;
  internalType?: string;
}

interface AbiFunctionLike {
  type: string;
  name: string;
  inputs: readonly AbiParam[];
  outputs: readonly AbiParam[];
}

function findFn(abi: readonly unknown[], name: string): AbiFunctionLike | undefined {
  return (abi as AbiFunctionLike[]).find((f) => f.type === 'function' && f.name === name);
}

function paramSignature(params: readonly AbiParam[]): string {
  return params.map((p) => `${p.name}:${p.type}`).join(', ');
}

function expectAbiMatches(frontAbi: readonly unknown[], verifiedAbi: readonly unknown[], name: string) {
  const front = findFn(frontAbi, name);
  const verified = findFn(verifiedAbi, name);

  expect(front, `${name} no está declarada en el ABI del front`).toBeTruthy();
  expect(verified, `${name} no está en el ABI verificado — ¿fixture desactualizado?`).toBeTruthy();
  if (!front || !verified) return;

  expect(front.inputs.length, `${name}: nº de inputs distinto (front: ${paramSignature(front.inputs)} | verificado: ${paramSignature(verified.inputs)})`).toBe(
    verified.inputs.length
  );
  expect(front.outputs.length, `${name}: nº de outputs distinto (front: ${paramSignature(front.outputs)} | verificado: ${paramSignature(verified.outputs)})`).toBe(
    verified.outputs.length
  );

  front.inputs.forEach((input, i) => {
    const expected = verified.inputs[i];
    expect(input.type, `${name}: input[${i}] tipo — front tiene "${input.name}:${input.type}", verificado "${expected.name}:${expected.type}"`).toBe(
      expected.type
    );
    expect(input.name, `${name}: input[${i}] NOMBRE — front tiene "${input.name}" (tipo ${input.type}), verificado "${expected.name}" en esa misma posición. Mismo tipo en el hueco equivocado = mismo selector, bug silencioso (hotfix 13-sep).`).toBe(
      expected.name
    );
  });

  front.outputs.forEach((output, i) => {
    const expected = verified.outputs[i];
    expect(output.type, `${name}: output[${i}] tipo — front "${output.type}", verificado "${expected.type}"`).toBe(expected.type);
  });
}

describe('TRAITS_EXTENSIONS_ABI vs. ABI verificado de Blockscout', () => {
  it.each(USED_TRAITS_EXTENSIONS_FUNCTIONS)('%s: inputs/outputs (tipos y orden) coinciden con el contrato verificado', (name) => {
    expectAbiMatches(TRAITS_EXTENSIONS_ABI, traitsExtensionsVerified.abi, name);
  });
});

describe('ADRIAN_LAB_ABI vs. ABI verificado de Blockscout', () => {
  it.each(USED_ADRIAN_LAB_FUNCTIONS)('%s: inputs/outputs (tipos y orden) coinciden con el contrato verificado', (name) => {
    expectAbiMatches(ADRIAN_LAB_ABI, adrianLabVerified.abi, name);
  });
});
