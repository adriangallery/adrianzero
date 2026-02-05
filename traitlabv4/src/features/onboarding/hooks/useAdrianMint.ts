/**
 * useAdrianMint Hook
 * Handles minting AdrianZERO NFTs with $ADRIAN tokens (not ETH)
 */

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ADRIAN_ZERO_MINT_ABI, ERC20_ABI } from '@/lib/web3/abi';

export interface AdrianMintBatchInfo {
  batchId: bigint;
  name: string;
  price: bigint;
  minted: bigint;
  maxSupply: bigint;
  active: boolean;
  startTime: bigint;
  endTime: bigint;
  useMerkleWhitelist: boolean;
}

export function useAdrianMintBatchInfo() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ADRIAN_ZERO_MINT_WITH_ADRIAN as `0x${string}`,
    abi: ADRIAN_ZERO_MINT_ABI,
    functionName: 'getCurrentBatchInfo',
  });

  // Parse tuple response
  let batchInfo: AdrianMintBatchInfo | undefined;
  if (data) {
    const [batchId, name, price, minted, maxSupply, active, startTime, endTime, useMerkleWhitelist] = data as [
      bigint, string, bigint, bigint, bigint, boolean, bigint, bigint, boolean
    ];
    batchInfo = {
      batchId,
      name,
      price,
      minted,
      maxSupply,
      active,
      startTime,
      endTime,
      useMerkleWhitelist,
    };
  }

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
      ? [address, CONTRACT_ADDRESSES.ADRIAN_ZERO_MINT_WITH_ADRIAN as `0x${string}`]
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
      args: [CONTRACT_ADDRESSES.ADRIAN_ZERO_MINT_WITH_ADRIAN as `0x${string}`, amount],
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
      address: CONTRACT_ADDRESSES.ADRIAN_ZERO_MINT_WITH_ADRIAN as `0x${string}`,
      abi: ADRIAN_ZERO_MINT_ABI,
      functionName: 'mintMultiplePublic',
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
