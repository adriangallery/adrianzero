import {useState} from 'react';
import {useAccount} from 'wagmi';
import {Loader2, Sparkles} from 'lucide-react';
import {usePartnerSkins} from '../hooks/usePartnerSkins';
import {useEnterAsAnonymousCivilian} from '../hooks/useDojoActions';
import {createWalletSkinIntent, type PartnerSkin} from '../lib/budokaiApi';
import {useCurrentBudokaiId, useBudokaiInfo} from '../hooks/useDojoContract';
import {useBudokaiCounters} from '../hooks/useBudokaiCounters';
import {BUDOKAI_STATUS} from '@/lib/web3/abi';

/**
 * Lists the partner-collection NFTs owned by the connected wallet
 * (Doodles, Pudgy, etc.). Click a card → records the cosmetic skin →
 * fires v10 enterAsAnonymousCivilian. The narrator broadcasts the
 * partner image instead of "civilian #N" across every wired Discord.
 *
 * Visual sizing matches the dojo's regular SamuraiCard grid so partner
 * skins sit alongside SamuraiZERO/AdrianZERO cards at the same scale.
 * Self-hides when wallet has no partner skins.
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
    const {
        enterAnon,
        isPending,
        isConfirming,
        isConfirmed,
        error: txError,
        reset,
    } = useEnterAsAnonymousCivilian();

    const [pickedSkin, setPickedSkin] = useState<PartnerSkin | null>(null);
    const [intentError, setIntentError] = useState<string | null>(null);

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

    async function handlePick(skin: PartnerSkin) {
        if (!wallet || !budokaiOpen) return;
        setIntentError(null);
        setPickedSkin(skin);
        reset();
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
            // Skin record is decorative — let the user enter anyway.
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

            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 sm:gap-2 md:grid-cols-7 lg:grid-cols-9">
                {skins.map((skin) => {
                    const id = `${skin.contract}-${skin.tokenId}`;
                    const isPicked =
                        pickedSkin?.contract === skin.contract &&
                        pickedSkin?.tokenId === skin.tokenId;
                    const cardBorder = isPicked
                        ? 'border-2 border-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.30)]'
                        : 'border-2 border-dashed border-cyan-700/60';
                    return (
                        <button
                            key={id}
                            onClick={() => handlePick(skin)}
                            disabled={!budokaiOpen || busy}
                            className={`group relative flex min-w-0 flex-col overflow-hidden rounded text-left transition-all duration-300 hover:scale-105 hover:z-10 disabled:cursor-not-allowed disabled:opacity-60 ${cardBorder}`}
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

                                {/* Collection badge — top-left, mirrors SR badge position. */}
                                <div className="absolute top-1 left-1 rounded border border-cyan-500/40 bg-black/70 px-1.5 py-0.5 backdrop-blur-sm">
                                    <span className="text-[7px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                                        {skin.collectionName ?? 'NFT'}
                                    </span>
                                </div>

                                {/* SKIN badge — top-right, mirrors MINE/CIVIL/IN slot. */}
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
        </div>
    );
}
