/**
 * Registro de packs — el único sitio que sabe "qué packId existe, quién lo
 * vende y quién lo abre", leído en vivo. `usePackCatalog`, `useMyPacks`,
 * `useBuyPack` y `useOpenPack` se construyen todos sobre esto; ninguno
 * mantiene su propia lista de IDs.
 *
 * Descubrimiento (sin listas a mano):
 *  - FloppyDiscs / OpenPack v4 / ActionPacks no tienen `packCount()` — se
 *    descubren escaneando el evento `PackConfigured` (`logScan.ts`).
 *  - FloppyETH / FloppyMerkle sí son enumerables: `batchCount()` +
 *    `getBatchSummary(batchId)` para cada uno — sin escaneo de logs.
 *
 * Venta vs. apertura: de los 5 contratos, solo `FloppyDiscs` (ERC20) y
 * `FloppyETH`/`FloppyMerkle` (ETH y/o ERC20 por batch) tienen función de
 * compra (`purchasePack`/`mint`/`mintWithToken`). `OpenPack v4` y
 * `ActionPacks` NO venden — solo abren packs que el usuario ya tiene
 * (llegados por airdrop, kit sale, etc.). Verificado leyendo el ABI
 * verificado de cada uno (no hay `purchase`/`mint`/`buy` en ninguno de
 * los dos) — ver `__fixtures__/*.verified-abi.json`.
 */

import { getAbiItem } from 'viem';
import type { AbiEvent, Address, PublicClient } from 'viem';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import {
  ADRIAN_FLOPPY_DISCS_DATA_ABI,
  ADRIAN_FLOPPY_ETH_DATA_ABI,
  ADRIAN_FLOPPY_MERKLE_DATA_ABI,
  OPENPACK_V4_DATA_ABI,
  ACTION_PACKS_DATA_ABI,
} from './packsData.abi';
import { scanPackIds } from './logScan';
import type { CatalogPack, PackOpenContractName, PackPrice } from './types';

// Bloques de deploy verificados en Blockscout (creation_transaction →
// block_number), 13-sep-2026. Esto NO es una lista de packIds: es metadata
// del contrato (desde qué bloque puede existir el evento), como el
// `startBlock` de un subgraph — sin esto habría que escanear desde el
// génesis de Base.
const DEPLOY_BLOCK = {
  FLOPPY_DISCS: 33_621_569n,
  FLOPPY_ETH: 34_334_689n,
  FLOPPY_MERKLE: 35_232_966n,
  OPENPACK_V4: 35_892_762n,
  ACTION_PACKS: 33_500_427n,
} as const;

const FLOPPY_DISCS_ADDRESS = CONTRACT_ADDRESSES.ADRIAN_FLOPPY_DISCS as Address;
const FLOPPY_ETH_ADDRESS = CONTRACT_ADDRESSES.ADRIAN_FLOPPY_ETH as Address;
const FLOPPY_MERKLE_ADDRESS = CONTRACT_ADDRESSES.ADRIAN_FLOPPY_MERKLE as Address;
const OPENPACK_V4_ADDRESS = CONTRACT_ADDRESSES.OPENPACK_V4 as Address;
const ACTION_PACKS_ADDRESS = CONTRACT_ADDRESSES.ACTION_PACKS as Address;

const FLOPPY_DISCS_PACK_CONFIGURED = getAbiItem({
  abi: ADRIAN_FLOPPY_DISCS_DATA_ABI,
  name: 'PackConfigured',
}) as AbiEvent;
const OPENPACK_V4_PACK_CONFIGURED = getAbiItem({ abi: OPENPACK_V4_DATA_ABI, name: 'PackConfigured' }) as AbiEvent;
const ACTION_PACKS_PACK_CONFIGURED = getAbiItem({ abi: ACTION_PACKS_DATA_ABI, name: 'PackConfigured' }) as AbiEvent;

