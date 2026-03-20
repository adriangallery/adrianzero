/**
 * useApplyTraits Hook
 * Handles trait application with ERC1155 approval
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ADRIAN_LAB_ABI, TRAITS_EXTENSIONS_ABI } from '@/lib/web3/abi';
import { useNotifications } from '@/hooks/useNotifications';

interface ApplyTraitsParams {
  tokenId: string;
  traitIds: string[];
}

export function useApplyTraits() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const notifications = useNotifications();

  const mutation = useMutation({
    mutationFn: async ({ tokenId, traitIds }: ApplyTraitsParams) => {
      if (!address || !publicClient) {
        throw new Error('Wallet not connected');
      }

      // Step 1: Check if approval is needed
      const isApproved = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ADRIAN_LAB,
        abi: ADRIAN_LAB_ABI,
        functionName: 'isApprovedForAll',
        args: [address, CONTRACT_ADDRESSES.TRAITS_EXTENSIONS],
      });

      // Step 2: Request approval if needed
      if (!isApproved) {
        if (import.meta.env.DEV) console.log('Requesting ERC1155 approval...');
        const approvalHash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.ADRIAN_LAB,
          abi: ADRIAN_LAB_ABI,
          functionName: 'setApprovalForAll',
          args: [CONTRACT_ADDRESSES.TRAITS_EXTENSIONS, true],
        });

        if (import.meta.env.DEV) console.log('Approval transaction sent:', approvalHash);

        // Wait for approval confirmation
        await publicClient.waitForTransactionReceipt({ hash: approvalHash });
        if (import.meta.env.DEV) console.log('Approval confirmed');
      }

      // Step 3: Apply traits
      const traitIdsBigInt = traitIds.map((id) => BigInt(id));

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.TRAITS_EXTENSIONS,
        abi: TRAITS_EXTENSIONS_ABI,
        functionName: 'applyTraits',
        args: [BigInt(tokenId), traitIdsBigInt],
      });

      if (import.meta.env.DEV) console.log('Apply traits transaction sent:', hash);

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
    onSuccess: (hash) => {
      if (import.meta.env.DEV) console.log('Traits applied successfully:', hash);
      notifications.success('Traits Applied!', 'Your NFT has been customized successfully', false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['adrianzero-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['traits'] });
    },
    onError: (error) => {
      console.error('Error applying traits:', error);
      notifications.error('Failed to Apply Traits', 'Please try again', false);
    },
  });

  return mutation;
}

export function useCheckApproval() {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  const checkApproval = async (): Promise<boolean> => {
    if (!address || !publicClient) {
      return false;
    }

    try {
      const isApproved = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ADRIAN_LAB,
        abi: ADRIAN_LAB_ABI,
        functionName: 'isApprovedForAll',
        args: [address, CONTRACT_ADDRESSES.TRAITS_EXTENSIONS],
      });

      return isApproved as boolean;
    } catch (error) {
      console.error('Error checking approval:', error);
      return false;
    }
  };

  return { checkApproval };
}
