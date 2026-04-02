import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZERO_MOVIES_FACET_ABI } from '@/lib/web3/abi';
import type { Movie } from '../types';

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

export function useMoviesCatalog() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: ZERO_MOVIES_FACET_ABI,
    functionName: 'getAllMovies',
    query: {
      refetchInterval: 30_000, // Poll every 30s to keep supply updated
    },
  });

  const movies: Movie[] = [];

  if (data) {
    const [ids, names, mintedFlags, activeFlags, tokenIds, minters] = data as [
      bigint[], string[], boolean[], boolean[], bigint[], string[]
    ];

    for (let i = 0; i < ids.length; i++) {
      movies.push({
        id: Number(ids[i]),
        name: names[i],
        minted: mintedFlags[i],
        active: activeFlags[i],
        tokenId: Number(tokenIds[i]),
        mintedBy: minters[i],
      });
    }
  }

  const available = movies.filter((m) => m.active && !m.minted);
  const soldOut = movies.filter((m) => m.minted);

  return { movies, available, soldOut, isLoading, error, refetch };
}
