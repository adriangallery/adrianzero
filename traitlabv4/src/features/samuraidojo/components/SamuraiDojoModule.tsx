import {useEffect, useMemo, useState} from 'react';
import {useAccount, useReadContract} from 'wagmi';
import {base} from 'wagmi/chains';
import {useConnectModal} from '@rainbow-me/rainbowkit';
import {Loader2, Sword, Eye, Wallet, ChevronDown, ChevronRight} from 'lucide-react';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI, BUDOKAI_STATUS} from '@/lib/web3/abi';
import {useZeroBalance} from '@/features/zeromovies/hooks/useZeroBalance';
import {dojoPollInterval, useBudokaiEntries, useBudokaiInfo, useCurrentBudokaiId} from '../hooks/useDojoContract';
import {useMySamurai} from '../hooks/useMySamurai';
import {useHasZeroNfts} from '../hooks/useHasZeroNfts';
import {useSamuraiRoster} from '../hooks/useSamuraiRoster';
import {useSamuraiState} from '../hooks/useSamuraiState';
import {useCivilianPreview} from '../hooks/useCivilianPreview';
import {useBudokaiCounters, civilianSlotsForWallet} from '../hooks/useBudokaiCounters';
import {useWalletEntryCount} from '../hooks/useWalletEntryCount';
import {useEnterBudokaiBatch, useReviveSamuraiBatch} from '../hooks/useDojoActions';
import {ENTRY_FEE_ZERO, SENZU_REVIVE_PER_SR_ZERO} from '../types';
import {useDojoStore} from '../store/dojoStore';
import {useBudokaiTheme, themeAccent, iconVariantSymbol} from '../hooks/useBudokaiTheme';
import {useBudokaiTrophy, trophyLabel, trophyEmoji, TROPHY_TYPE} from '../hooks/useBudokaiTrophy';
import {useMoviePrize} from '../hooks/useExtraPrizes';
import {SamuraiCard} from './SamuraiCard';
import {TournamentStats} from './TournamentStats';
import {SamuraiDetailModal} from './SamuraiDetailModal';
import {CivilianEntryDialog} from './CivilianEntryDialog';
import {useCivilianEntryFlow} from '../hooks/useCivilianEntryFlow';
import {ChampionsHall} from './ChampionsHall';
import {BracketReveal} from './BracketReveal';
import {PrizeShowcase} from './PrizeShowcase';
import {MoviePrizeBanner} from './MoviePrizeBanner';
import {BudokaiOnboarding} from './BudokaiOnboarding';
import {PartnerSkinsSection} from './PartnerSkinsSection';
import {useEntrantSkins, type EntrantSkinOverride} from '../hooks/useEntrantSkins';
import {usePartnerSkins} from '../hooks/usePartnerSkins';
import {useMyPartnerEntries} from '../hooks/useMyPartnerEntries';

type FilterMode = 'entrants' | 'mine' | 'ko' | 'hall' | 'all';

