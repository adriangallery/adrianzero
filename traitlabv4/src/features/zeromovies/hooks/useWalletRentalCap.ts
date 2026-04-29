import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { useAccount } from 'wagmi';
import { base } from 'wagmi/chains';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZERO_MOVIES_FACET_2_ABI } from '@/lib/web3/abi';

export interface WalletRentalCap {
  s1Active: number;
  s2Active: number;
  total: number;
  cap: number;
  canRent: boolean;
  slotsLeft: number;
  isLoading: boolean;
  refetch: () => void;
}

const DISABLED: WalletRentalCap = {
  s1Active: 0, s2Active: 0, total: 0,
  cap: 0, canRent: true, slotsLeft: 99,
  isLoading: false,
  refetch: () => {},
};

/**
 * Per-wallet cross-season rental cap. Calls `getWalletActiveRentals2(address)`
 * which returns current S1 + S2 non-permanent rentals, the configured cap, and
 * a boolean convenience flag. Returns DISABLED (cap=0, canRent=true) when the
 * wallet is not connected — no blocking in that case; the contract will revert
 * with a wallet-connect prompt anyway.
 */
export function useWalletRentalCap(): WalletRentalCap {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: ZERO_MOVIES_FACET_2_ABI,
    functionName: 'getWalletActiveRentals2',
    args: address ? [address] : undefined,
    chainId: base.id,
    query: {
      enabled: !!address,
      staleTime: 20_000,
      refetchInterval: 20_000,
    },
  });

  return useMemo<WalletRentalCap>(() => {
    if (!data || !address) return { ...DISABLED, isLoading };
    const tuple = data as readonly [bigint, bigint, bigint, boolean];
    const s1Active = Number(tuple[0]);
    const s2Active = Number(tuple[1]);
    const cap = Number(tuple[2]);
    const canRent = tuple[3];
    const total = s1Active + s2Active;
    const slotsLeft = cap > 0 ? Math.max(0, cap - total) : 99;
    return { s1Active, s2Active, total, cap, canRent, slotsLeft, isLoading, refetch };
  }, [data, address, isLoading, refetch]);
}
