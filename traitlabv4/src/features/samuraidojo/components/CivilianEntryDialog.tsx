// Modal triggered by the BudokaiBOT /budokai-enter slash command. Lands
// the user on /budokai with a deep-link query string and walks them
// through: connect wallet → confirm linked → pick civilian token →
// enter on-chain. Skin metadata (name + image of an external NFT like
// a Pudgy Penguin) is purely cosmetic — narrator picks it up from
// budokai_civil_intents and renders it in the round embed instead of
// the generic "civilian #N" string.

import {useEffect, useMemo, useState} from 'react';
import {useAccount} from 'wagmi';
import * as Dialog from '@radix-ui/react-dialog';
import {X, Loader2, ExternalLink, AlertCircle, CheckCircle2} from 'lucide-react';
import {useWalletPrompt} from '@/hooks/useWalletPrompt';
import {BUDOKAI_STATUS} from '@/lib/web3/abi';
import {useEnterBudokai} from '../hooks/useDojoActions';
import {useMySamurai} from '../hooks/useMySamurai';
import {useCurrentBudokaiId, useBudokaiInfo} from '../hooks/useDojoContract';
import {useBudokaiCounters} from '../hooks/useBudokaiCounters';
import {createCivilianIntent, confirmIntent, type CreateIntentRequest} from '../lib/budokaiApi';
import type {CivilianRepresentation} from '../hooks/useCivilianEntryFlow';

interface CivilianEntryDialogProps {
    open: boolean;
    discordUserId: string;
    guildId: string | null;
    representation: CivilianRepresentation | null;
    onClose: () => void;
}

type Phase =
    | 'idle' // initial render, waiting for wallet
    | 'preparing' // POSTing to backend to create intent
    | 'ready' // intent created, ready to sign
    | 'signing' // waiting for wallet signature
    | 'confirming' // tx submitted, waiting for receipt
    | 'success' // tx confirmed
    | 'error';

