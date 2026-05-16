/**
 * useGumballMint Hooks
 *
 * GumballZERO: pull a random pre-seeded AdrianZERO from the Diamond's
 * GumballMintFacet. Payment is in $ZERO (the Diamond IS the $ZERO ERC20 —
 * same address for approve + pull).
 *
 * Until the facet is cut into the Diamond on mainnet, `gumballGetConfig`
 * reverts. `useGumballConfig` surfaces that as `notLive` so the page can
 * render a "coming soon" state instead of crashing.
 */

import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { GUMBALL_MINT_FACET_ABI, ERC20_ABI } from '@/lib/web3/abi';

/** Default price the facet applies when initialised with 0 (2000 $ZERO). */
export const FALLBACK_PRICE_PER_PULL = 2000n * 10n ** 18n;

export interface GumballConfig {
  pricePerPull: bigint;
  maxPerTx: bigint;
  paused: boolean;
  poolRemaining: bigint;
  totalPulled: bigint;
  totalSeeded: bigint;
}

/**
 * Read the live gumball config from the Diamond. If the read reverts
 * (facet not deployed yet) we return `notLive: true` with sane fallbacks
 * so the UI stays presentable.
 */
export function useGumballConfig() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: GUMBALL_MINT_FACET_ABI,
    functionName: 'gumballGetConfig',
    query: { refetchInterval: 30_000, retry: false, staleTime: 0 },
  });

  const notLive = !!error;

  const config: GumballConfig = data
    ? {
        pricePerPull: (data as readonly unknown[])[4] as bigint,
        maxPerTx: (data as readonly unknown[])[8] as bigint,
        paused: (data as readonly unknown[])[9] as boolean,
        poolRemaining: (data as readonly unknown[])[10] as bigint,
        totalPulled: (data as readonly unknown[])[11] as bigint,
        totalSeeded: (data as readonly unknown[])[12] as bigint,
      }
    : {
        pricePerPull: FALLBACK_PRICE_PER_PULL,
        maxPerTx: 25n,
        paused: true,
        poolRemaining: 100n,
        totalPulled: 0n,
        totalSeeded: 100n,
      };

  return { config, notLive, isLoading, error, refetch };
}

/**
 * Approve $ZERO spend for the Diamond. The Diamond IS the $ZERO ERC20 token,
 * so `address` and `spender` are the same.
 */
export function useGumballApproval() {
  const { address } = useAccount();

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address
      ? [address, CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`]
      : undefined,
    query: { enabled: !!address },
  });

  const {
    data: approveHash,
    writeContract: approve,
    isPending: isApproving,
  } = useWriteContract();

  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } =
    useWaitForTransactionReceipt({ hash: approveHash });

  const approveTokens = (amount: bigint) => {
    approve({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`, amount],
    });
  };

  return {
    allowance: (allowance as bigint) ?? 0n,
    approveTokens,
    isApproving,
    isApprovalConfirming,
    isApprovalConfirmed,
    refetchAllowance,
  };
}

export function useGumballPull() {
  const {
    data: hash,
    writeContract,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const pull = (qty: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: GUMBALL_MINT_FACET_ABI,
      functionName: 'pullGumball',
      args: [BigInt(qty)],
    });
  };

  return { pull, isPending, isConfirming, isConfirmed, error, txHash: hash, reset };
}
