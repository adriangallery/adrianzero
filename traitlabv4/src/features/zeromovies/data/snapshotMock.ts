import type { GoldenSnapshotEntry } from '../types';

/**
 * S1 holders snapshot taken at Budokai 1 close (2026-04-25T19:00 UTC).
 * Real values from `zero-diamond/snapshots/s1-2026-04-25.json` — these
 * addresses + tickets + weights are exactly what the on-chain Merkle
 * root commits to.
 *
 * Real Merkle proofs are NOT shipped to the frontend — they'll be
 * served from a Vercel API route that reads the JSON at request time.
 * This mock returns an empty proof for now; the real `claimGoldenMint`
 * call that uses this hook would fail on-chain, but UI flows (banner +
 * eligibility) work end-to-end.
 */
const ENTRIES: GoldenSnapshotEntry[] = [
  {
    address: '0x13fCbbBdb6033b6Fdd805cc24940A8c05F717F23',
    ticketCount: 1,
    crossSeasonWeight: 2,
    proof: [],
  },
  {
    address: '0x427fEa9AFfFe417d1D71fF568D9dB1e7a8D2CC32',
    ticketCount: 1,
    crossSeasonWeight: 1,
    proof: [],
  },
  {
    address: '0x4943407105999e3E97EFA2035F5cbC64D72581C6',
    ticketCount: 1,
    crossSeasonWeight: 5,
    proof: [],
  },
  {
    address: '0x5BE28b0257dD7CcB24588B9C4e18CB127928415E',
    ticketCount: 1,
    crossSeasonWeight: 10,
    proof: [],
  },
];

/** lowercased-address → entry, built once at module load. */
const SNAPSHOT_BY_ADDR: Record<string, GoldenSnapshotEntry> = Object.fromEntries(
  ENTRIES.map((e) => [e.address.toLowerCase(), e]),
);

export const S1_SNAPSHOT_META = {
  takenAt: '2026-04-25T19:00:00Z',
  totalEligibleHolders: 4,
  totalTickets: 4,
  totalCrossSeasonWeight: 18,
  merkleRoot: '0xef1a0de8b8602ee53a18ffad37fea033ddb4d7ecc69b88aab83626243b6162d9',
};

/** Lookup eligibility for a connected wallet (returns null if not in snapshot). */
export function lookupSnapshot(address?: string | null): GoldenSnapshotEntry | null {
  if (!address) return null;
  return SNAPSHOT_BY_ADDR[address.toLowerCase()] ?? null;
}
