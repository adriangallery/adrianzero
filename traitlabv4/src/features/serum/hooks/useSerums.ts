/**
 * useSerums Hook
 * Reads serum balances (token IDs 262144-262147) directly from ADRIAN_LAB
 * via balanceOfBatch. Avoids Alchemy ERC-1155 listings missing these IDs.
 */

import { useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ADRIAN_LAB_ABI } from '@/lib/web3/abi';
import { IMAGE_PATHS, getGitHubImageUrl } from '@/config/images';
import type { Serum } from '@/types/nft.types';

const SERUM_IDS = [262144n, 262145n, 262146n, 262147n] as const;

const SERUM_NAMES: Record<string, string> = {
  '262144': 'AdrianGF',
  '262145': 'GOLD Serum (100%)',
  '262146': 'GOLD Serum (66%)',
  '262147': 'GOLD Serum (33%)',
};

function serumImage(id: bigint) {
  const url = getGitHubImageUrl(IMAGE_PATHS.getComponentImage(Number(id), 'gif'));
  return { cachedUrl: url, originalUrl: url, thumbnailUrl: url };
}

export function useSerums() {
  const { address } = useAccount();

  const accounts = address
    ? (SERUM_IDS.map(() => address) as `0x${string}`[])
    : undefined;

  const { data, isLoading, refetch, error } = useReadContract({
    address: CONTRACT_ADDRESSES.ADRIAN_LAB as `0x${string}`,
    abi: ADRIAN_LAB_ABI,
    functionName: 'balanceOfBatch',
    args: accounts ? [accounts, SERUM_IDS as unknown as readonly bigint[]] : undefined,
    query: { enabled: !!address, staleTime: 1000 * 30 },
  });

  const serums = useMemo<Serum[]>(() => {
    const balances = data as readonly bigint[] | undefined;
    if (!balances) return [];
    const out: Serum[] = [];
    SERUM_IDS.forEach((id, i) => {
      const balance = Number(balances[i] ?? 0n);
      if (balance <= 0) return;
      const idStr = id.toString();
      out.push({
        tokenId: idStr,
        name: SERUM_NAMES[idStr] ?? `Serum #${idStr}`,
        balance,
        image: serumImage(id),
      });
    });
    return out;
  }, [data]);

  return { data: serums, isLoading, error, refetch };
}
