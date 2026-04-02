/**
 * useTokenApproval Hook
 * Check and set token approval for the Diamond shop — supports $ZERO and $ADRIAN
 *
 * For $ZERO: user approves the Diamond to spend their ZERO (Diamond is also the ZERO token)
 * For $ADRIAN: user approves the Diamond to spend their ADRIAN
 */

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ERC20_ABI } from '@/lib/web3/abi';
import type { PaymentToken } from '../store/shopStore';

const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

const TOKEN_ADDRESSES: Record<PaymentToken, string> = {
  ZERO: CONTRACT_ADDRESSES.ZERO_DIAMOND,   // ZERO is the Diamond itself (ERC20Facet)
  ADRIAN: CONTRACT_ADDRESSES.ADRIAN_TOKEN,
};

const SPENDER = CONTRACT_ADDRESSES.ZERO_DIAMOND; // ShopFacet lives in the Diamond

export function useTokenApproval(paymentToken: PaymentToken) {
  const { address } = useAccount();
  const tokenAddress = TOKEN_ADDRESSES[paymentToken];

  // Check current allowance
  const {
    data: allowance,
    isLoading: isCheckingAllowance,
    refetch: refetchAllowance,
  } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address
      ? [address, SPENDER as `0x${string}`]
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
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [SPENDER as `0x${string}`, approvalAmount],
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
    tokenSymbol: paymentToken === 'ZERO' ? '$ZERO' : '$ADRIAN',
  };
}
