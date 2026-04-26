/**
 * Static "Crónica" — newspaper-style replay for a resolved Budokai.
 *
 * Reads /budokai/{id}.json and renders the resolved bracket as a designed
 * retrospective document: champion hero → prize table → Champion's Path →
 * Notable Moments → round tally → expandable full bracket. No animation,
 * no auto-advance — the user reads at their own pace.
 *
 * Used by:
 *   - BracketReveal (after the opening ceremony intro)
 *   - /budokai-replay-mockup (standalone preview route)
 */
import {useEffect, useMemo, useState} from 'react';
import {Flame, Trophy, Zap} from 'lucide-react';
import {useReadContracts} from 'wagmi';
import {base} from 'wagmi/chains';
import {createPublicClient, http, parseAbiItem} from 'viem';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {buildAlchemyRpcUrls} from '@/config/alchemy';
import {SAMURAI_DOJO_ABI} from '@/lib/web3/abi';
import type {MatchResult} from '../types';

interface HonorAward {
    tokenId: number;
    amount: number;
    reason: number; // 1=champion, 2=runnerUp, 3=semi
    trophyType: number;
}

const HONOR_AWARDED_EVENT = parseAbiItem(
    'event HonorAwarded(uint256 indexed budokaiId, uint256 indexed tokenId, uint32 amount, uint8 reason, uint8 trophyType)',
);

function honorReasonLabel(reason: number): string {
    if (reason === 1) return 'Champion';
    if (reason === 2) return 'Runner-up';
    if (reason === 3) return 'Semifinalist';
    return 'Awarded';
}

const SAMURAI_IMG = (id: number) => `https://adrianlab.vercel.app/api/render/${id}.png`;

interface ChronicleData {
    id: number;
    pool: bigint;
    entryCount: number;
    resolveBlock: number;
    matches: MatchResult[];
    senryoku: Map<number, number>;
    champion: number;
    runnerUp: number;
    semifinalists: number[];
    quarterfinalists: number[];
    totalRounds: number;
}

interface RawSnapshot {
    id: number;
    pool: string;
    entryCount: number;
    resolveBlock: number;
    matches: Array<{round: number; tokenA: number; tokenB: number; winner: number; kaioken: boolean}>;
    senryoku?: Record<string, number>;
    champion: number;
    runnerUp: number;
    semifinalists: number[];
    quarterfinalists: number[];
}

async function loadChronicle(id: number): Promise<ChronicleData | null> {
    // See BracketReveal note: 'default' avoids serving a stale cached 404 once the snapshot ships.
    const res = await fetch(`/budokai/${id}.json`, {cache: 'default'});
    if (!res.ok) return null;
    // Vercel may return 200 + HTML SPA fallback when the static file is missing.
    // Treat that as "not snapshotted yet" rather than letting JSON.parse crash the modal.
    let raw: RawSnapshot;
    try {
        raw = (await res.json()) as RawSnapshot;
    } catch {
        return null;
    }
    const matches: MatchResult[] = raw.matches.map((m) => ({
        budokaiId: id,
        round: m.round,
        tokenA: m.tokenA,
        tokenB: m.tokenB,
        winner: m.winner,
        kaioken: m.kaioken,
    }));
    matches.sort((a, b) => a.round - b.round);
    const senryoku = new Map<number, number>();
    if (raw.senryoku) {
        for (const [k, v] of Object.entries(raw.senryoku)) senryoku.set(Number(k), Number(v));
    }
    return {
        id: raw.id,
        pool: BigInt(raw.pool),
        entryCount: raw.entryCount,
        resolveBlock: raw.resolveBlock,
        matches,
        senryoku,
        champion: raw.champion,
        runnerUp: raw.runnerUp,
        semifinalists: raw.semifinalists,
        quarterfinalists: raw.quarterfinalists,
        totalRounds: matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0,
    };
}

function roundLabel(round: number, totalRounds: number): {kanji: string; en: string} {
    if (round === totalRounds) return {kanji: '決勝', en: 'FINAL'};
    if (round === totalRounds - 1) return {kanji: '準決勝', en: 'SEMIFINAL'};
    if (round === totalRounds - 2) return {kanji: '準々決勝', en: 'QUARTERFINAL'};
    return {kanji: `第${round}回戦`, en: `ROUND ${round}`};
}

/** Number → spelled-out copy (warrior counts 1-256). Round headers use this for dynamic intro copy. */
function numberWord(n: number): string {
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    if (n <= 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
        const t = Math.floor(n / 10);
        const o = n % 10;
        return o === 0 ? tens[t] : `${tens[t]}-${ones[o]}`;
    }
    const h = Math.floor(n / 100);
    const r = n % 100;
    const head = `${ones[h]}-HUNDRED`;
    if (r === 0) return head;
    if (r < 10) return `${head}-${ones[r]}`;
    if (r < 20) return `${head}-${teens[r - 10]}`;
    const t = Math.floor(r / 10);
    const o = r % 10;
    return o === 0 ? `${head}-${tens[t]}` : `${head}-${tens[t]}-${ones[o]}`;
}

