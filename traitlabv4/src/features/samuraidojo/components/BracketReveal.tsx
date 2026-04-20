import {useEffect, useMemo, useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {AnimatePresence, motion} from 'framer-motion';
import {X, Flame, Zap, Trophy} from 'lucide-react';
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

interface BudokaiSnapshot {
    pool: bigint;
    entryCount: number;
    champion: number;
    runnerUp: number;
}

function getSamuraiImageUrl(tokenId: number): string {
    return `https://adrianlab.vercel.app/api/render/${tokenId}.png`;
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

const CACHE_VERSION = 'v1';
const cacheKey = (budokaiId: number) => `budokai-bracket-${CACHE_VERSION}-${budokaiId}`;

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

function useBracketData(budokaiId: number | null) {
    const [matches, setMatches] = useState<MatchResult[]>([]);
    const [snapshot, setSnapshot] = useState<BudokaiSnapshot | null>(null);
    const [loading, setLoading] = useState(false);
    const [stage, setStage] = useState<'reading' | 'scanning' | 'done'>('reading');

    const client = useMemo(() => {
        const urls = buildAlchemyRpcUrls();
        return createPublicClient({chain: base, transport: http(urls[0], {retryCount: 3})});
    }, []);

    useEffect(() => {
        if (budokaiId == null) {
            setMatches([]);
            setSnapshot(null);
            setStage('reading');
            return;
        }
        let cancelled = false;
        setLoading(true);
        setStage('reading');
        (async () => {
            try {
                // Read info + champions in parallel — both needed regardless of cache state.
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
                    setMatches([]);
                    setStage('done');
                    return;
                }

                // Try cache — instant hit if we've scanned this budokai before.
                const cached = readCache(budokaiId);
                if (cached) {
                    const blockNumber = BigInt(cached.blockNumber);
                    const logs = await client.getLogs({
                        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                        event: MATCH_RESOLVED_EVENT,
                        args: {budokaiId: BigInt(budokaiId)},
                        fromBlock: blockNumber,
                        toBlock: blockNumber,
                    });
                    if (!cancelled && logs.length > 0) {
                        setMatches(parseMatches(logs));
                        setStage('done');
                        return;
                    }
                    // Cache was stale (reorg? shouldn't happen on Base, but be defensive) — fall through.
                }

                // Parallel scan across the entire valid window.
                setStage('scanning');
                const start = resolveBlock + RESOLVE_DELAY_BLOCKS;
                const end = resolveBlock + RESOLVE_WINDOW_BLOCKS;
                const ranges: Array<[bigint, bigint]> = [];
                for (let from = start; from <= end; from += CHUNK_SIZE) {
                    const to = from + CHUNK_SIZE - 1n > end ? end : from + CHUNK_SIZE - 1n;
                    ranges.push([from, to]);
                }
                const results = await Promise.all(
                    ranges.map(([from, to]) =>
                        client
                            .getLogs({
                                address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                                event: MATCH_RESOLVED_EVENT,
                                args: {budokaiId: BigInt(budokaiId)},
                                fromBlock: from,
                                toBlock: to,
                            })
                            .catch(() => [] as Awaited<ReturnType<typeof client.getLogs>>)
                    )
                );
                if (cancelled) return;
                const hit = results.flat();
                const parsed = parseMatches(hit);
                setMatches(parsed);
                if (hit.length > 0) {
                    writeCache(budokaiId, {
                        blockNumber: hit[0].blockNumber?.toString() ?? '0',
                        matches: parsed,
                        snapshot: {
                            pool: snap.pool.toString(),
                            entryCount: snap.entryCount,
                            champion: snap.champion,
                            runnerUp: snap.runnerUp,
                        },
                    });
                }
                setStage('done');
            } catch {
                if (!cancelled) setStage('done');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [budokaiId, client]);

    return {matches, snapshot, loading, stage};
}

function parseMatches(logs: Array<{args: Record<string, unknown>}>): MatchResult[] {
    const parsed: MatchResult[] = logs.map((log) => ({
        budokaiId: Number(log.args.budokaiId ?? 0n),
        round: Number(log.args.round ?? 0),
        tokenA: Number(log.args.tokenA ?? 0n),
        tokenB: Number(log.args.tokenB ?? 0n),
        winner: Number(log.args.winner ?? 0n),
        kaioken: !!log.args.kaioken,
    }));
    parsed.sort((a, b) => a.round - b.round);
    return parsed;
}

function roundLabel(round: number, totalRounds: number): {kanji: string; en: string} {
    if (round === totalRounds) return {kanji: '決勝', en: 'FINAL'};
    if (round === totalRounds - 1) return {kanji: '準決勝', en: 'SEMIFINAL'};
    if (round === totalRounds - 2) return {kanji: '準々決勝', en: 'QUARTERFINAL'};
    return {kanji: `第${round}回戦`, en: `ROUND ${round}`};
}

const INTRO_BEAT_MS = 900;
const MATCH_REVEAL_MS = 1200;
const ROUND_INTRO_MS = 1400;

type Phase = 'intro' | 'scanning' | 'revealing' | 'complete';

export function BracketReveal({open, onClose, budokaiId}: BracketRevealProps) {
    const {matches, snapshot, stage} = useBracketData(open ? budokaiId : null);
    const [phase, setPhase] = useState<Phase>('intro');
    const [introBeat, setIntroBeat] = useState(0);
    const [cursor, setCursor] = useState(0);
    const [activeRoundIntro, setActiveRoundIntro] = useState<number | null>(null);

    const totalRounds = matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;

    // Reset on close
    useEffect(() => {
        if (!open) {
            setPhase('intro');
            setIntroBeat(0);
            setCursor(0);
            setActiveRoundIntro(null);
        }
    }, [open]);

    // Advance intro beats (runs in parallel with data fetch)
    useEffect(() => {
        if (!open || phase !== 'intro') return;
        if (introBeat >= 3) {
            // Intro finished. If data is ready, go to revealing; else show scanning.
            if (stage === 'done' && matches.length > 0) {
                setPhase('revealing');
            } else if (stage === 'done' && matches.length === 0) {
                setPhase('complete');
            } else {
                setPhase('scanning');
            }
            return;
        }
        const t = setTimeout(() => setIntroBeat((b) => b + 1), INTRO_BEAT_MS);
        return () => clearTimeout(t);
    }, [open, phase, introBeat, stage, matches.length]);

    // When data lands during scanning phase, switch to revealing
    useEffect(() => {
        if (phase !== 'scanning') return;
        if (stage !== 'done') return;
        if (matches.length === 0) {
            setPhase('complete');
            return;
        }
        setPhase('revealing');
    }, [phase, stage, matches.length]);

    // Auto-advance matches + show round intros between rounds
    useEffect(() => {
        if (phase !== 'revealing') return;
        if (matches.length === 0) {
            setPhase('complete');
            return;
        }
        if (cursor >= matches.length) {
            const t = setTimeout(() => setPhase('complete'), 1000);
            return () => clearTimeout(t);
        }
        if (activeRoundIntro != null) {
            const t = setTimeout(() => setActiveRoundIntro(null), ROUND_INTRO_MS);
            return () => clearTimeout(t);
        }
        const nextMatch = matches[cursor];
        const prevRound = cursor === 0 ? null : matches[cursor - 1].round;
        if (nextMatch.round !== prevRound) {
            setActiveRoundIntro(nextMatch.round);
            return;
        }
        const t = setTimeout(() => setCursor((c) => c + 1), MATCH_REVEAL_MS);
        return () => clearTimeout(t);
    }, [phase, cursor, matches, activeRoundIntro]);

    const visible = matches.slice(0, cursor);
    const groupedByRound = useMemo(() => {
        const map = new Map<number, MatchResult[]>();
        for (const m of visible) {
            if (!map.has(m.round)) map.set(m.round, []);
            map.get(m.round)!.push(m);
        }
        return Array.from(map.entries()).sort(([a], [b]) => a - b);
    }, [visible]);

    const handleSkip = () => {
        setActiveRoundIntro(null);
        setCursor(matches.length);
        setPhase('complete');
    };

    const handleReplay = () => {
        setCursor(0);
        setActiveRoundIntro(null);
        setPhase('revealing');
    };

    return (
        <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/95 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <Dialog.Content
                    aria-describedby={undefined}
                    className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black"
                >
                    <Dialog.Title className="sr-only">Bracket replay — Budokai {budokaiId}</Dialog.Title>

                    <div className="flex items-center justify-between border-b border-zinc-900 px-6 py-3">
                        <div>
                            <h2 className="text-lg font-bold tracking-[0.3em] uppercase text-red-500">
                                Budokai {budokaiId ?? '—'}
                            </h2>
                            <p className="text-[9px] tracking-wider text-zinc-600">
                                {phase === 'intro' && 'opening ceremony...'}
                                {phase === 'scanning' && 'reading the chronicles...'}
                                {phase === 'revealing' &&
                                    `${visible.length}/${matches.length} fights revealed${
                                        totalRounds > 0 ? ` · ${totalRounds} rounds` : ''
                                    }`}
                                {phase === 'complete' &&
                                    (matches.length > 0
                                        ? `bracket complete · ${matches.length} fights`
                                        : 'budokai not yet resolved')}
                            </p>
                        </div>
                        <Dialog.Close className="rounded-full bg-zinc-900 p-2 text-zinc-400 hover:text-white">
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
                                />
                            )}

                            {phase === 'scanning' && <ScanningSequence key="scan" />}

                            {(phase === 'revealing' || phase === 'complete') && matches.length > 0 && (
                                <motion.div
                                    key="revealing"
                                    className="h-full overflow-y-auto px-6 py-6"
                                    initial={{opacity: 0}}
                                    animate={{opacity: 1}}
                                    transition={{duration: 0.4}}
                                >
                                    {groupedByRound.map(([round, rms]) => {
                                        const label = roundLabel(round, totalRounds);
                                        return (
                                            <div key={round} className="mb-8">
                                                <div className="mb-3 flex items-baseline gap-3">
                                                    <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-500">
                                                        {label.en}
                                                    </span>
                                                    <span className="font-mono text-[10px] text-zinc-600">
                                                        {label.kanji}
                                                    </span>
                                                    <div className="h-px flex-1 bg-zinc-900" />
                                                </div>
                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                                    {rms.map((m, i) => (
                                                        <MatchCard key={`${round}-${i}`} match={m} />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {phase === 'complete' && snapshot && snapshot.champion > 0 && (
                                        <ChampionBanner
                                            champion={snapshot.champion}
                                            runnerUp={snapshot.runnerUp}
                                            pool={snapshot.pool}
                                        />
                                    )}
                                </motion.div>
                            )}

                            {phase === 'complete' && matches.length === 0 && (
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

                        {/* Round intro flash overlay */}
                        <AnimatePresence>
                            {phase === 'revealing' && activeRoundIntro != null && (
                                <RoundIntro round={activeRoundIntro} totalRounds={totalRounds} />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Replay controls */}
                    {(phase === 'revealing' || phase === 'complete') && matches.length > 0 && (
                        <div className="border-t border-zinc-900 px-6 py-3">
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={handleSkip}
                                    disabled={phase === 'complete' && cursor >= matches.length}
                                    className="rounded border border-zinc-800 px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white disabled:opacity-30"
                                >
                                    Skip to end
                                </button>
                                <button
                                    onClick={handleReplay}
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

function IntroSequence({
    beat,
    budokaiId,
    snapshot,
}: {
    beat: number;
    budokaiId: number | null;
    snapshot: BudokaiSnapshot | null;
}) {
    const poolZero = snapshot ? Number(snapshot.pool / 10n ** 18n) : 0;
    const beats = [
        {top: '天下一武道会', bottom: 'TENKAICHI BUDOKAI'},
        {top: `BUDOKAI ${budokaiId ?? '—'}`, bottom: snapshot ? `${snapshot.entryCount} WARRIORS` : '...'},
        {top: `${poolZero.toLocaleString()} $ZERO`, bottom: 'PRIZE POOL'},
        {top: '決勝戦開始', bottom: 'THE BRACKET OPENS'},
    ];
    const current = beats[Math.min(beat, beats.length - 1)];
    return (
        <motion.div
            className="flex h-full items-center justify-center"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={beat}
                    initial={{opacity: 0, scale: 0.9, y: 10}}
                    animate={{opacity: 1, scale: 1, y: 0}}
                    exit={{opacity: 0, scale: 1.05, y: -10}}
                    transition={{duration: 0.35, ease: 'easeOut'}}
                    className="text-center"
                >
                    <h3 className="font-mono text-4xl font-bold tracking-[0.3em] text-red-500 sm:text-6xl">
                        {current.top}
                    </h3>
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

function RoundIntro({round, totalRounds}: {round: number; totalRounds: number}) {
    const label = roundLabel(round, totalRounds);
    return (
        <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.2}}
        >
            <motion.div
                initial={{scale: 0.8, opacity: 0}}
                animate={{scale: 1, opacity: 1}}
                exit={{scale: 1.1, opacity: 0}}
                transition={{duration: 0.4, ease: 'easeOut'}}
                className="text-center"
            >
                <p className="font-mono text-5xl font-bold text-red-500 sm:text-7xl">{label.kanji}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.5em] text-zinc-400 sm:text-sm">{label.en}</p>
            </motion.div>
        </motion.div>
    );
}

function MatchCard({match}: {match: MatchResult}) {
    const winnerIsA = match.winner === match.tokenA;
    return (
        <motion.div
            initial={{opacity: 0, y: 12, scale: 0.96}}
            animate={{opacity: 1, y: 0, scale: 1}}
            transition={{duration: 0.4, ease: 'easeOut'}}
            className={`relative overflow-hidden rounded border p-3 ${
                match.kaioken
                    ? 'border-red-500/60 bg-red-950/20 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                    : 'border-zinc-800 bg-zinc-950/70'
            }`}
        >
            {match.kaioken && (
                <div className="absolute right-2 top-2 flex items-center gap-1 rounded bg-red-600/30 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-red-300">
                    <Flame className="h-3 w-3" /> Kaioken
                </div>
            )}
            <div className="flex items-center justify-between gap-3">
                <SamuraiAvatar tokenId={match.tokenA} isWinner={winnerIsA} kaioken={match.kaioken} />
                <div className="text-center">
                    <Zap className={`mx-auto h-4 w-4 ${match.kaioken ? 'text-red-400' : 'text-zinc-600'}`} />
                    <span className="block text-[8px] font-mono uppercase tracking-wider text-zinc-600">vs</span>
                </div>
                <SamuraiAvatar tokenId={match.tokenB} isWinner={!winnerIsA} kaioken={match.kaioken} />
            </div>
        </motion.div>
    );
}

function SamuraiAvatar({tokenId, isWinner, kaioken}: {tokenId: number; isWinner: boolean; kaioken: boolean}) {
    return (
        <div className="flex flex-1 flex-col items-center gap-1">
            <img
                src={getSamuraiImageUrl(tokenId)}
                alt={`#${tokenId}`}
                className={`h-16 w-16 rounded transition-all ${
                    isWinner
                        ? kaioken
                            ? 'ring-2 ring-red-400 shadow-[0_0_16px_rgba(239,68,68,0.6)]'
                            : 'ring-2 ring-yellow-400'
                        : 'opacity-40 saturate-0'
                }`}
                style={{imageRendering: 'pixelated'}}
            />
            <span
                className={`font-mono text-[9px] uppercase ${
                    isWinner ? (kaioken ? 'text-red-300' : 'text-yellow-400') : 'text-zinc-600'
                }`}
            >
                #{tokenId}
            </span>
        </div>
    );
}

function ChampionBanner({champion, runnerUp, pool}: {champion: number; runnerUp: number; pool: bigint}) {
    const championPrize = Number((pool * 5000n) / 10000n / 10n ** 18n);
    const runnerUpPrize = Number((pool * 2000n) / 10000n / 10n ** 18n);
    return (
        <motion.div
            initial={{opacity: 0, scale: 0.95}}
            animate={{opacity: 1, scale: 1}}
            transition={{duration: 0.6, ease: 'easeOut'}}
            className="mt-8 rounded border border-yellow-500/50 bg-gradient-to-b from-yellow-950/30 via-black to-black p-6 shadow-[0_0_40px_rgba(234,179,8,0.2)]"
        >
            <div className="mb-4 flex items-center justify-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-yellow-400">Champion</p>
                <Trophy className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                <motion.div
                    initial={{y: 20, opacity: 0}}
                    animate={{y: 0, opacity: 1}}
                    transition={{delay: 0.2, duration: 0.5}}
                    className="flex flex-col items-center"
                >
                    <img
                        src={getSamuraiImageUrl(champion)}
                        alt={`Champion #${champion}`}
                        className="h-32 w-32 rounded ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.5)] sm:h-40 sm:w-40"
                        style={{imageRendering: 'pixelated'}}
                    />
                    <p className="mt-3 font-mono text-2xl font-bold text-yellow-400">#{champion}</p>
                    <p className="mt-1 font-mono text-[11px] text-yellow-500/80">
                        {championPrize.toLocaleString()} $ZERO
                    </p>
                </motion.div>
                {runnerUp > 0 && (
                    <motion.div
                        initial={{y: 20, opacity: 0}}
                        animate={{y: 0, opacity: 1}}
                        transition={{delay: 0.4, duration: 0.5}}
                        className="flex flex-col items-center"
                    >
                        <img
                            src={getSamuraiImageUrl(runnerUp)}
                            alt={`Runner-up #${runnerUp}`}
                            className="h-24 w-24 rounded ring-2 ring-zinc-400 sm:h-28 sm:w-28"
                            style={{imageRendering: 'pixelated'}}
                        />
                        <p className="mt-2 font-mono text-lg font-bold text-zinc-300">#{runnerUp}</p>
                        <p className="mt-1 font-mono text-[10px] text-zinc-500">
                            {runnerUpPrize.toLocaleString()} $ZERO
                        </p>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
