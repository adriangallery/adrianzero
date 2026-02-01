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
    mutationFn: async ({ packId, packType }: OpenPackParams) => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      let hash: `0x${string}`;

      // Determine which contract to use based on pack type and ID
      if (packType === 'FLOPPY_DISC') {
        // Use FLOPPY_DISCS contract for Floppy Discs
        hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.ADRIAN_FLOPPY_DISCS,
          abi: FLOPPY_DISCS_ABI,
          functionName: 'openPack',
          args: [BigInt(packId)],
        });
      } else if (packType === 'ACTION_PACK') {
        // Use ACTION_PACKS contract for Action Packs
        hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.ACTION_PACKS,
          abi: ACTION_PACKS_ABI,
          functionName: 'openPack',
          args: [BigInt(packId)],
        });
      } else {
        throw new Error('Unknown pack type');
      }

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