function buildChampionPath(matches: MatchResult[], champ: number) {
    if (champ <= 0 || matches.length === 0) return [];
    const totalRounds = Math.max(...matches.map((m) => m.round));
    const path: Array<{m: MatchResult; rival: number; rivalPrev: MatchResult | null}> = [];
    for (let r = 1; r <= totalRounds; r++) {
        const cm = matches.find((x) => x.round === r && (x.tokenA === champ || x.tokenB === champ));
        if (!cm) continue;
        const rival = cm.tokenA === champ ? cm.tokenB : cm.tokenA;
        const rivalPrev =
            r > 1
                ? matches.find(
                      (x) =>
                          x.round === r - 1 &&
                          x.winner === rival &&
                          (x.tokenA === rival || x.tokenB === rival),
                  ) ?? null
                : null;
        path.push({m: cm, rival, rivalPrev});
    }
    return path;
}

/**
 * Same flavor narrator as BracketReveal's makeLore — picks a deterministic
 * line per match using senryoku gap + kaioken + round as the bucket selector.
 * Same match always returns the same line (reproducible across reloads).
 */
function makeLore(
    m: MatchResult,
    senryoku: Map<number, number>,
    totalRounds: number,
    isFirstBlood: boolean = false,
): string {
    const w = m.winner;
    const l = w === m.tokenA ? m.tokenB : m.tokenA;
    const wPow = senryoku.get(w);
    const lPow = senryoku.get(l);
    const hasPower = wPow !== undefined && lPow !== undefined;
    const gap = hasPower ? (wPow as number) - (lPow as number) : 0;
    const isFinal = m.round === totalRounds;
    const isSemi = m.round === totalRounds - 1;
    const pick = (arr: string[]) => arr[(w * 31 + l * 17 + m.round * 7) % arr.length];

    // v6 civilian classifier — derived SR is 1-15, samurai start at 20+. Use a 15/20 split with
    // an "ambiguous" gap (16-19) treated as samurai to avoid misfiring civilian flavor.
    const winnerCivilian = hasPower && (wPow as number) <= 15;
    const loserSamurai = hasPower && (lPow as number) >= 20;

    if (isFirstBlood && !isFinal && !isSemi && !m.kaioken) {
        return pick([
            `First blood of the Budokai — #${w} draws the opening cut on #${l}.`,
            `The gates open. #${w} is the first to taste victory over #${l}.`,
            `An opening strike. #${w} drops #${l} before the dojo can breathe.`,
        ]);
    }
    if (isFinal) {
        // v6: Commoner King (民の王) — civilian wins the entire tournament.
        if (winnerCivilian) {
            return pick([
                `民の王 — #${w} ascends from the streets. The dojo bows to a Commoner King.`,
                `An AdrianZERO with no name carved in the roster takes the Tenkaichi title. #${w} is the people's champion now.`,
                `The samurai class will never live this down. #${w}, a civilian, holds the trophy over a fallen #${l}.`,
                `History rewrites itself. #${w} — a regular soul — strikes down #${l} and claims the dojo's highest seat.`,
            ]);
        }
        if (hasPower && Math.abs(gap) <= 5) {
            return pick([
                `A final that will be retold in the Chronicles — #${w} edges out #${l} by a single breath.`,
                `Two heartbeats. Two fates. #${w} stands, #${l} bows — by the thinnest margin ever recorded.`,
                `The dojo will never forget this final. #${w} over #${l} by a sliver.`,
            ]);
        }
        return pick([
            `Under the dojo lanterns, #${w} claims the Tenkaichi title over #${l}.`,
            `Tenkaichi — #${w} stands alone. #${l} takes runner-up with honor.`,
            `The final bell tolls. #${w} bows over a fallen #${l}.`,
        ]);
    }
    if (isSemi) {
        // Civilian into the final.
        if (winnerCivilian) {
            return pick([
                `民兵の刃 — #${w}, a civilian, slips past #${l} and into the final. The samurai look at each other.`,
                `The dojo's hierarchy keeps cracking — #${w} buries #${l} and walks toward the trophy.`,
                `One step from the title. #${w}, no roster mark, eliminates #${l} in the semis.`,
            ]);
        }
        return pick([
            `#${w} punches through to the final. #${l} exits with semifinal honors.`,
            `At the gates of the final, #${w} cuts down #${l}.`,
            `#${l} came close — but #${w} walks on to the title match.`,
        ]);
    }
    // v6: civilian upset — civilian (SR ≤15) drops a samurai (SR ≥20).
    if (winnerCivilian && loserSamurai) {
        return pick([
            `Civilian upset — #${w} (SR ${wPow}) drops the trained #${l} (SR ${lPow}). The dojo whispers.`,
            `The hierarchy cracks. #${w}, no samurai mark, takes down #${l} cleanly.`,
            `#${l} expected an easy round. #${w} reminded them why the dojo opened its gates.`,
            `民兵の刃 — #${w} channels the people's fury and strikes #${l} from the ranks.`,
        ]);
    }
    if (m.kaioken) {
        return pick([
            `The Kaioken flared — #${w} overwhelmed #${l} in a crimson blur.`,
            `Burning past the limit, #${w} dropped #${l} with a Kaioken surge.`,
            `#${l} had no answer to the Kaioken roar from #${w}.`,
            `A war cry tore through the dojo as #${w} invoked the Kaioken on #${l}.`,
        ]);
    }
    if (hasPower && gap >= 30) {
        return pick([
            `#${w} (power ${wPow}) overwhelms #${l} (${lPow}) in one crushing exchange.`,
            `No contest — #${w} dismantles #${l} cleanly.`,
            `A textbook dismantling; #${l} was outclassed from bell to bell.`,
        ]);
    }
    if (hasPower && gap <= -20) {
        return pick([
            `*Impossible.* #${w} (power ${wPow}) topples the favored #${l} (${lPow}).`,
            `The dojo gasps — #${w} refuses to lose to #${l}.`,
            `Against all odds, #${w} outlasts the stronger #${l}.`,
        ]);
    }
    if (hasPower && Math.abs(gap) <= 10) {
        return pick([
            `A razor-thin duel — #${w} edges out #${l}.`,
            `#${w} and #${l} trade blows until the final second. #${w} takes it.`,
            `Too close to call… #${w} stands over #${l} at the end.`,
        ]);
    }
    return pick([
        `#${w} outlasts #${l} in a clean duel.`,
        `#${w} finds the opening and drops #${l}.`,
        `#${l} fought well — but #${w} closed the show.`,
        `#${w} silences #${l} with disciplined technique.`,
    ]);
}

