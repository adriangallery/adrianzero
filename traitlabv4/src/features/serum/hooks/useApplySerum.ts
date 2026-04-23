/**
 * useApplySerum Hook
 * Applies a serum to an AdrianZERO NFT
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { SERUM_ABI, ADRIAN_LAB_ABI } from '@/lib/web3/abi';
import { useNotifications } from '@/hooks/useNotifications';

interface ApplySerumParams {
  tokenId: string;
  serumId: string;
}

export function useApplySerum() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const notifications = useNotifications();

  const mutation = useMutation({
    mutationFn: async ({ tokenId, serumId }: ApplySerumParams) => {
      if (!address || !publicClient) {
        throw new Error('Wallet not connected');
      }

      // Serums are ERC-1155 in ADRIAN_LAB — SERUM_MODULE must be approved to burn them
      const isApproved = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ADRIAN_LAB,
        abi: ADRIAN_LAB_ABI,
        functionName: 'isApprovedForAll',
        args: [address, CONTRACT_ADDRESSES.SERUM_MODULE],
      });

      if (!isApproved) {
        if (import.meta.env.DEV) console.log('Requesting ERC1155 approval for SERUM_MODULE...');
        const approvalHash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.ADRIAN_LAB,
          abi: ADRIAN_LAB_ABI,
          functionName: 'setApprovalForAll',
          args: [CONTRACT_ADDRESSES.SERUM_MODULE, true],
        });

        if (import.meta.env.DEV) console.log('Approval transaction sent:', approvalHash);
        await publicClient.waitForTransactionReceipt({ hash: approvalHash });
        if (import.meta.env.DEV) console.log('Approval confirmed');
      }

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.SERUM_MODULE,
        abi: SERUM_ABI,
        functionName: 'applySerum',
        args: [BigInt(tokenId), BigInt(serumId)],
      });

      if (import.meta.env.DEV) console.log('Apply serum transaction sent:', hash);

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
    onSuccess: (hash) => {
      if (import.meta.env.DEV) console.log('Serum applied successfully:', hash);
      notifications.success('Serum Applied!', 'Your NFT has been enhanced with the serum', false);
      // Invalidate queries to refresh data
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
