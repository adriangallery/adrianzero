import {memo} from 'react';

interface SamuraiCardProps {
    tokenId: number;
    senryoku: number;
    isEntered: boolean;
    isKnockedOut: boolean;
    isMine: boolean;
    onClick: () => void;
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
}: SamuraiCardProps) {
    return (
        <button
            onClick={onClick}
            className={`group relative flex min-w-0 flex-col overflow-hidden rounded text-left transition-all duration-300 cursor-pointer hover:scale-105 hover:z-10
        ${isMine ? 'border-2 border-yellow-400' : ''}
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

                {/* Senryoku — top-left scouter readout */}
                <div className="absolute top-1 left-1 rounded border border-red-500/40 bg-black/70 px-1.5 py-0.5 backdrop-blur-sm">
                    <span className="text-[7px] font-mono font-bold uppercase tracking-wider text-red-400">
                        SR
                    </span>
                    <span className="ml-1 text-[9px] font-mono font-bold text-white">{senryoku}</span>
                </div>

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
