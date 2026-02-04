/**
 * useKitInfo Hook
 * Reads kit information from the Kit Sale contract
 */

import { useReadContract, useReadContracts } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { KIT_SALE_ABI } from '@/lib/web3/abi';

// Kit IDs
export const FREE_KIT_ID = 3; // SubZERO
export const PAID_KIT_ID = 2; // AdrianZERO

export interface KitInfo {
  id: bigint;
  name: string;
  priceInETH: bigint;
  adrianTokenAmount: bigint;
  floppyTokenId: bigint;
  erc721Amount: bigint;
  maxPerWallet: bigint;
  maxSupply: bigint;
  sold: bigint;
  active: boolean;
  tag: string;
}

export function useKitInfo(kitId: number) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.KIT_SALE,
    abi: KIT_SALE_ABI,
    functionName: 'getKitInfo',
    args: [BigInt(kitId)],
  });
}

export function useKitSalePaused() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.KIT_SALE,
    abi: KIT_SALE_ABI,
    functionName: 'kitSalePaused',
  });
}

export function useMaxKitsPerTransaction() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.KIT_SALE,
    abi: KIT_SALE_ABI,
    functionName: 'maxKitsPerTransaction',
  });
}

export function useBothKitsInfo() {
  return useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.KIT_SALE,
        abi: KIT_SALE_ABI,
        functionName: 'getKitInfo',
        args: [BigInt(FREE_KIT_ID)],
      },
      {
        address: CONTRACT_ADDRESSES.KIT_SALE,
        abi: KIT_SALE_ABI,
        functionName: 'getKitInfo',
        args: [BigInt(PAID_KIT_ID)],
      },
      {
        address: CONTRACT_ADDRESSES.KIT_SALE,
        abi: KIT_SALE_ABI,
        functionName: 'kitSalePaused',
      },
      {
        address: CONTRACT_ADDRESSES.KIT_SALE,
        abi: KIT_SALE_ABI,
        functionName: 'maxKitsPerTransaction',
      },
    ],
  });
}
