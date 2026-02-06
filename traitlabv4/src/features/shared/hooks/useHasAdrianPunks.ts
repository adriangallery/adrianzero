/**
 * useHasAdrianPunks Hook
 * Checks if the connected wallet owns any AdrianPunks NFTs
 */

import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { PUNKS_ABI } from '@/lib/web3/abi';

export function useHasAdrianPunks() {
  const { address } = useAccount();

  const { data: balance, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.ADRIAN_PUNKS as `0x${string}`,
    abi: PUNKS_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const hasPunks = balance ? Number(balance) > 0 : false;

  return {
    hasPunks,
    count: balance ? Number(balance) : 0,
    isLoading,
  };
}
