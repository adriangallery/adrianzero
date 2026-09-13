#!/usr/bin/env node
/**
 * Regenera `src/features/packs/data/registry.seed.json`: la lista de
 * packIds vistos alguna vez en `PackConfigured` para `AdrianFloppyDiscs`,
 * `OpenPack v4` y `ActionPacks`, más el bloque hasta el que se escaneó.
 *
 * Por qué existe: esos 3 contratos no tienen `packCount()`/`nextPackId()`
 * — `usePackRegistry` (en el navegador) descubre sus IDs escaneando el
 * evento `PackConfigured` con `eth_getLogs` (`logScan.ts`). Escanear desde
 * el bloque de deploy (~17,7 M de bloques en Base) en la primera visita de
 * cada usuario es lento y puede dar 429 con el RPC público (2000 bloques
 * por llamada). Este script hace ESE escaneo largo una vez, offline, con
 * el RPC que le pases (idealmente uno con clave, no el público), y el
 * resultado se commitea; `logScan.ts` arranca desde `lastScannedBlock + 1`
 * en vez de desde el deploy, así que solo escanea lo nuevo desde entonces
 * (más el incremental normal que ya hace en `localStorage` del navegador).
 *
 * Cuándo ejecutarlo: después de registrar un pack nuevo
 * (`setPackConfig`/`configurePack` — ver `Contratos/RUNBOOK_LANZAR_ITEMS.md`
 * paso 7) o simplemente de vez en cuando para mantener el seed fresco.
 * NO se ejecuta en CI — es mantenimiento manual, deliberado (mismo motivo
 * que el resto del repo evita builds/RPC pesados en cada push).
 *
 * Uso:
 *   node scripts/packs-registry-seed.mjs
 *
 * **NUNCA le pases un RPC de Alchemy/Infura** (`RPC_URL=...`) pensando
 * que irá más rápido: medido en producción (13-sep) que para
 * `eth_getLogs` Alchemy responde `-32600 "up to a 10 block range"` en
 * esta cuenta/plan — muy por debajo incluso de lo que el chunking
 * adaptativo intentaba, y el escaneo termina reventando o tardando una
 * eternidad a golpes de 10 bloques. `mainnet.base.org` (el RPC público de
 * Base, por defecto, sin clave) SÍ soporta hasta 2000 bloques por llamada
 * (medido) — es lo que usa `logScan.ts` en el navegador y lo que usa este
 * script. Con el seed incremental (~25-30 peticiones desde el
 * `lastScannedBlock` anterior) tarda segundos de todas formas; no hace
 * falta una clave para esto.
 *
 * `RPC_URL` sigue siendo overrideable (por si algún día hay un endpoint
 * mejor verificado para rangos grandes), pero el default y lo recomendado
 * es SIEMPRE el público.
 */

import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(HERE, '../src/features/packs/data/registry.seed.json');

const RPC_URL = process.env.RPC_URL || 'https://mainnet.base.org';
if (/alchemy|infura/i.test(RPC_URL)) {
  console.warn(
    `⚠️  RPC_URL parece ser Alchemy/Infura (${RPC_URL}). eth_getLogs con esos proveedores puede estar limitado a rangos ` +
      `mucho más pequeños de lo esperado (medido: -32600 "up to a 10 block range" en Alchemy, 13-sep). ` +
      `Se recomienda dejar RPC_URL sin definir para usar el público (mainnet.base.org, 2000 bloques/llamada).`
  );
}
// Mismos valores que `logScan.ts` (DEFAULT_CHUNK_BLOCKS/MIN_CHUNK_BLOCKS)
// — el límite medido del RPC público, con caída defensiva si algún día
// cambia. NO se asume un límite mayor solo porque `RPC_URL` tenga clave:
// esa suposición fue exactamente el bug que este fix corrige.
const DEFAULT_CHUNK = 2_000;
const MIN_CHUNK = 500;

