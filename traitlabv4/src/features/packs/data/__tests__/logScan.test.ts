import { describe, it, expect, vi } from 'vitest';
import type { AbiEvent } from 'viem';
import { scanPackIds, DEFAULT_CHUNK_BLOCKS, MIN_CHUNK_BLOCKS, type LogsClient } from '../logScan';

/**
 * Tres cosas que este archivo cubre, todas del hallazgo del crítico en
 * producción (13-sep, sobre el PR #17/#20 ya en main):
 *
 * 1. `usePackRegistry` arranca del `seed` versionado en el repo
 *    (`registry.seed.json`), no del bloque de deploy, cuando no hay nada
 *    más reciente en `localStorage`.
 * 2. El chunking adaptativo: `DEFAULT_CHUNK_BLOCKS` (2000, el límite
 *    medido del RPC público `mainnet.base.org`) se reduce a
 *    `MIN_CHUNK_BLOCKS` (500) si el proveedor rechaza el rango (p. ej.
 *    `-32600` de Alchemy — el bug real en prod: el `publicClient` de
 *    wagmi usaba Alchemy para `eth_getLogs`, que en producción respondía
 *    `-32600 "up to a 10 block range"`, muy por debajo de lo asumido).
 * 3. El tope de peticiones por sesión (`maxRequests`): si el rango
 *    pendiente es enorme, el escaneo se corta, no revienta ni se cuelga.
 *
 * Todos corren sin red (`logsClient` fake) y sin `localStorage`
 * (`useCache: false`).
 */

const FAKE_EVENT = { type: 'event', name: 'PackConfigured', inputs: [] } as unknown as AbiEvent;
const ADDRESS = '0x56b3fcc1417f269138cb7eba1272e8ccfee8ffc8' as const;

describe('scanPackIds — arranca del seed, no del bloque de deploy', () => {
  it('con un seed y sin localStorage, escanea SOLO desde seed.lastScannedBlock + 1', async () => {
    const getLogs = vi.fn(async ({ fromBlock, toBlock }: { fromBlock: bigint; toBlock: bigint }) => {
      // Si esto se llamara con el bloque de deploy (1_000n, muy anterior
      // al seed) en vez de seed.lastScannedBlock+1, esta aserción fallaría.
      expect(fromBlock).toBe(9_000_001n);
      expect(toBlock).toBe(9_000_050n);
      return [{ args: { packId: 20000n } }];
    });
    const logsClient: LogsClient = { getBlockNumber: async () => 9_000_050n, getLogs };

    const ids = await scanPackIds({
      logsClient,
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
    const logsClient: LogsClient = { getBlockNumber: async () => 1_050n, getLogs };

    const ids = await scanPackIds({
      logsClient,
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

describe('scanPackIds — chunking adaptativo: RPC que rechaza rangos > 2000 bloques (-32600)', () => {
  it('reduce el chunk a MIN_CHUNK_BLOCKS, reintenta el mismo tramo, y vuelve a DEFAULT_CHUNK_BLOCKS tras el éxito', async () => {
    expect(DEFAULT_CHUNK_BLOCKS).toBe(2_000);
    expect(MIN_CHUNK_BLOCKS).toBe(500);

    const calls: Array<{ fromBlock: bigint; toBlock: bigint }> = [];
    const getLogs = vi.fn(async ({ fromBlock, toBlock }: { fromBlock: bigint; toBlock: bigint }) => {
      calls.push({ fromBlock, toBlock });
      const width = toBlock - fromBlock + 1n;
      if (width > 2_000n) {
        // Mismo mensaje real de Alchemy en producción (aunque su límite
        // real medido era de 10, no 2000 — el mecanismo de rechazo es el
        // mismo: cualquier "-32600" o "range" en el mensaje dispara el
        // chunk mínimo).
        throw new Error('-32600: up to a 2000 block range');
      }
      return [];
    });
    const logsClient: LogsClient = { getBlockNumber: async () => 2_500n, getLogs };

    await scanPackIds({
      logsClient,
      address: ADDRESS,
      event: FAKE_EVENT,
      packIdArg: 'packId',
      fromBlock: 0n,
      chainId: 8453,
      useCache: false,
    });

    // 1) primer intento a chunk completo (2000 → rango de 2001 bloques) —
    //    rechazado.
    expect(calls[0]).toEqual({ fromBlock: 0n, toBlock: 2_000n });
    // 2) reintento del MISMO tramo (fromBlock sigue en 0) con el chunk
    //    mínimo (500 → rango de 501 bloques) — éxito, nunca se saltó nada.
    expect(calls[1]).toEqual({ fromBlock: 0n, toBlock: 500n });
    // 3) tras el éxito, vuelve a DEFAULT_CHUNK_BLOCKS para el siguiente
    //    tramo — como el resto ya cabe en un solo tramo (hasta el bloque
    //    2500), no hace falta un tercer rechazo.
    expect(calls[2]).toEqual({ fromBlock: 501n, toBlock: 2_500n });
    expect(calls).toHaveLength(3);
  });
});

describe('scanPackIds — tope de peticiones por sesión', () => {
  it('se detiene al llegar a `maxRequests` y devuelve lo encontrado hasta entonces, sin lanzar', async () => {
    const getLogs = vi.fn(async ({ toBlock }: { fromBlock: bigint; toBlock: bigint }) => {
      // Un pack "encontrado" por cada tramo, para comprobar que solo se
      // cuentan los tramos realmente pedidos.
      return [{ args: { packId: toBlock } }];
    });
    // Rango total mucho mayor de lo que 3 peticiones de 2000 bloques cubren.
    const logsClient: LogsClient = { getBlockNumber: async () => 1_000_000n, getLogs };

    const ids = await scanPackIds({
      logsClient,
      address: ADDRESS,
      event: FAKE_EVENT,
      packIdArg: 'packId',
      fromBlock: 0n,
      chainId: 8453,
      useCache: false,
      maxRequests: 3,
    });

    expect(getLogs).toHaveBeenCalledTimes(3);
    expect(ids.size).toBe(3);
  });
});