export interface PackRegistry {
  /** Catálogo: solo entradas con función de compra real (FloppyDiscs + FloppyETH/Merkle). */
  catalog: CatalogPack[];
  /** packId → contrato que hoy puede abrirlo (resuelto en vivo), para quien ya lo tiene. */
  openRoutes: Map<string, { contract: PackOpenContractName; address: Address }>;
}

// Mismo mirror que `features/packs/components/PacksModule.tsx` (`LABIMAGES_BASE`)
// — la única fuente estable de arte de packs/floppies hoy (recon F0 §7): el
// renderer `/api/render/<id>.png` devuelve un avatar genérico, no el arte
// del pack. La extensión real (gif/png) varía por id; se deja como
// candidato principal y el consumidor decide su propio fallback, igual que
// hace `PacksModule.tsx` (no se toca esa UI, solo se replica la misma ruta).
function packImageUrl(packId: bigint): string {
  return `https://raw.githubusercontent.com/adriangallery/AdrianLAB/main/public/labimages/${packId}.gif`;
}

function priceListFrom(priceWei: bigint, priceToken: bigint, tokenAddress: Address): PackPrice[] {
  const prices: PackPrice[] = [];
  if (priceWei > 0n) prices.push({ currency: 'ETH', tokenAddress: null, amount: priceWei });
  if (priceToken > 0n) prices.push({ currency: 'ERC20', tokenAddress, amount: priceToken });
  return prices;
}

async function buildFloppyDiscsCatalog(client: PublicClient, chainId: number): Promise<{ catalog: CatalogPack[]; ids: bigint[] }> {
  const ids = await scanPackIds({
    client,
    address: FLOPPY_DISCS_ADDRESS,
    event: FLOPPY_DISCS_PACK_CONFIGURED,
    packIdArg: 'packId',
    fromBlock: DEPLOY_BLOCK.FLOPPY_DISCS,
    chainId,
  });
  const idList = Array.from(ids);
  if (idList.length === 0) return { catalog: [], ids: [] };

  const paymentToken = (await client.readContract({
    address: FLOPPY_DISCS_ADDRESS,
    abi: ADRIAN_FLOPPY_DISCS_DATA_ABI,
    functionName: 'paymentToken',
  })) as Address;

  const results = await client.multicall({
    contracts: idList.map((packId) => ({
      address: FLOPPY_DISCS_ADDRESS,
      abi: ADRIAN_FLOPPY_DISCS_DATA_ABI,
      functionName: 'getPackConfig' as const,
      args: [packId] as const,
    })),
    allowFailure: true,
  });

  const catalog: CatalogPack[] = [];
  results.forEach((res, i) => {
    if (res.status !== 'success' || !res.result) return;
    const cfg = res.result as {
      id: bigint;
      publicPrice: bigint;
      maxSupply: bigint;
      minted: bigint;
      itemsPerPack: bigint;
      maxPerWallet: bigint;
      startTime: bigint;
      endTime: bigint;
      active: boolean;
      allowlistFreeAmount: bigint;
      allowlistPrice: bigint;
      hasPublicSale: boolean;
      hasAllowlist: boolean;
    };
    if (cfg.id === 0n && cfg.maxSupply === 0n) return; // nunca configurado pese a salir en el log (config borrada)
    catalog.push({
      packId: idList[i],
      name: `Floppy #${idList[i]}`,
      image: packImageUrl(idList[i]),
      prices: priceListFrom(0n, cfg.publicPrice, paymentToken),
      maxSupply: cfg.maxSupply,
      minted: cfg.minted,
      remaining: cfg.maxSupply > cfg.minted ? cfg.maxSupply - cfg.minted : 0n,
      active: cfg.active && cfg.hasPublicSale,
      saleContract: 'FLOPPY_DISCS',
      saleContractAddress: FLOPPY_DISCS_ADDRESS,
      saleBatchId: null,
    });
  });

  return { catalog, ids: idList };
}

