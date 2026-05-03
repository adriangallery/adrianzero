import {useState} from 'react';
import {Flame, Award} from 'lucide-react';
import {useTopSamurai, type TopSamurai} from '../hooks/useTopSamurai';

const DEFAULT_LIMIT = 10;
const EXPANDED_LIMIT = 25;

function getSamuraiImageUrl(tokenId: number): string {
    return `https://adrianlab.vercel.app/api/render/${tokenId}.png`;
}

function rankBadge(rank: number): {label: string; color: string} {
    if (rank === 0) return {label: '1', color: 'text-yellow-300 border-yellow-500/40 bg-yellow-500/10'};
    if (rank === 1) return {label: '2', color: 'text-zinc-200 border-zinc-400/40 bg-zinc-400/10'};
    if (rank === 2) return {label: '3', color: 'text-amber-500 border-amber-700/40 bg-amber-700/10'};
    return {label: String(rank + 1), color: 'text-zinc-500 border-zinc-700/30 bg-zinc-900/30'};
}

/**
 * Top Samurai leaderboard — ranks the strongest samurai by effective SR (senryoku + honor).
 *
 * Lives inside the Hall of Fame. Compact by default (top 10), expandable to top 25.
 * Data source: `useTopSamurai` (multicall against the Diamond, refreshed every 5 min).
 */
export function TopSamuraiBoard() {
    const [expanded, setExpanded] = useState(false);
    const limit = expanded ? EXPANDED_LIMIT : DEFAULT_LIMIT;
    const {leaderboard, isLoading} = useTopSamurai(limit);

    return (
        <section className="mb-8">
            <div className="mb-3 flex items-baseline justify-between gap-3">
                <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-400">
                        Strongest Samurai
                    </h3>
                    <p className="mt-0.5 text-[9px] tracking-wider text-zinc-600">
                        Ranked by effective power (senryoku + honor)
                    </p>
                </div>
                <span className="font-mono text-[9px] text-orange-700">最強</span>
            </div>

            {isLoading && leaderboard.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded border border-dashed border-zinc-800 text-[10px] text-zinc-600">
                    Reading the dojo's stats…
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded border border-dashed border-zinc-800 text-[10px] text-zinc-600">
                    No samurai with loaded SR yet.
                </div>
            ) : (
                <>
                    <ol className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {leaderboard.map((row, i) => (
                            <Row key={row.tokenId} rank={i} row={row} />
                        ))}
                    </ol>
                    <div className="mt-3 text-center">
                        <button
                            type="button"
                            onClick={() => setExpanded((e) => !e)}
                            className="rounded border border-zinc-700 bg-zinc-900/40 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 transition hover:border-orange-500/50 hover:text-orange-300"
                        >
                            {expanded ? `Show top ${DEFAULT_LIMIT}` : `Show top ${EXPANDED_LIMIT}`}
                        </button>
                    </div>
                </>
            )}
        </section>
    );
}

function Row({rank, row}: {rank: number; row: TopSamurai}) {
    const badge = rankBadge(rank);
    const hasHonor = row.honor > 0;
    return (
        <li className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/40 px-2 py-1.5">
            <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border text-[10px] font-bold tracking-wider ${badge.color}`}
                aria-label={`Rank ${badge.label}`}
            >
                {badge.label}
            </span>
            <img
                src={getSamuraiImageUrl(row.tokenId)}
                alt={`SamuraiZERO #${row.tokenId}`}
                loading="lazy"
                className="h-8 w-8 shrink-0 rounded-sm bg-zinc-900 object-cover"
            />
            <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-zinc-200">
                    SamuraiZERO #{row.tokenId}
                </p>
                <p className="text-[9px] uppercase tracking-wider text-zinc-500">
                    SR {row.senryoku}
                    {hasHonor && (
                        <>
                            {' '}
                            <span className="text-amber-400">+ {row.honor} honor</span>
                        </>
                    )}
                </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-orange-300">
                {hasHonor ? <Award className="h-3 w-3" /> : <Flame className="h-3 w-3" />}
                <span className="text-[10px] font-bold tabular-nums">{row.effectiveSR}</span>
            </div>
        </li>
    );
}
