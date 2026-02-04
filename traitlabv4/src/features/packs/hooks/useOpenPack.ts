/**
 * useOpenPack Hook
 * Opens packs (Floppy Discs or Action Packs)
 * Contract routing aligned with traitlabold (pack-config.js):
 * - Token 10007 → ACTION_PACK_10007 (openPack)
 * - Tokens 10000-10005, 10009, 10010, 10013-10015, 10018, 15010 → OPENPACK_V4 (openPacks)
 * - Tokens 10008, 10011, 10012, 10016, 10019, 1123, 15008-15015 (except 15010) → ACTION_PACKS (openPack + pre-checks)
 * - Token 10006 (+ 10017 unconfigured in traitlabold) → ADRIAN_FLOPPY_DISCS (openPack)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, usePublicClient, useAccount } from 'wagmi';
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

// Token ID categories for contract routing (aligned with traitlabold pack-config.js)
const OPENPACK_V4_TOKENS = [10000, 10001, 10002, 10003, 10004, 10005, 10009, 10010, 10013, 10014, 10015, 10018, 15010];
const ACTION_PACK_TOKENS = [10008, 10011, 10012, 10016, 10019, 1123];

const isOpenPackV4Token = (id: number): boolean => OPENPACK_V4_TOKENS.includes(id);
const isActionPackToken = (id: number): boolean => {
  const isActionPackRange = id >= 15008 && id <= 15015 && id !== 15010;
  return ACTION_PACK_TOKENS.includes(id) || isActionPackRange;
};

export function useOpenPack() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const notifications = useNotifications();

  const mutation = useMutation({
    mutationFn: async ({ packId }: OpenPackParams) => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      if (!address) {
        throw new Error('Wallet not connected');
      }

      // Token ID to contract mapping based on V3 logic
      const getPackContract = (id: number): `0x${string}` => {
        // Special case: Token 10007 → ACTION_PACK_10007
        if (id === 10007) {
          return CONTRACT_ADDRESSES.ACTION_PACK_10007;
        }

        // OpenPackV4 contract tokens
        if (isOpenPackV4Token(id)) {
          return CONTRACT_ADDRESSES.OPENPACK_V4;
        }

        // ACTION_PACKS contract tokens
        if (isActionPackToken(id)) {
          return CONTRACT_ADDRESSES.ACTION_PACKS;
        }

        // Fallback to FLOPPY_DISCS (token 10006 and others)
        return CONTRACT_ADDRESSES.ADRIAN_FLOPPY_DISCS;
      };

      const id = parseInt(packId);
      const contractAddress = getPackContract(id);

      console.log(`[useOpenPack] Opening pack ${packId} using contract ${contractAddress}`);

      let hash: `0x${string}`;

      // Route to correct function based on contract type
      if (isOpenPackV4Token(id)) {
        // OPENPACK_V4 only has openPacks(packId, quantity) - use quantity=1 for single pack
        console.log(`[useOpenPack] Using openPacks() for OPENPACK_V4 token ${id}`);
        hash = await writeContractAsync({
          address: contractAddress,
          abi: OPENPACK_V4_ABI,
          functionName: 'openPacks',
          args: [BigInt(packId), 1],
        });
      } else if (isActionPackToken(id) || id === 10007) {
        // ACTION_PACKS and ACTION_PACK_10007 require pre-checks
        console.log(`[useOpenPack] Using openPack() with pre-check for ACTION_PACKS token ${id}`);

        // Pre-check: canOpenPack(user, packId)
        const [canOpen, reason] = await publicClient.readContract({
          address: contractAddress,
          abi: ACTION_PACKS_ABI,
          functionName: 'canOpenPack',
          args: [address, BigInt(packId)],
        }) as [boolean, string];

        if (!canOpen) {
          throw new Error(`Cannot open pack: ${reason || 'Not eligible or pack inactive'}`);
        }

        hash = await writeContractAsync({
          address: contractAddress,
          abi: ACTION_PACKS_ABI,
          functionName: 'openPack',
          args: [BigInt(packId)],
        });
      } else {
        // FLOPPY_DISCS (token 10006 and fallback)
        console.log(`[useOpenPack] Using openPack() for FLOPPY_DISCS token ${id}`);
        hash = await writeContractAsync({
          address: contractAddress,
          abi: FLOPPY_DISCS_ABI,
          functionName: 'openPack',
          args: [BigInt(packId)],
        });
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
