interface CountdownTimerProps {
    /** Seconds remaining until the auction ends. Anti-snipe extensions update this. */
    secondsLeft: number;
    /** True when a recent bid pushed `endTime` forward (last 60s). Drives a brief "+5min" pulse. */
    extendedRecently?: boolean;
}

function pad(n: number) {
    return n.toString().padStart(2, '0');
}

export function CountdownTimer({secondsLeft, extendedRecently}: CountdownTimerProps) {
    const days = Math.floor(secondsLeft / 86400);
    const hours = Math.floor((secondsLeft % 86400) / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;
    const isEnded = secondsLeft <= 0;
    const inSnipeWindow = secondsLeft > 0 && secondsLeft <= 300; // last 5 min

    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] uppercase tracking-[0.3em] text-zinc-500">
                {isEnded ? 'Ended' : 'Time left'}
            </span>
            <div className={`flex items-center gap-1 font-mono tabular-nums ${isEnded ? 'text-zinc-600' : inSnipeWindow ? 'text-red-400' : 'text-yellow-400'}`}>
                {days > 0 && <Block label="D" value={pad(days)} />}
                <Block label="H" value={pad(hours)} />
                <Colon />
                <Block label="M" value={pad(minutes)} />
                <Colon />
                <Block label="S" value={pad(seconds)} />
            </div>
            {extendedRecently && !isEnded && (
                <span className="animate-pulse rounded bg-purple-500/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-purple-300">
                    Anti-snipe · +5 min added
                </span>
            )}
            {inSnipeWindow && !isEnded && !extendedRecently && (
                <span className="text-[8px] uppercase tracking-wider text-red-400/80">
                    Bid in last 5 min extends auction
                </span>
            )}
        </div>
    );
}

function Block({label, value}: {label: string; value: string}) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-2xl font-bold leading-none sm:text-3xl">{value}</span>
            <span className="text-[7px] uppercase tracking-wider text-zinc-600">{label}</span>
        </div>
    );
}

function Colon() {
    return <span className="text-2xl font-bold leading-none text-zinc-700 sm:text-3xl">:</span>;
}
