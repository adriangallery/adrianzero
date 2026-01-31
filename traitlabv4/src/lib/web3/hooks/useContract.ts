/**
 * useContract Hook
 * Generic hook to get a typed contract instance
 */

import { useMemo } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { getContract, type Address } from 'viem';

export function useContract<TAbi extends readonly unknown[]>(
  address: Address,
  abi: TAbi
) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const contract = useMemo(() => {
    if (!publicClient) return null;

    return getContract({
      address,
      abi,
      client: { public: publicClient, wallet: walletClient },
    });
  }, [address, abi, publicClient, walletClient]);

  return contract;
}