export function CivilianEntryDialog({
    open,
    discordUserId,
    guildId,
    representation,
    onClose,
}: CivilianEntryDialogProps) {
    const {isConnected, address} = useAccount();
    const {requireWallet} = useWalletPrompt();
    const {currentBudokaiId} = useCurrentBudokaiId();
    const {info: budokaiInfo} = useBudokaiInfo(currentBudokaiId || undefined);
    const {counters: budokaiCounters} = useBudokaiCounters(
        currentBudokaiId ? BigInt(currentBudokaiId) : null,
    );
    const {civilians, isLoading: tokensLoading} = useMySamurai();

    const [phase, setPhase] = useState<Phase>('idle');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [intentId, setIntentId] = useState<number | null>(null);
    const [linkedWallet, setLinkedWallet] = useState<string | null>(null);
    const [pickedTokenId, setPickedTokenId] = useState<number | null>(null);

    const {enter, isPending: isSigning, isConfirming, isConfirmed, error: txError, txHash, reset} =
        useEnterBudokai();

    const isOpen = open && currentBudokaiId !== 0;
    const isFree =
        budokaiCounters?.freeEntry ||
        budokaiCounters?.entryFee === 0n;

    // Auto-pick first available civilian token. User can override below.
    useEffect(() => {
        if (pickedTokenId === null && civilians.length > 0) {
            setPickedTokenId(civilians[0]);
        }
    }, [civilians, pickedTokenId]);

    // Forward tx state into the dialog phase machine.
    useEffect(() => {
        if (isSigning) setPhase('signing');
        else if (isConfirming) setPhase('confirming');
        else if (isConfirmed) setPhase('success');
        else if (txError) {
            setPhase('error');
            setErrorMsg(txError.message);
        }
    }, [isSigning, isConfirming, isConfirmed, txError]);

    // Best-effort intent confirm ping (cosmetic — watcher promotes
    // independently on CivilianEntered).
    useEffect(() => {
        if (isConfirmed && txHash && intentId !== null && address) {
            confirmIntent(intentId, txHash, address).catch(() => {
                // Non-fatal; watcher will still promote.
            });
        }
    }, [isConfirmed, txHash, intentId, address]);

    const noActiveBudokai = currentBudokaiId === 0;
    const budokaiOpen = budokaiInfo?.status === BUDOKAI_STATUS.Open;

    async function handleEnter() {
        if (!isConnected) {
            requireWallet();
            return;
        }
        if (pickedTokenId === null) {
            setErrorMsg('Pick a civilian token to enter with.');
            setPhase('error');
            return;
        }
        if (!guildId) {
            setErrorMsg('Missing guildId — open this from a Discord /budokai-enter link.');
            setPhase('error');
            return;
        }

        setPhase('preparing');
        setErrorMsg('');
        try {
            const body: CreateIntentRequest = {
                discordUserId,
                guildId,
                representation: representation
                    ? {
                          chain: representation.chain,
                          contract: representation.contract,
                          tokenId: representation.tokenId,
                          name: representation.name,
                          imageUrl: representation.imageUrl,
                      }
                    : null,
            };
            const result = await createCivilianIntent(body);
            setIntentId(result.intentId);
            setLinkedWallet(result.wallet);

            // Sanity check: the connected wallet must match the linked one.
            if (address && result.wallet.toLowerCase() !== address.toLowerCase()) {
                setPhase('error');
                setErrorMsg(
                    `Connected wallet (${address.slice(0, 6)}…) doesn't match the wallet you /linked on Discord (${result.wallet.slice(
                        0,
                        6,
                    )}…). Switch wallet or run /unlink + /link again.`,
                );
                return;
            }

            setPhase('ready');
            // Fire the on-chain entry — phase will progress via tx state.
            enter(pickedTokenId);
        } catch (err) {
            setPhase('error');
            const msg = (err as Error).message;
            if (msg.includes('403')) {
                setErrorMsg('Wallet not linked. Run `/link 0xYourWallet` in Discord first.');
            } else if (msg.includes('409')) {
                setErrorMsg('No active Budokai right now. Try again when one opens.');
            } else {
                setErrorMsg(msg);
            }
        }
    }

    function reopenAndReset() {
        setPhase('idle');
        setErrorMsg('');
        setIntentId(null);
        reset();
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={(o) => !o && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/80 z-40" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(520px,92vw)] rounded-lg border border-zinc-700 bg-zinc-950 p-6 shadow-2xl">
                    <Dialog.Title className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                        🏯 Enter the Budokai
                    </Dialog.Title>
                    <Dialog.Close
                        onClick={onClose}
                        className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-200"
                    >
                        <X className="h-5 w-5" />
                    </Dialog.Close>

                    {noActiveBudokai ? (
                        <NoActiveBudokai onClose={onClose} />
                    ) : !budokaiOpen ? (
                        <BudokaiClosed status={budokaiInfo?.status} onClose={onClose} />
                    ) : phase === 'success' ? (
                        <SuccessPanel
                            representation={representation}
                            tokenId={pickedTokenId}
                            txHash={txHash}
                            onClose={onClose}
                        />
                    ) : (
                        <PreparePanel
                            phase={phase}
                            errorMsg={errorMsg}
                            representation={representation}
                            civilians={civilians}
                            pickedTokenId={pickedTokenId}
                            onPickToken={setPickedTokenId}
                            tokensLoading={tokensLoading}
                            isFree={isFree}
                            entryFeeZero={
                                budokaiCounters
                                    ? Number(budokaiCounters.entryFee / 10n ** 18n)
                                    : 0
                            }
                            isConnected={isConnected}
                            linkedWallet={linkedWallet}
                            address={address}
                            budokaiId={currentBudokaiId}
                            onEnter={handleEnter}
                            onRetry={reopenAndReset}
                        />
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function NoActiveBudokai({onClose}: {onClose: () => void}) {
    return (
        <div className="mt-4 text-zinc-300 text-sm">
            <p>No active Budokai right now.</p>
            <p className="mt-2 text-zinc-500">
                Come back when the next dojo opens — your /budokai-enter link will work
                automatically.
            </p>
            <button
                onClick={onClose}
                className="mt-4 w-full rounded border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-200 hover:bg-zinc-800"
            >
                Close
            </button>
        </div>
    );
}

function BudokaiClosed({status, onClose}: {status: number | undefined; onClose: () => void}) {
    const label =
        status === BUDOKAI_STATUS.Closed
            ? 'closed'
            : status === BUDOKAI_STATUS.Resolving
              ? 'resolving'
              : 'resolved';
    return (
        <div className="mt-4 text-zinc-300 text-sm">
            <p>This Budokai is already {label} — entries are locked.</p>
            <button
                onClick={onClose}
                className="mt-4 w-full rounded border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-200 hover:bg-zinc-800"
            >
                Close
            </button>
        </div>
    );
}

interface PreparePanelProps {
    phase: Phase;
    errorMsg: string;
    representation: CivilianRepresentation | null;
    civilians: number[];
    pickedTokenId: number | null;
    onPickToken: (id: number) => void;
    tokensLoading: boolean;
    isFree: boolean;
    entryFeeZero: number;
    isConnected: boolean;
    linkedWallet: string | null;
    address: string | undefined;
    budokaiId: number;
    onEnter: () => void;
    onRetry: () => void;
}

function PreparePanel(props: PreparePanelProps) {
    const {
        phase,
        errorMsg,
        representation,
        civilians,
        pickedTokenId,
        onPickToken,
        tokensLoading,
        isFree,
        entryFeeZero,
        isConnected,
        linkedWallet,
        address,
        budokaiId,
        onEnter,
        onRetry,
    } = props;

    const busy = phase === 'preparing' || phase === 'signing' || phase === 'confirming';
    const noCivilians = !tokensLoading && civilians.length === 0;

    return (
        <div className="mt-4 space-y-4">
            <p className="text-sm text-zinc-400">
                Joining <span className="text-zinc-100 font-mono">Budokai #{budokaiId}</span> as a
                civilian fighter.
            </p>

            {representation && (
                <SkinPreview rep={representation} />
            )}

            <div className="space-y-2">
                <div className="text-xs uppercase text-zinc-500 tracking-wide">
                    Your civilian fighter
                </div>
                {tokensLoading ? (
                    <div className="text-sm text-zinc-500 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading your AdrianZERO
                        holdings…
                    </div>
                ) : noCivilians ? (
                    <NoCiviliansHelp />
                ) : (
                    <CivilianPicker
                        civilians={civilians}
                        pickedTokenId={pickedTokenId}
                        onPick={onPickToken}
                    />
                )}
            </div>

            <div className="rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-400 flex justify-between">
                <span>Entry fee</span>
                <span className="text-zinc-100">
                    {isFree ? 'FREE' : `${entryFeeZero.toLocaleString()} ZERO`}
                </span>
            </div>

            {linkedWallet && address && linkedWallet.toLowerCase() !== address.toLowerCase() && (
                <ErrorBox>
                    Connected wallet doesn&apos;t match your Discord-linked wallet. Switch to{' '}
                    <span className="font-mono">{linkedWallet.slice(0, 6)}…{linkedWallet.slice(-4)}</span>.
                </ErrorBox>
            )}

            {phase === 'error' && <ErrorBox>{errorMsg}</ErrorBox>}

            <button
                onClick={phase === 'error' ? onRetry : onEnter}
                disabled={busy || noCivilians || !isConnected}
                className={`w-full rounded px-4 py-2 font-bold transition-colors ${
                    busy || noCivilians || !isConnected
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                }`}
            >
                {phase === 'preparing' ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Preparing intent…
                    </span>
                ) : phase === 'signing' ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Awaiting wallet signature…
                    </span>
                ) : phase === 'confirming' ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Confirming on-chain…
                    </span>
                ) : phase === 'error' ? (
                    'Try again'
                ) : !isConnected ? (
                    'Connect wallet to enter'
                ) : (
                    'Enter the Dojo'
                )}
            </button>
        </div>
    );
}

function SkinPreview({rep}: {rep: CivilianRepresentation}) {
    return (
        <div className="rounded border border-amber-500/40 bg-amber-500/5 p-3 flex items-center gap-3">
            {rep.imageUrl ? (
                <img
                    src={rep.imageUrl}
                    alt={rep.name}
                    className="h-14 w-14 rounded object-cover border border-amber-500/40"
                />
            ) : (
                <div className="h-14 w-14 rounded bg-amber-500/10 border border-amber-500/40 grid place-items-center text-2xl">
                    🎨
                </div>
            )}
            <div className="flex-1 min-w-0">
                <div className="text-xs uppercase text-amber-400/70 tracking-wide">Skin</div>
                <div className="text-sm text-zinc-100 truncate">{rep.name}</div>
                <div className="text-[10px] font-mono text-zinc-500 truncate">
                    {rep.contract.slice(0, 10)}…#{rep.tokenId}
                </div>
            </div>
        </div>
    );
}

function CivilianPicker({
    civilians,
    pickedTokenId,
    onPick,
}: {
    civilians: number[];
    pickedTokenId: number | null;
    onPick: (id: number) => void;
}) {
    if (civilians.length === 1) {
        return (
            <div className="rounded border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm">
                AdrianZERO <span className="font-mono">#{civilians[0]}</span>
            </div>
        );
    }
    return (
        <select
            value={pickedTokenId ?? ''}
            onChange={(e) => onPick(Number(e.target.value))}
            className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
            {civilians.map((id) => (
                <option key={id} value={id}>
                    AdrianZERO #{id}
                </option>
            ))}
        </select>
    );
}

function NoCiviliansHelp() {
    return (
        <div className="rounded border border-rose-500/40 bg-rose-500/5 p-3 text-sm text-zinc-300 space-y-2">
            <div className="flex items-center gap-2 text-rose-300">
                <AlertCircle className="h-4 w-4" />
                <span className="font-bold">No civilian token found</span>
            </div>
            <p>
                Civilian entry requires owning at least one AdrianZERO token. Pick one up from the
                shop or marketplace and try again.
            </p>
            <a
                href="https://adrianzero.com/shop"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-amber-400 hover:underline"
            >
                Open shop <ExternalLink className="h-3 w-3" />
            </a>
        </div>
    );
}

function ErrorBox({children}: {children: React.ReactNode}) {
    return (
        <div className="rounded border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 flex gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>{children}</div>
        </div>
    );
}

function SuccessPanel({
    representation,
    tokenId,
    txHash,
    onClose,
}: {
    representation: CivilianRepresentation | null;
    tokenId: number | null;
    txHash: string | undefined;
    onClose: () => void;
}) {
    return (
        <div className="mt-4 space-y-4">
            <div className="rounded border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5" />
                <div>
                    <div className="font-bold">You&apos;re in the dojo</div>
                    <div className="text-xs text-emerald-300/80 mt-1">
                        AdrianZERO #{tokenId}
                        {representation ? (
                            <>
                                {' '}as <span className="text-amber-300">{representation.name}</span>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
            {txHash && (
                <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs text-zinc-500 hover:text-amber-400 truncate font-mono"
                >
                    tx: {txHash}
                </a>
            )}
            <p className="text-sm text-zinc-400">
                The narrator will tag you in the live broadcast when your fighter shows up.
            </p>
            <button
                onClick={onClose}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-200 hover:bg-zinc-800"
            >
                Close
            </button>
        </div>
    );
}

// Lint hush: useMemo currently unused after the refactor — keeping the
// import slot so subsequent additions (e.g. memoised civilian filtering)
// don't have to re-import.
void useMemo;
