import {Trophy, Medal, Award, Swords} from 'lucide-react';
import {useReadContract} from 'wagmi';
import {base} from 'wagmi/chains';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI} from '@/lib/web3/abi';
import {useChampions, useBudokaiInfo, useConfiguredBudokais} from '../hooks/useDojoContract';
import {useBudokaiTheme} from '../hooks/useBudokaiTheme';
import {useDojoStore} from '../store/dojoStore';

/**
 * Hall of Fame — renders every configured Budokai, split into Golden (I-III) and Metal (IV+) tiers.
 * The Golden tier is the 3-budokai saga (Golden Shuriken trophy). Metal tier is the eternal dojo
 * that opens after Budokai III.
 *
 * Props:
 *   budokaiIds?: optional override. If omitted, auto-discovers via useConfiguredBudokais().
 */
interface ChampionsHallProps {
    budokaiIds?: number[]; // legacy optional override
}

function getSamuraiImageUrl(tokenId: number): string {
    return `https://adrianlab.vercel.app/api/render/${tokenId}.png`;
}

// Trophy boundary: ids 1..3 are Golden (maxSupply 3 on AdrianTraitsCore).
// Post-Budokai III the facet v6 configures Metal Shuriken for id 4+.
const GOLDEN_MAX_ID = 3;

export function ChampionsHall({budokaiIds}: ChampionsHallProps) {
    const {summaries, isLoading} = useConfiguredBudokais();
    const ids = budokaiIds ?? summaries.map((s) => s.id);

    const goldenIds = ids.filter((id) => id <= GOLDEN_MAX_ID);
    const metalIds = ids.filter((id) => id > GOLDEN_MAX_ID);

    return (
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <div className="mb-5 text-center">
                <h2 className="text-lg font-bold tracking-[0.3em] uppercase text-yellow-400">
                    Hall of Fame
                </h2>
                <p className="mt-1 text-[9px] tracking-wider text-zinc-600">
                    Podium winners of every resolved Budokai
                </p>
            </div>

            {/* Golden tier — full podium card */}
            <TierSection
                label="Golden Shuriken Tier"
                kanji="黄金"
                sub="Budokai I–III · Only 3 ever minted"
                color="text-yellow-400"
                accentBg="from-yellow-950/30"
                ids={goldenIds}
                isLoading={isLoading}
                emptyMsg="Awaiting the first Tenkaichi."
                variant="full"
            />

            {/* Metal tier — compact champion-only card */}
            {(metalIds.length > 0 || !isLoading) && (
                <TierSection
                    label="Metal Shuriken Tier"
                    kanji="鋼"
                    sub="The Eternal Dojo · Budokai IV onward"
                    color="text-zinc-300"
                    accentBg="from-zinc-800/30"
                    ids={metalIds}
                    isLoading={isLoading}
                    emptyMsg="The Eternal Dojo opens after Budokai III."
                    variant="compact"
                />
            )}
        </div>
    );
}

function TierSection({
    label,
    kanji,
    sub,
    color,
    accentBg,
    ids,
    isLoading,
    emptyMsg,
    variant,
}: {
    label: string;
    kanji: string;
    sub: string;
    color: string;
    accentBg: string;
    ids: number[];
    isLoading: boolean;
    emptyMsg: string;
    variant: 'full' | 'compact';
}) {
    const gridClass =
        variant === 'full'
            ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
            : 'grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
    return (
        <div className="mb-8">
            <div className={`mb-3 flex items-baseline gap-3 bg-gradient-to-r ${accentBg} via-transparent to-transparent px-2 py-2`}>
                <span className={`text-[11px] font-bold uppercase tracking-[0.3em] ${color}`}>{label}</span>
                <span className="font-mono text-[10px] text-zinc-600">{kanji}</span>
                <span className="text-[9px] tracking-wider text-zinc-600">{sub}</span>
                <div className="h-px flex-1 bg-zinc-900" />
                <span className="font-mono text-[9px] text-zinc-500">({ids.length})</span>
            </div>
            {ids.length === 0 ? (
                <div className="flex h-20 items-center justify-center rounded border border-dashed border-zinc-900 text-[10px] text-zinc-700">
                    {isLoading ? 'Loading...' : emptyMsg}
                </div>
            ) : (
                <div className={gridClass}>
                    {ids.map((id) =>
                        variant === 'full' ? (
                            <BudokaiRecap key={id} budokaiId={id} />
                        ) : (
                            <MetalRecap key={id} budokaiId={id} />
                        ),
                    )}
                </div>
            )}
        </div>
    );
}

