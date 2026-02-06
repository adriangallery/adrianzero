/**
 * useClaimBatch Hook
 * Handles batch punk claims
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePublicClient, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { OGCLAIM_ABI } from '@/lib/web3/abi';
import { parseClaimError } from '@/lib/web3/utils/batchReads';

interface ClaimBatchParams {
  punkIds: number[];
}

export function useClaimBatch() {
  const queryClient = useQueryClient();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const claimMutation = useMutation({
    mutationFn: async ({ punkIds }: ClaimBatchParams) => {
      if (!publicClient) throw new Error('No public client available');
      if (!writeContractAsync) throw new Error('Wallet not connected');
      if (punkIds.length === 0) throw new Error('No punks selected');

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.OGCLAIM_CONTRACT as `0x${string}`,
        abi: OGCLAIM_ABI,
        functionName: 'claimBatch',
        args: [punkIds.map(BigInt)],
      });

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      return { hash, punkIds };
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['ogclaim-status'] });
      queryClient.invalidateQueries({ queryKey: ['ogclaim-stats'] });
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
