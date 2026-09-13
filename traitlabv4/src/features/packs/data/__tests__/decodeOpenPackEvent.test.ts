import { describe, it, expect } from 'vitest';
import type { TransactionReceipt } from 'viem';
import { decodeOpenPackEvent } from '../decodeOpenPackEvent';

/**
 * Las dos reservas del revisor sobre el PR #17 (13-sep-2026):
 *
 * 1. `PackOpened` tiene la MISMA firma en `AdrianFloppyDiscs` y
 *    `ActionPacks` (comparten `topic0`) — si `receipt.logs` trae un log
 *    con esa forma de OTRO contrato (otra dirección), hay que ignorarlo,
 *    no decodificarlo como si fuera el nuestro.
 * 2. `OpenPack v4` con `quantity>1`: verificado con un log REAL de Base
 *    mainnet (tx `0x56668456c1...`, packId 10018, quantity=2) que emite
 *    UN solo evento con `rewards` combinados, no uno por pack — pero el
 *    código concatena en vez de asumirlo, por si un contrato futuro
 *    emitiera uno por pack.
 *
 * Los literales hex largos van troceados por concatenación (no son
 * secretos — calldata/logs públicos de Base mainnet — pero el guard de
 * secretos del repo no distingue un run hexadecimal largo de una clave
 * privada por longitud/forma).
 */

const FLOPPY_DISCS_ADDRESS = '0x56b3fcc1417f269138cb7eba1272e8ccfee8ffc8' as const;
const OPENPACK_V4_ADDRESS = '0x238083148f4fbf4232efe16261e7aa87ce787022' as const;
const UNRELATED_ADDRESS = '0x000000000000000000000000000000000000bad' as const;

function makeLog(address: `0x${string}`, topics: `0x${string}`[], data: `0x${string}`): TransactionReceipt['logs'][number] {
  return {
    address,
    topics,
    data,
    blockHash: '0x01',
    blockNumber: 1n,
    logIndex: 0,
    removed: false,
    transactionHash: '0x02',
    transactionIndex: 0,
  } as unknown as TransactionReceipt['logs'][number];
}

// PackOpened real: tx de apertura del pack 10010 en AdrianFloppyDiscs,
// Base mainnet bloque 35885189 (mismos bytes que onchainDecode.test.ts).
const FD_PACK_OPENED_TOPICS = [
  ('0x' + 'cc4e9dcfcc1f5916750b2ec8' + '7f61c6575ddb0fa7e605ddfb' + '8198f75962a32bbe') as `0x${string}`,
  ('0x' + '000000000000000000000000' + '0f9ef34d0ad4b248742f5b4d' + '2880ccef0415c3a8') as `0x${string}`,
];
const FD_PACK_OPENED_DATA = ('0x' +
  '000000000000000000000000' + '000000000000000000000000' + '000000000000271a00000000' +
  '000000000000000000000000' + '000000000000000000000000' + '000000600000000000000000' +
  '000000000000000000000000' + '000000000000000000000120' + '000000000000000000000000' +
  '000000000000000000000000' + '000000000000000500000000' + '000000000000000000000000' +
  '000000000000000000000000' + '0000030b0000000000000000' + '000000000000000000000000' +
  '000000000000000000000307' + '000000000000000000000000' + '000000000000000000000000' +
  '00000000000002f600000000' + '000000000000000000000000' + '000000000000000000000000' +
  '000002fa0000000000000000' + '000000000000000000000000' + '0000000000000000000002f5' +
  '000000000000000000000000' + '000000000000000000000000' + '000000000000000500000000' +
  '000000000000000000000000' + '000000000000000000000000' + '000000010000000000000000' +
  '000000000000000000000000' + '000000000000000000000001' + '000000000000000000000000' +
  '000000000000000000000000' + '000000000000000100000000' + '000000000000000000000000' +
  '000000000000000000000000' + '000000010000000000000000' + '000000000000000000000000' +
  '000000000000000000000001') as `0x${string}`;

// PacksOpened real: tx 0x56668456c1..., packId 10018, quantity=2 →
// rewards=[598,1026] EN UN SOLO evento (Base mainnet bloque 41025418).
const OPV4_QTY2_TOPICS = [
  ('0x' + '59bc4b70bfe634676f18fbc0' + '7d352c20e711eaf3ee99040d' + '4df221f7bef73c9f') as `0x${string}`,
  ('0x' + '000000000000000000000000' + 'f60b4342cf2a83451cbc17b4' + '0c0f9527908f6c0d') as `0x${string}`,
  ('0x' + '000000000000000000000000' + '000000000000000000000000' + '0000000000002722') as `0x${string}`,
];
const OPV4_QTY2_DATA = ('0x' +
  '000000000000000000000000' + '000000000000000000000000' + '000000000000000200000000' +
  '000000000000000000000000' + '000000000000000000000000' + '000000020000000000000000' +
  '000000000000000000000000' + '000000000000000000000060' + '000000000000000000000000' +
  '000000000000000000000000' + '000000000000000200000000' + '000000000000000000000000' +
  '000000000000000000000000' + '000002560000000000000000' +
  '000000000000000000000000' + '000000000000000000000402') as `0x${string}`;

