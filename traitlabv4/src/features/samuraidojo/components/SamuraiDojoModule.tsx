import {useEffect, useMemo, useState} from 'react';
import {useReadContract} from 'wagmi';
import {Loader2, Sword} from 'lucide-react';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI, BUDOKAI_STATUS} from '@/lib/web3/abi';
import {useZeroBalance} from '@/features/zeromovies/hooks/useZeroBalance';
import {useBudokaiEntries, useBudokaiInfo, useCurrentBudokaiId} from '../hooks/useDojoContract';
import {useMySamurai} from '../hooks/useMySamurai';
import {useSamuraiRoster} from '../hooks/useSamuraiRoster';
import {useSamuraiState} from '../hooks/useSamuraiState';
import {useEnterBudokaiBatch} from '../hooks/useDojoActions';
import {ENTRY_FEE_ZERO} from '../types';
import {useDojoStore} from '../store/dojoStore';
import {SamuraiCard} from './SamuraiCard';
import {TournamentStats} from './TournamentStats';
import {SamuraiDetailModal} from './SamuraiDetailModal';
import {ChampionsHall} from './ChampionsHall';
import {BracketReveal} from './BracketReveal';
import {PrizeShowcase} from './PrizeShowcase';

type FilterMode = 'entrants' | 'mine' | 'ko' | 'hall' | 'all';

