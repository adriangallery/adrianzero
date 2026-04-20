import {useEffect, useState} from 'react';
import {useAccount} from 'wagmi';
import * as Dialog from '@radix-ui/react-dialog';
import {X, Loader2, Sword, Sparkles, Zap} from 'lucide-react';
import {useWalletPrompt} from '@/hooks/useWalletPrompt';
import {BUDOKAI_STATUS} from '@/lib/web3/abi';
import {useDojoStore} from '../store/dojoStore';
import {useEnterBudokai, useReviveSamurai} from '../hooks/useDojoActions';
import {ENTRY_FEE_ZERO, SENZU_FEE_ZERO, type BudokaiInfo, type Samurai} from '../types';
import {ScouterOverlay} from './ScouterOverlay';

interface SamuraiDetailModalProps {
    tokenId: number | null;
    senryoku: number;
    isKnockedOut: boolean;
    isEntered: boolean;
    isMine: boolean;
    budokaiInfo: BudokaiInfo | null;
    zeroBalance: number;
    open: boolean;
    onClose: () => void;
    onActionSuccess: () => void;
}

function getSamuraiImageUrl(tokenId: number): string {
    return `https://adrianlab.vercel.app/api/render/${tokenId}.png`;
}

async function fetchSamuraiMeta(tokenId: number): Promise<Samurai | null> {
    try {
        const res = await fetch(`https://adrianlab.vercel.app/api/metadata/${tokenId}`);
        if (!res.ok) return null;
        const data = await res.json();
        const attrs: Array<{trait_type: string; value: string | number}> = data.attributes ?? [];
        const get = (key: string) => attrs.find((a) => a.trait_type === key)?.value;
        return {
            tokenId,
            name: data.name ?? `SamuraiZERO #${tokenId}`,
            senryoku: Number(get('Senryoku (戦力)') ?? 0),
            tier: String(get('Senryoku Tier (戦力位)') ?? 'Unknown'),
            weapon: get('WEAPON') as string | undefined,
            mask: get('Mask') as string | undefined,
            armour: get('Armour') as string | undefined,
            background: get('Background') as string | undefined,
        };
    } catch {
        return null;
    }
}

