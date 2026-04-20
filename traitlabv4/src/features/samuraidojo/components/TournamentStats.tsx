import {useEffect, useState} from 'react';
import {formatPool, phaseLabel} from '../hooks/useDojoContract';
import type {BudokaiInfo} from '../types';

interface TournamentStatsProps {
    budokaiId: number;
    info: BudokaiInfo | null;
    zeroBalance: number;
    totalBurned: bigint;
}

function formatCountdown(secondsLeft: number): string {
    if (secondsLeft <= 0) return '00:00:00';
    const d = Math.floor(secondsLeft / 86_400);
    const h = Math.floor((secondsLeft % 86_400) / 3_600);
    const m = Math.floor((secondsLeft % 3_600) / 60);
    const s = secondsLeft % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (d > 0) return `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function TournamentStats({budokaiId, info, zeroBalance, totalBurned}: TournamentStatsProps) {
    const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
    useEffect(() => {
        const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1_000);
        return () => clearInterval(t);
    }, []);

    const phase = info ? phaseLabel(info.status, now, info) : 'SOON';
    const targetTime = info ? (now < info.entryStart ? info.entryStart : info.entryEnd) : 0;
    const secondsLeft = targetTime > 0 ? targetTime - now : 0;
    const countdownLabel = info && now < info.entryStart ? 'OPENS IN' : 'CLOSES IN';

    return (
        <div className="mb-4 rounded border border-zinc-800 bg-zinc-950/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Budokai ID + phase */}
                <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-[0.3em] text-zinc-600">
                        Budokai {budokaiId || '—'}
                    </span>
                    <span
                        className={`text-sm font-bold ${
                            phase === 'ENTRY OPEN'
                                ? 'text-yellow-400 animate-pulse'
                                : phase === 'RESOLVING'
                                ? 'text-red-400 animate-pulse'
                                : phase === 'RESOLVED'
                                ? 'text-green-400'
                                : 'text-zinc-500'
                        }`}
                    >
                        {phase}
                    </span>
                </div>

                {/* Pool */}
                <div className="flex flex-col text-right">
                    <span className="text-[8px] uppercase tracking-[0.3em] text-zinc-600">Pool</span>
                    <span className="text-xl font-bold tracking-wider text-red-400 font-mono">
                        {formatPool(info?.pool)} <span className="text-[10px] text-zinc-500">$ZERO</span>
                    </span>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-3 sm:grid-cols-4">
                <StatBlock label="Entries" value={info ? String(info.entryCount) : '0'} color="text-white" />
                <StatBlock
                    label={countdownLabel}
                    value={secondsLeft > 0 ? formatCountdown(secondsLeft) : '—'}
                    color={secondsLeft > 0 && secondsLeft < 3600 ? 'text-yellow-400' : 'text-white'}
                />
                <StatBlock
                    label="Your $ZERO"
                    value={zeroBalance.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    color="text-green-400"
                />
                <StatBlock
                    label="Burned total"
                    value={formatPool(totalBurned)}
                    color="text-orange-400"
                />
            </div>
        </div>
    );
}

function StatBlock({label, value, color}: {label: string; value: string; color: string}) {
    return (
        <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-[0.3em] text-zinc-600">{label}</span>
            <span className={`text-sm font-mono font-bold ${color}`}>{value}</span>
        </div>
    );
}
