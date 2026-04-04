import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZERO_MOVIES_FACET_ABI } from '@/lib/web3/abi';

const NFT_APPROVE_ABI = [
  { type: 'function', name: 'setApprovalForAll', inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'isApprovedForAll', inputs: [{ name: 'owner', type: 'address' }, { name: 'operator', type: 'address' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'view' },
] as const;

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

export function useNftApproval() {
  const { address } = useAccount();

  const { data: isApproved, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ADRIAN_ZERO as `0x${string}`,
    abi: NFT_APPROVE_ABI,
    functionName: 'isApprovedForAll',
    args: address ? [address, CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const approve = () => {
    writeContract({
      address: CONTRACT_ADDRESSES.ADRIAN_ZERO as `0x${string}`,
      abi: NFT_APPROVE_ABI,
      functionName: 'setApprovalForAll',
      args: [CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`, true],
    });
  };

  return { isApproved: isApproved as boolean, approve, isPending, isConfirming, isConfirmed, refetch };
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
