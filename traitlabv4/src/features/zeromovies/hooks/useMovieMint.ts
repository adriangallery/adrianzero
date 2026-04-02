import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZERO_MOVIES_FACET_ABI } from '@/lib/web3/abi';

export function useMovieMint() {
  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash });

  const mint = (movieId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'mintMovie',
      args: [BigInt(movieId)],
    });
  };

  return {
    mint,
    isPending,
    isConfirming,
    isConfirmed,
    error: writeError,
    txHash: hash,
    receipt,
    reset,
  };
}