async function buildBatchCatalog(
  client: PublicClient,
  address: Address,
  saleContract: 'FLOPPY_ETH' | 'FLOPPY_MERKLE'
): Promise<CatalogPack[]> {
  const abi = saleContract === 'FLOPPY_ETH' ? ADRIAN_FLOPPY_ETH_DATA_ABI : ADRIAN_FLOPPY_MERKLE_DATA_ABI;

  const [batchCount, adrianToken] = await Promise.all([
    client.readContract({ address, abi, functionName: 'batchCount' }) as unknown as Promise<bigint>,
    client.readContract({ address, abi, functionName: 'adrianToken' }) as unknown as Promise<Address>,
  ]);

  if (batchCount === 0n) return [];

  // Los batchId empiezan en 1 (batches[0] no se usa) — batchCount() ya es el tope real.
  const batchIds = Array.from({ length: Number(batchCount) }, (_, i) => BigInt(i + 1));

  const results = await client.multicall({
    contracts: batchIds.map((batchId) => ({
      address,
      abi,
      functionName: 'getBatchSummary' as const,
      args: [batchId] as const,
    })),
    allowFailure: true,
  });

  const catalog: CatalogPack[] = [];
  results.forEach((res) => {
    if (res.status !== 'success' || !res.result) return;
    const [id, name, floppyTokenId, priceWei, priceToken, , , active, minted, maxSupply, remaining] = res.result as readonly [
      bigint,
      string,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      boolean,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
    ];
    catalog.push({
      packId: floppyTokenId,
      name: name || `Floppy #${floppyTokenId}`,
      image: packImageUrl(floppyTokenId),
      prices: priceListFrom(priceWei, priceToken, adrianToken),
      maxSupply,
      minted,
      remaining,
      active,
      saleContract,
      saleContractAddress: address,
      saleBatchId: id,
    });
  });
  return catalog;
}

async function buildOpenOnlyRoutes(
  client: PublicClient,
  chainId: number
): Promise<Map<string, { contract: PackOpenContractName; address: Address }>> {
  const routes = new Map<string, { contract: PackOpenContractName; address: Address }>();

  const [openpackIds, actionPackIds] = await Promise.all([
    scanPackIds({
      client,
      address: OPENPACK_V4_ADDRESS,
      event: OPENPACK_V4_PACK_CONFIGURED,
      packIdArg: 'packId',
      fromBlock: DEPLOY_BLOCK.OPENPACK_V4,
      chainId,
    }),
    scanPackIds({
      client,
      address: ACTION_PACKS_ADDRESS,
      event: ACTION_PACKS_PACK_CONFIGURED,
      packIdArg: 'packId',
      fromBlock: DEPLOY_BLOCK.ACTION_PACKS,
      chainId,
    }),
  ]);

  const openpackList = Array.from(openpackIds);
  const actionList = Array.from(actionPackIds);

  const [openpackResults, actionResults] = await Promise.all([
    openpackList.length
      ? client.multicall({
          contracts: openpackList.map((packId) => ({
            address: OPENPACK_V4_ADDRESS,
            abi: OPENPACK_V4_DATA_ABI,
            functionName: 'packConfigs' as const,
            args: [packId] as const,
          })),
          allowFailure: true,
        })
      : Promise.resolve([]),
    actionList.length
      ? client.multicall({
          contracts: actionList.map((packId) => ({
            address: ACTION_PACKS_ADDRESS,
            abi: ACTION_PACKS_DATA_ABI,
            functionName: 'isPackConfigured' as const,
            args: [packId] as const,
          })),
          allowFailure: true,
        })
      : Promise.resolve([]),
  ]);

  openpackResults.forEach((res, i) => {
    if (res.status !== 'success' || !res.result) return;
    const [itemsPerPack] = res.result as readonly [number, boolean];
    if (itemsPerPack > 0) {
      routes.set(openpackList[i].toString(), { contract: 'OPENPACK_V4', address: OPENPACK_V4_ADDRESS });
    }
  });

  actionResults.forEach((res, i) => {
    if (res.status !== 'success') return;
    if (res.result === true) {
      routes.set(actionList[i].toString(), { contract: 'ACTION_PACKS', address: ACTION_PACKS_ADDRESS });
    }
  });

  return routes;
}

