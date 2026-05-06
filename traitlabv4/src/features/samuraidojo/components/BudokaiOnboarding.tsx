import {useEffect, useState} from 'react';
import {useAccount} from 'wagmi';
import {useConnectModal} from '@rainbow-me/rainbowkit';
import {Loader2, Sword, Wallet, Check, ExternalLink, Sparkles} from 'lucide-react';
import {useBuyKit} from '@/features/onboarding/hooks/useBuyKit';
import {useKitInfo, FREE_KIT_ID, type KitInfo} from '@/features/onboarding/hooks/useKitInfo';
import {MintSuccessModal} from '@/features/onboarding/components/MintSuccessModal';
import {BUDOKAI_STATUS} from '@/lib/web3/abi';
import {useCurrentBudokaiId, useBudokaiInfo, useBudokaiEntries, dojoPollInterval} from '../hooks/useDojoContract';
import {useBudokaiCounters} from '../hooks/useBudokaiCounters';
import {useEnterAsAnonymousCivilian} from '../hooks/useDojoActions';
import {PartnerSkinsSection} from './PartnerSkinsSection';

const DISCORD_URL = 'https://discord.gg/wDsSreEDnf';

/**
 * Onboarding shown when the visitor has no AdrianZERO NFTs (whether or not their wallet
 * is connected — both states share the same layout intentionally so the journey is the
 * same path regardless of where they start).
 *
 * Layout (top → bottom): Hero · LiveStrip · StepLadder · How-it-works.
 * The page sells the experience first, then offers a 3-step path: mint SubZERO, enter
 * the next Budokai (auto-unlocks after mint via query invalidation), join Discord.
 */
