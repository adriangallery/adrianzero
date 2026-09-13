import { describe, it, expect } from 'vitest';
import {
  ADRIAN_FLOPPY_DISCS_DATA_ABI,
  ADRIAN_FLOPPY_ETH_DATA_ABI,
  ADRIAN_FLOPPY_MERKLE_DATA_ABI,
  OPENPACK_V4_DATA_ABI,
  ACTION_PACKS_DATA_ABI,
} from '../packsData.abi';
import floppyDiscsVerified from '../__fixtures__/floppyDiscs.verified-abi.json';
import floppyEthVerified from '../__fixtures__/floppyEth.verified-abi.json';
import floppyMerkleVerified from '../__fixtures__/floppyMerkle.verified-abi.json';
import openPackV4Verified from '../__fixtures__/openPackV4.verified-abi.json';
import actionPacksVerified from '../__fixtures__/actionPacks.verified-abi.json';

/**
 * Para cada `functionName`/evento que usan los hooks de `features/packs/data`,
 * compara nº/tipo/orden de inputs Y outputs (y nombres, por la lección del
 * hotfix de TraitLab 13-sep: mismo tipo en el hueco equivocado = mismo
 * selector, bug silencioso) contra el ABI VERIFICADO de Blockscout
 * (`__fixtures__/*.verified-abi.json`, campo `abi` de
 * https://base.blockscout.com/api/v2/smart-contracts/<addr>, capturado
 * 13-sep-2026). Si el contrato se redespliega, regenerar los fixtures.
 */

interface AbiParam {
  name: string;
  type: string;
  internalType?: string;
  components?: readonly AbiParam[];
}

interface AbiItemLike {
  type: string;
  name: string;
  inputs: readonly AbiParam[];
  outputs?: readonly AbiParam[];
}

function findItem(abi: readonly unknown[], itemType: 'function' | 'event', name: string): AbiItemLike | undefined {
  return (abi as AbiItemLike[]).find((f) => f.type === itemType && f.name === name);
}

function sig(params: readonly AbiParam[] | undefined): string {
  return (params ?? []).map((p) => `${p.name}:${p.type}`).join(', ');
}

function flattenTypes(params: readonly AbiParam[] | undefined): string {
  return (params ?? [])
    .map((p) => (p.components ? `(${flattenTypes(p.components)})` : p.type))
    .join(',');
}

function flattenNames(params: readonly AbiParam[] | undefined): string {
  return (params ?? [])
    .map((p) => (p.components ? `${p.name}(${flattenNames(p.components)})` : p.name))
    .join(',');
}

function expectMatches(frontAbi: readonly unknown[], verifiedAbi: readonly unknown[], itemType: 'function' | 'event', name: string) {
  const front = findItem(frontAbi, itemType, name);
  const verified = findItem(verifiedAbi, itemType, name);

  expect(front, `${name}: no declarada en el ABI del front (features/packs/data)`).toBeTruthy();
  expect(verified, `${name}: no está en el ABI verificado — ¿fixture desactualizado?`).toBeTruthy();
  if (!front || !verified) return;

  expect(front.inputs.length, `${name}: nº de inputs — front (${sig(front.inputs)}) vs verificado (${sig(verified.inputs)})`).toBe(
    verified.inputs.length
  );
  expect(flattenTypes(front.inputs), `${name}: TIPOS de inputs en orden distintos del ABI verificado`).toBe(flattenTypes(verified.inputs));
  expect(flattenNames(front.inputs), `${name}: NOMBRES de inputs en orden distintos del ABI verificado (mismo tipo en hueco distinto = mismo selector, bug silencioso)`).toBe(
    flattenNames(verified.inputs)
  );

  if (itemType === 'function') {
    const frontOutputs = front.outputs ?? [];
    const verifiedOutputs = verified.outputs ?? [];
    expect(frontOutputs.length, `${name}: nº de outputs — front (${sig(frontOutputs)}) vs verificado (${sig(verifiedOutputs)})`).toBe(
      verifiedOutputs.length
    );
    expect(flattenTypes(frontOutputs), `${name}: TIPOS de outputs en orden distintos del ABI verificado`).toBe(flattenTypes(verifiedOutputs));
  }
}

describe('ADRIAN_FLOPPY_DISCS_DATA_ABI vs. ABI verificado (0x56b3…ffc8)', () => {
  it.each(['paymentToken', 'getPackConfig', 'canPurchasePack', 'canOpenPack', 'purchasePack', 'openPack'])(
    'función %s coincide (tipos, orden y nombres)',
    (name) => expectMatches(ADRIAN_FLOPPY_DISCS_DATA_ABI, floppyDiscsVerified.abi, 'function', name)
  );
  it.each(['PackConfigured', 'PackOpened'])('evento %s coincide (tipos, orden y nombres)', (name) =>
    expectMatches(ADRIAN_FLOPPY_DISCS_DATA_ABI, floppyDiscsVerified.abi, 'event', name)
  );
});

describe('ADRIAN_FLOPPY_ETH_DATA_ABI vs. ABI verificado (0x9165…d251)', () => {
  it.each(['adrianToken', 'batchCount', 'getBatchSummary', 'mint', 'mintWithToken'])(
    'función %s coincide (tipos, orden y nombres)',
    (name) => expectMatches(ADRIAN_FLOPPY_ETH_DATA_ABI, floppyEthVerified.abi, 'function', name)
  );
});

describe('ADRIAN_FLOPPY_MERKLE_DATA_ABI vs. ABI verificado (0xbf67…3c29)', () => {
  it.each(['adrianToken', 'batchCount', 'getBatchSummary', 'mint', 'mintWithToken'])(
    'función %s coincide (tipos, orden y nombres)',
    (name) => expectMatches(ADRIAN_FLOPPY_MERKLE_DATA_ABI, floppyMerkleVerified.abi, 'function', name)
  );
});

describe('OPENPACK_V4_DATA_ABI vs. ABI verificado (0x2380…7022)', () => {
  it.each(['canOpenPack', 'packConfigs', 'openPacks'])('función %s coincide (tipos, orden y nombres)', (name) =>
    expectMatches(OPENPACK_V4_DATA_ABI, openPackV4Verified.abi, 'function', name)
  );
  it.each(['PackConfigured', 'PacksOpened'])('evento %s coincide (tipos, orden y nombres)', (name) =>
    expectMatches(OPENPACK_V4_DATA_ABI, openPackV4Verified.abi, 'event', name)
  );
});

describe('ACTION_PACKS_DATA_ABI vs. ABI verificado (0xa7e2…2e36)', () => {
  it.each(['canOpenPack', 'isPackConfigured', 'getPackConfig', 'openPack'])('función %s coincide (tipos, orden y nombres)', (name) =>
    expectMatches(ACTION_PACKS_DATA_ABI, actionPacksVerified.abi, 'function', name)
  );
  it.each(['PackConfigured', 'PackOpened'])('evento %s coincide (tipos, orden y nombres)', (name) =>
    expectMatches(ACTION_PACKS_DATA_ABI, actionPacksVerified.abi, 'event', name)
  );
});