export function SamuraiDetailModal({
    tokenId,
    senryoku,
    isKnockedOut,
    isEntered,
    isMine,
    budokaiInfo,
    zeroBalance,
    open,
    onClose,
    onActionSuccess,
}: SamuraiDetailModalProps) {
    const {isConnected} = useAccount();
    const {requireWallet} = useWalletPrompt();
    const {showSuccess} = useDojoStore();
    const [meta, setMeta] = useState<Samurai | null>(null);

    const feeLabel = isKnockedOut ? SENZU_FEE_ZERO : ENTRY_FEE_ZERO;
    const {enter, isPending: isEntering, isConfirming: isEnterConfirming, isConfirmed: isEnterConfirmed, error: enterError, reset: resetEnter} = useEnterBudokai();
    const {revive, isPending: isReviving, isConfirming: isReviveConfirming, isConfirmed: isReviveConfirmed, error: reviveError, reset: resetRevive} = useReviveSamurai();

    // Load metadata when modal opens
    useEffect(() => {
        if (!open || !tokenId) return;
        setMeta(null);
        fetchSamuraiMeta(tokenId).then(setMeta);
    }, [open, tokenId]);

    // Fire success callback
    useEffect(() => {
        if (isEnterConfirmed && tokenId) {
            showSuccess('enter', tokenId);
            onActionSuccess();
            resetEnter();
        }
    }, [isEnterConfirmed, tokenId, showSuccess, onActionSuccess, resetEnter]);
    useEffect(() => {
        if (isReviveConfirmed && tokenId) {
            showSuccess('revive', tokenId);
            onActionSuccess();
            resetRevive();
        }
    }, [isReviveConfirmed, tokenId, showSuccess, onActionSuccess, resetRevive]);

    if (!tokenId) return null;

    const budokaiOpen = budokaiInfo?.status === BUDOKAI_STATUS.Open;
    const now = Math.floor(Date.now() / 1000);
    const withinWindow = budokaiInfo && now >= budokaiInfo.entryStart && now <= budokaiInfo.entryEnd;
    const canEnter = !isKnockedOut && !isEntered && isMine && budokaiOpen && withinWindow;
    const canRevive = isKnockedOut && isMine && budokaiOpen;
    const insufficientBalance = zeroBalance < feeLabel;
    const isBusy = isEntering || isEnterConfirming || isReviving || isReviveConfirming;

    const handlePrimary = () => {
        if (!isConnected) {
            requireWallet();
            return;
        }
        if (isKnockedOut) {
            revive(tokenId);
        } else {
            enter(tokenId);
        }
    };

    const primaryLabel = (() => {
        if (!isConnected) return 'Connect Wallet';
        if (insufficientBalance) return `Need ${feeLabel.toLocaleString()} $ZERO`;
        if (isKnockedOut) return `Senzu Bean (${feeLabel.toLocaleString()} $ZERO)`;
        return `Enter Budokai (${feeLabel.toLocaleString()} $ZERO)`;
    })();

    const primaryDisabled =
        isBusy
        || insufficientBalance
        || (!isKnockedOut && !canEnter)
        || (isKnockedOut && !canRevive);

    const errorMsg = (enterError as Error | null)?.message || (reviveError as Error | null)?.message;

    return (
        <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(560px,95vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
                    <Dialog.Title className="sr-only">SamuraiZERO #{tokenId}</Dialog.Title>

                    <div className="relative">
                        <img
                            src={getSamuraiImageUrl(tokenId)}
                            alt={`SamuraiZERO #${tokenId}`}
                            className={`aspect-square w-full object-contain ${isKnockedOut ? 'opacity-50 saturate-0' : ''}`}
                            style={{imageRendering: 'pixelated'}}
                        />

                        <Dialog.Close className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-zinc-400 backdrop-blur hover:text-white">
                            <X className="h-4 w-4" />
                        </Dialog.Close>

                        {isKnockedOut && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-900/20">
                                <span className="rounded border-2 border-red-600 bg-black/80 px-6 py-2 text-lg font-bold uppercase tracking-[0.4em] text-red-500">
                                    Knocked Out
                                </span>
                            </div>
                        )}

                        <div className="absolute left-3 bottom-3">
                            <ScouterOverlay senryoku={senryoku} tier={meta?.tier} animate={open} />
                        </div>
                    </div>

                    <div className="space-y-4 p-5">
                        <div>
                            <h2 className="text-xl font-bold text-white">{meta?.name ?? `SamuraiZERO #${tokenId}`}</h2>
                            {meta?.tier && (
                                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">{meta.tier}</p>
                            )}
                        </div>

                        {meta && (
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                {meta.weapon && <Attr label="Weapon" value={meta.weapon} icon={<Sword className="h-3 w-3" />} />}
                                {meta.mask && <Attr label="Mask" value={meta.mask} />}
                                {meta.armour && <Attr label="Armour" value={meta.armour} />}
                                {meta.background && <Attr label="Background" value={meta.background} />}
                            </div>
                        )}

                        {isEntered && !isKnockedOut && (
                            <div className="rounded border border-yellow-600/30 bg-yellow-900/10 p-3 text-[10px] text-yellow-400">
                                <Sparkles className="mr-1 inline h-3 w-3" /> Already entered in the current Budokai.
                            </div>
                        )}

                        {!isMine && (
                            <div className="rounded border border-zinc-700 bg-zinc-900 p-3 text-[10px] text-zinc-400">
                                You don't own this samurai. Buy it on OpenSea to enter it in the next Budokai.
                            </div>
                        )}

                        {isKnockedOut && isMine && (
                            <div className="rounded border border-red-600/30 bg-red-900/10 p-3 text-[10px] text-red-300">
                                <Zap className="mr-1 inline h-3 w-3" /> Your samurai is unconscious. Pay 10,000 $ZERO (1,000 burned, 9,000 to the next Budokai pool) to revive.
                            </div>
                        )}

                        <button
                            onClick={handlePrimary}
                            disabled={primaryDisabled}
                            className={`w-full rounded px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all
                ${primaryDisabled
                                    ? 'cursor-not-allowed bg-zinc-800 text-zinc-600'
                                    : isKnockedOut
                                    ? 'bg-red-600 text-white hover:bg-red-500'
                                    : 'bg-yellow-400 text-black hover:bg-yellow-300'
                                }`}
                        >
                            {isBusy ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {isEntering || isEnterConfirming ? 'Entering...' : 'Reviving...'}
                                </span>
                            ) : (
                                primaryLabel
                            )}
                        </button>

                        {errorMsg && (
                            <p className="text-[10px] text-red-400">{errorMsg.split('\n')[0]}</p>
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function Attr({label, value, icon}: {label: string; value: string; icon?: React.ReactNode}) {
    return (
        <div className="flex flex-col rounded bg-zinc-900 p-2">
            <span className="text-[8px] uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                {icon}
                {label}
            </span>
            <span className="truncate text-[10px] font-mono text-zinc-300">{value}</span>
        </div>
    );
}