/** Construye el registro completo: catálogo de venta + rutas de apertura, todo leído en vivo. */
export async function buildPackRegistry(client: PublicClient, chainId: number): Promise<PackRegistry> {
  const [floppyDiscs, floppyEth, floppyMerkle, openRoutesFromOpenOnly] = await Promise.all([
    buildFloppyDiscsCatalog(client, chainId),
    buildBatchCatalog(client, FLOPPY_ETH_ADDRESS, 'FLOPPY_ETH'),
    buildBatchCatalog(client, FLOPPY_MERKLE_ADDRESS, 'FLOPPY_MERKLE'),
    buildOpenOnlyRoutes(client, chainId),
  ]);

  const catalog = [...floppyDiscs.catalog, ...floppyEth, ...floppyMerkle];

  // FloppyDiscs también sabe abrir lo que vende — mapeamos sus propios IDs
  // como ruta de apertura salvo que OpenPack v4/ActionPacks ya lo hagan
  // (algunos packIds migraron su apertura a un contrato más nuevo aunque
  // se sigan vendiendo desde FloppyDiscs — exactamente el caso que
  // PACKS_FLOPPIES_MISMATCH_REPORT.md documentó mal enrutado a mano).
  const openRoutes = new Map(openRoutesFromOpenOnly);
  for (const id of floppyDiscs.ids) {
    const key = id.toString();
    if (!openRoutes.has(key)) {
      openRoutes.set(key, { contract: 'FLOPPY_DISCS', address: FLOPPY_DISCS_ADDRESS });
    }
  }

  return { catalog, openRoutes };
}

/** Resuelve en vivo (sin depender del registro cacheado) quién puede abrir un packId concreto. Usado por useOpenPack como última verdad antes de firmar. */
export async function resolvePackOpenContract(
  client: PublicClient,
  packId: bigint
): Promise<{ contract: PackOpenContractName; address: Address } | null> {
  const [actionConfigured, openpackConfig, floppyConfig] = await Promise.all([
    (client
      .readContract({
        address: ACTION_PACKS_ADDRESS,
        abi: ACTION_PACKS_DATA_ABI,
        functionName: 'isPackConfigured',
        args: [packId],
      })
      .catch(() => false) as unknown) as Promise<boolean>,
    (client
      .readContract({
        address: OPENPACK_V4_ADDRESS,
        abi: OPENPACK_V4_DATA_ABI,
        functionName: 'packConfigs',
        args: [packId],
      })
      .catch(() => [0, false] as const) as unknown) as Promise<readonly [number, boolean]>,
    (client
      .readContract({
        address: FLOPPY_DISCS_ADDRESS,
        abi: ADRIAN_FLOPPY_DISCS_DATA_ABI,
        functionName: 'getPackConfig',
        args: [packId],
      })
      .catch(() => null) as unknown) as Promise<{ itemsPerPack: bigint } | null>,
  ]);

  // Orden de prioridad: si más de un contrato tiene config para el mismo
  // packId, gana el más nuevo (ActionPacks/OpenPack v4 sobre FloppyDiscs) —
  // así es como se migró la apertura sin dejar de vender desde FloppyDiscs.
  if (actionConfigured) return { contract: 'ACTION_PACKS', address: ACTION_PACKS_ADDRESS };
  if (openpackConfig[0] > 0) return { contract: 'OPENPACK_V4', address: OPENPACK_V4_ADDRESS };
  if (floppyConfig && floppyConfig.itemsPerPack > 0n) return { contract: 'FLOPPY_DISCS', address: FLOPPY_DISCS_ADDRESS };
  return null;
}