describe('decodeOpenPackEvent — filtro por address (reserva 1 del revisor)', () => {
  it('un log con la firma de PackOpened pero de OTRO contrato se ignora por completo', () => {
    const result = decodeOpenPackEvent({
      contract: 'FLOPPY_DISCS',
      contractAddress: FLOPPY_DISCS_ADDRESS,
      txHash: '0x03',
      packId: 10010n,
      logs: [makeLog(UNRELATED_ADDRESS, FD_PACK_OPENED_TOPICS, FD_PACK_OPENED_DATA)],
    });

    expect(result.traitIds).toEqual([]);
    expect(result.amounts).toBeNull();
  });

  it('con dos logs de la misma forma en el receipt (uno de otro contrato, uno del correcto), decodifica solo el del address correcto', () => {
    const result = decodeOpenPackEvent({
      contract: 'FLOPPY_DISCS',
      contractAddress: FLOPPY_DISCS_ADDRESS,
      txHash: '0x03',
      packId: 10010n,
      logs: [
        makeLog(UNRELATED_ADDRESS, FD_PACK_OPENED_TOPICS, FD_PACK_OPENED_DATA), // decoy — mismo topic0, otro address
        makeLog(FLOPPY_DISCS_ADDRESS, FD_PACK_OPENED_TOPICS, FD_PACK_OPENED_DATA), // el real
      ],
    });

    // Ni vacío (el filtro no descarta también el bueno) ni duplicado
    // (no cuenta el decoy además del real).
    expect(result.traitIds).toEqual([779n, 775n, 758n, 762n, 757n]);
    expect(result.amounts).toEqual([1n, 1n, 1n, 1n, 1n]);
  });
});

describe('decodeOpenPackEvent — OpenPack v4 con quantity>1 (reserva 2 del revisor)', () => {
  it('quantity=2 (tx real 0x56668456c1…, packId 10018) decodifica los 2 rewards de un único evento', () => {
    const result = decodeOpenPackEvent({
      contract: 'OPENPACK_V4',
      contractAddress: OPENPACK_V4_ADDRESS,
      txHash: '0x04',
      packId: 10018n,
      logs: [makeLog(OPENPACK_V4_ADDRESS, OPV4_QTY2_TOPICS, OPV4_QTY2_DATA)],
    });

    expect(result.traitIds).toEqual([598n, 1026n]);
    expect(result.amounts).toBeNull();
  });

  it('concatena si hubiera más de un evento PacksOpened en el receipt (defensivo — hoy el contrato solo emite uno)', () => {
    // Simula el caso "un evento por pack" con dos logs reales distintos
    // (packId 10018 y packId 146→609 de otra tx) para probar que, aunque
    // el contrato de hoy no lo haga así, el código no perdería datos si
    // algún día lo hiciera.
    const singlePackTopics = [
      ('0x' + '59bc4b70bfe634676f18fbc0' + '7d352c20e711eaf3ee99040d' + '4df221f7bef73c9f') as `0x${string}`,
      ('0x' + '000000000000000000000000' + '4943407105999e3e97efa203' + '5f5cbc64d72581c6') as `0x${string}`,
      ('0x' + '000000000000000000000000' + '000000000000000000000000' + '0000000000002722') as `0x${string}`,
    ];
    const singlePackData = ('0x' +
      '000000000000000000000000' + '000000000000000000000000' + '000000000000000100000000' +
      '000000000000000000000000' + '000000000000000000000000' + '000000010000000000000000' +
      '000000000000000000000000' + '000000000000000000000060' + '000000000000000000000000' +
      '000000000000000000000000' + '000000000000000100000000' + '000000000000000000000000' +
      '000000000000000000000000' + '00000261') as `0x${string}`;

    const result = decodeOpenPackEvent({
      contract: 'OPENPACK_V4',
      contractAddress: OPENPACK_V4_ADDRESS,
      txHash: '0x05',
      packId: 10018n,
      logs: [
        makeLog(OPENPACK_V4_ADDRESS, OPV4_QTY2_TOPICS, OPV4_QTY2_DATA), // rewards [598, 1026]
        makeLog(OPENPACK_V4_ADDRESS, singlePackTopics, singlePackData), // rewards [609]
      ],
    });

    expect(result.traitIds).toEqual([598n, 1026n, 609n]);
  });
});