function pickUpsets(matches: MatchResult[], senryoku: Map<number, number>, threshold = 20) {
    return matches.filter((m) => {
        const w = m.winner;
        const l = w === m.tokenA ? m.tokenB : m.tokenA;
        const ws = senryoku.get(w);
        const ls = senryoku.get(l);
        if (ws === undefined || ls === undefined) return false;
        return ls - ws >= threshold; // loser was favored by ≥ threshold
    });
}

function formatPool(pool: bigint): string {
    return Number(pool / 10n ** 18n).toLocaleString();
}

function PrizeRow({label, tokens, amount, accent, nicknames}: {label: string; tokens: number[]; amount: string; accent: string; nicknames?: Map<number, string>}) {
    return (
        <div className="flex items-center gap-3 border-b border-zinc-900 py-2 last:border-0">
            <div className={`w-24 font-mono text-[10px] uppercase tracking-[0.25em] ${accent}`}>{label}</div>
            <div className="flex flex-1 flex-wrap gap-1.5">
                {tokens.map((t) => {
                    const nick = nicknames?.get(t);
                    return (
                        <span key={t} className="rounded border border-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-300" title={nick ?? `#${t}`}>
                            #{t}
                            {nick && <span className="ml-1 text-zinc-500">· {nick}</span>}
                        </span>
                    );
                })}
            </div>
            <div className="font-mono text-[11px] text-zinc-400">{amount}</div>
        </div>
    );
}

