import {memo} from 'react';

interface SamuraiCardProps {
    tokenId: number;
    senryoku: number;
    isEntered: boolean;
    isKnockedOut: boolean;
    isMine: boolean;
    onClick: () => void;
    multiSelectMode?: boolean;
    multiSelectKind?: 'enter' | 'revive'; // determines which cards show a checkbox
    isSelected?: boolean;
    honor?: number; // v6: persistent combat bonus from podium finishes. 0 on v4.
    isSamurai?: boolean; // v6: false = civilian (regular AdrianZERO entering with derived SR 1-15). Default true for back-compat.
    isCivilianPreview?: boolean; // v6: senryoku is a *preview* (token hasn't entered yet), shown grayed out
    skinOverride?: {imageUrl: string; name: string} | null; // v10: cosmetic skin for synthetic civilian tokenIds (≥ 1_000_001)
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
    multiSelectKind = 'enter',
    isSelected = false,
    honor = 0,
    isSamurai = true,
    isCivilianPreview = false,
    skinOverride = null,
}: SamuraiCardProps) {
    // Border hierarchy (MINE tab visual fix):
    //   selected (multi-select)  → red solid + ring
    //   mine & IN this Budokai   → solid border + glow  (samurai=yellow, civilian=fuchsia)
    //   mine & READY to enter    → dashed                (samurai=zinc, civilian=fuchsia)
    //   mine & KO'd              → no border (gray overlay handles it)
    //   community / read-only    → no border
    const inBorder = isSamurai
        ? 'border-2 border-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.25)]'
        : 'border-2 border-fuchsia-400 shadow-[0_0_16px_rgba(232,121,249,0.30)]';
    const readyBorder = isSamurai
        ? 'border-2 border-dashed border-zinc-600'
        : 'border-2 border-dashed border-fuchsia-700/70';
    const mineBorder = isSelected
        ? 'border-2 border-red-500 ring-2 ring-red-500/50'
        : isMine && isEntered && !isKnockedOut
            ? inBorder
            : isMine && !isEntered && !isKnockedOut
                ? readyBorder
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
                    src={skinOverride?.imageUrl ?? getSamuraiImageUrl(tokenId)}
                    alt={skinOverride?.name ?? `SamuraiZERO #${tokenId}`}
                    className="h-full w-full object-cover"
                    style={skinOverride ? undefined : {imageRendering: 'pixelated'}}
                    loading="lazy"
                />

                {/* Senryoku — top-left scouter readout. v6: shows "+H" honor bonus in gold if any.
                    Civilian variant: fuchsia accent + "~" prefix when previewing pre-entry SR. */}
                <div className={`absolute top-1 left-1 rounded border ${
                    isSamurai ? 'border-red-500/40' : 'border-fuchsia-500/40'
                } bg-black/70 px-1.5 py-0.5 backdrop-blur-sm`}>
                    <span className={`text-[7px] font-mono font-bold uppercase tracking-wider ${
                        isSamurai ? 'text-red-400' : 'text-fuchsia-400'
                    }`}>
                        SR
                    </span>
                    <span className={`ml-1 text-[9px] font-mono font-bold ${isCivilianPreview ? 'text-fuchsia-200/80' : 'text-white'}`}>
                        {isCivilianPreview ? '~' : ''}{senryoku}
                    </span>
                    {honor > 0 && (
                        <span className="ml-0.5 text-[9px] font-mono font-bold text-yellow-400" title={`Honor bonus: +${honor}`}>
                            +{honor}
                        </span>
                    )}
                </div>

                {/* Multi-select checkbox overrides badges when active.
                    'enter' kind: show on owned tokens that are not entered and not KO.
                    'revive' kind: show on owned tokens that ARE KO. */}
                {multiSelectMode && isMine && (
                    multiSelectKind === 'revive'
                        ? isKnockedOut
                        : !isEntered && !isKnockedOut
                ) ? (
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
                            <div className={`absolute top-1 right-1 rounded px-1.5 py-0.5 text-[7px] font-bold uppercase text-white ${
                                isSamurai ? 'bg-green-600' : 'bg-fuchsia-600'
                            }`}>
                                {isSamurai ? 'MINE' : 'CIVIL'}
                            </div>
                        )}
                    </>
                )}

                {/* Red overlay for KO'd — dojo floor. Tag scales down with card to avoid overflow on tight grids. */}
                {isKnockedOut && (
                    <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-red-900/40 to-transparent">
                        <span className="mb-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-red-400 sm:text-[8px]">
                            KO
                        </span>
                    </div>
                )}
            </div>

            <div className="px-1 py-1.5">
                <p className={`truncate text-[9px] font-bold transition-colors group-hover:text-white ${
                    skinOverride ? 'text-cyan-300' : isSamurai ? 'text-zinc-300' : 'text-fuchsia-300'
                }`}>
                    {skinOverride ? skinOverride.name : `#${tokenId}`}
                </p>
            </div>
        </button>
    );
});
