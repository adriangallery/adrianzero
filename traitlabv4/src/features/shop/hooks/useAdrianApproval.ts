/**
 * useAdrianApproval Hook
 * Check and set $ADRIAN approval for the shop contract
 */

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ERC20_ABI } from '@/lib/web3/abi';

const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

export function useAdrianApproval() {
  const { address } = useAccount();

  // Check current allowance
  const {
    data: allowance,
    isLoading: isCheckingAllowance,
    refetch: refetchAllowance,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.ADRIAN_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address
      ? [address, CONTRACT_ADDRESSES.ADRIAN_SHOP as `0x${string}`]
      : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Write approval
  const {
    data: hash,
    writeContract,
    isPending: isApproving,
    error: approveError,
  } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const currentAllowance = (allowance as bigint) ?? BigInt(0);

  const hasApproval = (amount: bigint) => {
    return currentAllowance >= amount;
  };

  const approve = async (amount?: bigint) => {
    const approvalAmount = amount ?? MAX_UINT256;

    writeContract({
      address: CONTRACT_ADDRESSES.ADRIAN_TOKEN as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.ADRIAN_SHOP as `0x${string}`, approvalAmount],
    });
  };

  const needsApproval = (amount: bigint) => {
    return currentAllowance < amount;
  };

  return {
    allowance: currentAllowance,
    hasApproval,
    needsApproval,
    approve,
    isCheckingAllowance,
    isApproving,
    isConfirming,
    isConfirmed,
    approveError,
    refetchAllowance,
    txHash: hash,
  };
}