function FightCard({
    match,
    senryoku,
    honor,
    totalRounds,
    annotation,
    size = 'md',
}: {
    match: MatchResult;
    senryoku: Map<number, number>;
    honor?: Map<number, number>;
    totalRounds: number;
    annotation?: string;
    size?: 'sm' | 'md' | 'lg';
}) {
    const winnerIsA = match.winner === match.tokenA;
    const sA = senryoku.get(match.tokenA);
    const sB = senryoku.get(match.tokenB);
    const hA = honor?.get(match.tokenA) ?? 0;
    const hB = honor?.get(match.tokenB) ?? 0;
    const label = roundLabel(match.round, totalRounds);
    const avatar = size === 'lg' ? 'h-28 w-28' : size === 'sm' ? 'h-14 w-14' : 'h-20 w-20';
    return (
        <div
            className={`relative rounded border ${
                match.kaioken
                    ? 'border-red-500/50 bg-red-950/15'
                    : 'border-zinc-800 bg-zinc-950/60'
            } p-3`}
        >
            <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-600">
                    {label.en}
                </span>
                {match.kaioken && (
                    <span className="flex items-center gap-1 rounded bg-red-600/25 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-red-300">
                        <Flame className="h-3 w-3" /> Kaioken
                    </span>
                )}
            </div>
            <div className="flex items-center gap-3">
                <div className="flex flex-1 flex-col items-center gap-1">
                    <img
                        src={SAMURAI_IMG(match.tokenA)}
                        alt={`#${match.tokenA}`}
                        className={`${avatar} rounded ${
                            winnerIsA
                                ? match.kaioken
                                    ? 'ring-2 ring-red-400'
                                    : 'ring-2 ring-yellow-400'
                                : 'opacity-40 saturate-0'
                        }`}
                        style={{imageRendering: 'pixelated'}}
                    />
                    <span
                        className={`font-mono text-[10px] uppercase ${
                            winnerIsA ? (match.kaioken ? 'text-red-300' : 'text-yellow-400') : 'text-zinc-600'
                        }`}
                    >
                        #{match.tokenA}
                    </span>
                    {sA !== undefined && (
                        <span className="font-mono text-[8px] text-zinc-600">
                            戦力 {sA}
                            {hA > 0 && (
                                <span className="ml-1 text-yellow-500" title={`Effective ${sA + hA} (Senryoku ${sA} + Honor ${hA})`}>
                                    +{hA} = {sA + hA}
                                </span>
                            )}
                        </span>
                    )}
                </div>
                <Zap className={`h-4 w-4 ${match.kaioken ? 'text-red-400' : 'text-zinc-700'}`} />
                <div className="flex flex-1 flex-col items-center gap-1">
                    <img
                        src={SAMURAI_IMG(match.tokenB)}
                        alt={`#${match.tokenB}`}
                        className={`${avatar} rounded ${
                            !winnerIsA
                                ? match.kaioken
                                    ? 'ring-2 ring-red-400'
                                    : 'ring-2 ring-yellow-400'
                                : 'opacity-40 saturate-0'
                        }`}
                        style={{imageRendering: 'pixelated'}}
                    />
                    <span
                        className={`font-mono text-[10px] uppercase ${
                            !winnerIsA ? (match.kaioken ? 'text-red-300' : 'text-yellow-400') : 'text-zinc-600'
                        }`}
                    >
                        #{match.tokenB}
                    </span>
                    {sB !== undefined && (
                        <span className="font-mono text-[8px] text-zinc-600">
                            戦力 {sB}
                            {hB > 0 && (
                                <span className="ml-1 text-yellow-500" title={`Effective ${sB + hB} (Senryoku ${sB} + Honor ${hB})`}>
                                    +{hB} = {sB + hB}
                                </span>
                            )}
                        </span>
                    )}
                </div>
            </div>
            {annotation && (
                <p className="mt-3 border-t border-zinc-900 pt-2 text-center text-[10px] italic leading-snug text-zinc-400">
                    {annotation}
                </p>
            )}
        </div>
    );
}

interface BudokaiChronicleProps {
    budokaiId: number;
    /** When false, omits the page-level wrapper (use inside an existing modal). */
    standalone?: boolean;
}