// Mismos bloques de deploy que `packRegistry.ts#DEPLOY_BLOCK` — solo se
// usan si no hay seed previo (primera generación).
const SOURCES = [
  {
    key: 'FLOPPY_DISCS',
    address: '0x56b3fcc1417f269138cb7eba1272e8ccfee8ffc8',
    deployBlock: 33_621_569n,
    event: parseAbiItem('event PackConfigured(uint256 indexed packId, uint256 publicPrice, uint256 maxSupply)'),
  },
  {
    key: 'OPENPACK_V4',
    address: '0x238083148f4fbf4232efe16261e7aa87ce787022',
    deployBlock: 35_892_762n,
    event: parseAbiItem('event PackConfigured(uint256 indexed packId, uint256 assetCount, uint32 itemsPerPack, bool active)'),
  },
  {
    key: 'ACTION_PACKS',
    address: '0xa7e2ae50e7f15d220cd3f61728e52d0e6e1b2e36',
    deployBlock: 33_500_427n,
    event: parseAbiItem('event PackConfigured(uint256 indexed packId)'),
  },
];

function looksLikeRangeLimitError(err) {
  const msg = String(err?.message ?? err ?? '').toLowerCase();
  return (
    msg.includes('range') ||
    msg.includes('limit') ||
    msg.includes('block span') ||
    msg.includes('too many') ||
    msg.includes('-32600')
  );
}

async function scanIds(client, { address, event, fromBlock }, toBlockLatest) {
  const ids = new Set();
  let from = fromBlock;
  let chunk = DEFAULT_CHUNK;

  while (from <= toBlockLatest) {
    const to = from + BigInt(chunk) > toBlockLatest ? toBlockLatest : from + BigInt(chunk);
    try {
      const logs = await client.getLogs({ address, event, fromBlock: from, toBlock: to });
      for (const log of logs) {
        if (typeof log.args?.packId === 'bigint') ids.add(log.args.packId.toString());
      }
      from = to + 1n;
      if (chunk < DEFAULT_CHUNK) chunk = DEFAULT_CHUNK;
      process.stdout.write(`.`);
    } catch (err) {
      if (!looksLikeRangeLimitError(err) || chunk <= MIN_CHUNK) throw err;
      chunk = MIN_CHUNK;
    }
  }
  return ids;
}

function loadPreviousSeed() {
  if (!existsSync(OUT_PATH)) return null;
  try {
    return JSON.parse(readFileSync(OUT_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

async function main() {
  const client = createPublicClient({ chain: base, transport: http(RPC_URL) });
  const latest = await client.getBlockNumber();
  const previous = loadPreviousSeed();

  console.log(`RPC: ${RPC_URL}`);
  console.log(`Bloque actual: ${latest}`);
  if (previous) console.log('Seed previo encontrado — escaneo incremental desde su lastScannedBlock.');
  else console.log('Sin seed previo — escaneo completo desde el bloque de deploy de cada contrato (puede tardar).');

  const sources = {};
  for (const source of SOURCES) {
    const prevEntry = previous?.sources?.[source.key];
    const fromBlock = prevEntry ? BigInt(prevEntry.lastScannedBlock) + 1n : source.deployBlock;
    const prevIds = new Set(prevEntry?.packIds ?? []);

    console.log(`\nEscaneando ${source.key} (${source.address}) desde el bloque ${fromBlock}…`);
    const newIds = await scanIds(client, { ...source, fromBlock }, latest);
    const allIds = new Set([...prevIds, ...newIds]);

    // Ordena como BigInt, NUNCA como Number: ActionPacks tiene al menos un
    // `packId` histórico de pruebas (ago-2025) mayor que
    // Number.MAX_SAFE_INTEGER (parece la dirección del propio contrato
    // colada como uint256) — convertirlo a Number para ordenar lo
    // corrompería. Se deja en el seed tal cual (candidato crudo del log);
    // `packRegistry.ts` lo descarta solo si `isPackConfigured` da `false`.
    sources[source.key] = {
      address: source.address,
      lastScannedBlock: latest.toString(),
      packIds: Array.from(allIds)
        .map((id) => BigInt(id))
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
        .map(String),
    };
    console.log(`\n${source.key}: ${allIds.size} packIds (${newIds.size} nuevos)`);
  }

  const seed = {
    generatedAt: new Date().toISOString(),
    chainId: base.id,
    sources,
  };

  writeFileSync(OUT_PATH, JSON.stringify(seed, null, 2) + '\n');
  console.log(`\nEscrito: ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
