/**
 * Estado y claim del airdrop Cubist Souls → $ZERO (plan A4b-2).
 * Diamond 0x542b…D0A0 · AirdropFacet `claim(uint256 amount, bytes32[] proof)`,
 * `msg.sender` debe ser la wallet de la lista.
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient, useReadContract, useWriteContract } from 'wagmi';
import { CHAIN_ID, CONTRACT_ADDRESSES } from '@/config/contracts';
import { AIRDROP_FACET_ABI } from '@/lib/web3/abi';
import { claimView, findClaim, type AirdropList } from '../lib/eligibility';

const LIST_URL = '/data/airdrop/cubist-souls-2026-09.json';
const DIAMOND = CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`;

export type ClaimPending = 'idle' | 'checking' | 'signing' | 'confirming';

export function useCubistAirdrop() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<ClaimPending>('idle');
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const list = useQuery({
    queryKey: ['airdrop-list', 'cubist-souls-2026-09'],
    queryFn: async () => {
      const res = await fetch(LIST_URL);
      if (!res.ok) throw new Error(`Claim list unavailable (${res.status})`);
      return (await res.json()) as AirdropList;
    },
    staleTime: Infinity,
  });

  const active = useReadContract({
    address: DIAMOND,
    abi: AIRDROP_FACET_ABI,
    functionName: 'isAirdropActive',
    chainId: CHAIN_ID,
    query: { refetchInterval: 30_000 },
  });

  const root = useReadContract({
    address: DIAMOND,
    abi: AIRDROP_FACET_ABI,
    functionName: 'merkleRoot',
    chainId: CHAIN_ID,
  });

  const claimed = useReadContract({
    address: DIAMOND,
    abi: AIRDROP_FACET_ABI,
    functionName: 'hasClaimed',
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: !!address },
  });

  const entry = findClaim(list.data, address);

  const view = claimView({
    isConnected,
    isLoading: list.isLoading || active.isLoading || root.isLoading || (!!address && claimed.isLoading),
    hasError: !!list.error || !!active.error || !!root.error || !!claimed.error,
    entry,
    hasClaimed: claimed.data === true,
    isActive: active.data === true,
    onchainRoot: root.data,
    listRoot: list.data?.root,
  });

  const claim = async (): Promise<`0x${string}`> => {
    if (!entry || !address || !publicClient) throw new Error("This wallet isn't on the claim list");
    const args = [BigInt(entry.amount), entry.proof] as const;
    setPending('checking');
    try {
      // Simular antes de pedir firma: si está cerrado, ya reclamado o la prueba no vale, no se gasta gas
      await publicClient.simulateContract({ account: address, address: DIAMOND, abi: AIRDROP_FACET_ABI, functionName: 'claim', args });
      setPending('signing');
      const hash = await writeContractAsync({ address: DIAMOND, abi: AIRDROP_FACET_ABI, functionName: 'claim', args, chainId: CHAIN_ID });
      setTxHash(hash);
      setPending('confirming');
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') throw new Error('Claim transaction reverted');
      await claimed.refetch();
      // saldos de ZERO del resto de la app
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
      return hash;
    } finally {
      setPending('idle');
    }
  };

  const refetch = () => {
    list.refetch();
    active.refetch();
    root.refetch();
    if (address) claimed.refetch();
  };

  return { view, entry, list: list.data, pending, txHash, claim, refetch };
}
