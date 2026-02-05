/**
 * useAdrianBalance Hook
 * Gets the user's $ADRIAN token balance
 */

import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ERC20_ABI } from '@/lib/web3/abi';

export function useAdrianBalance() {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ADRIAN_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const balance = data as bigint | undefined;
  const formatted = balance ? Number(balance) / 1e18 : 0;

  return {
    balance,
    formatted,
    isLoading,
    error,
    refetch,
  };
}