export function BudokaiOnboarding({onAfterMint}: {onAfterMint?: () => void}) {
    const {isConnected} = useAccount();

    return (
        <div className="min-h-screen bg-black pt-20 sm:pt-24">
            <Hero />
            <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
                <LiveStrip />
                <StepLadder isConnected={isConnected} onAfterMint={onAfterMint} />
                {/* Self-hides when wallet has no NFTs from registered partner
                    collections. Shown here above HowItWorks so partner-only
                    holders (no AdrianZERO) immediately see their skin. */}
                <PartnerSkinsSection />
                <HowItWorks />
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Hero — sells the experience in one line                                    */
/* -------------------------------------------------------------------------- */

function Hero() {
    const [imgFailed, setImgFailed] = useState(false);
    return (
        <div className="relative w-full overflow-hidden bg-black">
            <div className="mx-auto max-w-5xl">
                {!imgFailed && (
                    <img
                        src="/images/budokai-hero.jpg"
                        alt="Budokai"
                        className="block h-auto w-full opacity-70"
                        style={{imageRendering: 'pixelated'}}
                        loading="eager"
                        fetchPriority="high"
                        onError={() => setImgFailed(true)}
                    />
                )}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-fuchsia-500 sm:text-xs">
                        On-chain tournament
                    </p>
                    <h1 className="mt-2 text-4xl font-black tracking-wider text-yellow-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-6xl md:text-7xl">
                        BUDOKAI
                    </h1>
                    <p className="mt-3 text-sm font-bold tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] sm:text-base">
                        Discord Rumble. On-chain.
                    </p>
                    <p className="mt-1 text-[11px] tracking-wider text-zinc-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] sm:text-xs">
                        Last samurai standing wins the pot in $ZERO.
                    </p>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* LiveStrip — current Budokai status as a teaser                             */
/* -------------------------------------------------------------------------- */

function LiveStrip() {
    const {currentBudokaiId} = useCurrentBudokaiId();
    const {info} = useBudokaiInfo(currentBudokaiId);
    const fastPoll = dojoPollInterval(info?.status, 15_000);
    const slowPoll = dojoPollInterval(info?.status, 30_000);
    const {entries} = useBudokaiEntries(currentBudokaiId, fastPoll);
    const {counters} = useBudokaiCounters(
        currentBudokaiId !== null ? BigInt(currentBudokaiId) : null,
        slowPoll,
    );

    if (!info) return null;

    let label = 'Next Budokai';
    let detail = 'TBA';
    let dotColor = 'bg-zinc-600';
    let borderColor = 'border-zinc-800';

    if (info.status === BUDOKAI_STATUS.Open) {
        label = 'Live now';
        detail = `${entries.length} entrant${entries.length === 1 ? '' : 's'} · entry open`;
        dotColor = 'bg-green-500 animate-pulse';
        borderColor = 'border-green-500/40';
    } else if (info.status === BUDOKAI_STATUS.Closed) {
        label = 'Battle imminent';
        detail = `${entries.length} fighter${entries.length === 1 ? '' : 's'} locked in`;
        dotColor = 'bg-amber-500 animate-pulse';
        borderColor = 'border-amber-500/40';
    } else if (info.status === BUDOKAI_STATUS.Resolving) {
        label = 'Resolving';
        detail = 'Bracket running on-chain';
        dotColor = 'bg-red-500 animate-pulse';
        borderColor = 'border-red-500/40';
    } else if (info.status === BUDOKAI_STATUS.Resolved) {
        label = 'Last Budokai';
        detail = `${entries.length} fought · 1 won`;
        dotColor = 'bg-zinc-500';
        borderColor = 'border-zinc-700';
    }

    const isFree = counters?.freeEntry ?? false;

    return (
        <div className={`flex items-center gap-3 rounded border ${borderColor} bg-zinc-950/60 px-4 py-3`}>
            <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
                    Budokai #{currentBudokaiId} · {label}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-300">{detail}</p>
            </div>
            {isFree && info.status === BUDOKAI_STATUS.Open && (
                <span className="rounded border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-300">
                    Free entry
                </span>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* AnonymousEntryAction — v10 enterAsAnonymousCivilian button                  */
/* No NFT required. Pays the active Budokai's entry fee in $ZERO and fights   */
/* as a synthetic civilian (tokenId ≥ 1_000_001, derived 1-15 SR).            */
/* -------------------------------------------------------------------------- */

function AnonymousEntryAction() {
    const {isConnected} = useAccount();
    const {openConnectModal} = useConnectModal();
    const {currentBudokaiId} = useCurrentBudokaiId();
    const {info} = useBudokaiInfo(currentBudokaiId);
    const {counters} = useBudokaiCounters(
        currentBudokaiId ? BigInt(currentBudokaiId) : null,
    );
    const {enterAnon, isPending, isConfirming, isConfirmed, error, reset} =
        useEnterAsAnonymousCivilian();

    // Surface successful entries with a transient confirmation. The page
    // separately auto-refetches so a fresh wallet swap to "I'm in" status
    // happens within ~1 cycle.
    const [justEntered, setJustEntered] = useState(false);
    useEffect(() => {
        if (isConfirmed) setJustEntered(true);
    }, [isConfirmed]);

    if (!info || !currentBudokaiId) {
        return (
            <div className="flex w-full items-center justify-center gap-2 rounded border border-zinc-800 bg-zinc-950 px-4 py-3 text-[11px] uppercase tracking-wider text-zinc-500">
                <Sword className="h-4 w-4" />
                Waiting for next Budokai…
            </div>
        );
    }
    if (info.status !== BUDOKAI_STATUS.Open) {
        return (
            <div className="flex w-full items-center justify-center gap-2 rounded border border-zinc-800 bg-zinc-950 px-4 py-3 text-[11px] uppercase tracking-wider text-zinc-500">
                <Sword className="h-4 w-4" />
                Budokai #{currentBudokaiId} not open
            </div>
        );
    }

    const isFree = counters?.freeEntry || counters?.entryFee === 0n;
    const feeLabel = isFree
        ? 'FREE entry'
        : counters
          ? `${Number(counters.entryFee / 10n ** 18n).toLocaleString()} ZERO entry`
          : 'Entry fee';

    if (justEntered) {
        return (
            <div className="flex w-full items-center justify-center gap-2 rounded border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-emerald-300">
                <Sparkles className="h-4 w-4" />
                You&apos;re in the dojo
            </div>
        );
    }

    const busy = isPending || isConfirming;
    const handleClick = () => {
        if (!isConnected) {
            openConnectModal?.();
            return;
        }
        if (busy) return;
        reset();
        enterAnon();
    };

    return (
        <div className="space-y-1.5">
            <button
                onClick={handleClick}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded border border-fuchsia-500/60 bg-gradient-to-r from-fuchsia-500/15 via-fuchsia-500/10 to-fuchsia-500/15 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-fuchsia-200 shadow-[0_0_20px_rgba(217,70,239,0.10)] transition-all hover:from-fuchsia-500/25 hover:to-fuchsia-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {busy ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isPending ? 'Confirm in wallet…' : 'Entering the dojo…'}
                    </>
                ) : !isConnected ? (
                    <>
                        <Wallet className="h-4 w-4" />
                        Connect & enter — {feeLabel}
                    </>
                ) : (
                    <>
                        <Sword className="h-4 w-4" />
                        Enter Budokai #{currentBudokaiId} — {feeLabel}
                    </>
                )}
            </button>
            <p className="text-[10px] tracking-wider text-zinc-500">
                Anonymous civilian — no NFT needed. Mint SubZERO above to also get
                revivability + persistent honor between Budokais.
            </p>
            {error && (
                <p className="text-[10px] text-rose-400 break-words">
                    {error.message.slice(0, 200)}
                </p>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* StepLadder — three-step path with smart Mint button + Discord              */
/* -------------------------------------------------------------------------- */

function StepLadder({isConnected, onAfterMint}: {isConnected: boolean; onAfterMint?: () => void}) {
    const {openConnectModal} = useConnectModal();
    const {data: kitInfoRaw} = useKitInfo(FREE_KIT_ID);
    const kitInfo = kitInfoRaw as KitInfo | undefined;
    const buyKit = useBuyKit();

    const [showSuccess, setShowSuccess] = useState(false);
    const [hasMinted, setHasMinted] = useState(false);

    const isMinting = buyKit.isPending;

    const handlePrimary = async () => {
        if (!isConnected) {
            openConnectModal?.();
            return;
        }
        if (!kitInfo) return;
        try {
            await buyKit.mutateAsync({
                kitId: FREE_KIT_ID,
                quantity: 1,
                pricePerKit: kitInfo.priceInETH,
            });
            setHasMinted(true);
            setShowSuccess(true);
            // Alchemy NFT API can take 30–90s to surface a fresh mint. `useMySamurai`
            // bypasses tanstack-query invalidation, so we drive the parent's refetch on
            // a 10s cadence for ~90s — once Alchemy indexes the SubZERO, hasZeroNfts
            // flips and SamuraiDojoModule swaps in the regular dojo UI automatically.
            if (onAfterMint) {
                let attempts = 0;
                const interval = setInterval(() => {
                    attempts += 1;
                    onAfterMint();
                    if (attempts >= 9) clearInterval(interval);
                }, 10_000);
            }
        } catch {
            // Errors surfaced via notifications by useBuyKit.
        }
    };

    return (
        <div className="space-y-3">
            <Step
                index={1}
                title="Mint your SubZERO"
                subtitle="Free fighter, yours forever."
                done={hasMinted}
                action={
                    <button
                        onClick={handlePrimary}
                        disabled={isMinting || (isConnected && !kitInfo)}
                        className="flex w-full items-center justify-center gap-2 rounded border border-yellow-500/60 bg-gradient-to-r from-yellow-500/15 via-yellow-500/10 to-yellow-500/15 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.10)] transition-all hover:from-yellow-500/25 hover:to-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isMinting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Minting...
                            </>
                        ) : !isConnected ? (
                            <>
                                <Wallet className="h-4 w-4" />
                                Connect &amp; mint free
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Mint SubZERO free
                            </>
                        )}
                    </button>
                }
            />

            <Step
                index={2}
                title="Enter the next Budokai"
                subtitle="No mint required. Fight as anonymous civilian. Win $ZERO."
                done={false}
                action={<AnonymousEntryAction />}
            />

            <Step
                index={3}
                title="Get pinged on Discord"
                subtitle="We ping #budokai-live when battles start."
                done={false}
                action={
                    <a
                        href={DISCORD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded border border-indigo-500/50 bg-indigo-500/10 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-indigo-300 transition-colors hover:bg-indigo-500/20"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Join Discord
                    </a>
                }
            />

            <MintSuccessModal
                open={showSuccess}
                onClose={() => setShowSuccess(false)}
                kitType="free"
                quantity={1}
            />
        </div>
    );
}

function Step({
    index,
    title,
    subtitle,
    done,
    locked,
    action,
}: {
    index: number;
    title: string;
    subtitle: string;
    done: boolean;
    locked?: boolean;
    action: React.ReactNode;
}) {
    return (
        <div className={`rounded border ${done ? 'border-green-500/30 bg-green-500/5' : locked ? 'border-zinc-900 bg-zinc-950/40 opacity-60' : 'border-zinc-800 bg-zinc-950/60'} p-4`}>
            <div className="mb-3 flex items-center gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${done ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-zinc-700 bg-black text-zinc-400'} font-mono text-xs font-bold`}>
                    {done ? <Check className="h-3.5 w-3.5" /> : index}
                </span>
                <div className="min-w-0">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-white">{title}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">{subtitle}</p>
                </div>
            </div>
            {action}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* HowItWorks — collapsible explainer for the 5% who read                     */
/* -------------------------------------------------------------------------- */

function HowItWorks() {
    const [open, setOpen] = useState(false);
    return (
        <details
            open={open}
            onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
            className="rounded border border-zinc-900 bg-zinc-950/40"
        >
            <summary className="cursor-pointer list-none px-4 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 hover:text-zinc-300">
                {open ? '▾' : '▸'} How it works
            </summary>
            <div className="space-y-2 px-4 pb-4 text-[11px] text-zinc-400">
                <p>
                    <span className="font-bold text-zinc-200">It's an on-chain Rumble.</span>{' '}
                    Every Budokai pulls fighters into a single bracket. The contract resolves the
                    battles deterministically from a block hash — no admin, no rigging.
                </p>
                <p>
                    <span className="font-bold text-zinc-200">Civilian mode.</span>{' '}
                    Any AdrianZERO (including SubZERO) can fight as a Civilian with derived power
                    1–15. Underdog mode — one civilian per wallet, per Budokai.
                </p>
                <p>
                    <span className="font-bold text-zinc-200">The pot.</span>{' '}
                    Entry fees + seed pool go to the champion in $ZERO. Some Budokais run free
                    with a sponsored seed.
                </p>
                <p>
                    <span className="font-bold text-zinc-200">KO &amp; revive.</span>{' '}
                    Lose and your fighter goes down. Pay Senzu (SR × 10 $ZERO) to revive for the
                    next Budokai.
                </p>
            </div>
        </details>
    );
}
