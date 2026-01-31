/**
 * useActivateToken Hook
 * Activates an AdrianZERO token on-chain
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ADRIAN_ZERO_ABI } from '@/lib/web3/abi';

export function useActivateToken() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();

  const mutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.ADRIAN_ZERO,
        abi: ADRIAN_ZERO_ABI,
        functionName: 'activateToken',
        args: [BigInt(tokenId)],
      });

      return hash;
    },
    onSuccess: (hash) => {
      console.log('Token activation transaction sent:', hash);
      // Invalidate and refetch after success
      queryClient.invalidateQueries({ queryKey: ['adrianzero-tokens'] });
    },
    onError: (error) => {
      console.error('Error activating token:', error);
    },
  });

  return mutation;
}

export function useRefreshMetadata() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();

  const mutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.ADRIAN_ZERO,
        abi: ADRIAN_ZERO_ABI,
        functionName: 'refreshMetadata',
        args: [BigInt(tokenId)],
      });

      return hash;
    },
    onSuccess: (hash) => {
      console.log('Metadata refresh transaction sent:', hash);
      // Invalidate and refetch after success
      queryClient.invalidateQueries({ queryKey: ['adrianzero-tokens'] });
    },
    onError: (error) => {
      console.error('Error refreshing metadata:', error);
    },
  });

  return mutation;
}
