import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZERO_MOVIES_FACET_ABI } from '@/lib/web3/abi';
import { formatEther } from 'viem';

/**
 * Reads the on-chain S1 late-fee configuration. `gracePeriod` is the seconds
 * before a rent is considered OVERDUE (default 5d on mainnet); `feePerDay`
 * is the $ZERO charged per day past grace (default 1k ZERO).
 *
 * Cached at the wagmi query level — these values change only via admin
 * setLateFeeConfig, so polling every 5 minutes is plenty.
 */
export function useS1LateFeeConfig() {
  const { data } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: ZERO_MOVIES_FACET_ABI,
    functionName: 'getLateFeeConfig',
    query: {
      staleTime: 5 * 60_000,
      refetchInterval: 5 * 60_000,
    },
  });

  const gracePeriod = data ? Number((data as [bigint, bigint])[0]) : 5 * 86_400;
  const feePerDayRaw = data ? (data as [bigint, bigint])[1] : 1_000n * 10n ** 18n;
  const feePerDay = Number(formatEther(feePerDayRaw));

  return { gracePeriod, feePerDay, feePerDayRaw };
}

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

/**
 * Pure helper: given a single rental status row + on-chain gracePeriod,
 * returns whether the rent is currently overdue and how many full days past
 * grace. Mirrors the on-chain `getBuyPriceForMovie` accumulator (line 562 of
 * ZEROmoviesFacet.sol) so the visual state matches the late-fee charged.
 */
export function deriveS1Overdue(
  rental: { renter: string; permanent: boolean; rentedAt: number } | undefined,
  gracePeriod: number,
): { isOverdue: boolean; daysOverdue: number } {
  if (!rental || rental.permanent || !rental.renter || rental.renter === ZERO_ADDR || rental.rentedAt <= 0) {
    return { isOverdue: false, daysOverdue: 0 };
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const overdueAt = rental.rentedAt + gracePeriod;
  if (nowSec <= overdueAt) return { isOverdue: false, daysOverdue: 0 };
  return { isOverdue: true, daysOverdue: Math.max(1, Math.floor((nowSec - overdueAt) / 86_400)) };
}
