import {useState} from 'react';
import {useAccount} from 'wagmi';
import {Loader2, Sparkles, ExternalLink} from 'lucide-react';
import {usePartnerSkins} from '../hooks/usePartnerSkins';
import {useEnterAsAnonymousCivilian} from '../hooks/useDojoActions';
import {createWalletSkinIntent, type PartnerSkin} from '../lib/budokaiApi';
import {useCurrentBudokaiId, useBudokaiInfo} from '../hooks/useDojoContract';
import {useBudokaiCounters} from '../hooks/useBudokaiCounters';
import {BUDOKAI_STATUS} from '@/lib/web3/abi';

/**
 * Shows the partner-collection NFTs (Doodles, Pudgy Penguins, etc.) that
 * the connected wallet owns. Pick one → records the cosmetic skin on the
 * backend → fires v10 enterAsAnonymousCivilian on-chain. The narrator
 * then renders the partner NFT image instead of "civilian #N" across
 * every wired Discord server.
 *
 * Hidden when wallet has no partner skins (vast majority of users) so it
 * doesn't add noise.
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
    const {enterAnon, isPending, isConfirming, isConfirmed, error: txError, reset} =
        useEnterAsAnonymousCivilian();

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
            // Intent recording is non-fatal — we still let the user enter,
            // they just won't get the skin override on the narrator embed.
            setIntentError(err instanceof Error ? err.message : String(err));
        }
        enterAnon();
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-baseline gap-3 border-b border-cyan-900/40 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-400">
                    Partner Skins
                </span>
                <span className="font-mono text-[9px] text-cyan-700">外部</span>
                <span className="text-[9px] tracking-wider text-cyan-300/60">
                    External NFTs you own. Use as cosmetic skin → enter as
                    anonymous civilian (no AdrianZERO needed).
                </span>
                <span className="ml-auto rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                    {skins.length} owned · {feeLabel}
                </span>
            </div>

            {!budokaiOpen && (
                <div className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-[10px] text-zinc-500">
                    No Budokai open right now. Skin selection will reactivate
                    once the next one is live.
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {skins.map((skin) => {
                    const id = `${skin.contract}-${skin.tokenId}`;
                    const isPicked =
                        pickedSkin?.contract === skin.contract &&
                        pickedSkin?.tokenId === skin.tokenId;
                    return (
                        <button
                            key={id}
                            onClick={() => handlePick(skin)}
                            disabled={!budokaiOpen || busy}
                            className={`group relative overflow-hidden rounded border bg-zinc-950 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                                isPicked
                                    ? 'border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                                    : 'border-cyan-900/40 hover:border-cyan-500/60'
                            }`}
                        >
                            <div className="relative aspect-square w-full">
                                {skin.imageUrl ? (
                                    <img
                                        src={skin.imageUrl}
                                        alt={skin.name}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="grid h-full place-items-center bg-zinc-900 text-[10px] text-zinc-600">
                                        no preview
                                    </div>
                                )}
                                <span className="absolute right-1.5 top-1.5 rounded border border-cyan-500/40 bg-cyan-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-cyan-300">
                                    {skin.collectionName ?? 'NFT'}
                                </span>
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
                            <div className="px-2 py-1.5">
                                <p className="truncate text-[11px] font-bold text-zinc-100">
                                    {skin.name}
                                </p>
                                <p className="text-[9px] tracking-wider text-zinc-500">
                                    {budokaiOpen ? `Enter as skin · ${feeLabel}` : 'Skin ready'}
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
                    <ExternalLink className="h-3.5 w-3.5" />
                    Entered as <strong>{pickedSkin.name}</strong> — broadcast
                    will reflect this skin across every wired server.
                </div>
            )}
        </div>
    );
}
