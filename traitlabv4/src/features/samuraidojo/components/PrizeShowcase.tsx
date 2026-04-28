import {useState} from 'react';
import {Trophy, Zap, Flame, Clock, ChevronDown, ScrollText} from 'lucide-react';

/**
 * Tournament rules panel. Collapsible — default closed so the page lands on
 * action (tabs + grid), not on a wall of text. The header always shows the
 * champion reward identity so the page still tells you what's at stake without
 * forcing a scroll.
 */
export function PrizeShowcase() {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="mt-8 rounded border border-yellow-600/30 bg-gradient-to-b from-yellow-900/10 to-transparent">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex w-full items-center gap-3 p-3 text-left sm:gap-4 sm:p-4"
                aria-expanded={expanded}
            >
                <div className="relative shrink-0">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-yellow-400/20 blur-md" />
                    <img
                        src="/images/golden-shuriken.png"
                        alt="Golden Shuriken"
                        className="relative h-10 w-10 object-contain sm:h-12 sm:w-12"
                        style={{imageRendering: 'pixelated'}}
                        loading="lazy"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <ScrollText className="h-3 w-3 text-yellow-400" />
                        <span className="text-[9px] uppercase tracking-[0.3em] text-yellow-400">
                            Tournament Rules
                        </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-400">
                        <span className="font-bold text-yellow-300">Golden Shuriken</span>
                        <span className="hidden sm:inline"> · entry fee · Kaioken · Senzu revive · payout split</span>
                        <span className="sm:hidden"> · how it works</span>
                    </p>
                </div>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
            </button>

            {expanded && (
                <div className="border-t border-yellow-600/20 p-4 sm:p-5">
                    {/* Champion reward — full description */}
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 animate-pulse rounded-full bg-yellow-400/20 blur-xl" />
                            <img
                                src="/images/golden-shuriken.png"
                                alt="Golden Shuriken"
                                className="relative h-20 w-20 object-contain sm:h-24 sm:w-24"
                                style={{imageRendering: 'pixelated'}}
                                loading="lazy"
                            />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <div className="flex items-center justify-center gap-2 sm:justify-start">
                                <Trophy className="h-4 w-4 text-yellow-400" />
                                <span className="text-[9px] uppercase tracking-[0.3em] text-yellow-400">
                                    Champion Reward
                                </span>
                            </div>
                            <h2 className="mt-1 text-lg font-bold tracking-wider text-yellow-300 sm:text-xl">
                                The Golden Shuriken
                            </h2>
                            <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                                Only <span className="text-yellow-400 font-bold">3 ever minted</span> — one for each Budokai Champion.
                                Awarded automatically on-chain at resolve. Tradeable. VISUAL_TRAIT (GEAR category) —
                                applies to any AdrianZERO.
                            </p>
                        </div>
                    </div>

                    {/* 5 rule chips */}
                    <div className="mt-5 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4 sm:grid-cols-3 lg:grid-cols-5">
                        <Rule
                            icon={<Zap className="h-3 w-3 text-red-400" />}
                            label="Entry Fee"
                            value="100 $ZERO"
                            sub="10% burned · 90% to pool"
                        />
                        <Rule
                            icon={<Clock className="h-3 w-3 text-blue-400" />}
                            label="Window"
                            value="1 Week"
                            sub="1 click per event"
                        />
                        <Rule
                            icon={<Trophy className="h-3 w-3 text-yellow-400" />}
                            label="Champion Wins"
                            value="50% + Trophy"
                            sub="Top-8 share the pool"
                        />
                        <Rule
                            icon={<Flame className="h-3 w-3 text-orange-400" />}
                            label="Senzu Revive"
                            value="SR × 10 $ZERO"
                            sub="Tiered. Persistent KO."
                        />
                        <Rule
                            icon={<Flame className="h-3 w-3 text-red-400" />}
                            label="Kaioken"
                            value="5% chance"
                            sub="×2 SR · upsets happen"
                        />
                    </div>

                    {/* Kaioken callout */}
                    <div className="mt-4 rounded border border-red-600/40 bg-red-950/20 p-3 text-[10px] leading-relaxed text-red-200">
                        <div className="mb-1 flex items-center gap-2">
                            <Flame className="h-3.5 w-3.5 text-red-400" />
                            <span className="font-bold uppercase tracking-[0.3em] text-red-400">Kaioken · 界王拳</span>
                        </div>
                        <p className="text-zinc-300">
                            Each match has a deterministic <span className="font-bold text-red-400">5% chance</span> of triggering a <span className="font-bold text-red-400">Kaioken</span> — the favored fighter's effective Senryoku is doubled for that match. The roar of the underdog. This is how SR-50 civilians topple SR-100 samurai. Watch for the red flame badge in match cards: that's a Kaioken match.
                        </p>
                    </div>

                    {/* How it works */}
                    <div className="mt-4 rounded bg-black/40 p-3 text-[10px] leading-relaxed text-zinc-400">
                        <span className="font-bold text-yellow-400">How it works: </span>
                        Enter your SAMURAIzero (or any AdrianZERO as <span className="text-fuchsia-400">civilian</span>) for the entry fee.
                        When the window closes, a bracket resolves automatically — each match is weighted by <span className="text-red-400">Senryoku (SR) + Honor</span> with the 5% <span className="text-red-400">Kaioken</span> roll.
                        Champion takes 50% of the pool + the Golden/Metal Shuriken. 2nd: 20%. 3rd-4th: 8% each. 5th-8th: 3.5% each.
                        Anyone losing before the semifinals is <span className="text-red-400">KO'd</span> — they can't re-enter until you pay <span className="text-orange-400">SR × 10 $ZERO</span> for a Senzu Bean (10% burned, 90% to current pool).
                    </div>
                </div>
            )}
        </div>
    );
}

function Rule({icon, label, value, sub}: {icon: React.ReactNode; label: string; value: string; sub: string}) {
    return (
        <div className="flex flex-col rounded bg-zinc-950/60 p-2.5">
            <div className="flex items-center gap-1.5">
                {icon}
                <span className="text-[8px] uppercase tracking-[0.25em] text-zinc-500">{label}</span>
            </div>
            <span className="mt-1 text-sm font-mono font-bold text-white">{value}</span>
            <span className="text-[8px] text-zinc-600">{sub}</span>
        </div>
    );
}
