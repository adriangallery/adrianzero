import {Trophy, Medal, Award, Swords} from 'lucide-react';
import {useReadContract} from 'wagmi';
import {base} from 'wagmi/chains';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI, BUDOKAI_STATUS} from '@/lib/web3/abi';
import {useChampions, useBudokaiInfo, useConfiguredBudokais} from '../hooks/useDojoContract';
import {useBudokaiTheme} from '../hooks/useBudokaiTheme';
import {useDojoStore} from '../store/dojoStore';
import {TopSamuraiBoard} from './TopSamuraiBoard';

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

// Frontend tagline overrides for Budokais launched before v6 stored the theme
// on-chain (legacy `configureBudokai` left `eventTagline` empty). Used as
// fallback when `getBudokaiTheme().tagline` is the empty string.
const TAGLINE_OVERRIDES: Record<number, string> = {
    1: 'The First Golden',
};

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

            {/* Strongest samurai — refreshed every 5 min via multicall */}
            <TopSamuraiBoard />

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
    const isResolved = info?.status === BUDOKAI_STATUS.Resolved;
    const hasChampion = !!champions && champions.champion !== 0;
    const isUndisputed = isResolved && !hasChampion;
    const isPending = !isResolved && !hasChampion;
    const warriors = info?.entryCount ?? 0;
    const tagline = theme?.tagline || TAGLINE_OVERRIDES[budokaiId];

    return (
        <div className="group rounded border border-zinc-800 bg-zinc-950/70 p-4 transition-colors hover:border-zinc-700">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">
                        Budokai {budokaiId}
                    </span>
                    {tagline && (
                        <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-300/80">
                            {tagline}
                        </span>
                    )}
                </div>
                {isPending && <span className="text-[8px] uppercase text-zinc-600">Pending</span>}
                {isUndisputed && (
                    <span className="text-[8px] uppercase text-zinc-500">Undisputed</span>
                )}
                {hasChampion && (
                    <button
                        onClick={() => openBracket(budokaiId)}
                        className="text-[8px] uppercase text-red-400 hover:text-red-300"
                    >
                        ▶ Replay
                    </button>
                )}
            </div>

            {isPending ? (
                <div className="flex h-24 items-center justify-center text-[10px] text-zinc-700">
                    Awaiting resolution
                </div>
            ) : isUndisputed ? (
                <div
                    className="flex h-24 flex-col items-center justify-center gap-1 rounded border border-dashed border-zinc-800 bg-gradient-to-b from-zinc-950 to-black text-center"
                    title="No challengers entered. The pool was rolled over to the next Budokai."
                >
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">
                        Undisputed
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-zinc-600">
                        no challengers · pool rolled over
                    </span>
                </div>
            ) : (
                <>
                    {/* Champion: prominent hero with large image. Click → detail modal. */}
                    <ChampionHero tokenId={champions!.champion} budokaiId={budokaiId} />
                    {/* Runner-up + semis: compact rows below. */}
                    <div className="mt-3 space-y-1.5">
                        <PodiumRow
                            budokaiId={budokaiId}
                            honorRank="runnerUp"
                            rank="2nd"
                            tokenId={champions!.runnerUp}
                            color="text-zinc-300"
                            icon={<Medal className="h-3 w-3" />}
                        />
                        <PodiumRow
                            budokaiId={budokaiId}
                            honorRank="semi"
                            rank="3rd-4th"
                            tokenId={champions!.semifinalists[0]}
                            color="text-orange-400"
                            icon={<Award className="h-3 w-3" />}
                        />
                        <PodiumRow
                            budokaiId={budokaiId}
                            honorRank="semi"
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
    // Resolved with no entries → keeper called _rolloverBudokai, the seed pool was carried
    // to the next configured Budokai, and this slot was marked Resolved without a champion.
    // Distinct from "still open / awaiting resolve" — keep them visually different.
    const isResolved = info?.status === BUDOKAI_STATUS.Resolved;
    const hasChampion = !!champions && champions.champion !== 0;
    const isUndisputed = isResolved && !hasChampion;
    const isPending = !isResolved && !hasChampion;
    const warriors = info?.entryCount ?? 0;
    const tokenId = champions?.champion ?? 0;
    const tagline = theme?.tagline || TAGLINE_OVERRIDES[budokaiId];

    return (
        <div className="group rounded border border-zinc-800 bg-zinc-950/70 p-2 transition-colors hover:border-zinc-700">
            <div className="mb-1.5 flex items-center justify-between gap-1">
                <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-500">
                    Budokai {budokaiId}
                </span>
                {hasChampion && (
                    <button
                        onClick={() => openBracket(budokaiId)}
                        className="text-[7px] uppercase text-red-400 hover:text-red-300"
                    >
                        ▶ Replay
                    </button>
                )}
            </div>

            {isPending ? (
                <div className="flex aspect-square items-center justify-center text-[9px] text-zinc-700">
                    Pending
                </div>
            ) : isUndisputed ? (
                <div
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded border border-dashed border-zinc-800 bg-gradient-to-b from-zinc-950 to-black px-2 text-center"
                    title="No challengers entered. The pool was rolled over to the next Budokai."
                >
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                        Undisputed
                    </span>
                    <span className="text-[7px] uppercase tracking-wider text-zinc-600">
                        no challengers
                    </span>
                    <span className="text-[7px] uppercase tracking-wider text-zinc-600">
                        pool rolled over
                    </span>
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
                        <HonorTag budokaiId={budokaiId} rank="champion" />
                    </div>
                </button>
            )}

            {hasChampion && (
                <div className="mt-1.5 space-y-0.5">
                    {tagline && (
                        <div className="truncate text-[9px] font-bold uppercase tracking-wider text-zinc-300" title={tagline}>
                            {tagline}
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

function PodiumRow({
    budokaiId,
    honorRank,
    rank,
    tokenId,
    color,
    icon,
}: {
    budokaiId: number;
    honorRank: HonorRank;
    rank: string;
    tokenId: number;
    color: string;
    icon: React.ReactNode;
}) {
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
            <HonorTag budokaiId={budokaiId} rank={honorRank} />
        </button>
    );
}

/** Champion hero — large image + 1ST badge. Click opens the detail modal. */
function ChampionHero({tokenId, budokaiId}: {tokenId: number; budokaiId: number}) {
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
                    <HonorTag budokaiId={budokaiId} rank="champion" />
                </div>
            </div>
            <div className="flex items-center justify-between border-t border-yellow-900/40 px-2.5 py-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-yellow-400">Champion</span>
                <span className="font-mono text-[11px] font-bold text-yellow-300">#{tokenId}</span>
            </div>
        </button>
    );
}

/**
 * v6: honor delta earned in THIS Budokai (per rank + trophy type).
 *
 * Mirrors LibSamuraiDojo constants:
 *   Golden champ +10 / runner-up +5 / semi +2
 *   Metal  champ +3  / runner-up +1 / semi +0
 *   Custom = same as Metal (admin can re-grant via adminGrantHonor)
 *   None   = no honor awarded
 *
 * Until 2026-05-05 this badge showed `getHonor(tokenId)` (the running per-token
 * total), which made every card display the same number on multi-win champions
 * (#634 showed +13 in Budokai 7 AND Budokai 9). Switched to per-Budokai delta
 * so the card reflects what the samurai earned in *that* battle.
 */
type HonorRank = 'champion' | 'runnerUp' | 'semi';

const HONOR_DELTAS: Record<number, Record<HonorRank, number>> = {
    0: {champion: 0, runnerUp: 0, semi: 0}, // None
    1: {champion: 10, runnerUp: 5, semi: 2}, // Golden Shuriken
    2: {champion: 3, runnerUp: 1, semi: 0}, // Metal Shuriken
    3: {champion: 3, runnerUp: 1, semi: 0}, // Custom (mirrors Metal)
};

function HonorTag({budokaiId, rank}: {budokaiId: number; rank: HonorRank}) {
    const {data} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_DOJO_ABI,
        functionName: 'getBudokaiTrophy',
        args: [BigInt(budokaiId)],
        chainId: base.id,
        query: {staleTime: 5 * 60_000},
    });
    const trophyType = data ? Number((data as readonly [number, bigint, number])[0]) : 0;
    const honor = HONOR_DELTAS[trophyType]?.[rank] ?? 0;
    if (honor === 0) return null;
    return (
        <span
            className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-yellow-400"
            title={`+${honor} honor earned in this Budokai. Honor stacks with Senryoku in combat.`}
        >
            +{honor}
        </span>
    );
}
