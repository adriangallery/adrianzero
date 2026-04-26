import {useEffect, useMemo, useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {AnimatePresence, motion} from 'framer-motion';
import {X} from 'lucide-react';
import {createPublicClient, http, parseAbiItem} from 'viem';
import {base} from 'viem/chains';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {buildAlchemyRpcUrls} from '@/config/alchemy';
import {SAMURAI_DOJO_ABI} from '@/lib/web3/abi';
import type {MatchResult} from '../types';
import {useBudokaiTheme} from '../hooks/useBudokaiTheme';
import {BudokaiChronicle} from './BudokaiChronicle';

interface BracketRevealProps {
    open: boolean;
    onClose: () => void;
    budokaiId: number | null;
}

interface BudokaiSnapshot {
    pool: bigint;
    entryCount: number;
    champion: number;
    runnerUp: number;
}

const MATCH_RESOLVED_EVENT = parseAbiItem(
    'event MatchResolved(uint256 indexed budokaiId, uint8 round, uint256 tokenA, uint256 tokenB, uint256 winner, bool kaioken)'
);

// blockhash expires after 256 blocks on Base, so resolveBudokai MUST land in that window.
// RESOLVE_BLOCK_DELAY is 5, so resolve is only callable from resolveBlock + 5 onwards.
// Alchemy free tier caps eth_getLogs at 10 blocks per call, so we chunk AND parallelize.
const RESOLVE_DELAY_BLOCKS = 5n;
const RESOLVE_WINDOW_BLOCKS = 256n;
const CHUNK_SIZE = 10n;

const CACHE_VERSION = 'v2';
const cacheKey = (budokaiId: number) => `budokai-bracket-${CACHE_VERSION}-${budokaiId}`;

interface StaticSnapshotJson {
    id: number;
    pool: string;
    entryCount: number;
    resolveBlock: number;
    resolveTx?: string;
    matches: Array<{round: number; tokenA: number; tokenB: number; winner: number; kaioken: boolean}>;
    senryoku?: Record<string, number>;
    champion: number;
    runnerUp: number;
}

async function loadFromStaticSnapshot(
    budokaiId: number,
): Promise<{matches: MatchResult[]; snapshot: BudokaiSnapshot} | null> {
    try {
        // 'default' (vs force-cache) lets a freshly-published snapshot override a previously
        // cached 404/HTML for the same path. Static JSON is small; the round-trip is cheap.
        const res = await fetch(`/budokai/${budokaiId}.json`, {cache: 'default'});
        if (!res.ok) return null;
        const data = (await res.json()) as StaticSnapshotJson;
        const matches: MatchResult[] = data.matches.map((m) => ({
            budokaiId,
            round: m.round,
            tokenA: m.tokenA,
            tokenB: m.tokenB,
            winner: m.winner,
            kaioken: m.kaioken,
        }));
        matches.sort((a, b) => a.round - b.round);
        const snapshot: BudokaiSnapshot = {
            pool: BigInt(data.pool),
            entryCount: data.entryCount,
            champion: data.champion,
            runnerUp: data.runnerUp,
        };
        return {matches, snapshot};
    } catch {
        return null;
    }
}

interface CacheEntry {
    blockNumber: string;
    matches: MatchResult[];
    snapshot: {
        pool: string;
        entryCount: number;
        champion: number;
        runnerUp: number;
    };
}

function readCache(budokaiId: number): CacheEntry | null {
    try {
        const raw = localStorage.getItem(cacheKey(budokaiId));
        return raw ? (JSON.parse(raw) as CacheEntry) : null;
    } catch {
        return null;
    }
}

function writeCache(budokaiId: number, entry: CacheEntry) {
    try {
        localStorage.setItem(cacheKey(budokaiId), JSON.stringify(entry));
    } catch {
        // ignore quota errors
    }
}

/**
 * Loads the snapshot needed for the opening ceremony intro (pool reveal,
 * warrior count, resolved status). Tries the static JSON first, falls back
 * to chain reads. The Chronicle component handles its own data load.
 */
function useBudokaiSnapshot(budokaiId: number | null) {
    const [snapshot, setSnapshot] = useState<BudokaiSnapshot | null>(null);
    const [stage, setStage] = useState<'reading' | 'scanning' | 'done'>('reading');
    const [hasMatches, setHasMatches] = useState(false);

    const client = useMemo(() => {
        const urls = buildAlchemyRpcUrls();
        return createPublicClient({chain: base, transport: http(urls[0], {retryCount: 0})});
    }, []);

    useEffect(() => {
        if (budokaiId == null) {
            setSnapshot(null);
            setHasMatches(false);
            setStage('reading');
            return;
        }
        let cancelled = false;
        setStage('reading');

        (async () => {
            // Static JSON first — instant, canonical for resolved budokais.
            const staticSnap = await loadFromStaticSnapshot(budokaiId);
            if (cancelled) return;
            if (staticSnap && staticSnap.matches.length > 0) {
                setSnapshot(staticSnap.snapshot);
                setHasMatches(true);
                setStage('done');
                return;
            }

            // Fall back to chain for unresolved or missing-snapshot budokais.
            try {
                const [info, champions] = (await Promise.all([
                    client.readContract({
                        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                        abi: SAMURAI_DOJO_ABI,
                        functionName: 'getBudokaiInfo',
                        args: [BigInt(budokaiId)],
                    }),
                    client.readContract({
                        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                        abi: SAMURAI_DOJO_ABI,
                        functionName: 'getChampions',
                        args: [BigInt(budokaiId)],
                    }),
                ])) as [
                    readonly [bigint, bigint, bigint, bigint, bigint, number, number, bigint],
                    readonly [bigint, bigint, readonly [bigint, bigint], readonly [bigint, bigint, bigint, bigint]],
                ];
                if (cancelled) return;
                const resolveBlock = info[4];
                const snap: BudokaiSnapshot = {
                    pool: info[1],
                    entryCount: Number(info[7]),
                    champion: Number(champions[0]),
                    runnerUp: Number(champions[1]),
                };
                setSnapshot(snap);

                if (resolveBlock === 0n) {
                    setHasMatches(false);
                    setStage('done');
                    return;
                }

                const cached = readCache(budokaiId);
                if (cached) {
                    setHasMatches(cached.matches.length > 0);
                    setStage('done');
                    return;
                }

                // Probe for any MatchResolved log to confirm the budokai actually
                // resolved on-chain (not just status). Stop on first hit.
                setStage('scanning');
                const start = resolveBlock + RESOLVE_DELAY_BLOCKS;
                const end = resolveBlock + RESOLVE_WINDOW_BLOCKS;
                for (let from = start; from <= end; from += CHUNK_SIZE) {
                    if (cancelled) return;
                    const to = from + CHUNK_SIZE - 1n > end ? end : from + CHUNK_SIZE - 1n;
                    try {
                        const chunk = await client.getLogs({
                            address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                            event: MATCH_RESOLVED_EVENT,
                            args: {budokaiId: BigInt(budokaiId)},
                            fromBlock: from,
                            toBlock: to,
                        });
                        if (chunk.length > 0) {
                            if (cancelled) return;
                            setHasMatches(true);
                            writeCache(budokaiId, {
                                blockNumber: chunk[0].blockNumber?.toString() ?? '0',
                                matches: [],
                                snapshot: {
                                    pool: snap.pool.toString(),
                                    entryCount: snap.entryCount,
                                    champion: snap.champion,
                                    runnerUp: snap.runnerUp,
                                },
                            });
                            setStage('done');
                            return;
                        }
                    } catch {
                        // ignore single-chunk failures
                    }
                }
                if (!cancelled) {
                    setHasMatches(false);
                    setStage('done');
                }
            } catch {
                if (!cancelled) setStage('done');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [budokaiId, client]);

    return {snapshot, hasMatches, stage};
}

const INTRO_BEAT_MS = 1500;

type Phase = 'intro' | 'scanning' | 'chronicle';

export function BracketReveal({open, onClose, budokaiId}: BracketRevealProps) {
    const {snapshot, hasMatches, stage} = useBudokaiSnapshot(open ? budokaiId : null);
    const [phase, setPhase] = useState<Phase>('intro');
    const [introBeat, setIntroBeat] = useState(0);

    // Reset on close
    useEffect(() => {
        if (!open) {
            setPhase('intro');
            setIntroBeat(0);
        }
    }, [open]);

    // Theme drives an optional extra intro beat (tagline). Read here so the beat-count
    // calc stays in sync with the IntroSequence render.
    const {theme} = useBudokaiTheme(budokaiId !== null ? BigInt(budokaiId) : null);
    const introBeatCount = theme?.tagline ? 5 : 4;

    // Advance intro beats; transition to scanning or chronicle when intro ends.
    useEffect(() => {
        if (!open || phase !== 'intro') return;
        if (introBeat >= introBeatCount - 1) {
            setPhase(stage === 'done' ? 'chronicle' : 'scanning');
            return;
        }
        const t = setTimeout(() => setIntroBeat((b) => b + 1), INTRO_BEAT_MS);
        return () => clearTimeout(t);
    }, [open, phase, introBeat, stage, introBeatCount]);

    // When data lands during scanning phase, switch to chronicle.
    useEffect(() => {
        if (phase !== 'scanning') return;
        if (stage === 'done') setPhase('chronicle');
    }, [phase, stage]);

    return (
        <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/95 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <Dialog.Content
                    aria-describedby={undefined}
                    className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black"
                >
                    <Dialog.Title className="sr-only">Bracket replay — Budokai {budokaiId}</Dialog.Title>

                    <div className="relative flex items-center justify-center border-b border-zinc-900 px-6 py-3 pt-20 sm:pt-24">
                        <div className="text-center">
                            <h2 className="text-lg font-bold tracking-[0.3em] uppercase text-red-500">
                                Budokai {budokaiId ?? '—'}
                            </h2>
                            <p className="text-[9px] tracking-wider text-zinc-600">
                                {phase === 'intro' && 'opening ceremony...'}
                                {phase === 'scanning' && 'reading the chronicles...'}
                                {phase === 'chronicle' &&
                                    (hasMatches ? 'the chronicles' : 'budokai not yet resolved')}
                            </p>
                        </div>
                        <Dialog.Close className="absolute right-4 top-20 rounded-full bg-zinc-900 p-2 text-zinc-400 hover:text-white sm:top-24">
                            <X className="h-4 w-4" />
                        </Dialog.Close>
                    </div>

                    <div className="relative flex-1 overflow-hidden">
                        <AnimatePresence mode="wait">
                            {phase === 'intro' && (
                                <IntroSequence
                                    key="intro"
                                    beat={introBeat}
                                    budokaiId={budokaiId}
                                    snapshot={snapshot}
                                    tagline={theme?.tagline}
                                />
                            )}

                            {phase === 'scanning' && <ScanningSequence key="scan" />}

                            {phase === 'chronicle' && hasMatches && budokaiId != null && (
                                <motion.div
                                    key="chronicle"
                                    className="h-full overflow-y-auto"
                                    initial={{opacity: 0}}
                                    animate={{opacity: 1}}
                                    transition={{duration: 0.4}}
                                >
                                    <BudokaiChronicle budokaiId={budokaiId} standalone={false} />
                                </motion.div>
                            )}

                            {phase === 'chronicle' && !hasMatches && (
                                <motion.div
                                    key="empty"
                                    className="flex h-full items-center justify-center"
                                    initial={{opacity: 0}}
                                    animate={{opacity: 1}}
                                >
                                    <p className="text-[11px] tracking-wider text-zinc-500">
                                        Budokai not yet resolved. Check back after the entry window closes.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function IntroSequence({
    beat,
    budokaiId,
    snapshot,
    tagline,
}: {
    beat: number;
    budokaiId: number | null;
    snapshot: BudokaiSnapshot | null;
    tagline?: string;
}) {
    const poolZero = snapshot ? Number(snapshot.pool / 10n ** 18n) : 0;
    // Tagline is inserted as beat 1.5 — between the Budokai number and the prize pool reveal.
    // Uses the v6 getBudokaiTheme.tagline ("Civilian Rebellion", etc).
    const beats = [
        {top: '天下一武道会', bottom: 'TENKAICHI BUDOKAI'},
        {top: `BUDOKAI ${budokaiId ?? '—'}`, bottom: snapshot ? `${snapshot.entryCount} WARRIORS` : '...'},
        ...(tagline ? [{top: tagline.toUpperCase(), bottom: 'THIS BUDOKAI', accent: 'fuchsia' as const}] : []),
        {top: `${poolZero.toLocaleString()} $ZERO`, bottom: 'PRIZE POOL'},
        {top: '決勝戦開始', bottom: 'THE BRACKET OPENS'},
    ];
    const current = beats[Math.min(beat, beats.length - 1)];
    const accent = (current as {accent?: 'fuchsia'}).accent === 'fuchsia' ? 'text-fuchsia-400' : 'text-red-500';
    return (
        <motion.div
            className="flex h-full items-center justify-center"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
        >
            <AnimatePresence>
                <motion.div
                    key={beat}
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                    transition={{duration: 0.25, ease: 'easeOut'}}
                    className="absolute text-center"
                >
                    <motion.h3
                        animate={{scale: [1, 1.035, 1]}}
                        transition={{duration: 1.5, ease: 'easeInOut', repeat: Infinity}}
                        className={`font-mono text-4xl font-bold tracking-[0.3em] sm:text-6xl ${accent}`}
                    >
                        {current.top}
                    </motion.h3>
                    <p className="mt-3 text-[10px] uppercase tracking-[0.4em] text-zinc-500 sm:text-xs">
                        {current.bottom}
                    </p>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}

function ScanningSequence() {
    const messages = [
        'reading the chronicles',
        'scanning the dojo',
        'summoning the spirits',
        'awaiting the blockhash',
    ];
    const [idx, setIdx] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setIdx((i) => (i + 1) % messages.length), 1200);
        return () => clearInterval(t);
    }, [messages.length]);
    return (
        <motion.div
            className="flex h-full flex-col items-center justify-center gap-6"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
        >
            <div className="relative h-16 w-16">
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                <div className="absolute inset-2 animate-pulse rounded-full border border-red-800" />
            </div>
            <AnimatePresence mode="wait">
                <motion.p
                    key={idx}
                    initial={{opacity: 0, y: 4}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: -4}}
                    transition={{duration: 0.25}}
                    className="text-[10px] uppercase tracking-[0.4em] text-zinc-500"
                >
                    {messages[idx]}...
                </motion.p>
            </AnimatePresence>
        </motion.div>
    );
}
