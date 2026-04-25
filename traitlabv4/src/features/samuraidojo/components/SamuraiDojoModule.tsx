import {useEffect, useMemo, useState} from 'react';
import {useReadContract} from 'wagmi';
import {base} from 'wagmi/chains';
import {Loader2, Sword} from 'lucide-react';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI, BUDOKAI_STATUS} from '@/lib/web3/abi';
import {useZeroBalance} from '@/features/zeromovies/hooks/useZeroBalance';
import {useBudokaiEntries, useBudokaiInfo, useCurrentBudokaiId} from '../hooks/useDojoContract';
import {useMySamurai} from '../hooks/useMySamurai';
import {useSamuraiRoster} from '../hooks/useSamuraiRoster';
import {useSamuraiState} from '../hooks/useSamuraiState';
import {useCivilianPreview} from '../hooks/useCivilianPreview';
import {useBudokaiCounters, civilianSlotsAvailable} from '../hooks/useBudokaiCounters';
import {useEnterBudokaiBatch} from '../hooks/useDojoActions';
import {ENTRY_FEE_ZERO} from '../types';
import {useDojoStore} from '../store/dojoStore';
import {useBudokaiTheme, themeAccent, iconVariantSymbol} from '../hooks/useBudokaiTheme';
import {useBudokaiTrophy, trophyLabel, trophyEmoji, TROPHY_TYPE} from '../hooks/useBudokaiTrophy';
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
    const {owned: myTokenIds, civilians: myCivilianIds, refetch: refetchOwned} = useMySamurai();
    const {counters: budokaiCounters, refetch: refetchCounters} = useBudokaiCounters(
        currentBudokaiId !== null ? BigInt(currentBudokaiId) : null,
    );
    const {theme: budokaiTheme} = useBudokaiTheme(
        currentBudokaiId !== null ? BigInt(currentBudokaiId) : null,
    );
    const {trophy: budokaiTrophy} = useBudokaiTrophy(
        currentBudokaiId !== null ? BigInt(currentBudokaiId) : null,
    );
    const {balance: zeroBalance} = useZeroBalance();
    const {data: totalBurnedRaw} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_DOJO_ABI,
        functionName: 'getTotalBurned',
        chainId: base.id,
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
            for (const id of myCivilianIds) set.add(id);
        }
        if (filter === 'ko' || filter === 'all') {
            for (const id of myTokenIds) set.add(id);
            for (const id of myCivilianIds) set.add(id);
            for (const id of roster) set.add(id); // community KO pool
        }
        return Array.from(set).sort((a, b) => a - b);
    }, [filter, entries, myTokenIds, myCivilianIds, roster]);

    const {states, refetch: refetchStates} = useSamuraiState(visibleTokenIds);

    // RECLASSIFY samurai vs civilian using ON-CHAIN senryoku (source of truth), not the roster.
    // The BatchDeployer tag list can lag/be incomplete (e.g. post-migration mints not tagged in
    // both contracts), but the senryoku slot in storage is canonical: samurai SR is loaded into
    // the 1-100 range at mint time, civilian SR is derived 1-15 at first entry.
    //   sr > 15            → unambiguous samurai (civ ceiling is 15)
    //   sr in [1,15]       → civilian who already entered (SR persisted)
    //   sr == 0 + roster   → samurai with unloaded SR (rare edge, treat as samurai)
    //   sr == 0, no roster → fresh civilian (use derived preview)
    const allOwnedIds = useMemo(
        () => [...new Set([...myTokenIds, ...myCivilianIds])].sort((a, b) => a - b),
        [myTokenIds, myCivilianIds],
    );
    const samuraiOwnedIds = useMemo(
        () =>
            allOwnedIds.filter((id) => {
                const sr = states.get(id)?.senryoku ?? 0;
                if (sr > 15) return true;
                if (sr === 0 && roster.has(id)) return true;
                return false;
            }),
        [allOwnedIds, states, roster],
    );
    const civilianOwnedIds = useMemo(() => {
        const samSet = new Set(samuraiOwnedIds);
        return allOwnedIds.filter((id) => !samSet.has(id));
    }, [allOwnedIds, samuraiOwnedIds]);

    // Preview SR for civilians (keccak-derived 1-15) so MINE can show what they'd fight with.
    // Only ask for tokens with sr==0 — others have a real on-chain SR already.
    const civilNeedsPreview = useMemo(
        () => civilianOwnedIds.filter((id) => (states.get(id)?.senryoku ?? 0) === 0),
        [civilianOwnedIds, states],
    );
    const {previews: civilianPreviews} = useCivilianPreview(civilNeedsPreview);

    const myOwnedSet = useMemo(() => new Set(allOwnedIds), [allOwnedIds]);
    const samuraiOwnedSet = useMemo(() => new Set(samuraiOwnedIds), [samuraiOwnedIds]);
    const civilianOwnedSet = useMemo(() => new Set(civilianOwnedIds), [civilianOwnedIds]);
    const enteredSet = useMemo(() => new Set(entries), [entries]);

    // MINE tab sub-buckets — samurai (now derived from on-chain SR).
    const mineInIds = useMemo(() => samuraiOwnedIds.filter((id) => enteredSet.has(id) && !states.get(id)?.isKnockedOut), [samuraiOwnedIds, enteredSet, states]);
    const mineReadyIds = useMemo(() => samuraiOwnedIds.filter((id) => !enteredSet.has(id) && !states.get(id)?.isKnockedOut), [samuraiOwnedIds, enteredSet, states]);
    const mineKoIds = useMemo(() => samuraiOwnedIds.filter((id) => states.get(id)?.isKnockedOut), [samuraiOwnedIds, states]);

    // MINE tab — civilians.
    const civilInIds = useMemo(() => civilianOwnedIds.filter((id) => enteredSet.has(id) && !states.get(id)?.isKnockedOut), [civilianOwnedIds, enteredSet, states]);
    const civilReadyIds = useMemo(() => civilianOwnedIds.filter((id) => !enteredSet.has(id) && !states.get(id)?.isKnockedOut), [civilianOwnedIds, enteredSet, states]);
    const civilKoIds = useMemo(() => civilianOwnedIds.filter((id) => states.get(id)?.isKnockedOut), [civilianOwnedIds, states]);

    const civilSlotsAvail = civilianSlotsAvailable(budokaiCounters);

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
        refetchCounters();
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
        const samuraiToSelect = mineReadyIds;
        // Civilians need slot availability — clamp to ratio gate.
        const civilToSelect = civilReadyIds.slice(0, civilSlotsAvail);
        const all = [...samuraiToSelect, ...civilToSelect];
        if (all.length === 0) return;
        selectMany(all, true);
    };

    const handleCardClick = (tokenId: number) => {
        if (multiSelectMode) {
            // Eligible: owned, not entered, not KO. Includes both samurai and civilians.
            if (!myOwnedSet.has(tokenId)) return;
            if (enteredSet.has(tokenId)) return;
            if (states.get(tokenId)?.isKnockedOut) return;
            // For civilians, only allow if there's a free ratio slot OR token already selected (deselect path).
            if (civilianOwnedSet.has(tokenId)) {
                const alreadySelected = selectedIds.has(tokenId);
                const civsSelected = Array.from(selectedIds).filter((id) => civilianOwnedSet.has(id)).length;
                if (!alreadySelected && civsSelected >= civilSlotsAvail) return;
            }
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
                {/* v6: event tagline + theme + trophy + honor tier banner */}
                {(budokaiTheme?.tagline || budokaiTrophy) && (
                    <EventBanner theme={budokaiTheme} trophy={budokaiTrophy} />
                )}

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
                        {filter === 'mine' && budokaiInfo?.status === BUDOKAI_STATUS.Open && (mineReadyIds.length + Math.min(civilReadyIds.length, civilSlotsAvail)) > 0 && !multiSelectMode && (
                            <button
                                onClick={() => {
                                    // Toggle multi-select AND preselect all READY tokens (samurai + civilians up to ratio cap).
                                    handleSelectAllReady();
                                }}
                                className="rounded border border-yellow-500/50 bg-yellow-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400 hover:bg-yellow-500/20"
                            >
                                <Sword className="mr-1 inline h-3 w-3" />
                                Enter all Ready ({mineReadyIds.length + Math.min(civilReadyIds.length, civilSlotsAvail)})
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
                        samuraiInIds={mineInIds}
                        samuraiReadyIds={mineReadyIds}
                        samuraiKoIds={mineKoIds}
                        civilInIds={civilInIds}
                        civilReadyIds={civilReadyIds}
                        civilKoIds={civilKoIds}
                        civilianPreviews={civilianPreviews}
                        civilSlotsAvail={civilSlotsAvail}
                        samuraiOwnedSet={samuraiOwnedSet}
                        states={states}
                        enteredSet={enteredSet}
                        myOwnedSet={myOwnedSet}
                        multiSelectMode={multiSelectMode}
                        selectedIds={selectedIds}
                        onCardClick={handleCardClick}
                        ownedCount={myTokenIds.length + myCivilianIds.length}
                    />
                ) : filter === 'ko' ? (
                    <KoSections
                        mineIds={koMineIds}
                        communityIds={koCommunityIds}
                        civilKoIds={civilKoIds}
                        civilianPreviews={civilianPreviews}
                        samuraiOwnedSet={samuraiOwnedSet}
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
                    <>
                        {budokaiCounters && budokaiCounters.civilianCount > 0 && (
                            <div className="mb-3 rounded border border-fuchsia-500/30 bg-fuchsia-500/5 px-3 py-2 text-[10px] uppercase tracking-wider text-fuchsia-300">
                                <span className="font-bold">{budokaiCounters.samuraiCount}</span> samurai ·{' '}
                                <span className="font-bold">{budokaiCounters.civilianCount}</span> civilian ·{' '}
                                <span className="text-fuchsia-200/70">ratio gate 10:1</span>
                            </div>
                        )}
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-7">
                            {entrantsIds.map((tokenId) => {
                                const state = states.get(tokenId);
                                const sr = state?.senryoku ?? 0;
                                // Entrants always have SR>0 (samurai pre-loaded, civilians persisted on entry).
                                const isSam = sr > 15 || (sr === 0 && samuraiOwnedSet.has(tokenId));
                                return (
                                    <SamuraiCard
                                        key={tokenId}
                                        tokenId={tokenId}
                                        senryoku={state?.senryoku ?? 0}
                                        honor={state?.honor ?? 0}
                                        isEntered={enteredSet.has(tokenId)}
                                        isKnockedOut={state?.isKnockedOut ?? false}
                                        isMine={myOwnedSet.has(tokenId)}
                                        isSamurai={isSam}
                                        onClick={() => handleCardClick(tokenId)}
                                        multiSelectMode={multiSelectMode}
                                        isSelected={selectedIds.has(tokenId)}
                                    />
                                );
                            })}
                        </div>
                    </>
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
                senryoku={(() => {
                    if (!selectedTokenId) return 0;
                    const onChain = selectedState?.senryoku ?? 0;
                    if (onChain > 0) return onChain;
                    // Civilian preview before first entry.
                    if (civilianOwnedSet.has(selectedTokenId)) {
                        return civilianPreviews.get(selectedTokenId) ?? 0;
                    }
                    return 0;
                })()}
                honor={selectedState?.honor ?? 0}
                isSamurai={(() => {
                    if (!selectedTokenId) return true;
                    const sr = selectedState?.senryoku ?? 0;
                    if (sr > 15) return true;
                    if (sr > 0) return false; // 1-15 persisted civilian
                    return samuraiOwnedSet.has(selectedTokenId);
                })()}
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

/**
 * v6 EventBanner — tagline + theme + trophy tier + honor at stake.
 * Reads getBudokaiTheme + getBudokaiTrophy. Shown only when at least one is meaningful.
 */
function EventBanner({theme, trophy}: {theme: ReturnType<typeof useBudokaiTheme>['theme']; trophy: ReturnType<typeof useBudokaiTrophy>['trophy']}) {
    const accent = themeAccent(theme?.themeColor);
    const icon = iconVariantSymbol(theme?.iconVariant);
    const tType = trophy?.trophyType;

    // Honor tier in play: Golden = +10/+5/+2, Metal/Custom = +3/+1/0, None = 0
    let honorLine: string | null = null;
    if (tType === TROPHY_TYPE.GoldenShuriken) {
        honorLine = 'Honor at stake: champion +10 · runner-up +5 · semis +2';
    } else if (tType === TROPHY_TYPE.MetalShuriken || tType === TROPHY_TYPE.Custom) {
        honorLine = 'Honor at stake: champion +3 · runner-up +1';
    }

    if (!theme?.tagline && tType === undefined) return null;

    return (
        <div className={`mb-4 rounded border ${accent.border} ${accent.bg} ${theme?.isSpecialEvent ? accent.glow : ''} px-4 py-3`}>
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-2xl leading-none">{icon}</span>
                <div className="flex-1 min-w-0">
                    {theme?.tagline && (
                        <p className={`text-sm font-bold tracking-wide ${accent.text}`}>{theme.tagline}</p>
                    )}
                    {honorLine && (
                        <p className="mt-0.5 text-[9px] uppercase tracking-wider text-zinc-500">{honorLine}</p>
                    )}
                </div>
                {tType !== undefined && tType !== TROPHY_TYPE.None && (
                    <div className={`rounded border ${accent.border} bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${accent.text}`}>
                        <span className="mr-1">{trophyEmoji(tType)}</span>
                        {trophyLabel(tType)}
                    </div>
                )}
                {theme?.isSpecialEvent && (
                    <span className="rounded bg-fuchsia-600/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white">Special</span>
                )}
            </div>
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
 * MINE tab — buckets split by samurai vs civilian (v6).
 *   Samurai:   IN THE DOJO (yellow), READY (dashed zinc), KO (grayscale)
 *   Civilian:  IN THE DOJO (fuchsia), READY (dashed fuchsia + ratio gate), KO (grayscale)
 */
function MineSections({
    samuraiInIds,
    samuraiReadyIds,
    samuraiKoIds,
    civilInIds,
    civilReadyIds,
    civilKoIds,
    civilianPreviews,
    civilSlotsAvail,
    samuraiOwnedSet,
    states,
    enteredSet,
    myOwnedSet,
    multiSelectMode,
    selectedIds,
    onCardClick,
    ownedCount,
}: {
    samuraiInIds: number[];
    samuraiReadyIds: number[];
    samuraiKoIds: number[];
    civilInIds: number[];
    civilReadyIds: number[];
    civilKoIds: number[];
    civilianPreviews: Map<number, number>;
    civilSlotsAvail: number;
    samuraiOwnedSet: Set<number>;
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
                You don&apos;t own any AdrianZERO.
            </div>
        );
    }
    const hasSamurai = samuraiInIds.length + samuraiReadyIds.length + samuraiKoIds.length > 0;
    const hasCivilians = civilInIds.length + civilReadyIds.length + civilKoIds.length > 0;
    return (
        <div className="space-y-8">
            {hasSamurai && (
                <div className="space-y-6">
                    <div className="flex items-baseline gap-3 border-b border-zinc-900 pb-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-yellow-500">Samurai</span>
                        <span className="font-mono text-[9px] text-zinc-700">侍</span>
                        <span className="text-[9px] tracking-wider text-zinc-700">Pre-loaded SR. Trained warriors.</span>
                    </div>
                    <SectionBlock
                        title="In the Dojo"
                        kanji="出場"
                        sub="Committed. Awaiting the bracket."
                        color="text-yellow-400"
                        count={samuraiInIds.length}
                        emptyMsg="None of yours are in yet. Enter to secure bracket slots."
                    >
                        <CardGrid ids={samuraiInIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} />
                    </SectionBlock>
                    <SectionBlock
                        title="Ready to Enter"
                        kanji="待機"
                        sub="Available. Pay the fee and lock them in."
                        color="text-zinc-300"
                        count={samuraiReadyIds.length}
                        emptyMsg="No available samurai to enter."
                    >
                        <CardGrid ids={samuraiReadyIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} />
                    </SectionBlock>
                    {samuraiKoIds.length > 0 && (
                        <SectionBlock title="Knocked Out" kanji="気絶" sub="Revive with Senzu to re-enter." color="text-red-400" count={samuraiKoIds.length}>
                            <CardGrid ids={samuraiKoIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} />
                        </SectionBlock>
                    )}
                </div>
            )}
            {hasCivilians && (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-baseline gap-3 border-b border-fuchsia-900/40 pb-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-fuchsia-400">Civilian</span>
                        <span className="font-mono text-[9px] text-fuchsia-700">民</span>
                        <span className="text-[9px] tracking-wider text-fuchsia-300/60">Regular AdrianZERO. Derived SR 1–15. Underdog mode.</span>
                        <div className="ml-auto rounded border border-fuchsia-500/40 bg-fuchsia-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-fuchsia-300">
                            {civilSlotsAvail > 0 ? `${civilSlotsAvail} slot${civilSlotsAvail === 1 ? '' : 's'} open` : 'no slots — need more samurai'}
                        </div>
                    </div>
                    <SectionBlock
                        title="In the Dojo"
                        kanji="出場"
                        sub="Civilians who made the cut."
                        color="text-fuchsia-400"
                        count={civilInIds.length}
                        emptyMsg="No civilians of yours are in yet."
                    >
                        <CardGrid ids={civilInIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} />
                    </SectionBlock>
                    <SectionBlock
                        title="Ready to Rise"
                        kanji="決起"
                        sub="Pay the fee, derive SR 1–15, fight the odds."
                        color="text-fuchsia-300"
                        count={civilReadyIds.length}
                        emptyMsg="No civilian AdrianZEROs available."
                    >
                        <CardGrid ids={civilReadyIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} />
                    </SectionBlock>
                    {civilKoIds.length > 0 && (
                        <SectionBlock title="Knocked Out" kanji="気絶" sub="Revive with Senzu (cost = SR × 10 ZERO)." color="text-red-400" count={civilKoIds.length}>
                            <CardGrid ids={civilKoIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} />
                        </SectionBlock>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * KO'D tab — "YOURS" first, then "COMMUNITY" (everyone else KO'd). Creates a revive market:
 * cheap KO'd tokens can be bought on OpenSea, revived, and re-entered in the next Budokai.
 * v6: civilian KO'd tokens shown in their own bucket (different revive cost — SR × 10 ZERO).
 */
function KoSections({
    mineIds,
    communityIds,
    civilKoIds,
    civilianPreviews,
    samuraiOwnedSet,
    states,
    enteredSet,
    myOwnedSet,
    onCardClick,
    multiSelectMode,
    selectedIds,
}: {
    mineIds: number[];
    communityIds: number[];
    civilKoIds: number[];
    civilianPreviews: Map<number, number>;
    samuraiOwnedSet: Set<number>;
    states: Map<number, {senryoku: number; isKnockedOut: boolean; honor: number}>;
    enteredSet: Set<number>;
    myOwnedSet: Set<number>;
    onCardClick: (tokenId: number) => void;
    multiSelectMode: boolean;
    selectedIds: Set<number>;
}) {
    if (mineIds.length === 0 && communityIds.length === 0 && civilKoIds.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center rounded border border-dashed border-zinc-800 text-[11px] text-zinc-600">
                No knocked-out warriors. The dojo rests.
            </div>
        );
    }
    return (
        <div className="space-y-6">
            <SectionBlock
                title="Your Samurai"
                kanji="自軍"
                sub="Your downed samurai. Revive to re-enter."
                color="text-red-400"
                count={mineIds.length}
                emptyMsg="None of yours are down — for now."
            >
                <CardGrid ids={mineIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} />
            </SectionBlock>

            {civilKoIds.length > 0 && (
                <SectionBlock
                    title="Your Civilians"
                    kanji="民兵"
                    sub="Civilian KO'd. Revive cheap (SR × 10 ZERO) for the next Budokai."
                    color="text-fuchsia-400"
                    count={civilKoIds.length}
                >
                    <CardGrid ids={civilKoIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} />
                </SectionBlock>
            )}

            <SectionBlock
                title="Community"
                kanji="衆生"
                sub="Available KO'd tokens across the dojo. Buy, revive, fight."
                color="text-zinc-400"
                count={communityIds.length}
                emptyMsg="No community KO'd tokens."
            >
                <CardGrid ids={communityIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} />
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
    samuraiOwnedSet,
    civilianPreviews,
    multiSelectMode,
    selectedIds,
    onCardClick,
}: {
    ids: number[];
    states: Map<number, {senryoku: number; isKnockedOut: boolean; honor: number}>;
    enteredSet: Set<number>;
    myOwnedSet: Set<number>;
    samuraiOwnedSet: Set<number>;
    civilianPreviews: Map<number, number>;
    multiSelectMode: boolean;
    selectedIds: Set<number>;
    onCardClick: (tokenId: number) => void;
}) {
    if (ids.length === 0) return null;
    return (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-7">
            {ids.map((tokenId) => {
                const state = states.get(tokenId);
                const onChainSR = state?.senryoku ?? 0;
                const isMine = myOwnedSet.has(tokenId);
                // SR-driven classifier (source of truth). Falls back to owned-set membership
                // when SR is 0 (token never entered) since the on-chain check is ambiguous.
                let isSamurai: boolean;
                if (onChainSR > 15) isSamurai = true;
                else if (onChainSR > 0) isSamurai = false; // 1-15 = persisted civilian
                else if (isMine) isSamurai = samuraiOwnedSet.has(tokenId);
                else isSamurai = false; // unknown community token with SR=0 — civilian preview
                // Civilian preview: use derived SR when on-chain is 0 (token hasn't entered yet).
                let displaySR = onChainSR;
                let isPreview = false;
                if (!isSamurai && onChainSR === 0) {
                    const preview = civilianPreviews.get(tokenId);
                    if (preview !== undefined && preview > 0) {
                        displaySR = preview;
                        isPreview = true;
                    }
                }
                return (
                    <SamuraiCard
                        key={tokenId}
                        tokenId={tokenId}
                        senryoku={displaySR}
                        honor={state?.honor ?? 0}
                        isEntered={enteredSet.has(tokenId)}
                        isKnockedOut={state?.isKnockedOut ?? false}
                        isMine={isMine}
                        isSamurai={isSamurai}
                        isCivilianPreview={isPreview}
                        onClick={() => onCardClick(tokenId)}
                        multiSelectMode={multiSelectMode}
                        isSelected={selectedIds.has(tokenId)}
                    />
                );
            })}
        </div>
    );
}
