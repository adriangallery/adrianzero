import {useEffect, useMemo, useState} from 'react';
import {useAccount} from 'wagmi';
import {Loader2, Sparkles, AlertTriangle, X, ChevronDown, ChevronRight} from 'lucide-react';
import {usePartnerSkins} from '../hooks/usePartnerSkins';
import {useEnterAsAnonymousCivilian} from '../hooks/useDojoActions';
import {createWalletSkinIntent, type PartnerSkin} from '../lib/budokaiApi';
import {useCurrentBudokaiId, useBudokaiInfo} from '../hooks/useDojoContract';
import {useBudokaiCounters} from '../hooks/useBudokaiCounters';
import {useWalletEntryCount} from '../hooks/useWalletEntryCount';
import {useEntrantSkins} from '../hooks/useEntrantSkins';
import {BUDOKAI_STATUS} from '@/lib/web3/abi';

/**
 * Lists the partner-collection NFTs owned by the connected wallet
 * (Doodles, Pudgy, etc.). Pick a card → confirm modal → records the
 * cosmetic skin → fires v10 enterAsAnonymousCivilian. The narrator
 * broadcasts the partner image instead of "civilian #N" across every
 * wired Discord.
 *
 * Visual sizing matches the dojo's regular SamuraiCard grid so partner
 * skins sit alongside SamuraiZERO/AdrianZERO cards at the same scale.
 * Self-hides when wallet has no partner skins.
 *
 * Slot guard: if the wallet already has an entry on-chain, cards are
 * disabled and we surface "you already entered" so the user doesn't
 * waste gas on a guaranteed-revert tx.
 */
