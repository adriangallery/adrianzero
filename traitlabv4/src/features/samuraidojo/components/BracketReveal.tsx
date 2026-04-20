import {useEffect, useMemo, useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {X, Flame, Zap} from 'lucide-react';
import {createPublicClient, http, parseAbiItem} from 'viem';
import {base} from 'viem/chains';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {buildAlchemyRpcUrls} from '@/config/alchemy';
import {SAMURAI_DOJO_ABI} from '@/lib/web3/abi';
import type {MatchResult} from '../types';

interface BracketRevealProps {
    open: boolean;
    onClose: () => void;
    budokaiId: number | null;
}

function getSamuraiImageUrl(tokenId: number): string {
    return `https://adrianlab.vercel.app/api/render/${tokenId}.png`;
}

const MATCH_RESOLVED_EVENT = parseAbiItem(
    'event MatchResolved(uint256 indexed budokaiId, uint8 round, uint256 tokenA, uint256 tokenB, uint256 winner, bool kaioken)'
);

// blockhash expires after 256 blocks on Base, so resolveBudokai MUST land in that window.
// A 300-block lookahead from resolveBlock safely covers the commit + resolve txs.
const RESOLVE_WINDOW_BLOCKS = 300n;

function useMatchLogs(budokaiId: number | null) {
    const [matches, setMatches] = useState<MatchResult[]>([]);
    const [loading, setLoading] = useState(false);

    const client = useMemo(() => {
        const urls = buildAlchemyRpcUrls();
        return createPublicClient({chain: base, transport: http(urls[0], {retryCount: 3})});
    }, []);

    useEffect(() => {
        if (budokaiId == null) return;
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                // Read resolveBlock from the contract so we can scan a tight range.
                // Alchemy rejects 'earliest' → 'latest' on Base (too many blocks).
                const info = (await client.readContract({
                    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                    abi: SAMURAI_DOJO_ABI,
                    functionName: 'getBudokaiInfo',
                    args: [BigInt(budokaiId)],
                })) as readonly [bigint, bigint, bigint, bigint, bigint, number, number, bigint];
                const resolveBlock = info[4];
                if (cancelled) return;
                if (resolveBlock === 0n) {
                    setMatches([]);
                    return;
                }
                const logs = await client.getLogs({
                    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                    event: MATCH_RESOLVED_EVENT,
                    args: {budokaiId: BigInt(budokaiId)},
                    fromBlock: resolveBlock,
                    toBlock: resolveBlock + RESOLVE_WINDOW_BLOCKS,
                });
                if (cancelled) return;
                const parsed: MatchResult[] = logs.map((log) => ({
                    budokaiId: Number(log.args.budokaiId ?? 0n),
                    round: Number(log.args.round ?? 0),
                    tokenA: Number(log.args.tokenA ?? 0n),
                    tokenB: Number(log.args.tokenB ?? 0n),
                    winner: Number(log.args.winner ?? 0n),
                    kaioken: !!log.args.kaioken,
                }));
                // Chronological order = ascending round, then ascending log index (natural order from RPC).
                parsed.sort((a, b) => a.round - b.round);
                setMatches(parsed);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [budokaiId, client]);

    return {matches, loading};
}

export function BracketReveal({open, onClose, budokaiId}: BracketRevealProps) {
    const {matches, loading} = useMatchLogs(open ? budokaiId : null);
    const [cursor, setCursor] = useState(0);

    // Auto-advance each match, ~1200ms per fight
    useEffect(() => {
        if (!open) {
            setCursor(0);
            return;
        }
        if (matches.length === 0) return;
        if (cursor >= matches.length) return;
        const t = setTimeout(() => setCursor((c) => c + 1), 1200);
        return () => clearTimeout(t);
    }, [cursor, matches.length, open]);

    const visible = matches.slice(0, cursor);
    const groupedByRound = useMemo(() => {
        const map = new Map<number, MatchResult[]>();
        for (const m of visible) {
            if (!map.has(m.round)) map.set(m.round, []);
            map.get(m.round)!.push(m);
        }
        return Array.from(map.entries()).sort(([a], [b]) => a - b);
    }, [visible]);

    const totalRounds = matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;

    return (
        <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/95 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black">
                    <Dialog.Title className="sr-only">Bracket replay — Budokai {budokaiId}</Dialog.Title>

                    <div className="flex items-center justify-between border-b border-zinc-900 px-6 py-3">
                        <div>
                            <h2 className="text-lg font-bold tracking-[0.3em] uppercase text-red-500">
                                Budokai {budokaiId ?? '—'}
                            </h2>
                            <p className="text-[9px] tracking-wider text-zinc-600">
                                {loading ? 'loading matches...' : `${visible.length}/${matches.length} fights revealed`}
                                {totalRounds > 0 && ` · ${totalRounds} rounds`}
                            </p>
                        </div>
                        <Dialog.Close className="rounded-full bg-zinc-900 p-2 text-zinc-400 hover:text-white">
                            <X className="h-4 w-4" />
                        </Dialog.Close>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        {loading && (
                            <div className="flex h-40 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                            </div>
                        )}

                        {!loading && matches.length === 0 && (
                            <div className="flex h-40 items-center justify-center text-[11px] text-zinc-500">
                                No matches indexed yet. Budokai may not be resolved.
                            </div>
                        )}

                        {groupedByRound.map(([round, rms]) => (
                            <div key={round} className="mb-8">
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">
                                        Round {round}
                                        {round === totalRounds && ' — Final'}
                                    </span>
                                    <div className="h-px flex-1 bg-zinc-900" />
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {rms.map((m, i) => (
                                        <MatchCard key={`${round}-${i}`} match={m} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Replay controls */}
                    {!loading && matches.length > 0 && (
                        <div className="border-t border-zinc-900 px-6 py-3">
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => setCursor(matches.length)}
                                    className="rounded border border-zinc-800 px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white"
                                >
                                    Skip to end
                                </button>
                                <button
                                    onClick={() => setCursor(0)}
                                    className="rounded border border-zinc-800 px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white"
                                >
                                    Replay
                                </button>
                            </div>
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function MatchCard({match}: {match: MatchResult}) {
    const winnerIsA = match.winner === match.tokenA;
    return (
        <div className="relative overflow-hidden rounded border border-zinc-800 bg-zinc-950/70 p-3 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-2">
            {match.kaioken && (
                <div className="absolute right-2 top-2 flex items-center gap-1 rounded bg-red-600/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-red-400">
                    <Flame className="h-3 w-3" /> Kaioken
                </div>
            )}
            <div className="flex items-center justify-between gap-3">
                <SamuraiAvatar tokenId={match.tokenA} isWinner={winnerIsA} />
                <div className="text-center">
                    <Zap className={`mx-auto h-4 w-4 ${match.kaioken ? 'text-red-400' : 'text-zinc-600'}`} />
                    <span className="block text-[8px] font-mono uppercase tracking-wider text-zinc-600">vs</span>
                </div>
                <SamuraiAvatar tokenId={match.tokenB} isWinner={!winnerIsA} />
            </div>
        </div>
    );
}

function SamuraiAvatar({tokenId, isWinner}: {tokenId: number; isWinner: boolean}) {
    return (
        <div className="flex flex-1 flex-col items-center gap-1">
            <img
                src={getSamuraiImageUrl(tokenId)}
                alt={`#${tokenId}`}
                className={`h-16 w-16 rounded ${isWinner ? 'ring-2 ring-yellow-400' : 'opacity-40 saturate-0'}`}
                style={{imageRendering: 'pixelated'}}
            />
            <span
                className={`font-mono text-[9px] uppercase ${
                    isWinner ? 'text-yellow-400' : 'text-zinc-600'
                }`}
            >
                #{tokenId}
            </span>
        </div>
    );
}