export function BudokaiChronicle({budokaiId, standalone = true}: BudokaiChronicleProps) {
    const [data, setData] = useState<ChronicleData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showAllFights, setShowAllFights] = useState(false);

    useEffect(() => {
        setData(null);
        setError(null);
        setShowAllFights(false);
        loadChronicle(budokaiId)
            .then((d) => {
                if (!d) setError('Snapshot not found');
                else setData(d);
            })
            .catch((e) => setError(String(e?.message ?? e)));
    }, [budokaiId]);

    // Honor multicall — fetches current on-chain honor for every token that appears in this
    // bracket. Honor is persistent across Budokais, so a snapshot view of B2 will show
    // honor that B1 podium-finishers already had at the time. Read happens once per chronicle
    // load; staleTime 60s avoids refetching while the user reads.
    const allBracketTokens = useMemo(() => {
        if (!data) return [] as number[];
        const set = new Set<number>();
        for (const m of data.matches) {
            set.add(m.tokenA);
            set.add(m.tokenB);
        }
        return Array.from(set);
    }, [data]);
    const honorContracts = useMemo(
        () =>
            allBracketTokens.map((id) => ({
                address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                abi: SAMURAI_DOJO_ABI,
                functionName: 'getHonor' as const,
                args: [BigInt(id)] as const,
                chainId: base.id,
            })),
        [allBracketTokens],
    );
    const {data: honorRaw} = useReadContracts({
        contracts: honorContracts,
        query: {enabled: allBracketTokens.length > 0, staleTime: 60_000},
    });
    const honorMap = useMemo(() => {
        const m = new Map<number, number>();
        if (!honorRaw) return m;
        for (let i = 0; i < allBracketTokens.length; ++i) {
            const v = honorRaw[i]?.result;
            if (v !== undefined) m.set(allBracketTokens[i], Number(v));
        }
        return m;
    }, [honorRaw, allBracketTokens]);

    // Nickname lookup — fetch AdrianLAB metadata `name` for the podium tokens. Falls back to
    // "#tokenId" when the metadata is the default "SamuraiZERO #N". Cheap (4-7 fetches) and
    // adds personality to the hero card + prize table without bloating the bundle.
    const [nicknames, setNicknames] = useState<Map<number, string>>(new Map());
    useEffect(() => {
        if (!data) return;
        const podium = new Set<number>([
            data.champion,
            data.runnerUp,
            ...data.semifinalists,
            ...data.quarterfinalists,
        ].filter((id) => id > 0));
        if (podium.size === 0) return;
        let cancelled = false;
        (async () => {
            const out = new Map<number, string>();
            await Promise.all(
                Array.from(podium).map(async (tokenId) => {
                    try {
                        const res = await fetch(`https://adrianlab.vercel.app/api/metadata/${tokenId}`, {cache: 'force-cache'});
                        if (!res.ok) return;
                        const meta = await res.json();
                        const raw = String(meta?.name ?? '');
                        // Skip generic fallbacks like "SamuraiZERO #634" — only keep custom nicknames.
                        const trimmed = raw.replace(/^SamuraiZERO\s*#\d+\s*/i, '').replace(/^AdrianZERO\s*#\d+\s*/i, '').trim();
                        if (trimmed) out.set(tokenId, trimmed);
                    } catch { /* ignore */ }
                }),
            );
            if (!cancelled) setNicknames(out);
        })();
        return () => { cancelled = true; };
    }, [data]);

    // HonorAwarded events for this Budokai — emitted at resolveBudokai time alongside MatchResolved.
    // Same scan window (resolveBlock + 5..256) as the bracket events.
    const [honorAwards, setHonorAwards] = useState<HonorAward[]>([]);
    useEffect(() => {
        if (!data || data.resolveBlock === 0) {
            setHonorAwards([]);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const urls = buildAlchemyRpcUrls();
                const client = createPublicClient({chain: base, transport: http(urls[0])});
                const fromBlock = BigInt(data.resolveBlock + 5);
                const toBlock = BigInt(data.resolveBlock + 256);
                const idTopic = `0x${BigInt(data.id).toString(16).padStart(64, '0')}` as `0x${string}`;
                // Scan in chunks of 10 to stay under Alchemy free-tier getLogs limits.
                const collected: HonorAward[] = [];
                for (let from = fromBlock; from <= toBlock; from += 10n) {
                    if (cancelled) return;
                    const to = from + 9n > toBlock ? toBlock : from + 9n;
                    try {
                        const logs = await client.getLogs({
                            address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                            event: HONOR_AWARDED_EVENT,
                            args: {budokaiId: BigInt(data.id)},
                            fromBlock: from,
                            toBlock: to,
                        });
                        for (const log of logs) {
                            collected.push({
                                tokenId: Number(log.args.tokenId ?? 0n),
                                amount: Number(log.args.amount ?? 0),
                                reason: Number(log.args.reason ?? 0),
                                trophyType: Number(log.args.trophyType ?? 0),
                            });
                        }
                        if (collected.length > 0) {
                            // All HonorAwarded logs land in the same tx — break early after first hit chunk.
                            break;
                        }
                    } catch {
                        // ignore per-chunk errors, keep scanning
                    }
                    void idTopic; // reserved for raw-getLogs fallback if we drop viem-typed args
                }
                if (!cancelled) setHonorAwards(collected);
            } catch (err) {
                if (!cancelled) console.warn('[chronicle] honor scan failed:', err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [data]);

    const championPath = useMemo(
        () => (data ? buildChampionPath(data.matches, data.champion) : []),
        [data],
    );
    const upsets = useMemo(
        () => (data ? pickUpsets(data.matches, data.senryoku, 20) : []),
        [data],
    );
    const kaiokens = useMemo(() => (data ? data.matches.filter((m) => m.kaioken) : []), [data]);
    const firstBlood = useMemo(() => {
        if (!data) return null;
        return data.matches.find((m) => m.round === 1) ?? null;
    }, [data]);

    const roundTally = useMemo(() => {
        if (!data) return [];
        const map = new Map<number, {fights: number; kaiokens: number; upsets: number}>();
        for (const m of data.matches) {
            const e = map.get(m.round) ?? {fights: 0, kaiokens: 0, upsets: 0};
            e.fights += 1;
            if (m.kaioken) e.kaiokens += 1;
            const w = m.winner;
            const l = w === m.tokenA ? m.tokenB : m.tokenA;
            const ws = data.senryoku.get(w);
            const ls = data.senryoku.get(l);
            if (ws !== undefined && ls !== undefined && ls - ws >= 20) e.upsets += 1;
            map.set(m.round, e);
        }
        return Array.from(map.entries()).sort(([a], [b]) => a - b);
    }, [data]);

    const groupedAll = useMemo(() => {
        if (!data) return [];
        const map = new Map<number, MatchResult[]>();
        for (const m of data.matches) {
            if (!map.has(m.round)) map.set(m.round, []);
            map.get(m.round)!.push(m);
        }
        return Array.from(map.entries()).sort(([a], [b]) => a - b);
    }, [data]);

    if (error === 'Snapshot not found') {
        return (
            <div className="mx-auto max-w-3xl p-12 text-center font-mono text-xs uppercase tracking-[0.4em] text-zinc-500">
                Chronicles not yet available for Budokai {budokaiId}.
                <p className="mt-3 normal-case tracking-normal text-zinc-600">
                    The bracket is recorded on-chain. The narrative replay is generated shortly after each Budokai resolves.
                </p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="mx-auto max-w-3xl p-12 text-center font-mono text-sm text-red-400">
                error: {error}
            </div>
        );
    }
    if (!data) {
        return (
            <div className="mx-auto max-w-3xl p-12 text-center font-mono text-xs uppercase tracking-[0.4em] text-zinc-500">
                loading the chronicles...
            </div>
        );
    }

    const championPrize = (data.pool * 5000n) / 10000n;
    const runnerPrize = (data.pool * 2000n) / 10000n;
    const semiPrize = (data.pool * 1500n) / 10000n / 2n;
    const quarterPrize = (data.pool * 1500n) / 10000n / 4n;

    const content = (
        <div className="mx-auto max-w-3xl px-6 py-12 sm:px-8">
                {/* Masthead */}
                <header className="mb-12 border-b border-zinc-800 pb-6 text-center">
                    <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-red-500">
                        天下一武道会
                    </p>
                    <h1 className="mt-1 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
                        The Tenkaichi Chronicles
                    </h1>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-500">
                        Budokai {data.id} · {data.entryCount} warriors · {formatPool(data.pool)} $ZERO
                        prize pool · resolved on block {data.resolveBlock.toLocaleString()}
                    </p>
                </header>

                {/* Hero — champion. v6: Commoner King variant when champion SR ≤15 (civilian winner). */}
                {(() => {
                    const champSR = data.senryoku.get(data.champion);
                    const isCommoner = champSR !== undefined && champSR <= 15;
                    return (
                        <section className="mb-16 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
                            <div className="relative">
                                <img
                                    src={SAMURAI_IMG(data.champion)}
                                    alt={`Champion #${data.champion}`}
                                    className={`h-44 w-44 rounded ring-4 sm:h-56 sm:w-56 ${
                                        isCommoner ? 'ring-fuchsia-400' : 'ring-yellow-400'
                                    }`}
                                    style={{imageRendering: 'pixelated'}}
                                />
                                <Trophy className={`absolute -right-3 -top-3 h-12 w-12 drop-shadow-[0_0_12px_rgba(234,179,8,0.6)] ${
                                    isCommoner ? 'text-fuchsia-400 drop-shadow-[0_0_12px_rgba(232,121,249,0.6)]' : 'text-yellow-400'
                                }`} />
                                {isCommoner && (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-fuchsia-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.3em] text-white shadow-lg">
                                        民の王 · COMMONER KING
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className={`font-mono text-[10px] uppercase tracking-[0.4em] ${
                                    isCommoner ? 'text-fuchsia-400' : 'text-yellow-400'
                                }`}>
                                    {isCommoner ? "The People's Champion" : 'Tenkaichi Champion'}
                                </p>
                                <h2 className={`mt-1 font-serif text-5xl font-bold ${
                                    isCommoner ? 'text-fuchsia-300' : 'text-yellow-300'
                                }`}>
                                    #{data.champion}
                                </h2>
                                {nicknames.get(data.champion) && (
                                    <p className={`mt-1 font-serif text-2xl italic ${
                                        isCommoner ? 'text-fuchsia-200/80' : 'text-yellow-200/80'
                                    }`}>
                                        {nicknames.get(data.champion)}
                                    </p>
                                )}
                                {champSR !== undefined && (
                                    <p className="font-mono text-xs text-zinc-500">
                                        戦力 {champSR}{isCommoner && ' · civilian'}
                                    </p>
                                )}
                                <p className={`mt-3 text-2xl font-bold ${
                                    isCommoner ? 'text-fuchsia-300' : 'text-yellow-300'
                                }`}>
                                    {formatPool(championPrize)} $ZERO
                                </p>
                                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
                                    {isCommoner
                                        ? `a regular AdrianZERO climbed ${data.totalRounds} rounds and ${data.matches.length} fights`
                                        : `crowned over ${data.totalRounds} rounds and ${data.matches.length} fights`}
                                </p>
                            </div>
                        </section>
                    );
                })()}

                {/* Podium */}
                <section className="mb-16">
                    <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.4em] text-zinc-500">
                        Prize Distribution
                    </h3>
                    <div className="rounded border border-zinc-800 bg-zinc-950/60 px-4 py-2">
                        <PrizeRow
                            label="Champion"
                            tokens={[data.champion]}
                            amount={`${formatPool(championPrize)} $ZERO`}
                            accent="text-yellow-400"
                            nicknames={nicknames}
                        />
                        <PrizeRow
                            label="Runner-up"
                            tokens={[data.runnerUp]}
                            amount={`${formatPool(runnerPrize)} $ZERO`}
                            accent="text-zinc-300"
                            nicknames={nicknames}
                        />
                        <PrizeRow
                            label="Semifinals"
                            tokens={data.semifinalists}
                            amount={`${formatPool(semiPrize)} $ZERO ea.`}
                            accent="text-zinc-400"
                            nicknames={nicknames}
                        />
                        <PrizeRow
                            label="Quarters"
                            tokens={data.quarterfinalists}
                            amount={`${formatPool(quarterPrize)} $ZERO ea.`}
                            accent="text-zinc-500"
                            nicknames={nicknames}
                        />
                    </div>
                </section>

                {/* Honor Earned — v6 HonorAwarded event readout */}
                {honorAwards.length > 0 && (
                    <section className="mb-16">
                        <h3 className="mb-2 font-serif text-2xl font-bold text-yellow-300">
                            Honor Earned · 名誉
                        </h3>
                        <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
                            Persistent combat bonus, stacks with Senryoku in future Budokais.
                        </p>
                        <div className="space-y-1 rounded border border-yellow-600/30 bg-yellow-950/10 px-4 py-3">
                            {honorAwards.map((h, i) => (
                                <div key={`${h.tokenId}-${i}`} className="flex items-center gap-3 border-b border-yellow-900/30 py-1.5 last:border-0">
                                    <span className="w-24 font-mono text-[10px] uppercase tracking-wider text-yellow-400">
                                        {honorReasonLabel(h.reason)}
                                    </span>
                                    <span className="flex-1 font-mono text-[11px] text-zinc-300">
                                        #{h.tokenId}
                                    </span>
                                    <span className="font-mono text-[12px] font-bold text-yellow-300">
                                        +{h.amount} honor
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* The Champion's Path */}
                <section className="mb-16">
                    <h3 className="mb-2 font-serif text-2xl font-bold text-yellow-300">
                        The Champion&rsquo;s Path
                    </h3>
                    <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
                        The {championPath.length} fights that crowned #{data.champion}
                    </p>
                    <div className="space-y-4">
                        {championPath.map((node) => (
                            <div
                                key={`${node.m.round}-${node.m.tokenA}-${node.m.tokenB}`}
                                className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-stretch"
                            >
                                <FightCard
                                    match={node.m}
                                    senryoku={data.senryoku}
                                    honor={honorMap}
                                    totalRounds={data.totalRounds}
                                    size="md"
                                    annotation={makeLore(
                                        node.m,
                                        data.senryoku,
                                        data.totalRounds,
                                        firstBlood
                                            ? node.m.tokenA === firstBlood.tokenA &&
                                                  node.m.tokenB === firstBlood.tokenB &&
                                                  node.m.round === firstBlood.round
                                            : false,
                                    )}
                                />
                                {node.rivalPrev ? (
                                    <div className="rounded border border-dashed border-zinc-900 bg-zinc-950/30 p-3 sm:w-56">
                                        <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.3em] text-zinc-600">
                                            ↑ #{node.rival} came from
                                        </p>
                                        <FightCard
                                            match={node.rivalPrev}
                                            senryoku={data.senryoku}
                                            honor={honorMap}
                                            totalRounds={data.totalRounds}
                                            size="sm"
                                            annotation={makeLore(
                                                node.rivalPrev,
                                                data.senryoku,
                                                data.totalRounds,
                                            )}
                                        />
                                    </div>
                                ) : (
                                    <div className="hidden sm:block sm:w-56" />
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Notable Moments */}
                <section className="mb-16">
                    <h3 className="mb-2 font-serif text-2xl font-bold text-red-400">
                        Notable Moments
                    </h3>
                    <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
                        First blood · {kaiokens.length} kaioken{kaiokens.length === 1 ? '' : 's'} ·{' '}
                        {upsets.length} upset{upsets.length === 1 ? '' : 's'}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {firstBlood && (
                            <FightCard
                                match={firstBlood}
                                senryoku={data.senryoku}
                                honor={honorMap}
                                totalRounds={data.totalRounds}
                                annotation={makeLore(firstBlood, data.senryoku, data.totalRounds, true)}
                            />
                        )}
                        {kaiokens.slice(0, 4).map((m) => (
                            <FightCard
                                key={`k-${m.round}-${m.tokenA}-${m.tokenB}`}
                                match={m}
                                senryoku={data.senryoku}
                                honor={honorMap}
                                totalRounds={data.totalRounds}
                                annotation={makeLore(m, data.senryoku, data.totalRounds)}
                            />
                        ))}
                        {upsets.slice(0, 6).map((m) => (
                            <FightCard
                                key={`u-${m.round}-${m.tokenA}-${m.tokenB}`}
                                match={m}
                                senryoku={data.senryoku}
                                honor={honorMap}
                                totalRounds={data.totalRounds}
                                annotation={makeLore(m, data.senryoku, data.totalRounds)}
                            />
                        ))}
                    </div>
                </section>

                {/* Round-by-round tally */}
                <section className="mb-16">
                    <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.4em] text-zinc-500">
                        Round-by-Round Tally
                    </h3>
                    <div className="overflow-hidden rounded border border-zinc-800">
                        <table className="w-full font-mono text-[11px]">
                            <thead className="bg-zinc-950 text-zinc-500">
                                <tr>
                                    <th className="px-3 py-2 text-left uppercase tracking-wider">Round</th>
                                    <th className="px-3 py-2 text-right uppercase tracking-wider">Fights</th>
                                    <th className="px-3 py-2 text-right uppercase tracking-wider">Kaiokens</th>
                                    <th className="px-3 py-2 text-right uppercase tracking-wider">Upsets</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roundTally.map(([r, t]) => {
                                    const lab = roundLabel(r, data.totalRounds);
                                    return (
                                        <tr key={r} className="border-t border-zinc-900">
                                            <td className="px-3 py-2">
                                                <span className="text-zinc-300">{lab.en}</span>{' '}
                                                <span className="text-zinc-700">{lab.kanji}</span>
                                            </td>
                                            <td className="px-3 py-2 text-right text-zinc-300">{t.fights}</td>
                                            <td className="px-3 py-2 text-right text-red-400">
                                                {t.kaiokens || '—'}
                                            </td>
                                            <td className="px-3 py-2 text-right text-yellow-400">
                                                {t.upsets || '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Full bracket disclosure */}
                <section className="mb-16">
                    <button
                        onClick={() => setShowAllFights((v) => !v)}
                        className="w-full rounded border border-zinc-800 bg-zinc-950/60 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-400 hover:text-white"
                    >
                        {showAllFights ? '▴ Hide' : '▾ Show'} all {data.matches.length} matches
                    </button>
                    {showAllFights && (
                        <div className="mt-6 space-y-8">
                            {groupedAll.map(([r, ms]) => {
                                const lab = roundLabel(r, data.totalRounds);
                                // Warriors entering this round = matches × 2. Champion round (R=totalRounds) = 1 winner.
                                // We surface the spelled-out count as the round's hero copy ("ONE-HUNDRED-TWENTY-EIGHT REMAIN").
                                const enterCount = ms.length * 2;
                                const remainCopy = `${numberWord(enterCount)} REMAIN`;
                                return (
                                    <div key={r}>
                                        <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-fuchsia-400/80 sm:text-[11px]">
                                            {remainCopy}
                                        </div>
                                        <div className="mb-3 flex items-baseline gap-3">
                                            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-red-500">
                                                {lab.en}
                                            </span>
                                            <span className="font-mono text-[10px] text-zinc-600">
                                                {lab.kanji}
                                            </span>
                                            <span className="font-mono text-[9px] text-zinc-700">
                                                {ms.length} fights
                                            </span>
                                            <div className="h-px flex-1 bg-zinc-900" />
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                            {ms.map((m) => (
                                                <FightCard
                                                    key={`${m.round}-${m.tokenA}-${m.tokenB}`}
                                                    match={m}
                                                    senryoku={data.senryoku}
                                                    honor={honorMap}
                                                    totalRounds={data.totalRounds}
                                                    size="sm"
                                                    annotation={makeLore(
                                                        m,
                                                        data.senryoku,
                                                        data.totalRounds,
                                                        firstBlood
                                                            ? m.tokenA === firstBlood.tokenA &&
                                                                  m.tokenB === firstBlood.tokenB &&
                                                                  m.round === firstBlood.round
                                                            : false,
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Footer */}
                <footer className="border-t border-zinc-800 pt-6 text-center font-mono text-[9px] uppercase tracking-[0.4em] text-zinc-700">
                    The Dojo · Tenkaichi Budokai {data.id} · A static replay
                </footer>
            </div>
    );

    if (!standalone) return content;
    return <div className="min-h-screen bg-black text-zinc-200">{content}</div>;
}
