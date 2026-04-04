import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import type { Movie } from '../types';
import { useMovieMint, useMovieReturn, useMovieKeep, useNftApproval } from '../hooks/useMovieMint';
import { useZeroBalance, useMoviesConfig } from '../hooks/useZeroBalance';
import { useMoviesStore } from '../store/moviesStore';
import { useAccount, useReadContract } from 'wagmi';
import { useWalletPrompt } from '@/hooks/useWalletPrompt';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZERO_MOVIES_FACET_ABI } from '@/lib/web3/abi';
import { formatEther } from 'viem';

interface MovieDetailModalProps {
  movie: Movie | null;
  posterUrl: string;
  open: boolean;
  onClose: () => void;
  onMintSuccess: () => void;
  isMystery?: boolean;
  rentalStatus?: { renter: string; deposit: bigint; rentedAt: number; permanent: boolean; rentCount: number } | null;
}

export function MovieDetailModal({ movie, posterUrl, open, onClose, onMintSuccess, isMystery = false, rentalStatus }: MovieDetailModalProps) {
  const { address, isConnected } = useAccount();
  const { requireWallet } = useWalletPrompt();
  const { balance, balanceRaw } = useZeroBalance();
  const { price, priceFormatted } = useMoviesConfig();
  const { mint, isPending, isConfirming, isConfirmed, error, reset } = useMovieMint();
  const { returnMovie, isPending: isReturnPending, isConfirming: isReturnConfirming, isConfirmed: isReturnConfirmed, reset: resetReturn } = useMovieReturn();
  const { isApproved: nftApproved, approve: approveNft, isPending: isApprovePending, isConfirming: isApproveConfirming, isConfirmed: isApproveConfirmed, refetch: refetchApproval } = useNftApproval();
  const { keepForever, isPending: isKeepPending, isConfirming: isKeepConfirming, isConfirmed: isKeepConfirmed, reset: resetKeep } = useMovieKeep();
  const { showSuccess } = useMoviesStore();

  // Check canKeep on-chain
  const { data: canKeepData } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: ZERO_MOVIES_FACET_ABI,
    functionName: 'canKeep',
    args: movie ? [BigInt(movie.id)] : undefined,
    query: { enabled: !!movie && !!rentalStatus?.renter },
  });

  const hasEnoughBalance = balanceRaw >= price;
  const isYours = rentalStatus?.renter?.toLowerCase() === address?.toLowerCase();
  const isRentedByOther = rentalStatus?.renter && rentalStatus.renter !== '0x0000000000000000000000000000000000000000' && !isYours;
  const isAvailable = !rentalStatus?.renter || rentalStatus.renter === '0x0000000000000000000000000000000000000000';
  const isPermanent = rentalStatus?.permanent;
  const canKeep = canKeepData as boolean;
  const depositFormatted = rentalStatus?.deposit ? Number(formatEther(rentalStatus.deposit)) : 0;

  // Days since rental
  const daysSinceRent = rentalStatus?.rentedAt
    ? Math.floor((Date.now() / 1000 - rentalStatus.rentedAt) / 86400)
    : 0;

  useEffect(() => {
    if (isConfirmed && movie) { showSuccess(movie.tokenId || 0); onMintSuccess(); reset(); }
  }, [isConfirmed]);

  useEffect(() => {
    if (isReturnConfirmed) { onMintSuccess(); resetReturn(); onClose(); }
  }, [isReturnConfirmed]);

  useEffect(() => {
    if (isKeepConfirmed) { onMintSuccess(); resetKeep(); }
  }, [isKeepConfirmed]);

  if (!movie) return null;

  const handleRent = () => { if (!requireWallet('rent a ZEROmovie')) return; mint(movie.id); };
  const handleReturn = () => {
    if (!requireWallet('return')) return;
    if (!nftApproved) {
      approveNft();
      return;
    }
    returnMovie(movie.id);
  };

  // After approval confirmed, auto-trigger return
  useEffect(() => {
    if (isApproveConfirmed) {
      refetchApproval();
      returnMovie(movie!.id);
    }
  }, [isApproveConfirmed]);
  const handleKeep = () => { if (!requireWallet('keep forever')) return; keepForever(movie.id); };

  const isLoading = isPending || isConfirming || isReturnPending || isReturnConfirming || isKeepPending || isKeepConfirming || isApprovePending || isApproveConfirming;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-800 bg-zinc-950 p-0 shadow-2xl focus:outline-none">
          <Dialog.Close className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-red-600 transition-colors">
            <X className="h-4 w-4" />
          </Dialog.Close>

          {/* Poster / Mystery */}
          <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-zinc-900">
            {isMystery ? (
              <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-950">
                <span className="text-8xl font-black italic text-red-600">X</span>
                <span className="mt-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">Restricted Section</span>
                <span className="mt-1 text-[9px] text-zinc-600">Identity revealed after renting</span>
              </div>
            ) : (
              <img src={posterUrl} alt={movie.name} className="h-full w-full object-contain" style={{ imageRendering: 'pixelated' }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          </div>

          <div className="space-y-3 p-5">
            <Dialog.Title className="text-lg font-bold text-white">
              {isMystery ? 'Mystery Movie' : movie.name}
            </Dialog.Title>

            {/* Rental status badge */}
            {isYours && !isPermanent && (
              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Rented {daysSinceRent} day{daysSinceRent !== 1 ? 's' : ''} ago
                {depositFormatted > 0 && <span>· {depositFormatted.toLocaleString()} $ZERO deposit</span>}
              </div>
            )}
            {isYours && isPermanent && (
              <div className="flex items-center gap-2 text-[10px] text-yellow-400">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                Yours forever
              </div>
            )}
            {rentalStatus && rentalStatus.rentCount > 1 && (
              <p className="text-[9px] text-zinc-600">Rented {rentalStatus.rentCount} times total</p>
            )}

            {/* Price info */}
            {isAvailable && !isPermanent && (
              <>
                <div className="flex items-center justify-between rounded-lg bg-zinc-900 p-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">Rent Price</p>
                    <p className="text-sm font-bold text-red-500">{priceFormatted.toLocaleString()} $ZERO</p>
                    <p className="text-[8px] text-zinc-600">30% burned · 50% refundable</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">Balance</p>
                    <p className={`text-sm font-bold ${hasEnoughBalance ? 'text-green-400' : 'text-red-400'}`}>
                      {balance.toLocaleString(undefined, { maximumFractionDigits: 0 })} $ZERO
                    </p>
                  </div>
                </div>

                <button onClick={handleRent} disabled={isLoading || !hasEnoughBalance || !isConnected}
                  className={`w-full rounded-lg py-3 text-sm font-bold transition-all ${
                    isLoading ? 'cursor-wait bg-zinc-700 text-zinc-400'
                    : !hasEnoughBalance || !isConnected ? 'cursor-not-allowed bg-zinc-800 text-zinc-500'
                    : 'bg-red-600 text-white hover:bg-red-500 active:scale-[0.98]'
                  }`}>
                  {isPending ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Confirm in wallet...</span>
                    : isConfirming ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Renting...</span>
                    : !isConnected ? 'Connect Wallet'
                    : !hasEnoughBalance ? `Need ${(priceFormatted - balance).toLocaleString(undefined, { maximumFractionDigits: 0 })} more $ZERO`
                    : isMystery ? 'RENT MYSTERY' : 'RENT'}
                </button>

                {error && <p className="text-center text-xs text-red-400">{(error as Error).message?.slice(0, 100)}</p>}
                <p className="text-center text-[10px] text-zinc-600">No approval needed · Return anytime for 50% refund</p>
              </>
            )}

            {/* Currently rented by someone else */}
            {isRentedByOther && (
              <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-3 text-center">
                <p className="text-xs font-bold text-amber-400">Currently Rented</p>
                <p className="mt-1 text-[10px] text-zinc-500">Check back later — it may be returned</p>
              </div>
            )}

            {/* YOURS: Return + Keep Forever */}
            {isYours && !isPermanent && (
              <div className="flex gap-2">
                <button onClick={handleReturn} disabled={isLoading}
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 text-[11px] font-bold text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50">
                  {isApprovePending || isApproveConfirming
                    ? <span className="flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Approving...</span>
                    : isReturnPending || isReturnConfirming
                    ? <span className="flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Returning...</span>
                    : !nftApproved
                    ? `Approve & Return · Get ${depositFormatted.toLocaleString()} $ZERO`
                    : `Return · Get ${depositFormatted.toLocaleString()} $ZERO`}
                </button>

                {canKeep && (
                  <button onClick={handleKeep} disabled={isLoading}
                    className="flex-1 rounded-lg bg-yellow-600 py-2.5 text-[11px] font-bold text-black hover:bg-yellow-500 transition-colors disabled:opacity-50">
                    {isKeepPending || isKeepConfirming
                      ? <span className="flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /></span>
                      : 'Keep Forever'}
                  </button>
                )}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
