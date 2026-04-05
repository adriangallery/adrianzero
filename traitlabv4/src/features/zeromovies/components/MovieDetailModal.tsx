import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import type { Movie } from '../types';
import { useMovieMint, useMovieBuy, useMovieReturn, useMovieKeep, useUpgradeRental, useNftApproval } from '../hooks/useMovieMint';
import { useListMovie, useDelistMovie } from '../hooks/useMarketplace';
import { useZeroBalance, useMoviesConfig, useBuyPrice } from '../hooks/useZeroBalance';
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
  const { buyPrice: baseBuyPrice, buyPriceFormatted: baseBuyPriceFormatted } = useBuyPrice();

  // Dynamic buy price (includes late fees for rented movies)
  const { data: dynamicBuyPriceData } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: ZERO_MOVIES_FACET_ABI,
    functionName: 'getBuyPriceForMovie',
    args: movie ? [BigInt(movie.id)] : undefined,
    query: { enabled: !!movie && !!rentalStatus?.renter },
  });
  const dynamicBuyPrice = (dynamicBuyPriceData as bigint) ?? baseBuyPrice;
  const dynamicBuyPriceFormatted = dynamicBuyPrice ? Number(formatEther(dynamicBuyPrice)) : baseBuyPriceFormatted;
  const hasLateFee = dynamicBuyPrice > baseBuyPrice;
  const { mint, isPending, isConfirming, isConfirmed, error, reset } = useMovieMint();
  const { buy, isPending: isBuyPending, isConfirming: isBuyConfirming, isConfirmed: isBuyConfirmed, error: buyError, reset: resetBuy } = useMovieBuy();
  const { returnMovie, isPending: isReturnPending, isConfirming: isReturnConfirming, isConfirmed: isReturnConfirmed, reset: resetReturn } = useMovieReturn();
  const { isApproved: nftApproved, approve: approveNft, isPending: isApprovePending, isConfirming: isApproveConfirming, isConfirmed: isApproveConfirmed, refetch: refetchApproval } = useNftApproval();
  const { keepForever, isPending: isKeepPending, isConfirming: isKeepConfirming, isConfirmed: isKeepConfirmed, reset: resetKeep } = useMovieKeep();
  const { upgrade, isPending: isUpgradePending, isConfirming: isUpgradeConfirming, isConfirmed: isUpgradeConfirmed, reset: resetUpgrade } = useUpgradeRental();
  const { list, isPending: isListPending, isConfirming: isListConfirming, isConfirmed: isListConfirmed } = useListMovie();
  const { delist, isPending: isDelistPending, isConfirming: isDelistConfirming } = useDelistMovie();
  const { showSuccess } = useMoviesStore();

  // Check canKeep on-chain
  const { data: canKeepData } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: ZERO_MOVIES_FACET_ABI,
    functionName: 'canKeep',
    args: movie ? [BigInt(movie.id)] : undefined,
    query: { enabled: !!movie && !!rentalStatus?.renter },
  });

  // Current listing price
  const { data: listingPriceData } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: ZERO_MOVIES_FACET_ABI,
    functionName: 'getListingPrice',
    args: movie ? [BigInt(movie.id)] : undefined,
    query: { enabled: !!movie },
  });
  const currentListingPrice = listingPriceData ? Number(formatEther(listingPriceData as bigint)) : 0;
  const isListed = currentListingPrice > 0;

  const [listPrice, setListPrice] = useState('');

  const hasEnoughForRent = balanceRaw >= price;
  const hasEnoughForBuy = balanceRaw >= dynamicBuyPrice;

  const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
  const renterAddr = rentalStatus?.renter ?? ZERO_ADDR;
  const hasActiveRenter = renterAddr !== ZERO_ADDR;
  const isPermanent = rentalStatus?.permanent === true;

  // "Yours" = you're the active renter OR you're the V1 minter of a permanent movie
  const isYoursViaRent = hasActiveRenter && renterAddr.toLowerCase() === address?.toLowerCase();
  const isYoursViaMint = isPermanent && movie?.mintedBy?.toLowerCase() === address?.toLowerCase();
  const isYours = isYoursViaRent || isYoursViaMint;

  const isRentedByOther = hasActiveRenter && !isYoursViaRent;
  const isAvailable = !hasActiveRenter && !isPermanent;
  const canKeepMovie = canKeepData === true;
  const depositFormatted = rentalStatus?.deposit ? Number(formatEther(rentalStatus.deposit)) : 0;
  const rentCountNum = rentalStatus?.rentCount ?? 0;
  // V1 mints that are permanent count as at least 1
  const displayRentCount = isPermanent && rentCountNum === 0 ? 1 : rentCountNum;

  // Days since rental
  const daysSinceRent = rentalStatus?.rentedAt
    ? Math.floor((Date.now() / 1000 - Number(rentalStatus.rentedAt)) / 86400)
    : 0;

  useEffect(() => {
    if (isConfirmed && movie) { showSuccess(movie.tokenId || 0, 'rent'); onMintSuccess(); reset(); }
  }, [isConfirmed]);

  useEffect(() => {
    if (isBuyConfirmed && movie) { showSuccess(movie.tokenId || 0, 'buy'); onMintSuccess(); resetBuy(); }
  }, [isBuyConfirmed]);

  useEffect(() => {
    if (isReturnConfirmed && movie) {
      showSuccess(movie.tokenId || 0, 'return', depositFormatted);
      onMintSuccess();
      resetReturn();
    }
  }, [isReturnConfirmed]);

  useEffect(() => {
    if (isKeepConfirmed) { onMintSuccess(); resetKeep(); }
  }, [isKeepConfirmed]);

  useEffect(() => {
    if (isUpgradeConfirmed && movie) { showSuccess(movie.tokenId || 0, 'buy'); onMintSuccess(); resetUpgrade(); }
  }, [isUpgradeConfirmed]);

  // After approval confirmed, refresh approval state so button updates
  useEffect(() => {
    if (isApproveConfirmed) {
      refetchApproval();
    }
  }, [isApproveConfirmed]);

  if (!movie) return null;

  const handleRent = () => { if (!requireWallet('rent a ZEROmovie')) return; mint(movie.id); };
  const handleBuy = () => { if (!requireWallet('buy a ZEROmovie')) return; buy(movie.id); };
  const handleReturn = () => {
    if (!requireWallet('return')) return;
    if (!nftApproved) {
      approveNft();
      return;
    }
    returnMovie(movie.id);
  };
  const handleKeep = () => { if (!requireWallet('keep forever')) return; keepForever(movie.id); };

  const isLoading = isPending || isConfirming || isBuyPending || isBuyConfirming || isReturnPending || isReturnConfirming || isKeepPending || isKeepConfirming || isUpgradePending || isUpgradeConfirming || isApprovePending || isApproveConfirming;

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

            {/* Status + Stats */}
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
                Yours forever · Earning rewards
              </div>
            )}

            {/* Movie stats bar — visible to everyone */}
            {rentalStatus && (
              <div className="flex items-center justify-around rounded-lg bg-zinc-900/50 px-3 py-2">
                <div className="text-center">
                  <p className="text-sm font-bold text-white">{displayRentCount}</p>
                  <p className="text-[8px] text-zinc-500">Rented</p>
                </div>
                <div className="h-6 w-px bg-zinc-800" />
                <div className="text-center">
                  <p className={`text-sm font-bold ${isYours ? 'text-yellow-400' : isPermanent ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {isYours ? 'Yours' : isPermanent ? 'Taken' : 'Available'}
                  </p>
                  <p className="text-[8px] text-zinc-500">Status</p>
                </div>
                <div className="h-6 w-px bg-zinc-800" />
                <div className="text-center">
                  {isPermanent ? (
                    <>
                      <p className="text-sm font-bold text-yellow-400">Earning</p>
                      <p className="text-[8px] text-zinc-500">Rewards</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-zinc-600">—</p>
                      <p className="text-[8px] text-zinc-500">No rewards</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Rent vs Buy options */}
            {isAvailable && !isPermanent && (
              <>
                {/* Balance */}
                <div className="rounded-lg bg-zinc-900 px-3 py-2 text-center">
                  <span className="text-[10px] text-zinc-500">Your Balance: </span>
                  <span className={`text-sm font-bold ${hasEnoughForRent ? 'text-green-400' : 'text-red-400'}`}>
                    {balance.toLocaleString(undefined, { maximumFractionDigits: 0 })} $ZERO
                  </span>
                </div>

                {/* Two options side by side */}
                <div className="grid grid-cols-2 gap-2">
                  {/* RENT option */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Rent</p>
                    <p className="text-lg font-bold text-white">{priceFormatted.toLocaleString()}</p>
                    <p className="text-[8px] text-zinc-500">$ZERO · 50% refundable</p>
                    <p className="mt-1 text-[7px] text-zinc-600">Return anytime · No rewards</p>
                    <button onClick={handleRent} disabled={isLoading || !hasEnoughForRent || !isConnected}
                      className={`mt-2 w-full rounded py-2 text-[10px] font-bold transition-all ${
                        isLoading ? 'bg-zinc-700 text-zinc-400'
                        : !hasEnoughForRent || !isConnected ? 'bg-zinc-800 text-zinc-600'
                        : 'bg-red-600 text-white hover:bg-red-500'
                      }`}>
                      {isPending || isConfirming
                        ? <span className="flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /></span>
                        : 'RENT'}
                    </button>
                  </div>

                  {/* BUY option */}
                  <div className="rounded-lg border border-yellow-600/30 bg-yellow-900/10 p-3">
                    <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Buy Forever</p>
                    <p className="text-lg font-bold text-white">{baseBuyPriceFormatted.toLocaleString()}</p>
                    <p className="text-[8px] text-zinc-500">$ZERO · 80% burned</p>
                    <p className="mt-1 text-[7px] text-yellow-600">Yours forever · Earns rewards</p>
                    <button onClick={handleBuy} disabled={isLoading || !hasEnoughForBuy || !isConnected}
                      className={`mt-2 w-full rounded py-2 text-[10px] font-bold transition-all ${
                        isLoading ? 'bg-zinc-700 text-zinc-400'
                        : !hasEnoughForBuy || !isConnected ? 'bg-zinc-800 text-zinc-600'
                        : 'bg-yellow-600 text-black hover:bg-yellow-500'
                      }`}>
                      {isBuyPending || isBuyConfirming
                        ? <span className="flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /></span>
                        : 'BUY'}
                    </button>
                  </div>
                </div>

                {(error || buyError) && <p className="text-center text-xs text-red-400">{((error || buyError) as Error).message?.slice(0, 100)}</p>}
                <p className="text-center text-[10px] text-zinc-600">No approval needed · Single transaction</p>
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
              <div className="space-y-2">
                {/* Upgrade to Buy */}
                <button
                  onClick={() => { if (!requireWallet('upgrade')) return; upgrade(movie.id); }}
                  disabled={isLoading || !hasEnoughForBuy}
                  className={`w-full rounded-lg py-2.5 text-[11px] font-bold transition-all ${
                    isLoading ? 'bg-zinc-700 text-zinc-400'
                    : !hasEnoughForBuy ? 'bg-zinc-800 text-zinc-600'
                    : 'bg-yellow-600 text-black hover:bg-yellow-500'
                  }`}
                >
                  {isUpgradePending || isUpgradeConfirming
                    ? <span className="flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Upgrading...</span>
                    : `Buy Forever · ${dynamicBuyPriceFormatted.toLocaleString()} $ZERO${hasLateFee ? ' (incl. late fee)' : ''}`}
                </button>

                <div className="relative py-1"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"/></div><div className="relative flex justify-center"><span className="bg-zinc-950 px-2 text-[8px] text-zinc-600">or</span></div></div>

                {/* Step 1: Approve (if needed) */}
                {!nftApproved && (
                  <button onClick={() => approveNft()} disabled={isLoading}
                    className="w-full rounded-lg border border-zinc-600 bg-zinc-800 py-2.5 text-[11px] font-bold text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50">
                    {isApprovePending || isApproveConfirming
                      ? <span className="flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Step 1: Approving...</span>
                      : 'Step 1: Approve NFT Transfer'}
                  </button>
                )}

                {/* Step 2: Return (only after approval) */}
                <div className="flex gap-2">
                  <button onClick={handleReturn} disabled={isLoading || !nftApproved}
                    className={`flex-1 rounded-lg border py-2.5 text-[11px] font-bold transition-colors disabled:opacity-50 ${
                      nftApproved
                        ? 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-600 cursor-not-allowed'
                    }`}>
                    {isReturnPending || isReturnConfirming
                      ? <span className="flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Returning...</span>
                      : `${nftApproved ? '' : 'Step 2: '}Return · Get ${depositFormatted.toLocaleString()} $ZERO`}
                  </button>

                  {canKeepMovie && (
                    <button onClick={handleKeep} disabled={isLoading}
                      className="flex-1 rounded-lg bg-yellow-600 py-2.5 text-[11px] font-bold text-black hover:bg-yellow-500 transition-colors disabled:opacity-50">
                      {isKeepPending || isKeepConfirming
                        ? <span className="flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /></span>
                        : 'Keep Forever'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* YOURS PERMANENT: List for Sale */}
            {isYours && isPermanent && (
              <div className="space-y-2">
                {isListed ? (
                  <div className="rounded-lg border border-green-800/30 bg-green-900/10 p-3">
                    <p className="text-[10px] text-green-400 mb-2">Listed for <span className="font-bold">{currentListingPrice.toLocaleString()} $ZERO</span></p>
                    <button
                      onClick={() => delist(movie.id)}
                      disabled={isDelistPending || isDelistConfirming}
                      className="w-full rounded py-2 text-[10px] font-bold border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      {isDelistPending || isDelistConfirming ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : 'Remove Listing'}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                    <p className="text-[10px] text-zinc-400 mb-2">List for sale on the marketplace</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={listPrice}
                        onChange={(e) => setListPrice(e.target.value)}
                        placeholder="Price in $ZERO"
                        className="flex-1 rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-[10px] text-white placeholder:text-zinc-700 focus:border-yellow-600 focus:outline-none"
                      />
                      <button
                        onClick={() => { if (Number(listPrice) > 0) list(movie.id, Number(listPrice)); }}
                        disabled={isListPending || isListConfirming || !listPrice || Number(listPrice) <= 0}
                        className="rounded bg-yellow-600 px-4 py-2 text-[10px] font-bold text-black hover:bg-yellow-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
                      >
                        {isListPending || isListConfirming ? <Loader2 className="h-3 w-3 animate-spin" /> : 'LIST'}
                      </button>
                    </div>
                    <p className="mt-1 text-[8px] text-zinc-700">5% fee on sale (burned). Buyer must approve NFT transfer.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
