/**
 * useHasAdrianZero Hook
 * Checks if the connected wallet owns any AdrianZERO NFTs
 */

import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ADRIAN_ZERO_ABI } from '@/lib/web3/abi';

export function useHasAdrianZero() {
  const { address } = useAccount();

  const { data: balance, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.ADRIAN_ZERO as `0x${string}`,
    abi: ADRIAN_ZERO_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const hasAdrianZero = balance ? Number(balance) > 0 : false;

  return {
    hasAdrianZero,
    balance: balance ? Number(balance) : 0,
    isLoading,
  };
}
