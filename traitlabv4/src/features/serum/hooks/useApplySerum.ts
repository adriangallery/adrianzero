/**
 * useApplySerum Hook
 * Calls SERUM_MODULE.useSerum(serumId, tokenId, narrativeText).
 * No ERC-1155 approval is required — AdrianTraitsCore.burn uses
 * onlyAuthorizedExtension, and SERUM_MODULE is already whitelisted.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { SERUM_ABI } from '@/lib/web3/abi';
import { useNotifications } from '@/hooks/useNotifications';

interface ApplySerumParams {
  tokenId: string;
  serumId: string;
  narrativeText?: string;
}

export function useApplySerum() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const notifications = useNotifications();

  const mutation = useMutation({
    mutationFn: async ({ tokenId, serumId, narrativeText = '' }: ApplySerumParams) => {
      if (!address || !publicClient) {
        throw new Error('Wallet not connected');
      }

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.SERUM_MODULE as `0x${string}`,
        abi: SERUM_ABI,
        functionName: 'useSerum',
        args: [BigInt(serumId), BigInt(tokenId), narrativeText],
      });

      if (import.meta.env.DEV) console.log('useSerum transaction sent:', hash);

      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
    onSuccess: (hash) => {
      if (import.meta.env.DEV) console.log('Serum applied successfully:', hash);
      notifications.success('Serum Applied!', 'Your NFT has been enhanced with the serum', false);
      queryClient.invalidateQueries({ queryKey: ['adrianzero-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['serums'] });
    },
    onError: (error) => {
      console.error('Error applying serum:', error);
      notifications.error('Failed to Apply Serum', 'Please try again', false);
    },
  });

  return mutation;
}
