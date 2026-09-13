/**
 * Descubrimiento de packIds vía logs on-chain, con chunking adaptativo,
 * caché incremental en localStorage, un RPC dedicado para `eth_getLogs`
 * y un tope de peticiones por sesión.
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
 * **RPC dedicado, nunca Alchemy (fix 13-sep, hallazgo del crítico en
 * producción):** el `publicClient` de wagmi (`config/wagmi.ts`) es
 * `fallback([alchemy…, infura?, mainnet.base.org, …], { rank: false })` —
 * en producción, con `VITE_ALCHEMY_API_KEYS` puesta, CADA `eth_getLogs`
 * va primero a Alchemy, que para esta cuenta/plan responde
 * `-32600 "up to a 10 block range"` — muy por debajo de los 2000 bloques
 * que este módulo asumía, y por debajo incluso de `MIN_CHUNK_BLOCKS`
 * (500), así que el chunking adaptativo terminaba agotando su suelo y
 * lanzando en vez de progresar. El RPC público de Base
 * (`mainnet.base.org`) sí soporta hasta 2000 bloques por `eth_getLogs`
 * (medido). Por eso `scanPackIds` usa SIEMPRE un cliente propio contra
 * ese RPC para `getLogs`/`getBlockNumber` — nunca el `publicClient` de
 * wagmi ni Alchemy — y el resto de lecturas de `packRegistry.ts`
 * (multicall, `readContract`) siguen yendo por wagmi/Alchemy sin cambios,
 * porque esas sí soportan su rango normal.
 *
 * El escaneo:
 *  1. Arranca con un `chunk` de `DEFAULT_CHUNK_BLOCKS` (2000, el límite
 *     medido del RPC público) y lo BAJA a `MIN_CHUNK_BLOCKS` (500) si el
 *     proveedor rechaza el rango — defensivo, por si ese límite cambia.
 *  2. Cachea en `localStorage` el último bloque escaneado + los IDs
 *     encontrados hasta ahora, por contrato+evento+chain — la próxima
 *     carga solo escanea los bloques nuevos, no repite el historial.
 *  3. Parte de un **seed versionado en el repo**
 *     (`registry.seed.json`, generado con
 *     `scripts/packs-registry-seed.mjs`) en vez del bloque de deploy —
 *     así la PRIMERA visita de cada usuario (sin `localStorage` aún)
 *     tampoco escanea los ~17,7 M de bloques completos, solo lo que haya
 *     pasado desde que se generó el seed (con el seed al día y trozos de
 *     2000 bloques, del orden de 25-30 peticiones).
 *  4. **Tope de peticiones por sesión** (`maxRequestsPerScan`, 60 por
 *     defecto): si el rango pendiente es inusualmente grande (seed
 *     desactualizado, o el navegador nunca llegó a `localStorage`), el
 *     escaneo se para al llegar al tope, guarda el progreso real
 *     (`lastScannedBlock` = hasta donde de verdad llegó, NUNCA el bloque
 *     más reciente de la cadena si no se escaneó hasta ahí) y la próxima
 *     carga continúa desde ese punto — nunca bloquea la pestaña ni
 *     dispara un aluvión de peticiones sin fin.
 *
 * Si esto se vuelve un problema de rendimiento en producción, la solución
 * de fondo es un indexer/subgraph — fuera de alcance de esta capa de
 * datos (ver informe del worker F5 en el PR).
 */

import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import type { AbiEvent, Address } from 'viem';

export const DEFAULT_CHUNK_BLOCKS = 2_000;
export const MIN_CHUNK_BLOCKS = 500;
export const DEFAULT_MAX_REQUESTS_PER_SCAN = 60;

/** RPC público de Base — límite medido de 2000 bloques por `eth_getLogs`, sin clave, nunca Alchemy. */
const LOGS_RPC_URL = 'https://mainnet.base.org';

let dedicatedLogsClient: LogsClient | null = null;

/** Cliente viem dedicado solo a `getLogs`/`getBlockNumber` de este escaneo. Singleton perezoso. */
function getDedicatedLogsClient(): LogsClient {
  if (!dedicatedLogsClient) {
    dedicatedLogsClient = createPublicClient({ chain: base, transport: http(LOGS_RPC_URL) });
  }
  return dedicatedLogsClient;
}