export function SamuraiDojoModule() {
    const {currentBudokaiId, refetch: refetchCurrent} = useCurrentBudokaiId();
    const {info: budokaiInfo, refetch: refetchInfo} = useBudokaiInfo(currentBudokaiId);
    const {entries, refetch: refetchEntries} = useBudokaiEntries(currentBudokaiId);
    const {owned: myTokenIds, refetch: refetchOwned} = useMySamurai();
    const {balance: zeroBalance} = useZeroBalance();
    const {data: totalBurnedRaw} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_DOJO_ABI,
        functionName: 'getTotalBurned',
        query: {refetchInterval: 30_000},
    });
    const totalBurned = (totalBurnedRaw as bigint | undefined) ?? 0n;

    const {
        selectedTokenId,
        isDetailOpen,
        isBracketOpen,
        bracketBudokaiId,
        multiSelectMode,
        selectedIds,
        toggleMultiSelectMode,
        toggleId,
        clearSelection,
        selectMany,
        selectSamurai,
        closeDetail,
        openBracket,
        closeBracket,
    } = useDojoStore();

    const [filter, setFilter] = useState<FilterMode>('mine');
    const {roster} = useSamuraiRoster();

    // Which tokenIds do we need state for?
    //   entrants  → current Budokai entries
    //   mine      → my tokens (to classify into IN / READY / KO)
    //   ko        → my tokens + the FULL roster (to show community KO'd too)
    //   hall      → no grid; skip
    const visibleTokenIds = useMemo(() => {
        const set = new Set<number>();
        if (filter === 'hall') return [];
        if (filter === 'entrants' || filter === 'all') {
            for (const id of entries) set.add(id);
        }
        if (filter === 'mine' || filter === 'all') {
            for (const id of myTokenIds) set.add(id);
        }
        if (filter === 'ko' || filter === 'all') {
            for (const id of myTokenIds) set.add(id);
            for (const id of roster) set.add(id); // community KO pool
        }
        return Array.from(set).sort((a, b) => a - b);
    }, [filter, entries, myTokenIds, roster]);

    const {states, refetch: refetchStates} = useSamuraiState(visibleTokenIds);

    const myOwnedSet = useMemo(() => new Set(myTokenIds), [myTokenIds]);
    const enteredSet = useMemo(() => new Set(entries), [entries]);

    // MINE tab sub-buckets.
    const mineInIds = useMemo(() => myTokenIds.filter((id) => enteredSet.has(id) && !states.get(id)?.isKnockedOut).sort((a, b) => a - b), [myTokenIds, enteredSet, states]);
    const mineReadyIds = useMemo(() => myTokenIds.filter((id) => !enteredSet.has(id) && !states.get(id)?.isKnockedOut).sort((a, b) => a - b), [myTokenIds, enteredSet, states]);
    const mineKoIds = useMemo(() => myTokenIds.filter((id) => states.get(id)?.isKnockedOut).sort((a, b) => a - b), [myTokenIds, states]);

    // KO'd tab split: mine vs community (roster \ mine, both KO'd).
    const koMineIds = mineKoIds;
    const koCommunityIds = useMemo(() => {
        const arr: number[] = [];
        for (const id of roster) {
            if (myOwnedSet.has(id)) continue;
            if (states.get(id)?.isKnockedOut) arr.push(id);
        }
        return arr.sort((a, b) => a - b);
    }, [roster, myOwnedSet, states]);

    // Entrants tab token list.
    const entrantsIds = useMemo(() => [...entries].sort((a, b) => a - b), [entries]);

    const handleRefresh = () => {
        refetchCurrent();
        refetchInfo();
        refetchEntries();
        refetchOwned();
        refetchStates();
    };

    const selectedState = selectedTokenId ? states.get(selectedTokenId) : undefined;

    // Batch entry
    const {enterBatch, isPending: isBatchPending, isConfirming: isBatchConfirming, isConfirmed: isBatchConfirmed, reset: resetBatch} =
        useEnterBudokaiBatch();
    const isBatchBusy = isBatchPending || isBatchConfirming;

    useEffect(() => {
        if (isBatchConfirmed) {
            clearSelection();
            toggleMultiSelectMode(); // exit multi-select
            handleRefresh();
            resetBatch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBatchConfirmed]);

    const selectedCount = selectedIds.size;
    const selectedTotalFee = selectedCount * ENTRY_FEE_ZERO;
    const insufficientBatchBalance = zeroBalance < selectedTotalFee;

    const handleSelectAllReady = () => {
        if (mineReadyIds.length === 0) return;
        // Pre-populate the multi-select bar; user sees the floating CTA and confirms.
        selectMany(mineReadyIds, true);
    };

    const handleCardClick = (tokenId: number) => {
        if (multiSelectMode) {
            // Only eligible samurai (mine + not entered + not KO) can be selected
            if (!myOwnedSet.has(tokenId)) return;
            if (enteredSet.has(tokenId)) return;
            if (states.get(tokenId)?.isKnockedOut) return;
            toggleId(tokenId);
        } else {
            selectSamurai(tokenId);
        }
    };

    return (
        <div className="min-h-screen bg-black pt-20 sm:pt-24">
            {/* Hero banner */}
            <HeroBanner />

            <div className="mx-auto max-w-6xl px-4 pt-6 pb-6 sm:px-6">
                <TournamentStats
                    budokaiId={currentBudokaiId}
                    info={budokaiInfo}
                    zeroBalance={zeroBalance}
                    totalBurned={totalBurned}
                />

                <PrizeShowcase />

                {/* Filter tabs + multi-select toggle */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1 rounded border border-zinc-800 p-1">
                        <FilterTab label="Entrants" count={entries.length} active={filter === 'entrants'} onClick={() => setFilter('entrants')} />
                        <FilterTab label="Mine" count={myTokenIds.length} active={filter === 'mine'} onClick={() => setFilter('mine')} />
                        <FilterTab
                            label="KO'd"
                            count={mineKoIds.length + koCommunityIds.length}
                            active={filter === 'ko'}
                            onClick={() => setFilter('ko')}
                        />
                        <FilterTab
                            label="Hall of Fame"
                            count={0}
                            hideCount
                            active={filter === 'hall'}
                            onClick={() => setFilter('hall')}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {filter === 'mine' && budokaiInfo?.status === BUDOKAI_STATUS.Open && mineReadyIds.length > 0 && !multiSelectMode && (
                            <button
                                onClick={() => {
                                    // Toggle multi-select AND preselect all READY tokens.
                                    // Parent wires this via a selectMany call handled below.
                                    handleSelectAllReady();
                                }}
                                className="rounded border border-yellow-500/50 bg-yellow-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400 hover:bg-yellow-500/20"
                            >
                                <Sword className="mr-1 inline h-3 w-3" />
                                Enter all Ready ({mineReadyIds.length})
                            </button>
                        )}
                        {budokaiInfo?.status === BUDOKAI_STATUS.Open && myOwnedSet.size > 0 && (
                            <button
                                onClick={() => toggleMultiSelectMode()}
                                className={`rounded border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                    multiSelectMode
                                        ? 'border-red-500 bg-red-600 text-white hover:bg-red-500'
                                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                                }`}
                            >
                                <Sword className="mr-1 inline h-3 w-3" />
                                {multiSelectMode ? 'Cancel' : 'Multi-Enter'}
                            </button>
                        )}

                        {budokaiInfo?.status === BUDOKAI_STATUS.Resolved && (
                            <button
                                onClick={() => openBracket(currentBudokaiId)}
                                className="rounded border border-red-600/40 bg-red-900/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-900/40"
                            >
                                Watch Bracket Replay
                            </button>
                        )}
                    </div>
                </div>

                {/* Content per filter */}
                {filter === 'hall' ? (
                    <ChampionsHall />
                ) : filter === 'mine' ? (
                    <MineSections
                        inIds={mineInIds}
                        readyIds={mineReadyIds}
                        koIds={mineKoIds}
                        states={states}
                        enteredSet={enteredSet}
                        myOwnedSet={myOwnedSet}
                        multiSelectMode={multiSelectMode}
                        selectedIds={selectedIds}
                        onCardClick={handleCardClick}
                        ownedCount={myTokenIds.length}
                    />
                ) : filter === 'ko' ? (
                    <KoSections
                        mineIds={koMineIds}
                        communityIds={koCommunityIds}
                        states={states}
                        enteredSet={enteredSet}
                        myOwnedSet={myOwnedSet}
                        onCardClick={handleCardClick}
                        multiSelectMode={multiSelectMode}
                        selectedIds={selectedIds}
                    />
                ) : entrantsIds.length === 0 ? (
                    <div className="flex h-40 items-center justify-center rounded border border-dashed border-zinc-800 text-[11px] text-zinc-600">
                        No entries yet. Be the first to enter!
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-7">
                        {entrantsIds.map((tokenId) => {
                            const state = states.get(tokenId);
                            return (
                                <SamuraiCard
                                    key={tokenId}
                                    tokenId={tokenId}
                                    senryoku={state?.senryoku ?? 0}
                                    honor={state?.honor ?? 0}
                                    isEntered={enteredSet.has(tokenId)}
                                    isKnockedOut={state?.isKnockedOut ?? false}
                                    isMine={myOwnedSet.has(tokenId)}
                                    onClick={() => handleCardClick(tokenId)}
                                    multiSelectMode={multiSelectMode}
                                    isSelected={selectedIds.has(tokenId)}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Floating batch action bar */}
            {multiSelectMode && selectedCount > 0 && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-red-600/40 bg-black/95 backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Selected</span>
                            <span className="font-mono text-sm font-bold text-white">
                                {selectedCount} samurai · {selectedTotalFee.toLocaleString()} $ZERO
                            </span>
                            {insufficientBatchBalance && (
                                <span className="mt-0.5 text-[9px] text-red-400">
                                    Need {(selectedTotalFee - zeroBalance).toLocaleString()} more $ZERO
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => clearSelection()}
                                disabled={isBatchBusy}
                                className="rounded border border-zinc-700 px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white disabled:opacity-50"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => enterBatch(Array.from(selectedIds))}
                                disabled={isBatchBusy || insufficientBatchBalance || selectedCount === 0}
                                className="rounded bg-red-600 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
                            >
                                {isBatchBusy ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Entering {selectedCount}...
                                    </span>
                                ) : (
                                    `Enter ${selectedCount} (${selectedTotalFee.toLocaleString()} $ZERO)`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SamuraiDetailModal
                tokenId={selectedTokenId}
                senryoku={selectedState?.senryoku ?? 0}
                isKnockedOut={selectedState?.isKnockedOut ?? false}
                isEntered={selectedTokenId ? enteredSet.has(selectedTokenId) : false}
                isMine={selectedTokenId ? myOwnedSet.has(selectedTokenId) : false}
                budokaiInfo={budokaiInfo}
                zeroBalance={zeroBalance}
                open={isDetailOpen}
                onClose={closeDetail}
                onActionSuccess={handleRefresh}
            />

            <BracketReveal open={isBracketOpen} onClose={closeBracket} budokaiId={bracketBudokaiId} />
        </div>
    );
}

function HeroBanner() {
    const [failed, setFailed] = useState(false);
    if (failed) {
        // Graceful fallback if the hero image is missing — keeps layout clean.
        return (
            <div className="relative flex w-full items-center justify-center bg-gradient-to-b from-indigo-950 via-black to-black py-16 pt-24">
                <div className="text-center">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-fuchsia-500">Adrian Zero presents</p>
                    <h1 className="mt-2 text-5xl font-black tracking-wider text-yellow-400 sm:text-7xl">
                        600 SAMURAI
                    </h1>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-zinc-600">
                        Tenkaichi Budokai · Tournament Saga
                    </p>
                </div>
            </div>
        );
    }
    return (
        <div className="relative w-full overflow-hidden bg-black">
            <div className="mx-auto max-w-5xl">
                <img
                    src="/images/budokai-hero.gif"
                    alt="600 Samurai Budokai"
                    className="block h-auto w-full"
                    style={{imageRendering: 'pixelated'}}
                    onError={() => setFailed(true)}
                />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black" />
        </div>
    );
}

function FilterTab({label, count, active, onClick, hideCount}: {label: string; count: number; active: boolean; onClick: () => void; hideCount?: boolean}) {
    return (
        <button
            onClick={onClick}
            className={`rounded px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                active ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
        >
            {label}{hideCount ? '' : <span className="text-[9px] opacity-60"> ({count})</span>}
        </button>
    );
}

/**
 * MINE tab — three buckets, visually distinct, scannable at a glance.
 *   1. IN THE DOJO   — tokens entered in current Budokai, solid yellow border + glow.
 *   2. READY         — owned, not entered, not KO'd; dashed border. (Fresh meat.)
 *   3. KNOCKED OUT   — owned + KO'd; grayscale.
 */
function MineSections({
    inIds,
    readyIds,
    koIds,
    states,
    enteredSet,
    myOwnedSet,
    multiSelectMode,
    selectedIds,
    onCardClick,
    ownedCount,
}: {
    inIds: number[];
    readyIds: number[];
    koIds: number[];
    states: Map<number, {senryoku: number; isKnockedOut: boolean; honor: number}>;
    enteredSet: Set<number>;
    myOwnedSet: Set<number>;
    multiSelectMode: boolean;
    selectedIds: Set<number>;
    onCardClick: (tokenId: number) => void;
    ownedCount: number;
}) {
    if (ownedCount === 0) {
        return (
            <div className="flex h-40 items-center justify-center rounded border border-dashed border-zinc-800 text-[11px] text-zinc-600">
                You don&apos;t own any SAMURAIzero.
            </div>
        );
    }
    return (
        <div className="space-y-6">
            <SectionBlock
                title="In the Dojo"
                kanji="出場"
                sub="Committed. Awaiting the bracket."
                color="text-yellow-400"
                count={inIds.length}
                emptyMsg="None of yours are in yet. Enter to secure bracket slots."
            >
                <CardGrid
                    ids={inIds}
                    states={states}
                    enteredSet={enteredSet}
                    myOwnedSet={myOwnedSet}
                    multiSelectMode={multiSelectMode}
                    selectedIds={selectedIds}
                    onCardClick={onCardClick}
                />
            </SectionBlock>

            <SectionBlock
                title="Ready to Enter"
                kanji="待機"
                sub="Available. Pay the fee and lock them in."
                color="text-zinc-300"
                count={readyIds.length}
                emptyMsg="No available samurai to enter."
            >
                <CardGrid
                    ids={readyIds}
                    states={states}
                    enteredSet={enteredSet}
                    myOwnedSet={myOwnedSet}
                    multiSelectMode={multiSelectMode}
                    selectedIds={selectedIds}
                    onCardClick={onCardClick}
                />
            </SectionBlock>

            {koIds.length > 0 && (
                <SectionBlock
                    title="Knocked Out"
                    kanji="気絶"
                    sub="Revive with Senzu to re-enter."
                    color="text-red-400"
                    count={koIds.length}
                >
                    <CardGrid
                        ids={koIds}
                        states={states}
                        enteredSet={enteredSet}
                        myOwnedSet={myOwnedSet}
                        multiSelectMode={multiSelectMode}
                        selectedIds={selectedIds}
                        onCardClick={onCardClick}
                    />
                </SectionBlock>
            )}
        </div>
    );
}

/**
 * KO'D tab — "YOURS" first, then "COMMUNITY" (everyone else KO'd). Creates a revive market:
 * cheap KO'd tokens can be bought on OpenSea, revived, and re-entered in the next Budokai.
 */
function KoSections({
    mineIds,
    communityIds,
    states,
    enteredSet,
    myOwnedSet,
    onCardClick,
    multiSelectMode,
    selectedIds,
}: {
    mineIds: number[];
    communityIds: number[];
    states: Map<number, {senryoku: number; isKnockedOut: boolean; honor: number}>;
    enteredSet: Set<number>;
    myOwnedSet: Set<number>;
    onCardClick: (tokenId: number) => void;
    multiSelectMode: boolean;
    selectedIds: Set<number>;
}) {
    if (mineIds.length === 0 && communityIds.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center rounded border border-dashed border-zinc-800 text-[11px] text-zinc-600">
                No knocked-out samurai. The dojo rests.
            </div>
        );
    }
    return (
        <div className="space-y-6">
            <SectionBlock
                title="Yours"
                kanji="自軍"
                sub="Your downed samurai. Revive to re-enter."
                color="text-red-400"
                count={mineIds.length}
                emptyMsg="None of yours are down — for now."
            >
                <CardGrid
                    ids={mineIds}
                    states={states}
                    enteredSet={enteredSet}
                    myOwnedSet={myOwnedSet}
                    multiSelectMode={multiSelectMode}
                    selectedIds={selectedIds}
                    onCardClick={onCardClick}
                />
            </SectionBlock>

            <SectionBlock
                title="Community"
                kanji="衆生"
                sub="Available KO'd tokens across the dojo. Buy, revive, fight."
                color="text-zinc-400"
                count={communityIds.length}
                emptyMsg="No community KO'd tokens."
            >
                <CardGrid
                    ids={communityIds}
                    states={states}
                    enteredSet={enteredSet}
                    myOwnedSet={myOwnedSet}
                    multiSelectMode={multiSelectMode}
                    selectedIds={selectedIds}
                    onCardClick={onCardClick}
                />
            </SectionBlock>
        </div>
    );
}

function SectionBlock({
    title,
    kanji,
    sub,
    color,
    count,
    emptyMsg,
    children,
}: {
    title: string;
    kanji: string;
    sub: string;
    color: string;
    count: number;
    emptyMsg?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div className="mb-3 flex items-baseline gap-3">
                <span className={`text-[11px] font-bold uppercase tracking-[0.3em] ${color}`}>{title}</span>
                <span className="font-mono text-[10px] text-zinc-600">{kanji}</span>
                <span className="text-[9px] tracking-wider text-zinc-600">{sub}</span>
                <div className="h-px flex-1 bg-zinc-900" />
                <span className="font-mono text-[9px] text-zinc-500">({count})</span>
            </div>
            {count === 0 && emptyMsg ? (
                <div className="flex h-20 items-center justify-center rounded border border-dashed border-zinc-900 text-[10px] text-zinc-700">
                    {emptyMsg}
                </div>
            ) : (
                children
            )}
        </div>
    );
}

function CardGrid({
    ids,
    states,
    enteredSet,
    myOwnedSet,
    multiSelectMode,
    selectedIds,
    onCardClick,
}: {
    ids: number[];
    states: Map<number, {senryoku: number; isKnockedOut: boolean; honor: number}>;
    enteredSet: Set<number>;
    myOwnedSet: Set<number>;
    multiSelectMode: boolean;
    selectedIds: Set<number>;
    onCardClick: (tokenId: number) => void;
}) {
    if (ids.length === 0) return null;
    return (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-7">
            {ids.map((tokenId) => {
                const state = states.get(tokenId);
                return (
                    <SamuraiCard
                        key={tokenId}
                        tokenId={tokenId}
                        senryoku={state?.senryoku ?? 0}
                        honor={state?.honor ?? 0}
                        isEntered={enteredSet.has(tokenId)}
                        isKnockedOut={state?.isKnockedOut ?? false}
                        isMine={myOwnedSet.has(tokenId)}
                        onClick={() => onCardClick(tokenId)}
                        multiSelectMode={multiSelectMode}
                        isSelected={selectedIds.has(tokenId)}
                    />
                );
            })}
        </div>
    );
}
