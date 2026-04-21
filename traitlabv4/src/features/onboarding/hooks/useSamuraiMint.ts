/**
 * useSamuraiMint Hook
 *
 * Post-migration: SamuraiZERO mints go through the $ZERO Diamond's SamuraiMintFacet.
 * Payment is in $ZERO (the Diamond IS the $ZERO ERC20 — same address for approve + mint).
 *
 * Supply UI aggregates two sources:
 *   - the legacy BatchDeployer (0xA988F323...) where the first 196/600 live, AND
 *   - the Diamond SamuraiMintFacet, where all new mints accumulate.
 *
 * See `useSamuraiSupplyCombined` for the merged counter.
 */

import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { SAMURAI_BATCH_ABI, SAMURAI_MINT_FACET_ABI, ERC20_ABI } from '@/lib/web3/abi';

const SAMURAI_BATCH_ID = 1;

export interface SamuraiBatchInfo {
  id: bigint;
  name: string;
  tag: string;
  price: bigint;
  minted: bigint;
  maxSupply: bigint;
  maxPerWallet: bigint;
  active: boolean;
}

/**
 * Read batch info from the Diamond's SamuraiMintFacet — current mint state
 * (price in $ZERO, remaining supply, active flag).
 */
export function useSamuraiBatchInfo() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: SAMURAI_MINT_FACET_ABI,
    functionName: 'getSamuraiBatchInfo',
    args: [BigInt(SAMURAI_BATCH_ID)],
  });

  // The Diamond returns a tuple; normalize it into the legacy shape used by callers.
  const batchInfo: SamuraiBatchInfo | undefined = data
    ? {
        id: (data as readonly unknown[])[0] as bigint,
        name: (data as readonly unknown[])[1] as string,
        tag: (data as readonly unknown[])[2] as string,
        price: (data as readonly unknown[])[3] as bigint,
        minted: (data as readonly unknown[])[4] as bigint,
        maxSupply: (data as readonly unknown[])[5] as bigint,
        maxPerWallet: (data as readonly unknown[])[6] as bigint,
        active: (data as readonly unknown[])[7] as boolean,
      }
    : undefined;

  return { batchInfo, isLoading, error, refetch };
}

/**
 * Combined supply: legacy BatchDeployer minted + new Diamond minted.
 * maxSupply comes from the Diamond (remaining capacity already excludes the legacy 196).
 * Displayed counter: (legacyMinted + newMinted) / (legacyMinted + maxSupply).
 */
export function useSamuraiSupplyCombined() {
  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.SAMURAI_BATCH_DEPLOYER as `0x${string}`,
        abi: SAMURAI_BATCH_ABI,
        functionName: 'getBatchInfo',
        args: [BigInt(SAMURAI_BATCH_ID)],
      },
      {
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_MINT_FACET_ABI,
        functionName: 'getSamuraiBatchInfo',
        args: [BigInt(SAMURAI_BATCH_ID)],
      },
    ],
  });

  let legacyMinted = BigInt(0);
  let newMinted = BigInt(0);
  let newMaxSupply = BigInt(0);

  if (data?.[0]?.status === 'success') {
    const legacy = data[0].result as { minted: bigint } | readonly unknown[];
    legacyMinted = Array.isArray(legacy) ? (legacy[3] as bigint) : legacy.minted;
  }
  if (data?.[1]?.status === 'success') {
    const d = data[1].result as readonly unknown[];
    newMinted = d[4] as bigint;
    newMaxSupply = d[5] as bigint;
  }

  const totalMinted = legacyMinted + newMinted;
  const totalSupply = legacyMinted + newMaxSupply;

  return {
    legacyMinted,
    newMinted,
    totalMinted,
    totalSupply,
    isLoading,
    refetch,
  };
}

/**
 * Approve $ZERO spend for the Diamond. The Diamond IS the $ZERO ERC20 token,
 * so `address` and `spender` are the same.
 */
export function useSamuraiApproval() {
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
    allowance: (allowance as bigint) ?? BigInt(0),
    approveTokens,
    isApproving,
    isApprovalConfirming,
    isApprovalConfirmed,
    refetchAllowance,
  };
}

export function useSamuraiMint() {
  const {
    data: hash,
    writeContract,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const mint = (quantity: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: SAMURAI_MINT_FACET_ABI,
      functionName: 'mintSamuraiZERO',
      args: [BigInt(quantity)],
    });
  };

  return {
    mint,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    txHash: hash,
    reset,
  };
}
