import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import type { Movie } from '../types';
import { useMovieMint } from '../hooks/useMovieMint';
import { useZeroBalance, useMoviesConfig } from '../hooks/useZeroBalance';
import { useMoviesStore } from '../store/moviesStore';
import { useAccount } from 'wagmi';
import { useWalletPrompt } from '@/hooks/useWalletPrompt';

interface MovieDetailModalProps {
  movie: Movie | null;
  posterUrl: string;
  open: boolean;
  onClose: () => void;
  onMintSuccess: () => void;
}

export function MovieDetailModal({ movie, posterUrl, open, onClose, onMintSuccess }: MovieDetailModalProps) {
  const { isConnected } = useAccount();
  const { requireWallet } = useWalletPrompt();
  const { balance, balanceRaw } = useZeroBalance();
  const { price, priceFormatted } = useMoviesConfig();
  const { mint, isPending, isConfirming, isConfirmed, error, reset } = useMovieMint();
  const { showSuccess } = useMoviesStore();

  const hasEnoughBalance = balanceRaw >= price;

  useEffect(() => {
    if (isConfirmed && movie) {
      showSuccess(movie.tokenId || 0);
      onMintSuccess();
      reset();
    }
  }, [isConfirmed]);

  if (!movie) return null;

  const handleMint = () => {
    if (!requireWallet('mint a ZEROmovie')) return;
    mint(movie.id);
  };

  const isLoading = isPending || isConfirming;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-800 bg-zinc-950 p-0 shadow-2xl focus:outline-none">
          {/* Close Button */}
          <Dialog.Close className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-red-600 transition-colors">
            <X className="h-4 w-4" />
          </Dialog.Close>

          {/* Poster */}
          <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-zinc-900">
            <img
              src={posterUrl}
              alt={movie.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="space-y-4 p-6">
            <Dialog.Title className="text-lg font-bold text-white">
              {movie.name}
            </Dialog.Title>

            {/* Price + Balance */}
            <div className="flex items-center justify-between rounded-lg bg-zinc-900 p-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Price</p>
                <p className="text-sm font-bold text-red-500">
                  {priceFormatted.toLocaleString()} $ZERO
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Your Balance</p>
                <p className={`text-sm font-bold ${hasEnoughBalance ? 'text-green-400' : 'text-red-400'}`}>
                  {balance.toLocaleString(undefined, { maximumFractionDigits: 0 })} $ZERO
                </p>
              </div>
            </div>

            {/* Status */}
            {movie.minted ? (
              <div className="rounded-lg border border-red-600/30 bg-red-900/20 p-3 text-center">
                <p className="text-sm font-bold text-red-400">SOLD OUT</p>
              </div>
            ) : (
              <>
                {/* Mint Button */}
                <button
                  onClick={handleMint}
                  disabled={isLoading || !hasEnoughBalance || !isConnected}
                  className={`w-full rounded-lg py-3 text-sm font-bold transition-all
                    ${isLoading
                      ? 'cursor-wait bg-zinc-700 text-zinc-400'
                      : !hasEnoughBalance || !isConnected
                        ? 'cursor-not-allowed bg-zinc-800 text-zinc-500'
                        : 'bg-red-600 text-white hover:bg-red-500 active:scale-[0.98]'
                    }
                  `}
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Confirm in wallet...
                    </span>
                  ) : isConfirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Minting...
                    </span>
                  ) : !isConnected ? (
                    'Connect Wallet'
                  ) : !hasEnoughBalance ? (
                    `Need ${(priceFormatted - balance).toLocaleString(undefined, { maximumFractionDigits: 0 })} more $ZERO`
                  ) : (
                    'MINT'
                  )}
                </button>

                {/* Error */}
                {error && (
                  <p className="text-center text-xs text-red-400">
                    {(error as Error).message?.slice(0, 100) || 'Transaction failed'}
                  </p>
                )}

                {/* Info */}
                <p className="text-center text-[10px] text-zinc-600">
                  No approval needed — $ZERO is burned in a single transaction
                </p>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
