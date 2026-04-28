import {useMemo} from 'react';
import {useReadContract} from 'wagmi';
import {base} from 'wagmi/chains';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI} from '@/lib/web3/abi';
import {MOVIES_S2_MOCK} from '@/features/zeromovies/data/movies2Mock';

const ADRIAN_LAB_CORE = '0x6E369BF0E4e0c106192D606FB6d85836d684DA75';
const PRIZE_KIND_ERC721 = 1;

export interface ExtraPrize {
    kind: number;
    token: string;
    tokenIdOrAmount: bigint;
    rank: number;
}

/**
 * Resolve a movie cover for a Premiere Budokai prize. The contract stores the
 * AdrianLabCore tokenId, but the catalog is keyed by movieId. We map by the
 * known auction/Budokai tokenIds — pre-mints land at small tokenIds before any
 * S2 public minting starts so this is unambiguous at launch. Falls back to a
 * "Unknown Movie" label so the UI never breaks if a future drop changes shape.
 */
export interface MoviePrizeMatch {
    rank: number;
    tokenId: bigint;
    movieId: number | null;
    movieName: string;
    posterUrl: string;
    hasAnimation: boolean;
}

/** Best-effort: find the movie this prize was minted for by looking up
 *  reservedFor='budokai' in the catalog. If we ever pre-mint multiple movies
 *  the resolver should be replaced by an on-chain `tokenToMovie` read. */
function matchMoviePrize(prize: ExtraPrize): MoviePrizeMatch | null {
    if (prize.kind !== PRIZE_KIND_ERC721) return null;
    if (prize.token.toLowerCase() !== ADRIAN_LAB_CORE.toLowerCase()) return null;

    // Default match: any movie flagged `reservedFor: 'budokai'`. If multiple
    // are flagged, pick the lowest movieId (deterministic, mirrors mint order).
    const candidate = MOVIES_S2_MOCK
        .filter((m) => m.reservedFor === 'budokai')
        .sort((a, b) => a.id - b.id)[0];

    if (!candidate) {
        return {
            rank: prize.rank,
            tokenId: prize.tokenIdOrAmount,
            movieId: null,
            movieName: 'Premiere Movie',
            posterUrl: '',
            hasAnimation: false,
        };
    }

    const base = 'https://adrianlab.vercel.app/labimages/zeromovies2';
    const posterUrl = candidate.hasAnimation
        ? `${base}/animated/${candidate.id}.gif`
        : `${base}/${candidate.id}.svg`;

    return {
        rank: prize.rank,
        tokenId: prize.tokenIdOrAmount,
        movieId: candidate.id,
        movieName: candidate.name,
        posterUrl,
        hasAnimation: !!candidate.hasAnimation,
    };
}

/**
 * Read SamuraiDojoFacet.getExtraPrizes(budokaiId) and surface any rank-1
 * AdrianLabCore ERC-721 (i.e. a movie prize). Returns null when no movie prize
 * is configured — caller can render the standard PrizeShowcase.
 */
export function useMoviePrize(budokaiId: bigint | null | undefined): {
    moviePrize: MoviePrizeMatch | null;
    refetch: () => void;
} {
    const {data, refetch} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_DOJO_ABI,
        functionName: 'getExtraPrizes',
        args: budokaiId !== null && budokaiId !== undefined ? [budokaiId] : undefined,
        chainId: base.id,
        query: {
            enabled: budokaiId !== null && budokaiId !== undefined,
            staleTime: 60_000,
        },
    });

    const moviePrize = useMemo<MoviePrizeMatch | null>(() => {
        if (!data || !Array.isArray(data) || data.length === 0) return null;
        // Champion gets rank-1 (lowest rank value). Pick the rank-1 ERC721
        // (movie cover); ignore other ranks for the headline banner.
        const rank1 = (data as ExtraPrize[]).find((p) => Number(p.rank) === 1);
        if (!rank1) return null;
        return matchMoviePrize({
            kind: Number(rank1.kind),
            token: rank1.token,
            tokenIdOrAmount: BigInt(rank1.tokenIdOrAmount),
            rank: Number(rank1.rank),
        });
    }, [data]);

    return {moviePrize, refetch};
}
