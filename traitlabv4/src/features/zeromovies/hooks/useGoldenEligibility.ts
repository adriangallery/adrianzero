import { useAccount } from 'wagmi';
import { lookupSnapshot, S1_SNAPSHOT_META } from '../data/snapshotMock';

/**
 * Looks up the connected wallet against the Budokai-1-close S1 snapshot.
 * Returns ticket count + cross-season weight + merkle proof if eligible.
 *
 * Mock for now: reads from a hard-coded copy of the JSON committed to
 * `zero-diamond/snapshots/s1-2026-04-25.json`. When the real frontend ships
 * we replace this with a fetch to `/api/snapshot/goldenproof?addr=...` that
 * reads the same JSON server-side and returns the proof — keeping the proof
 * out of the JS bundle.
 */
export function useGoldenEligibility() {
  const { address, isConnected } = useAccount();
  const entry = isConnected ? lookupSnapshot(address) : null;

  return {
    isEligible: !!entry,
    ticketCount: entry?.ticketCount ?? 0,
    crossSeasonWeight: entry?.crossSeasonWeight ?? 0,
    proof: entry?.proof ?? [],
    snapshotMeta: S1_SNAPSHOT_META,
    isMock: true as const,
  };
}
