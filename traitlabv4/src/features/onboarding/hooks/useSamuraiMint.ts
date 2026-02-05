/**
 * useSamuraiMint Hook
 * Handles minting SamuraiZERO NFTs with $ADRIAN tokens
 */

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { SAMURAI_BATCH_ABI, ERC20_ABI } from '@/lib/web3/abi';

const SAMURAI_BATCH_ID = 1;

export interface SamuraiBatchInfo {
  id: bigint;
  price: bigint;
  maxSupply: bigint;
  minted: bigint;
  active: boolean;
  name: string;
  tag: string;
  startTime: bigint;
  endTime: bigint;
  maxPerWallet: bigint;
}

export function useSamuraiBatchInfo() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.SAMURAI_BATCH_DEPLOYER as `0x${string}`,
    abi: SAMURAI_BATCH_ABI,
    functionName: 'getBatchInfo',
    args: [BigInt(SAMURAI_BATCH_ID)],
  });

  const batchInfo = data as SamuraiBatchInfo | undefined;

  return {
    batchInfo,
    isLoading,
    error,
    refetch,
  };
}

export function useSamuraiApproval() {
  const { address } = useAccount();

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.ADRIAN_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address
      ? [address, CONTRACT_ADDRESSES.SAMURAI_BATCH_DEPLOYER as `0x${string}`]
      : undefined,
    query: {
      enabled: !!address,
    },
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
      address: CONTRACT_ADDRESSES.ADRIAN_TOKEN as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.SAMURAI_BATCH_DEPLOYER as `0x${string}`, amount],
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
      address: CONTRACT_ADDRESSES.SAMURAI_BATCH_DEPLOYER as `0x${string}`,
      abi: SAMURAI_BATCH_ABI,
      functionName: 'mint',
      args: [BigInt(SAMURAI_BATCH_ID), BigInt(quantity)],
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
