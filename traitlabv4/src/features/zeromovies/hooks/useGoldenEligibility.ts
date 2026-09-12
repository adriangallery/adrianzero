import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { base } from 'wagmi/chains';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZERO_MOVIES_FACET_2_ABI } from '@/lib/web3/abi';

const DIAMOND = CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`;

// Fallback metadata shown before the connected wallet's fetch resolves (or
// while disconnected) — matches the real snapshot's public totals so the
// banner never flashes a "0 holders" placeholder.
const FALLBACK_META = {
  takenAt: '2026-04-28T14:40:17.770Z',
  totalEligibleHolders: 4,
  totalTickets: 4,
};

interface GoldenProofResponse {
  eligible: boolean;
  ticketCount?: number;
  crossSeasonWeight?: number;
  proof?: `0x${string}`[];
  snapshotTakenAt?: string;
  totalEligibleHolders?: number;
  totalTickets?: number;
}

/**
 * Looks up the connected wallet against the Budokai-1-close S1 snapshot via
 * `/api/movies2/golden-proof` — a Vercel serverless function that reads the
 * snapshot JSON server-side and returns only the connected wallet's own
 * ticketCount / crossSeasonWeight / Merkle proof.
 *
 * This intentionally does NOT ship the full snapshot (with everyone's
 * proofs) to the client bundle: with only 4 eligible wallets today the
 * dataset is small, but embedding it means any visitor's dev tools reveal
 * every other holder's proof and un-mystery's the reveal-adjacent movies
 * ahead of time. The proof is fetched per-wallet, at request time, instead.
 *
 * Also reads `isGolden2Claimed(address)` on-chain — replaces the old
 * mock-era `goldenClaimed` flag that lived in `movies2Store`.
 */
export function useGoldenEligibility() {
  const { address, isConnected } = useAccount();
  const [data, setData] = useState<GoldenProofResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) {
      setData(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetch(`/api/movies2/golden-proof?address=${address}`)
      .then((r) => r.json())
      .then((json: GoldenProofResponse) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData({ eligible: false });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  const { data: claimedRaw, refetch: refetchClaimed } = useReadContract({
    address: DIAMOND,
    abi: ZERO_MOVIES_FACET_2_ABI,
    functionName: 'isGolden2Claimed',
    args: address ? [address] : undefined,
    chainId: base.id,
    query: { enabled: !!address, staleTime: 30_000 },
  });

  return {
    isEligible: !!data?.eligible,
    ticketCount: data?.ticketCount ?? 0,
    crossSeasonWeight: data?.crossSeasonWeight ?? 0,
    proof: data?.proof ?? [],
    alreadyClaimed: !!claimedRaw,
    refetchClaimed,
    isLoading,
    snapshotMeta: {
      takenAt: data?.snapshotTakenAt ?? FALLBACK_META.takenAt,
      totalEligibleHolders: data?.totalEligibleHolders ?? FALLBACK_META.totalEligibleHolders,
      totalTickets: data?.totalTickets ?? FALLBACK_META.totalTickets,
    },
    isMock: false as const,
  };
}
