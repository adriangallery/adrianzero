import {memo} from 'react';

interface SamuraiCardProps {
    tokenId: number;
    senryoku: number;
    isEntered: boolean;
    isKnockedOut: boolean;
    isMine: boolean;
    onClick: () => void;
    multiSelectMode?: boolean;
    isSelected?: boolean;
    honor?: number; // v6: persistent combat bonus from podium finishes. 0 on v4.
}

function getSamuraiImageUrl(tokenId: number): string {
    return `https://adrianlab.vercel.app/api/render/${tokenId}.png`;
}

export const SamuraiCard = memo(function SamuraiCard({
    tokenId,
    senryoku,
    isEntered,
    isKnockedOut,
    isMine,
    onClick,
    multiSelectMode = false,
    isSelected = false,
    honor = 0,
}: SamuraiCardProps) {
    // Border hierarchy (MINE tab visual fix):
    //   selected (multi-select)  → red solid + ring
    //   mine & IN this Budokai   → yellow solid + glow  (committed, locked in)
    //   mine & READY to enter    → zinc dashed          (available, opt-in vibe)
    //   mine & KO'd              → no border (gray overlay handles it)
    //   community / read-only    → no border
    const mineBorder = isSelected
        ? 'border-2 border-red-500 ring-2 ring-red-500/50'
        : isMine && isEntered && !isKnockedOut
            ? 'border-2 border-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.25)]'
            : isMine && !isEntered && !isKnockedOut
                ? 'border-2 border-dashed border-zinc-600'
                : '';

    return (
        <button
            onClick={onClick}
            className={`group relative flex min-w-0 flex-col overflow-hidden rounded text-left transition-all duration-300 cursor-pointer hover:scale-105 hover:z-10
        ${mineBorder}
        ${isKnockedOut ? 'opacity-50 saturate-0' : ''}
      `}
        >
            <div className="relative aspect-square w-full overflow-hidden rounded-t bg-zinc-900">
                <img
                    src={getSamuraiImageUrl(tokenId)}
                    alt={`SamuraiZERO #${tokenId}`}
                    className="h-full w-full object-contain"
                    style={{imageRendering: 'pixelated'}}
                    loading="lazy"
                />

                {/* Senryoku — top-left scouter readout. v6: shows "+H" honor bonus in gold if any. */}
                <div className="absolute top-1 left-1 rounded border border-red-500/40 bg-black/70 px-1.5 py-0.5 backdrop-blur-sm">
                    <span className="text-[7px] font-mono font-bold uppercase tracking-wider text-red-400">
                        SR
                    </span>
                    <span className="ml-1 text-[9px] font-mono font-bold text-white">{senryoku}</span>
                    {honor > 0 && (
                        <span className="ml-0.5 text-[9px] font-mono font-bold text-yellow-400" title={`Honor bonus: +${honor}`}>
                            +{honor}
                        </span>
                    )}
                </div>

                {/* Multi-select checkbox overrides badges when active */}
                {multiSelectMode && isMine && !isEntered && !isKnockedOut ? (
                    <div
                        className={`absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded border-2 text-[10px] font-bold ${
                            isSelected ? 'border-red-500 bg-red-500 text-white' : 'border-white/60 bg-black/60 text-transparent'
                        }`}
                    >
                        ✓
                    </div>
                ) : (
                    <>
                        {/* Status badges — top-right */}
                        {isKnockedOut && (
                            <div className="absolute top-1 right-1 rounded bg-red-700 px-1.5 py-0.5 text-[7px] font-bold uppercase text-white">
                                KO
                            </div>
                        )}
                        {isEntered && !isKnockedOut && (
                            <div className="absolute top-1 right-1 rounded bg-yellow-400 px-1.5 py-0.5 text-[7px] font-bold uppercase text-black">
                                IN
                            </div>
                        )}
                        {isMine && !isEntered && !isKnockedOut && (
                            <div className="absolute top-1 right-1 rounded bg-green-600 px-1.5 py-0.5 text-[7px] font-bold uppercase text-white">
                                MINE
                            </div>
                        )}
                    </>
                )}

                {/* Red overlay for KO'd — dojo floor */}
                {isKnockedOut && (
                    <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-red-900/40 to-transparent">
                        <span className="mb-2 rounded bg-black/70 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-red-400">
                            Unconscious
                        </span>
                    </div>
                )}
            </div>

            <div className="px-1 py-1.5">
                <p className="truncate text-[9px] font-bold text-zinc-300 transition-colors group-hover:text-white">
                    #{tokenId}
                </p>
            </div>
        </button>
    );
});
