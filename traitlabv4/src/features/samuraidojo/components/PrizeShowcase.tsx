import {Trophy, Zap, Flame, Clock} from 'lucide-react';

/**
 * Prize & rules showcase. Shown between the hero and the entry grid.
 * Explains what's at stake (pool + Golden Shuriken), how to enter, and the KO mechanic.
 */
export function PrizeShowcase() {
    return (
        <div className="mb-6 rounded border border-yellow-600/30 bg-gradient-to-b from-yellow-900/10 to-transparent p-4 sm:p-5">
            {/* Headline prize */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                <div className="relative shrink-0">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-yellow-400/20 blur-xl" />
                    <img
                        src="/images/golden-shuriken.png"
                        alt="Golden Shuriken"
                        className="relative h-24 w-24 object-contain sm:h-28 sm:w-28"
                        style={{imageRendering: 'pixelated'}}
                    />
                </div>

                <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                        <Trophy className="h-4 w-4 text-yellow-400" />
                        <span className="text-[9px] uppercase tracking-[0.3em] text-yellow-400">
                            Champion Reward
                        </span>
                    </div>
                    <h2 className="mt-1 text-xl font-bold tracking-wider text-yellow-300 sm:text-2xl">
                        The Golden Shuriken
                    </h2>
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                        Only <span className="text-yellow-400 font-bold">3 ever minted</span> — one for each Budokai Champion.
                        Awarded automatically on-chain at resolve. Tradeable. VISUAL_TRAIT (GEAR category) —
                        applies to any AdrianZERO.
                    </p>
                </div>
            </div>

            {/* Mechanics strip */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4 sm:grid-cols-4">
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
                    label="Losers KO'd"
                    value="10k Senzu"
                    sub="Persistent until revived"
                />
            </div>

            {/* Quick rules */}
            <div className="mt-4 rounded bg-black/40 p-3 text-[10px] leading-relaxed text-zinc-400">
                <span className="font-bold text-yellow-400">How it works: </span>
                Enter your SAMURAIzero for 100 $ZERO (use <span className="text-white">Multi-Enter</span> for several at once).
                When the window closes, a bracket resolves automatically — each match is weighted by <span className="text-red-400">Senryoku (SR)</span> with a 5% <span className="text-red-400">Kaioken</span> chance (×2 power, real upsets).
                Champion takes 50% of the pool + the Golden Shuriken. 2nd: 20%. 3rd-4th: 8% each. 5th-8th: 3.5% each.
                Anyone losing before the semifinals is <span className="text-red-400">KO'd</span> — they can't re-enter until you pay <span className="text-orange-400">10,000 $ZERO Senzu Bean</span> to revive them (90% goes to the NEXT Budokai's pool).
            </div>
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
