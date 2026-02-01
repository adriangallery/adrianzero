/**
 * useOpenPack Hook
 * Opens packs (Floppy Discs or Action Packs)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import {
  OPENPACK_V4_ABI,
  ACTION_PACKS_ABI,
  FLOPPY_DISCS_ABI,
} from '@/lib/web3/abi';
import { useNotifications } from '@/hooks/useNotifications';

interface OpenPackParams {
  packId: string;
  packType: 'FLOPPY_DISC' | 'ACTION_PACK';
  quantity?: number;
}

export function useOpenPack() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const notifications = useNotifications();

  const mutation = useMutation({
    mutationFn: async ({ packId }: OpenPackParams) => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      // Token ID to contract mapping based on V3 logic
      const getPackContract = (id: number): `0x${string}` => {
        // Special case: Token 10007
        if (id === 10007) {
          return CONTRACT_ADDRESSES.ACTION_PACK_10007;
        }

        // OpenPackV4 contract tokens
        const openPackV4Tokens = [10000, 10001, 10002, 10003, 10004, 10005, 10009, 10010, 10013, 10015, 15010];
        if (openPackV4Tokens.includes(id)) {
          return CONTRACT_ADDRESSES.OPENPACK_V4;
        }

        // ACTION_PACKS contract tokens
        const actionPackTokens = [10008, 10011, 10012, 1123];
        const isActionPackRange = id >= 15008 && id <= 15015 && id !== 15010;
        if (actionPackTokens.includes(id) || isActionPackRange) {
          return CONTRACT_ADDRESSES.ACTION_PACKS;
        }

        // Fallback to FLOPPY_DISCS
        return CONTRACT_ADDRESSES.ADRIAN_FLOPPY_DISCS;
      };

      const id = parseInt(packId);
      const contractAddress = getPackContract(id);

      // Determine ABI based on contract address
      let abi;
      if (contractAddress === CONTRACT_ADDRESSES.OPENPACK_V4) {
        abi = OPENPACK_V4_ABI;
      } else if (contractAddress === CONTRACT_ADDRESSES.ACTION_PACKS || contractAddress === CONTRACT_ADDRESSES.ACTION_PACK_10007) {
        abi = ACTION_PACKS_ABI;
      } else {
        abi = FLOPPY_DISCS_ABI;
      }

      console.log(`[useOpenPack] Opening pack ${packId} using contract ${contractAddress}`);

      let hash: `0x${string}`;
      hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: 'openPack',
        args: [BigInt(packId)],
      });

      console.log('Pack opening transaction sent:', hash);

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
    onSuccess: (hash: `0x${string}`) => {
      console.log('Pack opened successfully:', hash);
      notifications.success('Pack Opened!', 'Check your inventory for new traits');
      // Invalidate queries to refresh pack balances and traits
      queryClient.invalidateQueries({ queryKey: ['packs'] });
      queryClient.invalidateQueries({ queryKey: ['traits'] });
    },
    onError: (error: Error) => {
      console.error('Error opening pack:', error);
      notifications.error('Failed to Open Pack', 'Please try again');
    },
  });

  return mutation;
}

// Hook for opening multiple packs at once
export function useOpenPacks() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const notifications = useNotifications();

  const mutation = useMutation({
    mutationFn: async ({ packId, quantity }: { packId: string; quantity: number }) => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      // Use OpenPack V4 contract for batch opening
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.OPENPACK_V4,
        abi: OPENPACK_V4_ABI,
        functionName: 'openPacks',
        args: [BigInt(packId), quantity],
      });

      console.log('Batch pack opening transaction sent:', hash);

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
    onSuccess: (hash: `0x${string}`) => {
      console.log('Packs opened successfully:', hash);
      notifications.success('Packs Opened!', `Successfully opened packs. Check your inventory for new traits`);
      queryClient.invalidateQueries({ queryKey: ['packs'] });
      queryClient.invalidateQueries({ queryKey: ['traits'] });
    },
    onError: (error: Error) => {
      console.error('Error opening packs:', error);
      notifications.error('Failed to Open Packs', 'Please try again');
    },
  });

  return mutation;
}
