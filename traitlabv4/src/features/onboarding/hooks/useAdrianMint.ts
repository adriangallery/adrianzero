/**
 * useAdrianMint Hook
 *
 * Post-migration: AdrianZERO mints go through the $ZERO Diamond's SamuraiMintFacet
 * (batch ID 2). Paid in $ZERO. Supply UI aggregates legacy BatchDeployer + Diamond.
 */

import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { SAMURAI_BATCH_ABI, SAMURAI_MINT_FACET_ABI, ERC20_ABI } from '@/lib/web3/abi';

const ADRIAN_BATCH_ID = 2;

export interface AdrianMintBatchInfo {
  id: bigint;
  name: string;
  tag: string;
  price: bigint;
  minted: bigint;
  maxSupply: bigint;
  maxPerWallet: bigint;
  active: boolean;
}

export function useAdrianMintBatchInfo() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: SAMURAI_MINT_FACET_ABI,
    functionName: 'getSamuraiBatchInfo',
    args: [BigInt(ADRIAN_BATCH_ID)],
  });

  const batchInfo: AdrianMintBatchInfo | undefined = data
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

export function useAdrianSupplyCombined() {
  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.SAMURAI_BATCH_DEPLOYER as `0x${string}`,
        abi: SAMURAI_BATCH_ABI,
        functionName: 'getBatchInfo',
        args: [BigInt(ADRIAN_BATCH_ID)],
      },
      {
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_MINT_FACET_ABI,
        functionName: 'getSamuraiBatchInfo',
        args: [BigInt(ADRIAN_BATCH_ID)],
      },
    ],
  });

  let legacyMinted = BigInt(0);
  let newMinted = BigInt(0);
  let newMaxSupply = BigInt(0);

  if (data?.[0]?.status === 'success') {
    const legacy = data[0].result as unknown;
    if (Array.isArray(legacy)) {
      // BatchConfig struct returned as tuple — minted is index 3
      legacyMinted = (legacy[3] as bigint) ?? BigInt(0);
    } else if (legacy && typeof legacy === 'object' && 'minted' in legacy) {
      legacyMinted = (legacy as { minted: bigint }).minted;
    }
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

export function useAdrianMintApproval() {
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

export function useAdrianMint() {
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
      functionName: 'mintAdrianZERO',
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
