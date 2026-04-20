import {useEffect, useMemo, useState} from 'react';
import {useReadContract} from 'wagmi';
import {Loader2, Sword} from 'lucide-react';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI, BUDOKAI_STATUS} from '@/lib/web3/abi';
import {useZeroBalance} from '@/features/zeromovies/hooks/useZeroBalance';
import {useBudokaiEntries, useBudokaiInfo, useCurrentBudokaiId} from '../hooks/useDojoContract';
import {useMySamurai} from '../hooks/useMySamurai';
import {useSamuraiState} from '../hooks/useSamuraiState';
import {useEnterBudokaiBatch} from '../hooks/useDojoActions';
import {ENTRY_FEE_ZERO} from '../types';
import {useDojoStore} from '../store/dojoStore';
import {SamuraiCard} from './SamuraiCard';
import {TournamentStats} from './TournamentStats';
import {SamuraiDetailModal} from './SamuraiDetailModal';
import {ChampionsHall} from './ChampionsHall';
import {BracketReveal} from './BracketReveal';

type FilterMode = 'entrants' | 'mine' | 'ko' | 'all';

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
        selectSamurai,
        closeDetail,
        openBracket,
        closeBracket,
    } = useDojoStore();

    const [filter, setFilter] = useState<FilterMode>('mine');

    // Figure out which tokenIds we need to display + batch-read state for them
    const visibleTokenIds = useMemo(() => {
        const set = new Set<number>();
        if (filter === 'entrants' || filter === 'ko' || filter === 'all') {
            for (const id of entries) set.add(id);
        }
        if (filter === 'mine' || filter === 'all') {
            for (const id of myTokenIds) set.add(id);
        }
        if (filter === 'ko' || filter === 'all') {
            for (const id of myTokenIds) set.add(id);
        }
        return Array.from(set).sort((a, b) => a - b);
    }, [filter, entries, myTokenIds]);

    const {states, refetch: refetchStates} = useSamuraiState(visibleTokenIds);

    const filteredTokenIds = useMemo(() => {
        if (filter === 'ko') {
            return visibleTokenIds.filter((id) => states.get(id)?.isKnockedOut);
        }
        return visibleTokenIds;
    }, [filter, visibleTokenIds, states]);

    const myOwnedSet = useMemo(() => new Set(myTokenIds), [myTokenIds]);
    const enteredSet = useMemo(() => new Set(entries), [entries]);

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
        <div className="min-h-screen bg-black">
            {/* Hero banner */}
            <HeroBanner />

            <div className="mx-auto max-w-6xl px-4 pt-6 pb-6 sm:px-6">
                <TournamentStats
                    budokaiId={currentBudokaiId}
                    info={budokaiInfo}
                    zeroBalance={zeroBalance}
                    totalBurned={totalBurned}
                />

                {/* Filter tabs + multi-select toggle */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-1 rounded border border-zinc-800 p-1">
                        <FilterTab label="Entrants" count={entries.length} active={filter === 'entrants'} onClick={() => setFilter('entrants')} />
                        <FilterTab label="Mine" count={myTokenIds.length} active={filter === 'mine'} onClick={() => setFilter('mine')} />
                        <FilterTab
                            label="KO'd"
                            count={myTokenIds.filter((id) => states.get(id)?.isKnockedOut).length}
                            active={filter === 'ko'}
                            onClick={() => setFilter('ko')}
                        />
                    </div>

                    <div className="flex items-center gap-2">
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

                {/* Grid */}
                {filteredTokenIds.length === 0 ? (
                    <div className="flex h-40 items-center justify-center rounded border border-dashed border-zinc-800 text-[11px] text-zinc-600">
                        {filter === 'mine' && myTokenIds.length === 0 && 'You don\'t own any SAMURAIzero.'}
                        {filter === 'entrants' && entries.length === 0 && 'No entries yet. Be the first to enter!'}
                        {filter === 'ko' && 'No KO\'d samurai in your collection.'}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-7">
                        {filteredTokenIds.map((tokenId) => {
                            const state = states.get(tokenId);
                            return (
                                <SamuraiCard
                                    key={tokenId}
                                    tokenId={tokenId}
                                    senryoku={state?.senryoku ?? 0}
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

            <ChampionsHall budokaiIds={[1, 2, 3]} />

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
        <div className="relative w-full overflow-hidden">
            <img
                src="/images/budokai-hero.gif"
                alt="600 Samurai Budokai"
                className="w-full object-cover"
                style={{imageRendering: 'pixelated', maxHeight: '60vh'}}
                onError={() => setFailed(true)}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
        </div>
    );
}

function FilterTab({label, count, active, onClick}: {label: string; count: number; active: boolean; onClick: () => void}) {
    return (
        <button
            onClick={onClick}
            className={`rounded px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                active ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
        >
            {label} <span className="text-[9px] opacity-60">({count})</span>
        </button>
    );
}
