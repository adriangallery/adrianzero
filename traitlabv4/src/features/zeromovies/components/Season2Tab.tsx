import { useMovies2Catalog } from '../hooks/useMovies2Catalog';
import { useGoldenEligibility } from '../hooks/useGoldenEligibility';
import { useMovie2Actions } from '../hooks/useMovie2Actions';
import { Movie2Card } from './Movie2Card';
import { Movie2DetailModal } from './Movie2DetailModal';
import { S2GoldenClaimBanner } from './S2GoldenClaimBanner';
import { S2SuccessToast } from './S2SuccessToast';
import { getS2PosterUrl } from '../data/movies2Mock';
import { useMovies2Store } from '../store/movies2Store';

export function Season2Tab() {
  const { movies, rentalMap, onShelf, config, isMock } = useMovies2Catalog();
  const { snapshotMeta } = useGoldenEligibility();
  const { selectedMovieId, isDetailOpen, selectMovie, closeDetail, goldenClaimed } = useMovies2Store();
  const { claimGoldenMint, isPending, pendingAction } = useMovie2Actions();

  const selectedMovie = movies.find((m) => m.id === selectedMovieId) ?? null;
  const selectedRental = selectedMovie ? rentalMap.get(selectedMovie.id) ?? null : null;

  const overdueCount = movies.reduce((acc, m) => acc + (rentalMap.get(m.id)?.isOverdue ? 1 : 0), 0);
  const permanentCount = movies.reduce((acc, m) => acc + (rentalMap.get(m.id)?.permanent ? 1 : 0), 0);

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-wider text-yellow-500 sm:text-3xl">ZEROmovies II</h2>
        <p className="text-[9px] tracking-[0.3em] text-zinc-600 sm:text-[10px]">
          THE RETURN OF THE PIXEL
        </p>
      </div>

      {/* Mock-mode warning banner — visible only while the live facet isn't deployed */}
      {isMock && (
        <div className="mb-4 rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-center text-[9px] uppercase tracking-widest text-zinc-500">
          Preview · Catalog and rental state are mock data — replace once the on-chain facet ships
        </div>
      )}

      <S2GoldenClaimBanner
        unpauseAt={Math.floor(Date.now() / 1000) - 60}
        alreadyClaimed={goldenClaimed}
        onClaim={claimGoldenMint}
        isClaiming={pendingAction === 'claimGolden'}
        isClaimDisabled={isPending}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-3 text-[9px] uppercase tracking-wider text-zinc-500 sm:text-[10px]">
          <span>On shelf: <span className="text-white">{onShelf.length}/{movies.length}</span></span>
          <span>Permanent: <span className="text-yellow-400">{permanentCount}</span></span>
          <span>Overdue: <span className="text-red-400">{overdueCount}</span></span>
          <span>Rent: <span className="text-red-400">{config.rentPrice.toLocaleString()}</span></span>
          <span>Buy: <span className="text-yellow-400">{config.buyPrice.toLocaleString()}</span></span>
          {config.paused && <span className="animate-pulse text-yellow-400">SOON</span>}
        </div>
        <span className="text-[9px] uppercase tracking-widest text-zinc-600">
          Snapshot {new Date(snapshotMeta.takenAt).toLocaleDateString()} · {snapshotMeta.totalEligibleHolders} holders · {snapshotMeta.totalTickets} tickets
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-7">
        {movies.map((m) => {
          const rental = rentalMap.get(m.id)!;
          return (
            <Movie2Card
              key={m.id}
              movie={m}
              posterUrl={getS2PosterUrl(m.id, m.isMystery)}
              rental={rental}
              onClick={() => selectMovie(m.id)}
            />
          );
        })}
      </div>

      {/* Cross-season + late-fee mechanic explainer (preview copy) */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-yellow-500">Asymmetric tokenomics</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-zinc-400">
            Every S2 transaction routes <span className="text-white">50% burn</span> ·{' '}
            <span className="text-yellow-400">20% to S1 permanent holders</span> · 30% to FiftyFifty.
            S1 keeps earning from S2 forever. S2 itself has no holder rewards.
          </p>
        </div>
        <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">Return-the-tape</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-zinc-400">
            7-day grace, then the NFT shows <span className="text-red-400">OVERDUE</span> on every
            marketplace. <span className="text-emerald-400">Returning the tape is always free</span> — the rent
            itself is non-refundable, but you can drop it back on the shelf any time.
            Late fees (<span className="text-red-400">1k ZERO/day</span>) only apply if you upgrade
            an overdue rent into a permanent buy, never on a plain return.
          </p>
        </div>
      </div>

      <Movie2DetailModal
        movie={selectedMovie}
        rental={selectedRental}
        posterUrl={selectedMovie ? getS2PosterUrl(selectedMovie.id, selectedMovie.isMystery) : ''}
        open={isDetailOpen}
        onClose={closeDetail}
      />
      <S2SuccessToast />
    </>
  );
}
