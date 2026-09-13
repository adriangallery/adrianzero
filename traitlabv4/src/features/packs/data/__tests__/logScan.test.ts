import { describe, it, expect, vi } from 'vitest';
import type { AbiEvent, PublicClient } from 'viem';
import { scanPackIds } from '../logScan';

/**
 * Reserva del revisor sobre el PR #17 (13-sep): `usePackRegistry` no debe
 * escanear desde el bloque de deploy en la primera visita — debe arrancar
 * del `seed` versionado en el repo (`registry.seed.json`) cuando no hay
 * nada más reciente en `localStorage`. Estos tests corren sin red (RPC
 * fake) y sin `localStorage` (`useCache: false`).
 */

const FAKE_EVENT = { type: 'event', name: 'PackConfigured', inputs: [] } as unknown as AbiEvent;
const ADDRESS = '0x56b3fcc1417f269138cb7eba1272e8ccfee8ffc8' as const;

function fakeClient(overrides: { latestBlock: bigint; getLogs: PublicClient['getLogs'] }): PublicClient {
  return {
    getBlockNumber: async () => overrides.latestBlock,
    getLogs: overrides.getLogs,
  } as unknown as PublicClient;
}

describe('scanPackIds — arranca del seed, no del bloque de deploy', () => {
  it('con un seed y sin localStorage, escanea SOLO desde seed.lastScannedBlock + 1', async () => {
    const getLogs = vi.fn(async ({ fromBlock, toBlock }: { fromBlock: bigint; toBlock: bigint }) => {
      // Si esto se llamara con el bloque de deploy (1_000n, muy anterior
      // al seed) en vez de seed.lastScannedBlock+1, esta aserción fallaría.
      expect(fromBlock).toBe(9_000_001n);
      expect(toBlock).toBe(9_000_050n);
      return [{ args: { packId: 20000n } }];
    });

    const ids = await scanPackIds({
      client: fakeClient({ latestBlock: 9_000_050n, getLogs: getLogs as unknown as PublicClient['getLogs'] }),
      address: ADDRESS,
      event: FAKE_EVENT,
      packIdArg: 'packId',
      fromBlock: 1_000n, // "bloque de deploy" — NO debería usarse aquí
      chainId: 8453,
      useCache: false,
      seed: { lastScannedBlock: 9_000_000n, ids: [10005n, 10010n] },
    });

    expect(getLogs).toHaveBeenCalledTimes(1);
    // Trae los ids del seed MÁS el nuevo encontrado en el tramo escaneado.
    expect(Array.from(ids).sort((a, b) => Number(a - b))).toEqual([10005n, 10010n, 20000n]);
  });

  it('sin seed ni localStorage, escanea desde `fromBlock` (bloque de deploy)', async () => {
    const getLogs = vi.fn(async ({ fromBlock, toBlock }: { fromBlock: bigint; toBlock: bigint }) => {
      expect(fromBlock).toBe(1_000n);
      expect(toBlock).toBe(1_050n);
      return [];
    });

    const ids = await scanPackIds({
      client: fakeClient({ latestBlock: 1_050n, getLogs: getLogs as unknown as PublicClient['getLogs'] }),
      address: ADDRESS,
      event: FAKE_EVENT,
      packIdArg: 'packId',
      fromBlock: 1_000n,
      chainId: 8453,
      useCache: false,
    });

    expect(getLogs).toHaveBeenCalledTimes(1);
    expect(ids.size).toBe(0);
  });
});
