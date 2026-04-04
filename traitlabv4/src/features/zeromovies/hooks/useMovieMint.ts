import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZERO_MOVIES_FACET_ABI } from '@/lib/web3/abi';

export function useMovieMint() {
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({ hash });

  const mint = (movieId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'rentMovie',
      args: [BigInt(movieId)],
    });
  };

  return { mint, isPending, isConfirming, isConfirmed, error: writeError, txHash: hash, receipt, reset };
}

export function useMovieReturn() {
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const returnMovie = (movieId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'returnMovie',
      args: [BigInt(movieId)],
    });
  };

  return { returnMovie, isPending, isConfirming, isConfirmed, error: writeError, reset };
}

export function useMovieKeep() {
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const keepForever = (movieId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'keepMovieForever',
      args: [BigInt(movieId)],
    });
  };

  return { keepForever, isPending, isConfirming, isConfirmed, error: writeError, reset };
}

export function useClaimMovieRewards() {
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const claim = () => {
    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'claimMovieRewards',
    });
  };

  return { claim, isPending, isConfirming, isConfirmed, error: writeError, reset };
}
