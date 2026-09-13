/**
 * Descubrimiento de packIds vía logs on-chain, con chunking adaptativo y
 * caché incremental en localStorage.
 *
 * Por qué esto y no una lista de IDs a mano: `FloppyDiscs`/`OpenPack v4`/
 * `ActionPacks` no exponen ningún `packCount()`/`nextPackId()` — la única
 * forma de saber qué packIds existen de verdad es leer el evento
 * `PackConfigured` que cada `setPackConfig`/`configurePack` emite. Eso es
 * justo lo que faltaba: `usePacks.ts`/`useOpenPack.ts` (v4 vieja) tenían un
 * `PACK_METADATA`/`OPENPACK_V4_TOKENS` mantenidos a mano que se
 * desincronizó del contrato real (`PACKS_FLOPPIES_MISMATCH_REPORT.md`:
 * 10014/10018 nunca se añadieron a la lista y no se podían abrir).
 *
 * El coste real: los contratos de packs llevan ~15-17M de bloques de vida
 * en Base. `eth_getLogs` en el RPC público de Base (`mainnet.base.org`,
 * uno de los fallbacks de `RPC_URLS`) limita el rango a 2000 bloques por
 * llamada; Alchemy (el proveedor primario configurado en
 * `config/alchemy.ts`) acepta rangos mucho mayores. Por eso el escaneo:
 *  1. Arranca con un `chunk` grande (`DEFAULT_CHUNK_BLOCKS`) y lo REDUCE a
 *     la mitad (con suelo `MIN_CHUNK_BLOCKS`) si el proveedor rechaza el
 *     rango — funciona tanto con Alchemy como con el fallback público.
 *  2. Cachea en `localStorage` el último bloque escaneado + los IDs
 *     encontrados hasta ahora, por contrato+evento+chain — la próxima
 *     carga solo escanea los bloques nuevos, no repite el historial.
 *
 * Si esto se vuelve un problema de rendimiento o de cuota de RPC en
 * producción, la solución de fondo es un indexer/subgraph — fuera de
 * alcance de esta capa de datos (ver informe del worker F5 en el PR).
 */

import type { AbiEvent, Address, PublicClient } from 'viem';

export const DEFAULT_CHUNK_BLOCKS = 200_000;
export const MIN_CHUNK_BLOCKS = 500;

interface ScanCacheEntry {
  lastBlock: string; // bigint serializado
  ids: string[]; // bigints serializados
}

function cacheKey(chainId: number, address: Address, eventName: string): string {
  return `az-packs-scan:${chainId}:${address.toLowerCase()}:${eventName}`;
}

function loadCache(key: string): ScanCacheEntry | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScanCacheEntry;
    if (typeof parsed.lastBlock !== 'string' || !Array.isArray(parsed.ids)) return null;
    return parsed;
  } catch {
    // localStorage puede no existir (SSR/test) o estar bloqueado (privado) — sin caché, no falla.
    return null;
  }
}

function saveCache(key: string, entry: ScanCacheEntry): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // best-effort — quedarse sin caché no es un error del escaneo.
  }
}

function looksLikeRangeLimitError(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err ?? '').toLowerCase();
  return (
    msg.includes('range') ||
    msg.includes('block span') ||
    msg.includes('query returned more than') ||
    msg.includes('limit') ||
    msg.includes('too many')
  );
}

export interface ScanPackIdsParams {
  client: PublicClient;
  address: Address;
  event: AbiEvent;
  /** Nombre del argumento packId dentro del evento (p.ej. "packId"). */
  packIdArg: string;
  /** Primer bloque en el que el contrato pudo emitir el evento (bloque de deploy verificado en Blockscout). */
  fromBlock: bigint;
  chainId: number;
  /** Desactiva localStorage (tests). */
  useCache?: boolean;
}

/** Escanea `PackConfigured`-like events y devuelve el set de packIds vistos, con caché incremental. */
export async function scanPackIds(params: ScanPackIdsParams): Promise<Set<bigint>> {
  const { client, address, event, packIdArg, chainId, useCache = true } = params;
  const key = cacheKey(chainId, address, event.name ?? 'event');
  const cached = useCache ? loadCache(key) : null;

  const ids = new Set<bigint>(cached ? cached.ids.map((s) => BigInt(s)) : []);
  let from = cached ? BigInt(cached.lastBlock) + 1n : params.fromBlock;

  const latest = await client.getBlockNumber();
  let chunk = DEFAULT_CHUNK_BLOCKS;

  while (from <= latest) {
    const to = from + BigInt(chunk) > latest ? latest : from + BigInt(chunk);
    try {
      const logs = await client.getLogs({ address, event, fromBlock: from, toBlock: to });
      for (const log of logs) {
        const value = (log as { args?: Record<string, unknown> }).args?.[packIdArg];
        if (typeof value === 'bigint') ids.add(value);
      }
      from = to + 1n;
      if (chunk < DEFAULT_CHUNK_BLOCKS) chunk = Math.min(DEFAULT_CHUNK_BLOCKS, chunk * 2);
    } catch (err) {
      if (!looksLikeRangeLimitError(err) || chunk <= MIN_CHUNK_BLOCKS) throw err;
      chunk = Math.max(MIN_CHUNK_BLOCKS, Math.floor(chunk / 4));
      // no avanzamos `from`: reintenta el mismo tramo con un chunk menor
    }
  }

  if (useCache) {
    saveCache(key, { lastBlock: latest.toString(), ids: Array.from(ids, (id) => id.toString()) });
  }
  return ids;
}
