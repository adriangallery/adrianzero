/**
 * useClaimReward Hook
 * Handles claiming rewards (single and batch)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePublicClient, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { REWARDS_ABI } from '@/lib/web3/abi';
import { parseClaimError } from '@/lib/web3/utils/batchReads';

interface ClaimRewardParams {
  campaignId: number;
  punkIds: number[];
}

export function useClaimReward() {
  const queryClient = useQueryClient();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const claimMutation = useMutation({
    mutationFn: async ({ campaignId, punkIds }: ClaimRewardParams) => {
      if (!publicClient) throw new Error('No public client available');
      if (!writeContractAsync) throw new Error('Wallet not connected');

      // Use batchClaim if multiple punks, otherwise single claim
      const isBatch = punkIds.length > 1;

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.REWARDS_CONTRACT as `0x${string}`,
        abi: REWARDS_ABI,
        functionName: isBatch ? 'batchClaim' : 'claim',
        args: isBatch
          ? [BigInt(campaignId), punkIds.map(BigInt)]
          : [BigInt(campaignId), BigInt(punkIds[0])],
      });

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      return { hash, campaignId, punkIds };
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['rewards-claim-status'] });
      queryClient.invalidateQueries({ queryKey: ['rewards-campaigns'] });
    },
  });

  return {
    claim: claimMutation.mutate,
    claimAsync: claimMutation.mutateAsync,
    isLoading: claimMutation.isPending,
    isSuccess: claimMutation.isSuccess,
    isError: claimMutation.isError,
    error: claimMutation.error,
    errorMessage: claimMutation.error ? parseClaimError(claimMutation.error as Error) : null,
  };
}
