/**
 * Decodifica el resultado de abrir un pack a partir de los logs REALES del
 * receipt — extraído de `useOpenPack.ts` para poder testearlo sin wallet
 * (`__tests__/decodeOpenPackEvent.test.ts`).
 *
 * Dos guardias que pidió el revisor sobre el PR #17 (13-sep):
 *
 * 1. **Filtro por `address` antes de decodificar.** `PackOpened` tiene
 *    EXACTAMENTE la misma firma en `AdrianFloppyDiscs` y `ActionPacks`
 *    (mismo nombre, mismo orden y tipo de argumentos) — comparten
 *    `topic0`. `receipt.logs` trae los logs de TODOS los contratos
 *    tocados en la tx, no solo el que abrió el pack; sin filtrar por
 *    `log.address`, `parseEventLogs` decodificaría igual de "bien" un
 *    `PackOpened` de OTRO contrato si por lo que sea apareciera en el
 *    mismo receipt (una migración futura que llame a los dos, un ataque
 *    de log spoofing con un evento de la misma forma desde un contrato
 *    no relacionado, etc.).
 * 2. **Concatenar, no asumir `events[0]`.** Verificado con logs reales de
 *    Base mainnet (`openpack_v4_alllogs.json`, 259 aperturas): `OpenPack
 *    v4` emite UN solo `PacksOpened` por tx incluso con `quantity>1` (tx
 *    `0x56668456c1...`, packId 10018, quantity=2 → `rewards=[598,1026]`
 *    en un único evento) — pero el código no se apoya en esa suposición:
 *    si algún día una versión del contrato emitiera un evento por pack,
 *    esto sigue siendo correcto porque concatena TODOS los eventos
 *    encontrados en vez de quedarse con el primero.
 */

import { parseEventLogs } from 'viem';
import type { TransactionReceipt } from 'viem';
import { ADRIAN_FLOPPY_DISCS_DATA_ABI, OPENPACK_V4_DATA_ABI, ACTION_PACKS_DATA_ABI } from './packsData.abi';
import type { OpenPackResult, PackOpenContractName } from './types';

export interface DecodeOpenPackEventParams {
  contract: PackOpenContractName;
  contractAddress: `0x${string}`;
  txHash: `0x${string}`;
  packId: bigint;
  logs: TransactionReceipt['logs'];
}

export function decodeOpenPackEvent(params: DecodeOpenPackEventParams): OpenPackResult {
  const { contract, contractAddress, txHash, packId, logs } = params;

  const ownLogs = logs.filter((log) => log.address.toLowerCase() === contractAddress.toLowerCase());

  if (contract === 'OPENPACK_V4') {
    const events = parseEventLogs({ abi: OPENPACK_V4_DATA_ABI, eventName: 'PacksOpened', logs: ownLogs });
    const traitIds = events.flatMap((event) => {
      const rewards = (event.args as { rewards?: readonly bigint[] }).rewards ?? [];
      return [...rewards];
    });
    return { txHash, packId, traitIds, amounts: null };
  }

  const abi = contract === 'ACTION_PACKS' ? ACTION_PACKS_DATA_ABI : ADRIAN_FLOPPY_DISCS_DATA_ABI;
  const events = parseEventLogs({ abi, eventName: 'PackOpened', logs: ownLogs });

  const traitIds = events.flatMap((event) => {
    const assetIds = (event.args as { assetIds?: readonly bigint[] }).assetIds ?? [];
    return [...assetIds];
  });
  const amountsLists = events
    .map((event) => (event.args as { amounts?: readonly bigint[] }).amounts)
    .filter((a): a is readonly bigint[] => !!a);
  const amounts = amountsLists.length > 0 ? amountsLists.flatMap((a) => [...a]) : null;

  return { txHash, packId, traitIds, amounts };
}
