/**
 * useShopPurchase Hook
 * Handle purchasing items from the shop
 */

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ADRIAN_SHOP_ABI } from '@/lib/web3/abi';
import type { CartItem } from '../store/shopStore';

export function useShopPurchase() {
  const {
    data: hash,
    writeContract,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Purchase a single item
  const purchaseItem = (assetId: number, quantity: number, useFree: boolean) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ADRIAN_SHOP as `0x${string}`,
      abi: ADRIAN_SHOP_ABI,
      functionName: 'purchaseItem',
      args: [BigInt(assetId), BigInt(quantity), useFree],
    });
  };

  // Batch purchase multiple items
  const batchPurchase = (items: CartItem[]) => {
    const requests = items.map((item) => ({
      assetId: BigInt(item.assetId),
      quantity: BigInt(item.quantity),
      useFree: item.useFree,
    }));

    writeContract({
      address: CONTRACT_ADDRESSES.ADRIAN_SHOP as `0x${string}`,
      abi: ADRIAN_SHOP_ABI,
      functionName: 'batchPurchase',
      args: [requests],
    });
  };

  // Claim free item
  const claimFree = (assetId: number, quantity: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ADRIAN_SHOP as `0x${string}`,
      abi: ADRIAN_SHOP_ABI,
      functionName: 'claimFreeItem',
      args: [BigInt(assetId), BigInt(quantity)],
    });
  };

  return {
    purchaseItem,
    batchPurchase,
    claimFree,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || confirmError,
    txHash: hash,
    reset,
  };
}
