/**
 * useApplySerum Hook
 * Applies a serum to an AdrianZERO NFT
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { SERUM_ABI } from '@/lib/web3/abi';
import { useNotifications } from '@/hooks/useNotifications';

interface ApplySerumParams {
  tokenId: string;
  serumId: string;
}

export function useApplySerum() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const notifications = useNotifications();

  const mutation = useMutation({
    mutationFn: async ({ tokenId, serumId }: ApplySerumParams) => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.SERUM_MODULE,
        abi: SERUM_ABI,
        functionName: 'applySerum',
        args: [BigInt(tokenId), BigInt(serumId)],
      });

      console.log('Apply serum transaction sent:', hash);

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
    onSuccess: (hash) => {
      console.log('Serum applied successfully:', hash);
      notifications.success('Serum Applied!', 'Your NFT has been enhanced with the serum');
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['adrianzero-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['serums'] });
    },
    onError: (error) => {
      console.error('Error applying serum:', error);
      notifications.error('Failed to Apply Serum', 'Please try again');
    },
  });

  return mutation;
}