function BudokaiRecap({budokaiId}: {budokaiId: number}) {
    const {champions} = useChampions(budokaiId);
    const {info} = useBudokaiInfo(budokaiId);
    const {theme} = useBudokaiTheme(BigInt(budokaiId));
    const {openBracket} = useDojoStore();
    const unresolved = !champions || champions.champion === 0;
    const warriors = info?.entryCount ?? 0;

    return (
        <div className="group rounded border border-zinc-800 bg-zinc-950/70 p-4 transition-colors hover:border-zinc-700">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">
                        Budokai {budokaiId}
                    </span>
                    {theme?.tagline && (
                        <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-300/80">
                            {theme.tagline}
                        </span>
                    )}
                </div>
                {unresolved ? (
                    <span className="text-[8px] uppercase text-zinc-600">Pending</span>
                ) : (
                    <button
                        onClick={() => openBracket(budokaiId)}
                        className="text-[8px] uppercase text-red-400 hover:text-red-300"
                    >
                        ▶ Replay
                    </button>
                )}
            </div>

            {unresolved ? (
                <div className="flex h-24 items-center justify-center text-[10px] text-zinc-700">
                    Awaiting resolution
                </div>
            ) : (
                <>
                    {/* Champion: prominent hero with large image. Click → detail modal. */}
                    <ChampionHero tokenId={champions!.champion} />
                    {/* Runner-up + semis: compact rows below. */}
                    <div className="mt-3 space-y-1.5">
                        <PodiumRow
                            rank="2nd"
                            tokenId={champions!.runnerUp}
                            color="text-zinc-300"
                            icon={<Medal className="h-3 w-3" />}
                        />
                        <PodiumRow
                            rank="3rd-4th"
                            tokenId={champions!.semifinalists[0]}
                            color="text-orange-400"
                            icon={<Award className="h-3 w-3" />}
                        />
                        <PodiumRow
                            rank="3rd-4th"
                            tokenId={champions!.semifinalists[1]}
                            color="text-orange-400"
                            icon={<Award className="h-3 w-3" />}
                        />
                    </div>
                    {warriors > 0 && (
                        <div className="mt-3 flex items-center gap-1.5 border-t border-zinc-900 pt-2 text-[9px] tracking-wider text-zinc-600">
                            <Swords className="h-3 w-3" />
                            <span className="uppercase">{warriors} warriors fought</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/**
 * Compact recap card for Metal Shuriken tier (Budokai IV+).
 * Shows champion image + tagline + warriors fought, no podium runner-ups.
 * Designed to fit a denser grid (up to 6 cols on xl) so dozens of Budokais stay browsable.
 */
function MetalRecap({budokaiId}: {budokaiId: number}) {
    const {champions} = useChampions(budokaiId);
    const {info} = useBudokaiInfo(budokaiId);
    const {theme} = useBudokaiTheme(BigInt(budokaiId));
    const {openBracket, selectSamurai} = useDojoStore();
    const unresolved = !champions || champions.champion === 0;
    const warriors = info?.entryCount ?? 0;
    const tokenId = champions?.champion ?? 0;

    return (
        <div className="group rounded border border-zinc-800 bg-zinc-950/70 p-2 transition-colors hover:border-zinc-700">
            <div className="mb-1.5 flex items-center justify-between gap-1">
                <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-500">
                    Budokai {budokaiId}
                </span>
                {!unresolved && (
                    <button
                        onClick={() => openBracket(budokaiId)}
                        className="text-[7px] uppercase text-red-400 hover:text-red-300"
                    >
                        ▶ Replay
                    </button>
                )}
            </div>

            {unresolved ? (
                <div className="flex aspect-square items-center justify-center text-[9px] text-zinc-700">
                    Pending
                </div>
            ) : (
                <button
                    onClick={() => selectSamurai(tokenId)}
                    className="relative block aspect-square w-full overflow-hidden rounded border border-zinc-700 bg-gradient-to-b from-zinc-800/30 to-transparent transition-all hover:border-zinc-500"
                >
                    <img
                        src={getSamuraiImageUrl(tokenId)}
                        alt={`Champion #${tokenId}`}
                        className="h-full w-full object-contain"
                        style={{imageRendering: 'pixelated'}}
                    />
                    <div className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-black/70 px-1 py-0.5 backdrop-blur-sm">
                        <Trophy className="h-2.5 w-2.5 text-zinc-300" />
                        <span className="font-mono text-[7px] font-bold uppercase tracking-[0.2em] text-zinc-300">1st</span>
                    </div>
                    <div className="absolute right-1 top-1">
                        <HonorTag tokenId={tokenId} />
                    </div>
                </button>
            )}

            {!unresolved && (
                <div className="mt-1.5 space-y-0.5">
                    {theme?.tagline && (
                        <div className="truncate text-[9px] font-bold uppercase tracking-wider text-zinc-300" title={theme.tagline}>
                            {theme.tagline}
                        </div>
                    )}
                    <div className="flex items-center justify-between font-mono text-[9px] text-zinc-400">
                        <span>#{tokenId}</span>
                        {warriors > 0 && (
                            <span className="flex items-center gap-1 text-zinc-500">
                                <Swords className="h-2.5 w-2.5" />
                                {warriors}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function PodiumRow({rank, tokenId, color, icon}: {rank: string; tokenId: number; color: string; icon: React.ReactNode}) {
    const {selectSamurai} = useDojoStore();
    if (!tokenId) return null;
    return (
        <button
            onClick={() => selectSamurai(tokenId)}
            className="flex w-full items-center gap-3 rounded px-1 py-0.5 text-left transition-colors hover:bg-zinc-900/50"
        >
            <img
                src={getSamuraiImageUrl(tokenId)}
                alt={`#${tokenId}`}
                className="h-8 w-8 rounded"
                style={{imageRendering: 'pixelated'}}
            />
            <div className={`flex items-center gap-1 text-[10px] ${color}`}>
                {icon}
                <span className="font-mono uppercase tracking-wider">{rank}</span>
            </div>
            <span className="ml-auto font-mono text-[10px] text-zinc-400">#{tokenId}</span>
            <HonorTag tokenId={tokenId} />
        </button>
    );
}

/** Champion hero — large image + 1ST badge. Click opens the detail modal. */
function ChampionHero({tokenId}: {tokenId: number}) {
    const {selectSamurai} = useDojoStore();
    if (!tokenId) return null;
    return (
        <button
            onClick={() => selectSamurai(tokenId)}
            className="group relative block w-full overflow-hidden rounded border border-yellow-500/40 bg-gradient-to-b from-yellow-950/30 to-transparent text-left transition-all hover:border-yellow-400 hover:shadow-[0_0_20px_rgba(234,179,8,0.25)]"
        >
            <div className="relative aspect-square w-full">
                <img
                    src={getSamuraiImageUrl(tokenId)}
                    alt={`Champion #${tokenId}`}
                    className="h-full w-full object-contain"
                    style={{imageRendering: 'pixelated'}}
                />
                <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 backdrop-blur-sm">
                    <Trophy className="h-3 w-3 text-yellow-400" />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-yellow-400">1st</span>
                </div>
                <div className="absolute right-2 top-2 flex items-center gap-1">
                    <HonorTag tokenId={tokenId} />
                </div>
            </div>
            <div className="flex items-center justify-between border-t border-yellow-900/40 px-2.5 py-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-yellow-400">Champion</span>
                <span className="font-mono text-[11px] font-bold text-yellow-300">#{tokenId}</span>
            </div>
        </button>
    );
}

/** v6: per-token persistent honor displayed next to the token id. Hidden when honor=0. */
function HonorTag({tokenId}: {tokenId: number}) {
    const {data} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_DOJO_ABI,
        functionName: 'getHonor',
        args: [BigInt(tokenId)],
        chainId: base.id,
        query: {staleTime: 60_000},
    });
    const honor = data !== undefined ? Number(data) : 0;
    if (honor === 0) return null;
    return (
        <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-yellow-400" title={`Honor: +${honor}. Stacks with Senryoku in combat.`}>
            +{honor}
        </span>
    );
}