export function SamuraiDojoModule() {
    const civilianFlow = useCivilianEntryFlow();
    const {currentBudokaiId, refetch: refetchCurrent} = useCurrentBudokaiId();
    const {info: budokaiInfo, refetch: refetchInfo} = useBudokaiInfo(currentBudokaiId);

    // Adaptive polling — Resolved Budokais are frozen on-chain so polling burns RPC for nothing.
    // Resolving polls fast (about to flip). Other states use the per-hook default.
    const fastPoll = dojoPollInterval(budokaiInfo?.status, 15_000);
    const slowPoll = dojoPollInterval(budokaiInfo?.status, 30_000);

    const {entries, refetch: refetchEntries} = useBudokaiEntries(currentBudokaiId, fastPoll);
    const {owned: myTokenIds, civilians: myCivilianIds, refetch: refetchOwned} = useMySamurai();
    const {hasAny: hasZeroNfts, isLoading: nftsLoading, refetch: refetchHasNfts} = useHasZeroNfts();
    const {address} = useAccount();
    const {counters: budokaiCounters, refetch: refetchCounters} = useBudokaiCounters(
        currentBudokaiId !== null ? BigInt(currentBudokaiId) : null,
        slowPoll,
    );
    const {gate: walletGate, refetch: refetchWalletGate} = useWalletEntryCount(
        currentBudokaiId !== null ? BigInt(currentBudokaiId) : null,
        budokaiCounters,
        slowPoll,
    );
    const {theme: budokaiTheme} = useBudokaiTheme(
        currentBudokaiId !== null ? BigInt(currentBudokaiId) : null,
    );
    const {trophy: budokaiTrophy} = useBudokaiTrophy(
        currentBudokaiId !== null ? BigInt(currentBudokaiId) : null,
    );
    const {moviePrize} = useMoviePrize(
        currentBudokaiId !== null ? BigInt(currentBudokaiId) : null,
    );
    const {balance: zeroBalance} = useZeroBalance();
    const {data: totalBurnedRaw} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_DOJO_ABI,
        functionName: 'getTotalBurned',
        chainId: base.id,
        query: {refetchInterval: slowPoll, refetchOnWindowFocus: true},
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
    // Pending multi-action triggered by the PrimaryActionBar when it auto-switches tabs.
    // Resolved by a useEffect once `filter` matches the action's target tab — without this
    // intermediate, the [filter]-change effect below would wipe a freshly-populated selection.
    const [pendingMultiAction, setPendingMultiAction] = useState<null | 'enterAll' | 'reviveAll'>(null);
    const {roster} = useSamuraiRoster();

    // Which tokenIds do we need state for?
    //   entrants  → current Budokai entries
    //   mine      → my tokens (to classify into IN / READY / KO)
    //   ko        → my tokens + the FULL roster (to show community KO'd too)
    //   hall      → no grid; but still load state for the selected token so the detail modal
    //               has fresh SR + honor when opened from a podium row.
    const visibleTokenIds = useMemo(() => {
        const set = new Set<number>();
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
        // Always include the currently-selected token (for the detail modal opened from any tab,
        // including Hall of Fame which would otherwise have visibleTokenIds === []).
        if (selectedTokenId) set.add(selectedTokenId);
        return Array.from(set).sort((a, b) => a - b);
    }, [filter, entries, myTokenIds, myCivilianIds, roster, selectedTokenId]);

    const {states, refetch: refetchStates} = useSamuraiState(visibleTokenIds, slowPoll);

    // Roster is the source of truth for samurai vs civilian classification (user mental model).
    // Some non-roster AdrianZEROs have "stale senryoku" stored on-chain from legacy mint scripts
    // (e.g. tokens with tag "ZEROS" that got SR populated). We ignore that stored SR for owned
    // tokens — civilians always show derived SR (1-15) from previewCivilianSenryoku.
    // Note: the contract still classifies on entry by `senryoku[id] > 0`, so a civilian with
    // stale stored SR will end up entering as samurai with that SR. That's a contract-level
    // artifact; surfaced via warning below.
    const samuraiOwnedIds = myTokenIds; // already roster-filtered by useMySamurai
    const civilianOwnedIds = myCivilianIds; // owned but not in roster

    const {previews: civilianPreviews} = useCivilianPreview(civilianOwnedIds);

    // Cosmetic skin overrides for synthetic civilian tokenIds (≥ 1_000_001).
    // The on-chain entries have no AdrianLAB render — without this map they
    // show up as blank silhouettes. We poll the public skin map every 30s
    // for the active Budokai.
    const baseEntrantSkins = useEntrantSkins(
        currentBudokaiId !== null ? BigInt(currentBudokaiId) : null,
        typeof slowPoll === 'number' ? slowPoll : 30_000,
    );

    // v11: discover the user's partner-NFT fighters in the active Budokai.
    // The synthetic id is stable per (contract, tokenId), and getEntryOwner
    // tells us whether the connected wallet locked that fighter for this
    // tournament. Honor + KO + senryoku follow the synthetic across Budokais.
    const {skins: ownedPartnerSkins} = usePartnerSkins(address?.toLowerCase());
    const myPartnerEntries = useMyPartnerEntries(
        currentBudokaiId,
        ownedPartnerSkins,
        address,
    );
    // Merge any locally-known partner skin URLs into the entrantSkins map so
    // cards/modal hit the partner image even when the off-chain intent POST
    // hasn't landed yet (e.g. user entered via direct contract call).
    const entrantSkins = useMemo(() => {
        const merged = new Map(baseEntrantSkins);
        for (const e of myPartnerEntries) {
            if (!merged.has(e.syntheticId) && e.skin.imageUrl) {
                merged.set(e.syntheticId, {
                    imageUrl: e.skin.imageUrl,
                    name: e.skin.name,
                });
            }
        }
        return merged;
    }, [baseEntrantSkins, myPartnerEntries]);
    const myPartnerEntryIds = useMemo(
        () => myPartnerEntries.map((e) => e.syntheticId),
        [myPartnerEntries],
    );

    const myOwnedSet = useMemo(
        () => new Set([...samuraiOwnedIds, ...civilianOwnedIds, ...myPartnerEntryIds]),
        [samuraiOwnedIds, civilianOwnedIds, myPartnerEntryIds],
    );
    const samuraiOwnedSet = useMemo(() => new Set(samuraiOwnedIds), [samuraiOwnedIds]);
    const civilianOwnedSet = useMemo(() => new Set(civilianOwnedIds), [civilianOwnedIds]);
    const enteredSet = useMemo(() => new Set(entries), [entries]);

    // MINE tab sub-buckets — samurai.
    const mineInIds = useMemo(() => samuraiOwnedIds.filter((id) => enteredSet.has(id) && !states.get(id)?.isKnockedOut), [samuraiOwnedIds, enteredSet, states]);
    const mineReadyIds = useMemo(() => samuraiOwnedIds.filter((id) => !enteredSet.has(id) && !states.get(id)?.isKnockedOut), [samuraiOwnedIds, enteredSet, states]);
    const mineKoIds = useMemo(() => samuraiOwnedIds.filter((id) => states.get(id)?.isKnockedOut), [samuraiOwnedIds, states]);

    // MINE tab — civilians.
    const civilInIds = useMemo(() => civilianOwnedIds.filter((id) => enteredSet.has(id) && !states.get(id)?.isKnockedOut), [civilianOwnedIds, enteredSet, states]);
    const civilReadyIds = useMemo(() => civilianOwnedIds.filter((id) => !enteredSet.has(id) && !states.get(id)?.isKnockedOut), [civilianOwnedIds, enteredSet, states]);
    const civilKoIds = useMemo(() => civilianOwnedIds.filter((id) => states.get(id)?.isKnockedOut), [civilianOwnedIds, states]);

    // Civilians with STALE stored SR (>15, not derived). Surfaced as warning so users know
    // these will enter as samurai-with-that-SR despite their roster status.
    const civilStaleSrIds = useMemo(
        () => civilianOwnedIds.filter((id) => (states.get(id)?.senryoku ?? 0) > 15),
        [civilianOwnedIds, states],
    );

    // v8: civilian slot is per-wallet — 1 slot, consumed once you have a civilian IN.
    const civilSlotsAvail = civilianSlotsForWallet(civilInIds.length);

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
        refetchWalletGate();
    };

    const selectedState = selectedTokenId ? states.get(selectedTokenId) : undefined;

    // Multi-select kind: derived from active filter. KO'd tab → revive batch; everywhere else → entry batch.
    const multiSelectKind: 'enter' | 'revive' = filter === 'ko' ? 'revive' : 'enter';

    // Batch entry
    const {enterBatch, isPending: isBatchPending, isConfirming: isBatchConfirming, isConfirmed: isBatchConfirmed, reset: resetBatch} =
        useEnterBudokaiBatch();
    const isBatchBusy = isBatchPending || isBatchConfirming;

    // Batch revive (v6 reviveSamuraiBatch — single tx, fee = Σ sr × 10 ZERO)
    const {reviveBatch, isPending: isRevivePending, isConfirming: isReviveConfirming, isConfirmed: isReviveConfirmed, reset: resetRevive} =
        useReviveSamuraiBatch();
    const isReviveBusy = isRevivePending || isReviveConfirming;

    useEffect(() => {
        if (isBatchConfirmed) {
            clearSelection();
            toggleMultiSelectMode(); // exit multi-select
            handleRefresh();
            resetBatch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBatchConfirmed]);

    useEffect(() => {
        if (isReviveConfirmed) {
            clearSelection();
            toggleMultiSelectMode();
            handleRefresh();
            resetRevive();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReviveConfirmed]);

    const selectedCount = selectedIds.size;
    // v6: per-Budokai entry fee. freeEntry=true → 0 per token; otherwise on-chain entryFee in wei → ZERO units.
    const perEntryFeeZero = budokaiCounters?.freeEntry
        ? 0
        : budokaiCounters && budokaiCounters.entryFee > 0n
            ? Number(budokaiCounters.entryFee / 10n ** 18n)
            : ENTRY_FEE_ZERO;
    const selectedTotalFee = selectedCount * perEntryFeeZero;
    const insufficientBatchBalance = zeroBalance < selectedTotalFee;
    // v6 per-wallet cap: contract reverts if entriesByWallet + new entries > cap. Mirror it client-side.
    const walletCapExceeded = walletGate.cap > 0 && selectedCount > walletGate.remaining;

    // Revive total: sum of (senryoku × 10) across selected. Computed live as user toggles.
    // Tokens missing senryoku in `states` (shouldn't happen for KO'd, since SR is set on entry)
    // contribute 0 — will revert on-chain via LEGACY_SENZU_FEE path if it slips through.
    const selectedReviveTotal = useMemo(() => {
        let total = 0;
        for (const id of selectedIds) {
            const sr = states.get(id)?.senryoku ?? 0;
            total += sr * SENZU_REVIVE_PER_SR_ZERO;
        }
        return total;
    }, [selectedIds, states]);
    const insufficientReviveBalance = zeroBalance < selectedReviveTotal;

    const handleSelectAllReady = () => {
        const samuraiToSelect = mineReadyIds;
        // v8: civilian slot is per-wallet, so clamp at most 1 civilian regardless of how many are ready.
        const civilToSelect = civilReadyIds.slice(0, civilSlotsAvail);
        let all = [...samuraiToSelect, ...civilToSelect];
        // Clamp to per-wallet cap (samurai first, then civilian).
        if (walletGate.cap > 0 && all.length > walletGate.remaining) {
            all = all.slice(0, walletGate.remaining);
        }
        if (all.length === 0) return;
        selectMany(all, true);
    };

    // Preselect all KO'd tokens the user owns (samurai + civilian). Used by "Revive all yours" CTA.
    const handleSelectAllKo = () => {
        const all = [...mineKoIds, ...civilKoIds];
        if (all.length === 0) return;
        selectMany(all, true);
    };

    const handleCardClick = (tokenId: number) => {
        if (multiSelectMode) {
            if (multiSelectKind === 'revive') {
                // Revive eligibility: owned + KO'd in current Budokai. Community KO'd is read-only.
                if (!myOwnedSet.has(tokenId)) return;
                if (!states.get(tokenId)?.isKnockedOut) return;
                toggleId(tokenId);
                return;
            }
            // Entry eligibility: owned, not entered, not KO. Includes both samurai and civilians.
            if (!myOwnedSet.has(tokenId)) return;
            if (enteredSet.has(tokenId)) return;
            if (states.get(tokenId)?.isKnockedOut) return;
            // v8: civilians are 1-per-wallet. Block selecting a 2nd civilian (allow deselect of current pick).
            if (civilianOwnedSet.has(tokenId)) {
                const alreadySelected = selectedIds.has(tokenId);
                const civsSelected = Array.from(selectedIds).filter((id) => civilianOwnedSet.has(id)).length;
                if (!alreadySelected && civsSelected >= civilSlotsAvail) return;
            }
            // v6 per-wallet cap: don't allow selecting beyond remaining slots (keep deselect path open).
            if (!selectedIds.has(tokenId) && walletGate.cap > 0 && selectedIds.size >= walletGate.remaining) return;
            toggleId(tokenId);
        } else {
            selectSamurai(tokenId);
        }
    };

    // When the user switches tabs, the previous selection is no longer meaningful (entry vs revive
    // pools are different). Drop selection + exit multi-select on tab change. Skip when a
    // PrimaryActionBar-initiated tab switch is in flight (pendingMultiAction != null) — that
    // case is auto-switching us into a tab that's about to receive a fresh selection, and we
    // don't want to wipe it before it lands.
    useEffect(() => {
        if (pendingMultiAction !== null) return;
        if (multiSelectMode) {
            clearSelection();
            toggleMultiSelectMode();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    // Resolve a pending PrimaryActionBar action once the filter has caught up to its target tab.
    useEffect(() => {
        if (pendingMultiAction === 'enterAll' && filter === 'mine') {
            handleSelectAllReady();
            setPendingMultiAction(null);
        } else if (pendingMultiAction === 'reviveAll' && filter === 'ko') {
            handleSelectAllKo();
            setPendingMultiAction(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingMultiAction, filter]);

    // Onboarding gate — same layout for !connected and connected-but-empty so the entry
    // point is the same path. When connected, wait for the NFT lookup to settle before
    // deciding so users with holdings don't briefly flash the onboarding.
    if (!address) {
        return <BudokaiOnboarding onAfterMint={refetchHasNfts} />;
    }
    if (nftsLoading && !hasZeroNfts) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
            </div>
        );
    }
    if (!hasZeroNfts) {
        return <BudokaiOnboarding onAfterMint={refetchHasNfts} />;
    }

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

                {/* Premiere Budokai movie prize banner — shown only when the
                    current Budokai has a rank-1 ERC721 from AdrianLabCore as
                    extraPrize (i.e. a ZEROmovies S2 cover for the champion). */}
                {moviePrize && <MoviePrizeBanner prize={moviePrize} />}

                {/* Primary action — top-level CTA so the user lands on action, not on a wall of text. */}
                <PrimaryActionBar
                    isResolved={budokaiInfo?.status === BUDOKAI_STATUS.Resolved}
                    isOpen={budokaiInfo?.status === BUDOKAI_STATUS.Open}
                    readyCount={mineReadyIds.length + Math.min(civilReadyIds.length, civilSlotsAvail)}
                    koCount={mineKoIds.length + civilKoIds.length}
                    multiSelectMode={multiSelectMode}
                    onEnterAll={() => {
                        if (filter === 'mine') {
                            handleSelectAllReady();
                        } else {
                            setFilter('mine');
                            setPendingMultiAction('enterAll');
                        }
                    }}
                    onReviveAll={() => {
                        if (filter === 'ko') {
                            handleSelectAllKo();
                        } else {
                            setFilter('ko');
                            setPendingMultiAction('reviveAll');
                        }
                    }}
                    onWatchReplay={() => openBracket(currentBudokaiId)}
                />

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

                    {budokaiInfo?.status === BUDOKAI_STATUS.Open && myOwnedSet.size > 0 && (filter !== 'ko' || (mineKoIds.length + civilKoIds.length) > 0) && (
                        <button
                            onClick={() => toggleMultiSelectMode()}
                            className={`rounded border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                multiSelectMode
                                    ? 'border-red-500 bg-red-600 text-white hover:bg-red-500'
                                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                            }`}
                        >
                            <Sword className="mr-1 inline h-3 w-3" />
                            {multiSelectMode ? 'Cancel' : (filter === 'ko' ? 'Multi-Revive' : 'Multi-Enter')}
                        </button>
                    )}
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
                        civilStaleSrIds={civilStaleSrIds}
                        civilianPreviews={civilianPreviews}
                        civilSlotsAvail={civilSlotsAvail}
                        samuraiOwnedSet={samuraiOwnedSet}
                        states={states}
                        enteredSet={enteredSet}
                        myOwnedSet={myOwnedSet}
                        skinOverrides={entrantSkins}
                        roster={roster}
                        partnerEntryIds={myPartnerEntryIds}
                        multiSelectMode={multiSelectMode}
                        multiSelectKind={multiSelectKind}
                        selectedIds={selectedIds}
                        onCardClick={handleCardClick}
                        ownedCount={myTokenIds.length + myCivilianIds.length + myPartnerEntryIds.length}
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
                        skinOverrides={entrantSkins}
                        roster={roster}
                        onCardClick={handleCardClick}
                        multiSelectMode={multiSelectMode}
                        multiSelectKind={multiSelectKind}
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
                                <span className="text-fuchsia-200/70">1 civilian per wallet</span>
                            </div>
                        )}
                        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 sm:gap-2 md:grid-cols-7 lg:grid-cols-9">
                            {entrantsIds.map((tokenId) => {
                                const state = states.get(tokenId);
                                const sr = state?.senryoku ?? 0;
                                // Roster (on-chain SamuraiZERO tag) is authoritative.
                                // Some samurai have stored SR 1-15 (e.g. ASHIGARU
                                // tier) — must not be misclassified as civilian.
                                const isSam =
                                    roster.has(tokenId) ||
                                    sr > 15 ||
                                    (sr === 0 && samuraiOwnedSet.has(tokenId));
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
                                        skinOverride={entrantSkins.get(tokenId) ?? null}
                                        onClick={() => handleCardClick(tokenId)}
                                        multiSelectMode={multiSelectMode}
                                        multiSelectKind={multiSelectKind}
                                        isSelected={selectedIds.has(tokenId)}
                                    />
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Tournament rules — moved below the action so first-time visitors land on
                    tabs + tokens, not on a wall of explanatory text. Collapsible.
                    Trophy variant tracks the current Budokai (Golden / Metal / Custom). */}
                <PrizeShowcase
                    trophyType={budokaiTrophy?.trophyType}
                    trophyTraitId={budokaiTrophy?.trophyTraitId}
                />
            </div>

            {/* Floating batch action bar — branches on entry vs revive kind. */}
            {multiSelectMode && selectedCount > 0 && multiSelectKind === 'enter' && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-red-600/40 bg-black/95 backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Selected</span>
                            <span className="font-mono text-sm font-bold text-white">
                                {selectedCount} samurai · {budokaiCounters?.freeEntry ? 'FREE' : `${selectedTotalFee.toLocaleString()} $ZERO`}
                            </span>
                            {insufficientBatchBalance && (
                                <span className="mt-0.5 text-[9px] text-red-400">
                                    Need {(selectedTotalFee - zeroBalance).toLocaleString()} more $ZERO
                                </span>
                            )}
                            {walletCapExceeded && (
                                <span className="mt-0.5 text-[9px] text-amber-400">
                                    Wallet cap: {walletGate.entries}/{walletGate.cap} entered · only {walletGate.remaining} slot{walletGate.remaining === 1 ? '' : 's'} left
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
                                disabled={isBatchBusy || insufficientBatchBalance || walletCapExceeded || selectedCount === 0}
                                className="rounded bg-red-600 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
                            >
                                {isBatchBusy ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Entering {selectedCount}...
                                    </span>
                                ) : (
                                    budokaiCounters?.freeEntry
                                        ? `Enter ${selectedCount} (FREE)`
                                        : `Enter ${selectedCount} (${selectedTotalFee.toLocaleString()} $ZERO)`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {multiSelectMode && selectedCount > 0 && multiSelectKind === 'revive' && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-red-600/40 bg-black/95 backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Senzu Beans</span>
                            <span className="font-mono text-sm font-bold text-white">
                                Revive {selectedCount} · {selectedReviveTotal.toLocaleString()} $ZERO
                            </span>
                            <span className="mt-0.5 text-[9px] text-zinc-500">
                                Cost = Σ senryoku × 10 ZERO. Calculated live as you select.
                            </span>
                            {insufficientReviveBalance && (
                                <span className="mt-0.5 text-[9px] text-red-400">
                                    Need {(selectedReviveTotal - zeroBalance).toLocaleString()} more $ZERO
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => clearSelection()}
                                disabled={isReviveBusy}
                                className="rounded border border-zinc-700 px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white disabled:opacity-50"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => reviveBatch(Array.from(selectedIds))}
                                disabled={isReviveBusy || insufficientReviveBalance || selectedCount === 0}
                                className="rounded bg-red-600 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
                            >
                                {isReviveBusy ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Reviving {selectedCount}...
                                    </span>
                                ) : (
                                    `Revive ${selectedCount} (${selectedReviveTotal.toLocaleString()} $ZERO)`
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
                    // Roster (on-chain getTokensByTag('SamuraiZERO')) is the
                    // authoritative source. Some samurai have stored
                    // senryoku in the 1-15 range (e.g. PaleKnotWhip #832
                    // tier ASHIGARU SR=1) — without the roster-first check
                    // they'd misclassify as civilians.
                    if (roster.has(selectedTokenId)) return true;
                    const sr = selectedState?.senryoku ?? 0;
                    if (sr > 15) return true; // civilian ceiling — anything above is samurai
                    if (sr > 0) return false; // not in roster + 1-15 → persisted civilian
                    return samuraiOwnedSet.has(selectedTokenId);
                })()}
                civilSlotsAvail={civilSlotsAvail}
                walletEntries={walletGate.entries}
                walletCap={walletGate.cap}
                entryFeeWei={budokaiCounters?.entryFee}
                freeEntry={budokaiCounters?.freeEntry ?? false}
                isKnockedOut={selectedState?.isKnockedOut ?? false}
                isEntered={selectedTokenId ? enteredSet.has(selectedTokenId) : false}
                isMine={selectedTokenId ? myOwnedSet.has(selectedTokenId) : false}
                budokaiInfo={budokaiInfo}
                zeroBalance={zeroBalance}
                skinOverride={selectedTokenId ? entrantSkins.get(selectedTokenId) ?? null : null}
                open={isDetailOpen}
                onClose={closeDetail}
                onActionSuccess={handleRefresh}
            />

            <BracketReveal open={isBracketOpen} onClose={closeBracket} budokaiId={bracketBudokaiId} />

            {civilianFlow.isActive && civilianFlow.discordUserId && (
                <CivilianEntryDialog
                    open={civilianFlow.isActive}
                    discordUserId={civilianFlow.discordUserId}
                    guildId={civilianFlow.guildId}
                    representation={civilianFlow.representation}
                    onClose={civilianFlow.dismiss}
                />
            )}
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
                        BUDOKAI
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
                    src="/images/budokai-hero.jpg"
                    alt="Budokai"
                    className="block h-auto w-full"
                    style={{imageRendering: 'pixelated'}}
                    loading="eager"
                    fetchPriority="high"
                    onError={() => setFailed(true)}
                />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-black" />
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
 * Top-level call-to-action above the tabs. Renders the most relevant single action for the
 * current state so the page lands on something clickable, not on a wall of explanatory text.
 *
 * Wallet not connected   → Connect Wallet
 * Open + ready tokens    → Enter all Ready (N)        — switches to Mine + preselects
 * Open + only KO'd       → Revive your warriors (N)   — switches to KO + preselects
 * Open + nothing usable  → null (no CTA — the entrants grid speaks for itself)
 * Resolved               → Watch Bracket Replay
 * Otherwise              → null
 *
 * Hidden while a multi-select session is active (the floating batch bar takes over).
 */
function PrimaryActionBar({
    isResolved,
    isOpen,
    readyCount,
    koCount,
    multiSelectMode,
    onEnterAll,
    onReviveAll,
    onWatchReplay,
}: {
    isResolved: boolean;
    isOpen: boolean;
    readyCount: number;
    koCount: number;
    multiSelectMode: boolean;
    onEnterAll: () => void;
    onReviveAll: () => void;
    onWatchReplay: () => void;
}) {
    const {isConnected} = useAccount();
    const {openConnectModal} = useConnectModal();

    if (multiSelectMode) return null;

    if (!isConnected) {
        return (
            <div className="mb-4">
                <button
                    onClick={() => openConnectModal?.()}
                    className="flex w-full items-center justify-center gap-2 rounded border border-yellow-500/60 bg-yellow-500/10 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-yellow-300 transition-colors hover:bg-yellow-500/20"
                >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet to Enter Budokai
                </button>
            </div>
        );
    }

    if (isOpen && readyCount > 0) {
        return (
            <div className="mb-4">
                <button
                    onClick={onEnterAll}
                    className="flex w-full items-center justify-center gap-2 rounded border border-yellow-500/60 bg-gradient-to-r from-yellow-500/15 via-yellow-500/10 to-yellow-500/15 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.10)] transition-all hover:from-yellow-500/25 hover:to-yellow-500/25"
                >
                    <Sword className="h-4 w-4" />
                    Enter all Ready ({readyCount})
                </button>
            </div>
        );
    }

    if (isOpen && koCount > 0) {
        return (
            <div className="mb-4">
                <button
                    onClick={onReviveAll}
                    className="flex w-full items-center justify-center gap-2 rounded border border-red-500/60 bg-red-500/10 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-red-300 transition-colors hover:bg-red-500/20"
                >
                    <Sword className="h-4 w-4" />
                    Revive your warriors ({koCount})
                </button>
            </div>
        );
    }

    if (isResolved) {
        return (
            <div className="mb-4">
                <button
                    onClick={onWatchReplay}
                    className="flex w-full items-center justify-center gap-2 rounded border border-red-600/50 bg-red-900/25 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-red-300 transition-colors hover:bg-red-900/40"
                >
                    <Eye className="h-4 w-4" />
                    Watch Bracket Replay
                </button>
            </div>
        );
    }

    return null;
}

/**
 * MINE tab — buckets split by samurai vs civilian (v6).
 *   Samurai:   IN THE DOJO (yellow), READY (dashed zinc), KO (grayscale)
 *   Civilian:  IN THE DOJO (fuchsia), READY (dashed fuchsia + 1-per-wallet gate), KO (grayscale)
 */
function MineSections({
    samuraiInIds,
    samuraiReadyIds,
    samuraiKoIds,
    civilInIds,
    civilReadyIds,
    civilKoIds,
    civilStaleSrIds,
    civilianPreviews,
    civilSlotsAvail,
    samuraiOwnedSet,
    states,
    enteredSet,
    myOwnedSet,
    skinOverrides,
    roster,
    partnerEntryIds = [],
    multiSelectMode,
    multiSelectKind,
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
    civilStaleSrIds: number[];
    civilianPreviews: Map<number, number>;
    civilSlotsAvail: number;
    samuraiOwnedSet: Set<number>;
    states: Map<number, {senryoku: number; isKnockedOut: boolean; honor: number}>;
    enteredSet: Set<number>;
    myOwnedSet: Set<number>;
    skinOverrides?: Map<number, EntrantSkinOverride>;
    roster?: Set<number>;
    partnerEntryIds?: number[];
    multiSelectMode: boolean;
    multiSelectKind: 'enter' | 'revive';
    selectedIds: Set<number>;
    onCardClick: (tokenId: number) => void;
    ownedCount: number;
}) {
    if (ownedCount === 0 && partnerEntryIds.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center rounded border border-dashed border-zinc-800 text-[11px] text-zinc-600">
                You don&apos;t own any AdrianZERO.
            </div>
        );
    }
    const hasSamurai = samuraiReadyIds.length + samuraiKoIds.length > 0 || samuraiInIds.length > 0;
    const hasCivilians = civilReadyIds.length + civilKoIds.length > 0 || civilInIds.length > 0;

    const partnerSkins = <PartnerSkinsSection />;

    // Combined "In the Dojo" — once a token is committed, the samurai/civilian distinction matters
    // less than "they're locked into the bracket". Card border still shows the type at a glance.
    // v11: include partner-NFT entries the user owns this Budokai (synthetic
    // ids ≥ 1_000_001 with entryOwner === wallet) alongside samurai/civilian
    // commits. They show under "In the Dojo" with the partner skin image.
    const allInIds = [
        ...samuraiInIds,
        ...civilInIds,
        ...partnerEntryIds,
    ].sort((a, b) => a - b);

    return (
        <div className="space-y-8">
            {/* IN THE DOJO — unified across samurai + civilian. */}
            {allInIds.length > 0 && (
                <SectionBlock
                    title="In the Dojo"
                    kanji="出場"
                    sub="Committed. Awaiting the bracket."
                    color="text-yellow-400"
                    count={allInIds.length}
                    previewIds={allInIds}
                    skinOverrides={skinOverrides}
                >
                    <CardGrid ids={allInIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} multiSelectKind={multiSelectKind} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} skinOverrides={skinOverrides} roster={roster} />
                </SectionBlock>
            )}

            {/* SAMURAI section — only Ready + KO, since In the Dojo is shared above. */}
            {hasSamurai && (samuraiReadyIds.length + samuraiKoIds.length > 0) && (
                <div className="space-y-6">
                    <div className="flex items-baseline gap-3 border-b border-zinc-900 pb-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-yellow-500">Samurai</span>
                        <span className="font-mono text-[9px] text-zinc-700">侍</span>
                        <span className="text-[9px] tracking-wider text-zinc-700">Pre-loaded SR. Trained warriors.</span>
                    </div>
                    {samuraiReadyIds.length > 0 && (
                        <SectionBlock
                            title="Ready to Enter"
                            kanji="待機"
                            sub="Available. Pay the fee and lock them in."
                            color="text-zinc-300"
                            count={samuraiReadyIds.length}
                            previewIds={samuraiReadyIds}
                            skinOverrides={skinOverrides}
                        >
                            <CardGrid ids={samuraiReadyIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} multiSelectKind={multiSelectKind} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} skinOverrides={skinOverrides} roster={roster} />
                        </SectionBlock>
                    )}
                    {samuraiKoIds.length > 0 && (
                        <SectionBlock title="Knocked Out" kanji="気絶" sub="Revive with Senzu to re-enter." color="text-red-400" count={samuraiKoIds.length} previewIds={samuraiKoIds} skinOverrides={skinOverrides}>
                            <CardGrid ids={samuraiKoIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} multiSelectKind={multiSelectKind} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} skinOverrides={skinOverrides} roster={roster} />
                        </SectionBlock>
                    )}
                </div>
            )}

            {/* CIVILIAN section — only Ready + KO + warnings, since In the Dojo is shared above. */}
            {hasCivilians && (civilReadyIds.length + civilKoIds.length > 0) && (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-baseline gap-3 border-b border-fuchsia-900/40 pb-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-fuchsia-400">Civilian</span>
                        <span className="font-mono text-[9px] text-fuchsia-700">民</span>
                        <span className="text-[9px] tracking-wider text-fuchsia-300/60">Regular AdrianZERO. Derived SR 1–15. Underdog mode. 1 per wallet.</span>
                        <div className="ml-auto rounded border border-fuchsia-500/40 bg-fuchsia-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-fuchsia-300">
                            {civilSlotsAvail > 0 ? 'civilian slot open' : 'civilian slot used'}
                        </div>
                    </div>
                    {civilSlotsAvail === 0 && civilReadyIds.length > 0 && (
                        <div className="rounded border border-fuchsia-500/30 bg-fuchsia-950/15 px-3 py-2 text-[10px] text-fuchsia-200">
                            <p className="font-bold uppercase tracking-wider text-fuchsia-300">Civilian slot already used</p>
                            <p className="mt-1 text-fuchsia-200/80">
                                Each wallet may field <span className="font-bold text-fuchsia-300">one civilian</span> per Budokai.
                                You already have a civilian in the dojo, so the rest of your civilians sit this one out — they'll be eligible again next Budokai.
                            </p>
                        </div>
                    )}
                    {civilStaleSrIds.length > 0 && (
                        <div className="rounded border border-amber-500/40 bg-amber-950/20 px-3 py-2 text-[10px] text-amber-300">
                            <p className="font-bold uppercase tracking-wider">⚠ {civilStaleSrIds.length} civilian{civilStaleSrIds.length === 1 ? '' : 's'} with stored SR &gt; 15</p>
                            <p className="mt-1 text-amber-200/80">Tokens minted with legacy senryoku stored on-chain. Despite their civilian roster status, the contract will treat them as samurai-with-that-SR on entry. Affected: {civilStaleSrIds.slice(0, 8).map((id) => `#${id}`).join(', ')}{civilStaleSrIds.length > 8 ? `, +${civilStaleSrIds.length - 8} more` : ''}.</p>
                        </div>
                    )}
                    {civilReadyIds.length > 0 && (
                        <SectionBlock
                            title="Ready to Rise"
                            kanji="決起"
                            sub="Pay the fee, derive SR 1–15, fight the odds."
                            color="text-fuchsia-300"
                            count={civilReadyIds.length}
                            previewIds={civilReadyIds}
                            skinOverrides={skinOverrides}
                        >
                            <CardGrid ids={civilReadyIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} multiSelectKind={multiSelectKind} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} skinOverrides={skinOverrides} roster={roster} />
                        </SectionBlock>
                    )}
                    {civilKoIds.length > 0 && (
                        <SectionBlock title="Knocked Out" kanji="気絶" sub="Revive with Senzu (cost = SR × 10 ZERO)." color="text-red-400" count={civilKoIds.length} previewIds={civilKoIds} skinOverrides={skinOverrides}>
                            <CardGrid ids={civilKoIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} multiSelectKind={multiSelectKind} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} skinOverrides={skinOverrides} roster={roster} />
                        </SectionBlock>
                    )}
                </div>
            )}

            {/* Partner-collection NFTs the wallet owns (Doodles, Pudgy, etc.).
                Self-hides when none. Click → records cosmetic skin + fires
                v10 enterAsAnonymousCivilian. */}
            {partnerSkins}
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
    skinOverrides,
    roster,
    onCardClick,
    multiSelectMode,
    multiSelectKind,
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
    skinOverrides?: Map<number, EntrantSkinOverride>;
    roster?: Set<number>;
    onCardClick: (tokenId: number) => void;
    multiSelectMode: boolean;
    multiSelectKind: 'enter' | 'revive';
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
                previewIds={mineIds}
                skinOverrides={skinOverrides}
            >
                <CardGrid ids={mineIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} multiSelectKind={multiSelectKind} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} skinOverrides={skinOverrides} roster={roster} />
            </SectionBlock>

            {civilKoIds.length > 0 && (
                <SectionBlock
                    title="Your Civilians"
                    kanji="民兵"
                    sub="Civilian KO'd. Revive cheap (SR × 10 ZERO) for the next Budokai."
                    color="text-fuchsia-400"
                    count={civilKoIds.length}
                    previewIds={civilKoIds}
                    skinOverrides={skinOverrides}
                >
                    <CardGrid ids={civilKoIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} multiSelectKind={multiSelectKind} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} skinOverrides={skinOverrides} roster={roster} />
                </SectionBlock>
            )}

            <SectionBlock
                title="Community"
                kanji="衆生"
                sub="Available KO'd tokens across the dojo. Buy, revive, fight."
                color="text-zinc-400"
                count={communityIds.length}
                emptyMsg="No community KO'd tokens."
                previewIds={communityIds}
                skinOverrides={skinOverrides}
                collapseThreshold={9}
            >
                <CardGrid ids={communityIds} states={states} enteredSet={enteredSet} myOwnedSet={myOwnedSet} multiSelectMode={multiSelectMode} multiSelectKind={multiSelectKind} selectedIds={selectedIds} onCardClick={onCardClick} samuraiOwnedSet={samuraiOwnedSet} civilianPreviews={civilianPreviews} skinOverrides={skinOverrides} roster={roster} />
            </SectionBlock>
        </div>
    );
}