export function PartnerSkinsSection() {
    const {address} = useAccount();
    const wallet = address?.toLowerCase();
    const {skins, loading, error} = usePartnerSkins(wallet);
    const {currentBudokaiId} = useCurrentBudokaiId();
    const {info} = useBudokaiInfo(currentBudokaiId);
    const {counters} = useBudokaiCounters(
        currentBudokaiId ? BigInt(currentBudokaiId) : null,
    );
    // Pre-flight slot check: getEntriesByWallet > 0 means wallet has at
    // least one entry this Budokai. For wallets without AdrianZERO this
    // is a 100% lock (all entries are anonymous civilian via v10). For
    // ZERO holders it's a soft warning — they may have entered samurai
    // already, civilian slot can still be open. We surface entered as
    // disabled by default and let them force-enter via the same modal.
    const {gate} = useWalletEntryCount(
        currentBudokaiId !== null ? BigInt(currentBudokaiId) : null,
        counters,
    );
    // Cross-check: do we have a recorded skin for this wallet's entry
    // already? If so we can show "you're in as <skin>" definitively.
    const entrantSkins = useEntrantSkins(
        currentBudokaiId !== null ? BigInt(currentBudokaiId) : null,
    );
    const {
        enterAnon,
        isPending,
        isConfirming,
        isConfirmed,
        error: txError,
        reset,
    } = useEnterAsAnonymousCivilian();

    const [confirmingSkin, setConfirmingSkin] = useState<PartnerSkin | null>(null);
    const [pickedSkin, setPickedSkin] = useState<PartnerSkin | null>(null);
    const [intentError, setIntentError] = useState<string | null>(null);

    // Group skins by collection so a whale with 100 Doodles + 50 Pudgy
    // sees two tidy headers instead of 150 cards landing all at once.
    // Sorted: largest collection first (most likely the user's "main").
    const groups = useMemo(() => {
        const map = new Map<string, PartnerSkin[]>();
        for (const skin of skins) {
            const key = skin.collectionName ?? 'Other';
            const arr = map.get(key);
            if (arr) arr.push(skin);
            else map.set(key, [skin]);
        }
        return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
    }, [skins]);

    // Per-collection expand/collapse override. `undefined` = default
    // (auto-collapse when > COLLAPSE_THRESHOLD). User clicks the header
    // to flip the override.
    const COLLAPSE_THRESHOLD = 12;
    const [expandedOverride, setExpandedOverride] = useState<Record<string, boolean>>({});
    function isExpanded(name: string, count: number): boolean {
        return expandedOverride[name] ?? count <= COLLAPSE_THRESHOLD;
    }
    function toggleGroup(name: string, count: number) {
        setExpandedOverride((prev) => ({
            ...prev,
            [name]: !isExpanded(name, count),
        }));
    }

    // When a tx confirms, drop the modal so the success state is visible.
    useEffect(() => {
        if (isConfirmed) setConfirmingSkin(null);
    }, [isConfirmed]);

    if (!wallet) return null;
    if (loading) {
        return (
            <div className="flex items-center gap-2 rounded border border-cyan-900/40 bg-cyan-950/10 px-3 py-2 text-[10px] text-cyan-300/70">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking partner collections…
            </div>
        );
    }
    if (error || skins.length === 0) return null;

    const budokaiOpen =
        info?.status === BUDOKAI_STATUS.Open &&
        currentBudokaiId !== null &&
        currentBudokaiId !== undefined;
    const isFree = counters?.freeEntry || counters?.entryFee === 0n;
    const feeLabel = isFree
        ? 'FREE'
        : counters
          ? `${Number(counters.entryFee / 10n ** 18n).toLocaleString()} ZERO`
          : 'entry fee';

    const busy = isPending || isConfirming;
    const alreadyEntered = gate.entries > 0;
    // Lookup the skin already entered with — if known, show "in as" text.
    const enteredSkin = (() => {
        if (!alreadyEntered) return null;
        for (const [, skin] of entrantSkins) {
            if (skin.name && skins.some((s) => skin.name.includes(s.name))) {
                return skin;
            }
        }
        return null;
    })();

    function openConfirm(skin: PartnerSkin) {
        if (!budokaiOpen || alreadyEntered || busy) return;
        setIntentError(null);
        reset();
        setConfirmingSkin(skin);
    }

    async function confirmEntry() {
        const skin = confirmingSkin;
        if (!skin || !wallet) return;
        setPickedSkin(skin);
        try {
            await createWalletSkinIntent({
                wallet,
                representation: {
                    chain: 'ethereum',
                    contract: skin.contract,
                    tokenId: skin.tokenId,
                    name: skin.name,
                    imageUrl: skin.imageUrl,
                },
            });
        } catch (err) {
            // Skin record is decorative — keep going so user can still enter.
            setIntentError(err instanceof Error ? err.message : String(err));
        }
        enterAnon();
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-3 border-b border-cyan-900/40 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-400">
                    Partner Skins
                </span>
                <span className="font-mono text-[9px] text-cyan-700">外部</span>
                <span className="text-[9px] tracking-wider text-cyan-300/60">
                    External NFTs you own. Use as cosmetic skin → enter as
                    anonymous civilian.
                </span>
                <span className="ml-auto rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                    {skins.length} owned · {feeLabel}
                </span>
            </div>

            {!budokaiOpen && (
                <div className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-[10px] text-zinc-500">
                    No Budokai open right now. Skins will reactivate once the
                    next one is live.
                </div>
            )}

            {budokaiOpen && alreadyEntered && (
                <div className="flex items-center gap-2 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    {enteredSkin
                        ? <>You&apos;re already in Budokai #{currentBudokaiId} as <strong>{enteredSkin.name}</strong>. Skin selection unlocks next Budokai.</>
                        : <>You already entered Budokai #{currentBudokaiId} ({gate.entries} {gate.entries === 1 ? 'entry' : 'entries'}). Civilian slot may already be used — skin selection unlocks next Budokai.</>}
                </div>
            )}

            <div className="space-y-3">
                {groups.map(([collectionName, items]) => {
                    const expanded = isExpanded(collectionName, items.length);
                    const previewItems = items.slice(0, 5);
                    return (
                        <div
                            key={collectionName}
                            className="rounded border border-cyan-900/40 bg-zinc-950/40 overflow-hidden"
                        >
                            <button
                                type="button"
                                onClick={() => toggleGroup(collectionName, items.length)}
                                className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-cyan-950/30"
                            >
                                {expanded ? (
                                    <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-cyan-400" />
                                ) : (
                                    <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-cyan-400" />
                                )}
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">
                                    {collectionName}
                                </span>
                                <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-cyan-300">
                                    {items.length} owned
                                </span>
                                {!expanded && (
                                    <div className="ml-auto flex items-center gap-1.5">
                                        {previewItems.map((p) =>
                                            p.imageUrl ? (
                                                <img
                                                    key={`${p.contract}-${p.tokenId}`}
                                                    src={p.imageUrl}
                                                    alt=""
                                                    className="h-6 w-6 rounded border border-cyan-900/40 object-cover"
                                                    loading="lazy"
                                                />
                                            ) : null,
                                        )}
                                        {items.length > previewItems.length && (
                                            <span className="text-[9px] tracking-wider text-cyan-400/70">
                                                +{items.length - previewItems.length}
                                            </span>
                                        )}
                                        <span className="ml-1 text-[9px] uppercase tracking-wider text-cyan-400/70">
                                            click to expand
                                        </span>
                                    </div>
                                )}
                            </button>
                            {expanded && (
                                <div className="grid grid-cols-4 gap-1.5 border-t border-cyan-900/40 bg-zinc-950/60 p-2 sm:grid-cols-5 sm:gap-2 md:grid-cols-7 lg:grid-cols-9">
                                    {items.map((skin) => {
                                        const id = `${skin.contract}-${skin.tokenId}`;
                                        const isPicked =
                                            pickedSkin?.contract === skin.contract &&
                                            pickedSkin?.tokenId === skin.tokenId;
                                        const disabled = !budokaiOpen || busy || alreadyEntered;
                                        const cardBorder = isPicked
                                            ? 'border-2 border-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.30)]'
                                            : 'border-2 border-dashed border-cyan-700/60';
                                        return (
                                            <button
                                                key={id}
                                                onClick={() => openConfirm(skin)}
                                                disabled={disabled}
                                                className={`group relative flex min-w-0 flex-col overflow-hidden rounded text-left transition-all duration-300 hover:scale-105 hover:z-10 disabled:cursor-not-allowed disabled:opacity-50 ${cardBorder}`}
                                            >
                                                <div className="relative aspect-square w-full overflow-hidden rounded-t bg-zinc-900">
                                                    {skin.imageUrl ? (
                                                        <img
                                                            src={skin.imageUrl}
                                                            alt={skin.name}
                                                            className="h-full w-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="grid h-full place-items-center bg-zinc-900 text-[8px] text-zinc-600">
                                                            no img
                                                        </div>
                                                    )}
                                                    <div className="absolute top-1 right-1 rounded bg-cyan-500 px-1.5 py-0.5 text-[7px] font-bold uppercase text-black">
                                                        SKIN
                                                    </div>
                                                    {isPicked && busy && (
                                                        <div className="absolute inset-0 grid place-items-center bg-black/60">
                                                            <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
                                                        </div>
                                                    )}
                                                    {isPicked && isConfirmed && (
                                                        <div className="absolute inset-0 grid place-items-center bg-emerald-500/20">
                                                            <Sparkles className="h-6 w-6 text-emerald-300" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="px-1 py-1.5">
                                                    <p className="truncate text-[9px] font-bold text-cyan-300 transition-colors group-hover:text-white">
                                                        {skin.name}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {(intentError || txError) && (
                <div className="rounded border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-[10px] text-rose-300">
                    {intentError && <p>Skin record failed: {intentError}</p>}
                    {txError && (
                        <p className="mt-1 break-words">
                            Tx error: {txError.message.slice(0, 200)}
                        </p>
                    )}
                </div>
            )}

            {isConfirmed && pickedSkin && (
                <div className="flex items-center gap-2 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Entered as <strong>{pickedSkin.name}</strong> — broadcast
                    will reflect this skin across every wired server.
                </div>
            )}

            {confirmingSkin && (
                <ConfirmModal
                    skin={confirmingSkin}
                    feeLabel={feeLabel}
                    budokaiId={currentBudokaiId}
                    busy={busy}
                    onConfirm={confirmEntry}
                    onCancel={() => setConfirmingSkin(null)}
                />
            )}
        </div>
    );
}

/**
 * Pre-tx confirmation modal. Surfaces (1) the skin chosen, (2) the
 * exact fee, (3) the irreversibility — once confirmed the skin is
 * locked for this Budokai, no swapping. Aligned with PartnerSkinsSection's
 * cyan accent so it reads as part of the same flow.
 */
function ConfirmModal({
    skin,
    feeLabel,
    budokaiId,
    busy,
    onConfirm,
    onCancel,
}: {
    skin: PartnerSkin;
    feeLabel: string;
    budokaiId: number | null;
    busy: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-4 py-8"
            onClick={(e) => {
                if (e.target === e.currentTarget && !busy) onCancel();
            }}
        >
            <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-cyan-500/40 bg-zinc-950 shadow-[0_0_40px_rgba(34,211,238,0.20)]">
                <button
                    onClick={onCancel}
                    disabled={busy}
                    className="absolute right-3 top-3 z-10 rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                    aria-label="Cancel"
                >
                    <X className="h-4 w-4" />
                </button>
                <div className="border-b border-cyan-900/40 bg-cyan-950/30 px-5 py-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-cyan-400">
                        Confirm entry
                    </p>
                    <h3 className="mt-1 text-base font-bold text-white">
                        Enter Budokai #{budokaiId} as this skin?
                    </h3>
                </div>
                <div className="px-5 py-5 space-y-4">
                    <div className="flex gap-3 items-center">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded border border-cyan-500/40 bg-zinc-900">
                            {skin.imageUrl ? (
                                <img
                                    src={skin.imageUrl}
                                    alt={skin.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="grid h-full place-items-center text-[8px] text-zinc-600">
                                    no img
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] uppercase tracking-wider text-cyan-400">
                                {skin.collectionName ?? 'NFT'}
                            </p>
                            <p className="mt-0.5 truncate text-base font-bold text-white">
                                {skin.name}
                            </p>
                            <p className="mt-1 text-[10px] text-zinc-400">
                                Cosmetic skin · derived SR 1–15
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1.5 rounded border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-[11px]">
                        <Row label="Cost" value={feeLabel} accent />
                        <Row label="Slots" value="1 civilian per wallet · final" />
                        <Row label="Skin lock" value="Locked once tx confirms" />
                    </div>

                    <p className="text-[10px] leading-relaxed text-zinc-500">
                        You&apos;ll sign one transaction. Once it confirms, the
                        skin is locked for this Budokai — you can&apos;t swap to
                        a different NFT until next Budokai.
                    </p>

                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={onCancel}
                            disabled={busy}
                            className="flex-1 rounded border border-zinc-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={busy}
                            className="flex-[1.5] rounded border border-cyan-500/60 bg-gradient-to-r from-cyan-500/20 via-cyan-500/15 to-cyan-500/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.20)] hover:from-cyan-500/30 hover:to-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {busy ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Sign in wallet…
                                </span>
                            ) : (
                                <>Confirm & enter</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Row({label, value, accent = false}: {label: string; value: string; accent?: boolean}) {
    return (
        <div className="flex justify-between gap-3">
            <span className="text-zinc-500 uppercase tracking-wider text-[9px]">
                {label}
            </span>
            <span
                className={`font-bold ${accent ? 'text-cyan-300' : 'text-zinc-200'}`}
            >
                {value}
            </span>
        </div>
    );
}
