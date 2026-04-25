import { useEffect } from 'react';
import { useMovies2Store } from '../store/movies2Store';
import { MOVIES_S2_MOCK } from '../data/movies2Mock';

const ACTION_COPY: Record<string, { title: string; sub: string; accent: string }> = {
  rent: { title: 'Tape rented', sub: 'You have 7 days of grace before late fees', accent: 'text-sky-400 border-sky-500/40' },
  buy: { title: 'Tape bought', sub: 'Permanent. The S1 cross-season pool just grew', accent: 'text-yellow-400 border-yellow-500/40' },
  payLateFee: { title: 'Late fee paid', sub: 'Tape returned to the shelf · you can rent again', accent: 'text-red-400 border-red-500/40' },
  upgrade: { title: 'Upgraded to permanent', sub: 'Diff (+ late fees) absorbed · yours forever', accent: 'text-yellow-400 border-yellow-500/40' },
  claimGolden: { title: 'Golden Mint redeemed', sub: 'Random tape(s) airdropped to your wallet', accent: 'text-yellow-300 border-yellow-400/40' },
};

export function S2SuccessToast() {
  const { isSuccessOpen, lastAction, lastMovieId, closeSuccess } = useMovies2Store();

  useEffect(() => {
    if (!isSuccessOpen) return;
    const t = setTimeout(closeSuccess, 4000);
    return () => clearTimeout(t);
  }, [isSuccessOpen, closeSuccess]);

  if (!isSuccessOpen || !lastAction) return null;

  const movie = MOVIES_S2_MOCK.find((m) => m.id === lastMovieId);
  const copy = ACTION_COPY[lastAction];

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 transform rounded-md border-2 ${copy.accent} bg-black/95 px-4 py-3 shadow-2xl`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${copy.accent.split(' ')[0]}`}>{copy.title}</span>
          <span className="text-xs text-white">
            {movie ? movie.name : `Movie #${lastMovieId}`}
          </span>
          <span className="text-[9px] text-zinc-500">{copy.sub}</span>
        </div>
        <button
          onClick={closeSuccess}
          className="ml-3 rounded p-1 text-zinc-500 hover:bg-zinc-900 hover:text-white"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
