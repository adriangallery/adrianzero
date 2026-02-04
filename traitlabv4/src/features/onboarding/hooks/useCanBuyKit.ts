/**
 * useCanBuyKit Hook
 * Validates if user can purchase a kit
 */

import { useReadContract } from 'wagmi';
import { useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { KIT_SALE_ABI } from '@/lib/web3/abi';

export function useCanBuyKit(kitId: number, quantity: number = 1) {
  const { address } = useAccount();

  return useReadContract({
    address: CONTRACT_ADDRESSES.KIT_SALE,
    abi: KIT_SALE_ABI,
    functionName: 'userCanBuyKit',
    args: address ? [address, BigInt(kitId), BigInt(quantity)] : undefined,
    query: {
      enabled: !!address,
    },
  });
}