/**
 * SectionBlock — collapsible header + grid wrapper. Auto-collapses
 * when `count > collapseThreshold` (12 by default = ~1 row on lg).
 * When collapsed, renders 5 thumbnail previews next to the header so
 * the user can still spot whether their roster is in there before
 * deciding to expand. Preview thumbnails honor `skinOverrides` so a
 * civilian entered with a partner skin (Doodle, Pudgy, …) shows the
 * NFT artwork instead of the blank AdrianLAB silhouette.
 */
function SectionBlock({
    title,
    kanji,
    sub,
    color,
    count,
    emptyMsg,
    children,
    previewIds = [],
    skinOverrides,
    collapseThreshold = 12,
}: {
    title: string;
    kanji: string;
    sub: string;
    color: string;
    count: number;
    emptyMsg?: string;
    children: React.ReactNode;
    previewIds?: number[];
    skinOverrides?: Map<number, EntrantSkinOverride>;
    collapseThreshold?: number;
}) {
    const [override, setOverride] = useState<boolean | null>(null);
    const defaultExpanded = count <= collapseThreshold;
    const expanded = override ?? defaultExpanded;

    return (
        <div>
            <button
                type="button"
                onClick={() => setOverride(!expanded)}
                disabled={count === 0}
                className="mb-2 flex w-full items-center gap-3 text-left transition-opacity hover:opacity-80 disabled:cursor-default disabled:hover:opacity-100"
            >
                {count > 0 ? (
                    expanded ? (
                        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
                    )
                ) : (
                    <span className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                <span className={`text-[11px] font-bold uppercase tracking-[0.3em] ${color}`}>
                    {title}
                </span>
                <span className="font-mono text-[10px] text-zinc-600">{kanji}</span>
                <span className="text-[9px] tracking-wider text-zinc-600">{sub}</span>
                <div className="h-px flex-1 bg-zinc-900" />
                {!expanded && previewIds.length > 0 && (
                    <span className="flex items-center gap-1">
                        {previewIds.slice(0, 5).map((id) => {
                            const override = skinOverrides?.get(id);
                            const src =
                                override?.imageUrl ??
                                `https://adrianlab.vercel.app/api/render/${id}.png`;
                            return (
                                <img
                                    key={id}
                                    src={src}
                                    alt=""
                                    className="h-6 w-6 rounded border border-zinc-800 object-cover"
                                    style={
                                        override
                                            ? undefined
                                            : {imageRendering: 'pixelated'}
                                    }
                                    loading="lazy"
                                />
                            );
                        })}
                        {count > previewIds.length && (
                            <span className="ml-1 font-mono text-[9px] text-zinc-500">
                                +{count - previewIds.length}
                            </span>
                        )}
                    </span>
                )}
                <span className="font-mono text-[9px] text-zinc-500">({count})</span>
            </button>
            {count === 0 && emptyMsg ? (
                <div className="flex h-20 items-center justify-center rounded border border-dashed border-zinc-900 text-[10px] text-zinc-700">
                    {emptyMsg}
                </div>
            ) : expanded ? (
                children
            ) : null}
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
    skinOverrides,
    roster,
    multiSelectMode,
    multiSelectKind,
    selectedIds,
    onCardClick,
}: {
    ids: number[];
    states: Map<number, {senryoku: number; isKnockedOut: boolean; honor: number}>;
    enteredSet: Set<number>;
    myOwnedSet: Set<number>;
    samuraiOwnedSet: Set<number>;
    civilianPreviews: Map<number, number>;
    skinOverrides?: Map<number, EntrantSkinOverride>;
    roster?: Set<number>;
    multiSelectMode: boolean;
    multiSelectKind: 'enter' | 'revive';
    selectedIds: Set<number>;
    onCardClick: (tokenId: number) => void;
}) {
    if (ids.length === 0) return null;
    return (
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 sm:gap-2 md:grid-cols-7 lg:grid-cols-9">
            {ids.map((tokenId) => {
                const state = states.get(tokenId);
                const onChainSR = state?.senryoku ?? 0;
                const isMine = myOwnedSet.has(tokenId);
                // Roster (on-chain SamuraiZERO tag) is the authoritative
                // source. Falls back to owned-set / SR threshold when the
                // roster wasn't passed (e.g. Hall of Fame snapshots) or
                // doesn't include the token.
                const isSamurai = roster?.has(tokenId)
                    ? true
                    : isMine
                      ? samuraiOwnedSet.has(tokenId)
                      : onChainSR > 15;
                let displaySR = onChainSR;
                let isPreview = false;
                if (!isSamurai) {
                    const preview = civilianPreviews.get(tokenId);
                    if (preview !== undefined && preview > 0) {
                        displaySR = preview;
                        isPreview = onChainSR !== preview; // preview shown over (or instead of) stored
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
                        skinOverride={skinOverrides?.get(tokenId) ?? null}
                        onClick={() => onCardClick(tokenId)}
                        multiSelectMode={multiSelectMode}
                        multiSelectKind={multiSelectKind}
                        isSelected={selectedIds.has(tokenId)}
                    />
                );
            })}
        </div>
    );
}
