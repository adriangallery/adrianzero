import {useMemo, useState} from 'react';
import {useReadContract} from 'wagmi';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI, BUDOKAI_STATUS} from '@/lib/web3/abi';
import {useZeroBalance} from '@/features/zeromovies/hooks/useZeroBalance';
import {useBudokaiEntries, useBudokaiInfo, useCurrentBudokaiId} from '../hooks/useDojoContract';
import {useMySamurai} from '../hooks/useMySamurai';
import {useSamuraiState} from '../hooks/useSamuraiState';
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

    const {selectedTokenId, isDetailOpen, isBracketOpen, bracketBudokaiId, selectSamurai, closeDetail, openBracket, closeBracket} =
        useDojoStore();

    const [filter, setFilter] = useState<FilterMode>('entrants');

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

    return (
        <div className="min-h-screen bg-black">
            <div className="mx-auto max-w-6xl px-4 pt-20 pb-6 sm:px-6 sm:pt-24">
                {/* Title */}
                <div className="mb-5 text-center">
                    <h1 className="text-2xl font-bold tracking-[0.3em] uppercase text-red-600 sm:text-3xl">
                        SamuraiDojo
                    </h1>
                    <p className="text-[9px] tracking-[0.3em] text-zinc-600 sm:text-[10px]">
                        Tenkaichi Budokai · SAMURAIzero Tournament Saga
                    </p>
                </div>

                <TournamentStats
                    budokaiId={currentBudokaiId}
                    info={budokaiInfo}
                    zeroBalance={zeroBalance}
                    totalBurned={totalBurned}
                />

                {/* Filter tabs */}
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

                    {budokaiInfo?.status === BUDOKAI_STATUS.Resolved && (
                        <button
                            onClick={() => openBracket(currentBudokaiId)}
                            className="rounded border border-red-600/40 bg-red-900/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-900/40"
                        >
                            Watch Bracket Replay
                        </button>
                    )}
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
                                    onClick={() => selectSamurai(tokenId)}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <ChampionsHall budokaiIds={[1, 2, 3]} />

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
