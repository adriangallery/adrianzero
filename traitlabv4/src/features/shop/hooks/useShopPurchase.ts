/**
 * useShopPurchase Hook
 * Handle purchasing items from the Diamond ShopFacet V2
 * Supports dual-token payment ($ZERO / $ADRIAN)
 */

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { SHOP_FACET_ABI } from '@/lib/web3/abi';
import type { CartItem, PaymentToken } from '../store/shopStore';

// Maps to ShopFacet.PaymentToken enum: ZERO=0, ADRIAN=1
const PAYMENT_TOKEN_MAP: Record<PaymentToken, number> = {
  ZERO: 0,
  ADRIAN: 1,
};

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

  // Batch purchase via Diamond ShopFacet
  const batchPurchase = (items: CartItem[], paymentToken: PaymentToken) => {
    const requests = items.map((item) => ({
      assetId: BigInt(item.assetId),
      quantity: BigInt(item.quantity),
      useFree: item.useFree,
    }));

    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: SHOP_FACET_ABI,
      functionName: 'purchaseItems',
      args: [requests, PAYMENT_TOKEN_MAP[paymentToken]],
    });
  };

  return {
    batchPurchase,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || confirmError,
    txHash: hash,
    reset,
  };
}
