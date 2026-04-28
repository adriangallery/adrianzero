import {Trophy, Film} from 'lucide-react';
import type {MoviePrizeMatch} from '../hooks/useExtraPrizes';

interface MoviePrizeBannerProps {
    prize: MoviePrizeMatch;
}

/**
 * Headline banner for "Premiere Budokai" events — Budokais where the champion
 * walks away with a ZEROmovies S2 cover (in addition to the trophy). Reads its
 * data from `useMoviePrize(currentBudokaiId)`. Renders nothing when no movie
 * prize is registered for the current Budokai.
 */
export function MoviePrizeBanner({prize}: MoviePrizeBannerProps) {
    return (
        <div className="mb-6 overflow-hidden rounded border-2 border-yellow-400/60 bg-gradient-to-br from-yellow-900/30 via-zinc-950 to-purple-900/20 shadow-[0_0_32px_rgba(250,204,21,0.20)]">
            <div className="flex flex-col items-center gap-4 p-4 sm:flex-row sm:gap-5 sm:p-5">
                <div className="relative shrink-0">
                    <div className="absolute inset-0 animate-pulse rounded bg-yellow-400/20 blur-xl" />
                    {prize.posterUrl ? (
                        <img
                            src={prize.posterUrl}
                            alt={prize.movieName}
                            className="relative h-28 w-28 rounded border border-yellow-500/40 object-contain sm:h-32 sm:w-32"
                            style={{imageRendering: 'pixelated'}}
                            loading="eager"
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="relative flex h-28 w-28 items-center justify-center rounded border border-yellow-500/40 bg-zinc-900 sm:h-32 sm:w-32">
                            <Film className="h-8 w-8 text-zinc-700" />
                        </div>
                    )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                        <Film className="h-3.5 w-3.5 text-purple-400" />
                        <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-purple-400">
                            ZEROmovies S2 · Premiere Prize
                        </span>
                    </div>
                    <h2 className="mt-1 text-xl font-bold tracking-wider text-yellow-300 sm:text-2xl">
                        {prize.movieName}
                    </h2>
                    <p className="mt-1 text-[10px] leading-relaxed text-zinc-400 sm:text-[11px]">
                        The Budokai champion walks away with this 1/1 ZEROmovies S2 cover —
                        delivered automatically on-chain at resolve. Trophy stacks on top:
                        {' '}<span className="font-bold text-yellow-400">winner takes both</span>.
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-1 text-[8px] uppercase tracking-wider text-yellow-300/80 sm:justify-start">
                        <Trophy className="h-3 w-3 text-yellow-400" />
                        <span>tokenId #{prize.tokenId.toString()}</span>
                        {prize.hasAnimation && (
                            <span className="ml-2 rounded bg-purple-500/30 px-1.5 py-0.5 font-bold text-purple-200">
                                ANIMATED
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