/** Subconjunto de PublicClient que este módulo necesita — así los tests pueden inyectar un fake sin depender del tipo completo de viem. */
export interface LogsClient {
  getBlockNumber: () => Promise<bigint>;
  getLogs: (params: {
    address: Address;
    event: AbiEvent;
    fromBlock: bigint;
    toBlock: bigint;
  }) => Promise<readonly { args?: Record<string, unknown> }[]>;
}

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
    msg.includes('too many') ||
    msg.includes('-32600')
  );
}

export interface RegistrySeed {
  lastScannedBlock: bigint;
  ids: readonly bigint[];
}

export interface ScanPackIdsParams {
  address: Address;
  event: AbiEvent;
  /** Nombre del argumento packId dentro del evento (p.ej. "packId"). */
  packIdArg: string;
  /** Primer bloque en el que el contrato pudo emitir el evento (bloque de deploy verificado en Blockscout) — solo se usa si no hay ni caché de localStorage ni `seed`. */
  fromBlock: bigint;
  chainId: number;
  /** Desactiva localStorage (tests). */
  useCache?: boolean;
  /** Punto de partida versionado en el repo (`registry.seed.json`) — evita escanear desde `fromBlock` en la primera visita de cada navegador. */
  seed?: RegistrySeed;
  /** Tope de peticiones `eth_getLogs` por llamada — protege contra un rango pendiente enorme (seed viejo, sin localStorage). Por defecto `DEFAULT_MAX_REQUESTS_PER_SCAN`. */
  maxRequests?: number;
  /** Solo para tests — inyecta un cliente falso en vez del RPC dedicado real. NUNCA se usa en producción (siempre el RPC público dedicado, nunca el `publicClient` de wagmi/Alchemy). */
  logsClient?: LogsClient;
}

/** Escanea `PackConfigured`-like events y devuelve el set de packIds vistos, con caché incremental y tope de peticiones por llamada. */
export async function scanPackIds(params: ScanPackIdsParams): Promise<Set<bigint>> {
  const {
    address,
    event,
    packIdArg,
    chainId,
    useCache = true,
    seed,
    maxRequests = DEFAULT_MAX_REQUESTS_PER_SCAN,
  } = params;
  const client = params.logsClient ?? getDedicatedLogsClient();
  const key = cacheKey(chainId, address, event.name ?? 'event');
  const cachedFromStorage = useCache ? loadCache(key) : null;

  // Prioridad: localStorage (ya tiene lo que este navegador escaneó) >
  // seed del repo (ya tiene lo que se escaneó offline hasta su
  // `generatedAt`) > bloque de deploy (primera vez sin nada de lo anterior).
  // (Nombrado `resumePoint`, no `base`, para no tapar el `base` de
  // `viem/chains` importado arriba.)
  const resumePoint: ScanCacheEntry | null =
    cachedFromStorage ?? (seed ? { lastBlock: seed.lastScannedBlock.toString(), ids: seed.ids.map(String) } : null);

  const ids = new Set<bigint>(resumePoint ? resumePoint.ids.map((s) => BigInt(s)) : []);
  let from = resumePoint ? BigInt(resumePoint.lastBlock) + 1n : params.fromBlock;
  // Hasta dónde se ha escaneado de verdad — arranca un bloque por debajo
  // de `from` (nada nuevo todavía); si el tope de peticiones corta el
  // escaneo a medias, esto es lo que se guarda, NUNCA `latest` sin más.
  let scannedUpTo = from - 1n;

  const latest = await client.getBlockNumber();
  let chunk = DEFAULT_CHUNK_BLOCKS;
  let requests = 0;

  while (from <= latest && requests < maxRequests) {
    const to = from + BigInt(chunk) > latest ? latest : from + BigInt(chunk);
    requests += 1;
    try {
      const logs = await client.getLogs({ address, event, fromBlock: from, toBlock: to });
      for (const log of logs) {
        const value = log.args?.[packIdArg];
        if (typeof value === 'bigint') ids.add(value);
      }
      scannedUpTo = to;
      from = to + 1n;
      if (chunk < DEFAULT_CHUNK_BLOCKS) chunk = DEFAULT_CHUNK_BLOCKS;
    } catch (err) {
      if (!looksLikeRangeLimitError(err) || chunk <= MIN_CHUNK_BLOCKS) throw err;
      chunk = MIN_CHUNK_BLOCKS;
      // no avanzamos `from`: reintenta el mismo tramo con el chunk mínimo
    }
  }

  if (useCache) {
    saveCache(key, { lastBlock: scannedUpTo.toString(), ids: Array.from(ids, (id) => id.toString()) });
  }
  return ids;
}
