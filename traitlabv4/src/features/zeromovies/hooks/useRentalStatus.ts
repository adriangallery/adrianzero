import { useReadContract, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZERO_MOVIES_FACET_ABI } from '@/lib/web3/abi';
import { formatEther } from 'viem';

export interface RentalStatus {
  renter: string;
  deposit: bigint;
  rentedAt: number;
  permanent: boolean;
  rentCount: number;
}

export function useAllRentalStatus() {
  const { data, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: ZERO_MOVIES_FACET_ABI,
    functionName: 'getAllRentalStatus',
    query: { refetchInterval: 30_000 },
  });

  const statusMap = new Map<number, RentalStatus>();

  if (data) {
    const [ids, renters, deposits, rentedAts, permanents, rentCounts] = data as [
      bigint[], string[], bigint[], bigint[], boolean[], bigint[]
    ];
    for (let i = 0; i < ids.length; i++) {
      statusMap.set(Number(ids[i]), {
        renter: renters[i],
        deposit: deposits[i],
        rentedAt: Number(rentedAts[i]),
        permanent: permanents[i],
        rentCount: Number(rentCounts[i]),
      });
    }
  }

  return { statusMap, refetch };
}

export function usePendingRewards() {
  const { address } = useAccount();
  const { data } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: ZERO_MOVIES_FACET_ABI,
    functionName: 'getPendingRewards',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });

  const pending = data ? Number(formatEther(data as bigint)) : 0;
  return { pending, pendingRaw: (data as bigint) ?? 0n };
}
