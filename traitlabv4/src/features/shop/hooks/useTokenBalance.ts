/**
 * useTokenBalance Hook
 * Gets the user's $ZERO and $ADRIAN token balances
 */

import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ERC20_ABI } from '@/lib/web3/abi';

export function useTokenBalance() {
  const { address } = useAccount();

  const { data: zeroData, isLoading: zeroLoading, refetch: refetchZero } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: adrianData, isLoading: adrianLoading, refetch: refetchAdrian } = useReadContract({
    address: CONTRACT_ADDRESSES.ADRIAN_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const zeroBalance = zeroData as bigint | undefined;
  const adrianBalance = adrianData as bigint | undefined;

  return {
    zeroBalance,
    adrianBalance,
    zeroFormatted: zeroBalance ? Number(zeroBalance) / 1e18 : 0,
    adrianFormatted: adrianBalance ? Number(adrianBalance) / 1e18 : 0,
    isLoading: zeroLoading || adrianLoading,
    refetch: () => { refetchZero(); refetchAdrian(); },
  };
}
