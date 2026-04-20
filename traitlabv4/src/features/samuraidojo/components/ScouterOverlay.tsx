import {useEffect, useState} from 'react';

interface ScouterOverlayProps {
    senryoku: number;
    tier?: string;
    animate?: boolean;
}

/**
 * DBZ-style scouter readout. When `animate`, numbers tick up rapidly
 * before settling on the real value (the "Vegeta scouter" effect).
 */
export function ScouterOverlay({senryoku, tier, animate = false}: ScouterOverlayProps) {
    const [display, setDisplay] = useState(animate ? 0 : senryoku);

    useEffect(() => {
        if (!animate) {
            setDisplay(senryoku);
            return;
        }
        let current = 0;
        const step = Math.max(1, Math.ceil(senryoku / 40));
        const interval = setInterval(() => {
            current = Math.min(senryoku, current + step + Math.floor(Math.random() * 3));
            setDisplay(current);
            if (current >= senryoku) {
                clearInterval(interval);
                setDisplay(senryoku);
            }
        }, 30);
        return () => clearInterval(interval);
    }, [senryoku, animate]);

    const intensity = senryoku >= 90 ? 'high' : senryoku >= 70 ? 'mid' : 'low';
    const colorClass = intensity === 'high' ? 'text-red-400' : intensity === 'mid' ? 'text-yellow-400' : 'text-green-400';
    const glowClass = intensity === 'high' ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : '';

    return (
        <div className="rounded-lg border-2 border-red-500/40 bg-black/80 px-4 py-3 backdrop-blur-md font-mono">
            <div className="flex items-center justify-between">
                <span className="text-[8px] uppercase tracking-[0.3em] text-red-500">Senryoku (戦力)</span>
                {tier && (
                    <span className="text-[8px] uppercase tracking-wider text-zinc-500">{tier.split('/')[0]?.trim() ?? tier}</span>
                )}
            </div>
            <div className={`text-4xl font-bold ${colorClass} ${glowClass} ${animate ? 'animate-pulse' : ''}`}>
                {display.toLocaleString()}
            </div>
            {/* Power bar */}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                    className={`h-full transition-all duration-500 ${
                        intensity === 'high'
                            ? 'bg-gradient-to-r from-red-600 to-orange-500'
                            : intensity === 'mid'
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-300'
                            : 'bg-gradient-to-r from-green-600 to-green-400'
                    }`}
                    style={{width: `${Math.min(100, display)}%`}}
                />
            </div>
        </div>
    );
}
