import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// `import.meta.url` (not `__dirname`) so this resolves correctly whether
// Vercel's build bundles this function as ESM (project package.json has
// "type": "module") or downlevels it to CJS — esbuild rewrites
// `import.meta.url` to the CJS-equivalent automatically in that case,
// whereas a bare `__dirname` reference is undefined under real ESM.
const currentDir = dirname(fileURLToPath(import.meta.url));

/**
 * GET /api/movies2/golden-proof?address=0x...
 *
 * Serves one wallet's ZEROmovies S2 Golden Mint eligibility (ticketCount,
 * crossSeasonWeight, Merkle proof) read server-side from the S1-close
 * snapshot. The proof array is NOT bundled into client JS — only fetched
 * per-connected-wallet at request time — so a random visitor's dev tools /
 * the Vite chunk never leaks the other 3 eligible wallets' proofs.
 *
 * Source: `ZEROtoken/zero-diamond/bots/zero-keeper/snapshot-s1.json`
 * (copied here as `_snapshot.json` — not secret data, just kept out of the
 * client bundle; these are public Merkle proofs, not credentials). Its
 * `totals.merkleRoot` was verified 2026-09-13 against `getMovies2Snapshot()`
 * on the live Diamond (0x542b…D0A0, Base mainnet) — both match exactly.
 * NOTE: this superseded a stale root hard-coded in the old frontend mock
 * (`data/snapshotMock.ts`) that never matched on-chain state.
 *
 * Response:
 *   { eligible: false }
 *   { eligible: true, ticketCount, crossSeasonWeight, proof: string[],
 *     merkleRoot, snapshotTakenAt, totalEligibleHolders, totalTickets,
 *     totalCrossSeasonWeight }
 */
interface SnapshotWallet {
  address: string;
  ticketCount: number;
  crossSeasonWeight: number;
  proof: string[];
}

interface Snapshot {
  snapshotTakenAt: string;
  totals: {
    holders: number;
    totalGoldenTickets: number;
    totalCrossSeasonWeight: number;
    merkleRoot: string;
  };
  wallets: SnapshotWallet[];
}

function loadSnapshot(): Snapshot {
  const raw = readFileSync(join(currentDir, '_snapshot.json'), 'utf8');
  return JSON.parse(raw) as Snapshot;
}

function corsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const address = typeof req.query.address === 'string' ? req.query.address : '';
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: 'Missing or invalid address' });
  }

  try {
    const snapshot = loadSnapshot();
    const wallet = snapshot.wallets.find((w) => w.address.toLowerCase() === address.toLowerCase());

    if (!wallet) {
      return res.status(200).json({ eligible: false });
    }

    return res.status(200).json({
      eligible: true,
      ticketCount: wallet.ticketCount,
      crossSeasonWeight: wallet.crossSeasonWeight,
      proof: wallet.proof,
      merkleRoot: snapshot.totals.merkleRoot,
      snapshotTakenAt: snapshot.snapshotTakenAt,
      totalEligibleHolders: snapshot.totals.holders,
      totalTickets: snapshot.totals.totalGoldenTickets,
      totalCrossSeasonWeight: snapshot.totals.totalCrossSeasonWeight,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    return res.status(500).json({ error: 'Failed to read snapshot', detail: msg });
  }
}
