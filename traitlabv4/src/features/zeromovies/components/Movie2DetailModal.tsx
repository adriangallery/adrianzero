import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, X } from 'lucide-react';
import { useAccount } from 'wagmi';
import type { Movie2, Movie2RentalState } from '../types';
import { useMovie2Actions } from '../hooks/useMovie2Actions';
import { useMovies2Catalog } from '../hooks/useMovies2Catalog';
import { useGoldenEligibility } from '../hooks/useGoldenEligibility';
import { useWalletRentalCap } from '../hooks/useWalletRentalCap';
import { useWalletPrompt } from '@/hooks/useWalletPrompt';
import { EnsName } from '@/components/shared/EnsName';

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

interface Movie2DetailModalProps {
  movie: Movie2 | null;
  posterUrl: string;
  rental: Movie2RentalState | null;
  open: boolean;
  onClose: () => void;
}

const ANGLE_LABEL: Record<Movie2['angle'], string> = {
  cult: 'Cult Era · 90s/2000s',
  pixel: 'Pixel Era · Videogame',
  horror: 'Horror Legends',
};

export function Movie2DetailModal({ movie, posterUrl, rental, open, onClose }: Movie2DetailModalProps) {
  const { address, isConnected } = useAccount();
  const { requireWallet } = useWalletPrompt();
  const { config } = useMovies2Catalog();
  const { rent2, buy2, returnMovie2, upgradeRent2ToBuy, isPending, pendingAction } = useMovie2Actions();
  const { isEligible, ticketCount } = useGoldenEligibility();
  const rentalCap = useWalletRentalCap();

  if (!movie || !rental) return null;

  const hasRenter = rental.renter && rental.renter !== ZERO_ADDR;
  const isMine = hasRenter && rental.renter.toLowerCase() === address?.toLowerCase();
  const isOnShelf = !rental.permanent && !hasRenter;
  const isMineRent = !rental.permanent && isMine;
  const isMinePermanent = rental.permanent && isMine;
  const isOthers = (rental.permanent || hasRenter) && !isMine;
  const isOverdue = rental.isOverdue;

  // On-chain: returnMovie2 is FREE at any time. Late fees only flow on
  // upgradeRent2ToBuy when the rent is overdue (`daysOverdue * 1k ZERO`).
  const lateFee = isMineRent && isOverdue ? rental.daysOverdue * config.lateFeePerDay : 0;
  const upgradeCost = config.buyPrice - config.rentPrice + lateFee;

  const requireConnected = (fn: () => void) => () => {
    if (!isConnected) return requireWallet();
    fn();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-zinc-800 bg-black shadow-2xl data-[state=open]:animate-in data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">{movie.name}</Dialog.Title>

          <div className="relative flex flex-col">
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute right-2 top-2 z-20 rounded p-1 text-zinc-500 hover:bg-zinc-900 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Poster */}
            <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
              {movie.isMystery && !movie.revealed ? (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
                  <span className="font-mono text-6xl font-bold text-zinc-700">???</span>
                </div>
              ) : (
                <img
                  src={posterUrl}
                  alt={movie.name}
                  className={`h-full w-full object-contain ${isOthers && !isOverdue ? 'opacity-30 saturate-0' : ''}`}
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}

              {/* OVERDUE overlay (mirror the AdrianLAB compositor look) */}
              {isOverdue && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/50">
                  <span className="rotate-[-12deg] rounded border-4 border-red-500 px-6 py-2 text-2xl font-black uppercase tracking-widest text-red-400">
                    OVERDUE
                  </span>
                  <span className="mt-3 text-sm font-bold uppercase tracking-wider text-red-300">
                    {rental.daysOverdue} day{rental.daysOverdue === 1 ? '' : 's'}
                  </span>
                </div>
              )}
            </div>

            {/* Header */}
            <div className="border-b border-zinc-900 px-4 py-3">
              <div className="text-[8px] uppercase tracking-[0.3em] text-zinc-600">
                Season 2 · {ANGLE_LABEL[movie.angle]} · #{movie.id}
              </div>
              <div className="mt-0.5 text-base font-bold text-white">
                {movie.isMystery && !movie.revealed ? 'Mystery card' : movie.name}
              </div>
              {/* Status line */}
              <div className="mt-2 text-[10px] text-zinc-500">
                {isMinePermanent && <span className="text-yellow-400">You own this permanently</span>}
                {isMineRent && !isOverdue && (
                  <span className="text-sky-400">You're renting · {rental.daysOverdue === 0 ? 'in grace' : `${rental.daysOverdue}d into grace`}</span>
                )}
                {isMineRent && isOverdue && (
                  <span className="text-red-400">
                    You're renting · OVERDUE {rental.daysOverdue}d · late fee {lateFee.toLocaleString()} $ZERO
                  </span>
                )}
                {isOthers && !isOverdue && (
                  <span>
                    {rental.permanent ? 'Owned' : 'Rented'} by{' '}
                    <EnsName address={rental.renter} className="text-zinc-300" />
                  </span>
                )}
                {isOthers && isOverdue && (
                  <span className="text-red-400">
                    Held overdue by <EnsName address={rental.renter} className="text-zinc-300" /> · {rental.daysOverdue}d past grace
                  </span>
                )}
                {isOnShelf && <span className="text-emerald-400">Available on the shelf</span>}
              </div>
            </div>

            {/* Action area */}
            <div className="space-y-2 px-4 py-4">
              {/* AVAILABLE → rent | buy */}
              {isOnShelf && (
                <>
                  {/* Cap-reached warning — only shown when there's no slot left */}
                  {isConnected && rentalCap.cap > 0 && !rentalCap.canRent && (
                    <div className="rounded border border-orange-500/40 bg-orange-950/30 px-3 py-2 text-[10px] leading-relaxed text-orange-300">
                      <span className="font-bold">Rental cap reached.</span> You have{' '}
                      <span className="font-bold text-white">{rentalCap.total}/{rentalCap.cap}</span> active rentals across S1+S2.
                      Return a tape to free a slot, or buy permanently — buys don't count toward the cap.
                    </div>
                  )}
                  <ActionRow
                    label="Rent"
                    sub={rentalCap.cap > 0 && !rentalCap.canRent
                      ? 'Cap reached — return a tape first or buy permanently'
                      : isConnected && rentalCap.cap > 0
                        ? `${rentalCap.slotsLeft}/${rentalCap.cap} slots left · 7d grace, then 1k ZERO/day late fee`
                        : '7d grace · after grace 1k ZERO/day late fee'}
                    cost={`${config.rentPrice.toLocaleString()} $ZERO`}
                    accent="sky"
                    busy={pendingAction === 'rent'}
                    disabled={isPending || (isConnected && !rentalCap.canRent)}
                    onClick={requireConnected(() => rent2(movie.id))}
                  />
                  <ActionRow
                    label="Buy permanently"
                    sub="No cap, no grace period, no late fees — yours forever"
                    cost={`${config.buyPrice.toLocaleString()} $ZERO`}
                    accent="yellow"
                    busy={pendingAction === 'buy'}
                    disabled={isPending}
                    onClick={requireConnected(() => buy2(movie.id))}
                  />
                </>
              )}

              {/* MY ACTIVE RENT (in-grace) → free return | upgrade */}
              {isMineRent && !isOverdue && (
                <>
                  <ActionRow
                    label="Return tape"
                    sub="Free · drops back on the shelf for anyone to rent or buy"
                    cost="Free"
                    accent="emerald"
                    busy={pendingAction === 'return'}
                    disabled={isPending}
                    onClick={requireConnected(() => returnMovie2(movie.id))}
                  />
                  <ActionRow
                    label="Upgrade rent → Buy"
                    sub={`Pay ${(config.buyPrice - config.rentPrice).toLocaleString()} $ZERO diff, keep forever`}
                    cost={`${(config.buyPrice - config.rentPrice).toLocaleString()} $ZERO`}
                    accent="yellow"
                    busy={pendingAction === 'upgrade'}
                    disabled={isPending}
                    onClick={requireConnected(() => upgradeRent2ToBuy(movie.id))}
                  />
                  <div className="rounded border border-zinc-900 bg-zinc-950 p-2 text-[9px] text-zinc-500 space-y-1">
                    <div>
                      Tape due back in <span className="text-zinc-300">{Math.max(0, 7 - Math.floor((Date.now() / 1000 - rental.rentedAt) / 86_400))}d</span>.
                      After 7 days it shows <span className="text-red-400">OVERDUE</span> everywhere — return is always free.
                    </div>
                    {isConnected && rentalCap.cap > 0 && (
                      <div className={rentalCap.slotsLeft === 0 ? 'text-orange-400' : 'text-zinc-600'}>
                        Rental slots: <span className="font-bold text-zinc-300">{rentalCap.total}/{rentalCap.cap}</span> used across S1+S2.
                        {rentalCap.slotsLeft === 0 && ' Return this tape to unlock another rental.'}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* MY OVERDUE RENT → free return | upgrade (late fees only on upgrade) */}
              {isMineRent && isOverdue && (
                <>
                  <ActionRow
                    label="Return tape"
                    sub={`Still free · ${rental.daysOverdue}d overdue · no late fee charged on return`}
                    cost="Free"
                    accent="emerald"
                    busy={pendingAction === 'return'}
                    disabled={isPending}
                    onClick={requireConnected(() => returnMovie2(movie.id))}
                  />
                  <ActionRow
                    label="Upgrade rent → Buy"
                    sub={`Diff (${(config.buyPrice - config.rentPrice).toLocaleString()}) + late fees (${lateFee.toLocaleString()}). Keep forever.`}
                    cost={`${upgradeCost.toLocaleString()} $ZERO`}
                    accent="yellow"
                    busy={pendingAction === 'upgrade'}
                    disabled={isPending}
                    onClick={requireConnected(() => upgradeRent2ToBuy(movie.id))}
                  />
                  <div className="rounded border border-red-900/40 bg-red-950/20 p-2 text-[9px] text-red-300">
                    Late fees ({lateFee.toLocaleString()} $ZERO so far) only apply if you upgrade to buy. Returning the tape is always free.
                  </div>
                </>
              )}

              {/* MY PERMANENT → no actions, just stats */}
              {isMinePermanent && (
                <div className="rounded border border-yellow-500/30 bg-yellow-900/10 p-3 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-yellow-500">Permanent</div>
                  <div className="mt-1 text-sm text-yellow-200">This tape is yours forever</div>
                  <div className="mt-2 text-[9px] text-zinc-500">
                    No holder rewards on S2 itself — the perpetual share goes to S1 holders.
                  </div>
                </div>
              )}

              {/* OTHERS' RENT/BUY — info only, no actions in S2 (no marketplace yet) */}
              {isOthers && (
                <div className="rounded border border-zinc-900 bg-zinc-950 p-3 text-center text-[10px] text-zinc-500">
                  {rental.permanent
                    ? 'This tape is permanently owned by another wallet.'
                    : isOverdue
                      ? "This tape is held overdue by another wallet — they need to pay the late fee before it's available again."
                      : "This tape is currently rented by another wallet."}
                </div>
              )}
            </div>

            {/* Footer: golden hint when relevant */}
            {isEligible && ticketCount > 0 && (
              <div className="border-t border-zinc-900 bg-zinc-950 px-4 py-2 text-center text-[9px] uppercase tracking-widest text-yellow-500/80">
                You hold {ticketCount} Golden Ticket{ticketCount === 1 ? '' : 's'} — claim from the banner above
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface ActionRowProps {
  label: string;
  sub: string;
  cost: string;
  accent: 'sky' | 'yellow' | 'red' | 'emerald';
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}

function ActionRow({ label, sub, cost, accent, busy, disabled, onClick }: ActionRowProps) {
  const accentBg =
    accent === 'sky' ? 'bg-sky-500 hover:bg-sky-400 text-black'
    : accent === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
    : accent === 'emerald' ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
    : 'bg-red-500 hover:bg-red-400 text-white';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between rounded px-4 py-3 text-left transition-colors ${accentBg} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        <span className="text-[9px] font-normal opacity-80">{sub}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold tabular-nums">{cost}</span>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
    </button>
  );
}
