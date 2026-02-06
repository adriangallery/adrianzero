/**
 * useBuyKit Hook
 * Handles kit purchase transactions
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { KIT_SALE_ABI } from '@/lib/web3/abi';
import { useNotifications } from '@/hooks/useNotifications';

interface BuyKitParams {
  kitId: number;
  quantity: number;
  pricePerKit: bigint;
}

export function useBuyKit() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const notifications = useNotifications();

  return useMutation({
    mutationFn: async ({ kitId, quantity, pricePerKit }: BuyKitParams) => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      const totalCost = pricePerKit * BigInt(quantity);

      console.log(`[useBuyKit] Buying ${quantity} kit(s) of type ${kitId} for ${totalCost} wei`);

      let hash: `0x${string}`;

      if (quantity === 1) {
        hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.KIT_SALE,
          abi: KIT_SALE_ABI,
          functionName: 'buyKit',
          args: [BigInt(kitId)],
          value: totalCost,
        });
      } else {
        hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.KIT_SALE,
          abi: KIT_SALE_ABI,
          functionName: 'buyMultipleKits',
          args: [BigInt(kitId), BigInt(quantity)],
          value: totalCost,
        });
      }

      console.log('[useBuyKit] Transaction sent:', hash);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('[useBuyKit] Transaction confirmed:', receipt);

      return { hash, kitId, quantity };
    },
    onSuccess: ({ kitId, quantity }) => {
      const kitName = kitId === 3 ? 'SubZERO' : 'AdrianZERO';
      notifications.success(
        'Mint Successful!',
        `You minted ${quantity} ${kitName} kit${quantity > 1 ? 's' : ''}`,
        false
      );
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['adrianzero'] });
      queryClient.invalidateQueries({ queryKey: ['traits'] });
      queryClient.invalidateQueries({ queryKey: ['packs'] });
    },
    onError: (error: Error) => {
      console.error('[useBuyKit] Error:', error);

      // Parse common error messages
      let message = 'Transaction failed. Please try again.';
      if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
        message = 'Transaction was cancelled';
      } else if (error.message.includes('insufficient funds')) {
        message = 'Insufficient ETH balance';
      }

      notifications.error('Mint Failed', message, false);
    },
  });
}
