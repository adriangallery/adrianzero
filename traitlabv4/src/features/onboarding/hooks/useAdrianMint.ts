/**
 * useAdrianMint Hook
 * Handles minting AdrianZERO NFTs with $ADRIAN tokens using BatchDeployer
 * NOTE: Now uses the same BatchDeployer contract as SamuraiZERO
 */

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { SAMURAI_BATCH_ABI, ERC20_ABI } from '@/lib/web3/abi';

const ADRIAN_BATCH_ID = 2;

export interface AdrianMintBatchInfo {
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

export function useAdrianMintBatchInfo() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.SAMURAI_BATCH_DEPLOYER as `0x${string}`,
    abi: SAMURAI_BATCH_ABI,
    functionName: 'getBatchInfo',
    args: [BigInt(ADRIAN_BATCH_ID)],
  });

  const batchInfo = data as AdrianMintBatchInfo | undefined;

  return {
    batchInfo,
    isLoading,
    error,
    refetch,
  };
}

export function useAdrianMintApproval() {
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
      address: CONTRACT_ADDRESSES.SAMURAI_BATCH_DEPLOYER as `0x${string}`,
      abi: SAMURAI_BATCH_ABI,
      functionName: 'mint',
      args: [BigInt(ADRIAN_BATCH_ID), BigInt(quantity)],
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
