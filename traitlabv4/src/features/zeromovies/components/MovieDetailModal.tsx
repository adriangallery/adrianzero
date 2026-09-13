import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import type { Movie } from '../types';
import { useMovieMint, useMovieBuy, useMovieReturn, useMovieKeep, useUpgradeRental, useNftApproval } from '../hooks/useMovieMint';
import { useListMovie, useDelistMovie, useAcceptOffer, useAcceptOfferAsRenter, useMakeOffer, useCancelOffer, useBuyListing, useCollectionOffers, useAcceptCollectionOffer } from '../hooks/useMarketplace';
import { useZeroBalance, useMoviesConfig, useBuyPrice } from '../hooks/useZeroBalance';
import { useS1LateFeeConfig, deriveS1Overdue } from '../hooks/useS1LateFeeConfig';
import { useMoviesStore } from '../store/moviesStore';
import { useAccount, useReadContract } from 'wagmi';
import { useWalletPrompt } from '@/hooks/useWalletPrompt';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZERO_MOVIES_FACET_ABI } from '@/lib/web3/abi';
import { formatEther } from 'viem';
import { EnsName } from '@/components/shared/EnsName';

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
  const { list, isPending: isListPending, isConfirming: isListConfirming } = useListMovie();
  const { delist, isPending: isDelistPending, isConfirming: isDelistConfirming } = useDelistMovie();
  const { offer: makeIndOffer, isPending: isIndOfferPending, isConfirming: isIndOfferConfirming, isConfirmed: isIndOfferConfirmed } = useMakeOffer();
  const { cancel: cancelOffer, isPending: isCancelOfferPending, isConfirming: isCancelOfferConfirming, isConfirmed: isCancelOfferConfirmed } = useCancelOffer();
  const { buy: buyListing, isPending: isBuyListingPending, isConfirming: isBuyListingConfirming } = useBuyListing();
  const { offers: collectionOffers } = useCollectionOffers();
  const { accept: acceptColOffer, isPending: isAcceptColPending, isConfirming: isAcceptColConfirming } = useAcceptCollectionOffer();
  const { accept: acceptOffer, isPending: isAcceptPending, isConfirming: isAcceptConfirming } = useAcceptOffer();
  const { accept: acceptAsRenter, isPending: isRenterAcceptPending, isConfirming: isRenterAcceptConfirming } = useAcceptOfferAsRenter();

  // Best offer on this movie
  const { data: offerData, refetch: refetchOffer } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: ZERO_MOVIES_FACET_ABI,
    functionName: 'getOffer',
    args: movie ? [BigInt(movie.id)] : undefined,
    query: { enabled: !!movie },
  });
  const bestOfferBidder = offerData ? (offerData as [string, bigint, bigint])[0] : '';
  const bestOfferAmount = offerData ? Number(formatEther((offerData as [string, bigint, bigint])[1])) : 0;
  const hasOffer = bestOfferBidder && bestOfferBidder !== '0x0000000000000000000000000000000000000000' && bestOfferAmount > 0;
  const isBidderSomeoneElse = hasOffer && bestOfferBidder.toLowerCase() !== address?.toLowerCase();
  const isMyOffer = hasOffer && bestOfferBidder.toLowerCase() === address?.toLowerCase();

  const [offerInput, setOfferInput] = useState('');
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

  // "Yours" = currentRenter matches you, OR for V1 permanent mints (renter=0x0) check mintedBy
  const isYoursViaRenter = hasActiveRenter && renterAddr.toLowerCase() === address?.toLowerCase();
  const isYoursV1 = isPermanent && !hasActiveRenter && movie?.mintedBy?.toLowerCase() === address?.toLowerCase();
  const isYours = isYoursViaRenter || isYoursV1;

  const isRentedByOther = hasActiveRenter && !isYoursViaRenter;
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

  // Overdue derivation — same source the card grid uses, so the modal stays
  // consistent with what the user clicked
  const { gracePeriod, feePerDay } = useS1LateFeeConfig();
  const overdueDerived = deriveS1Overdue(
    rentalStatus
      ? { renter: rentalStatus.renter, permanent: rentalStatus.permanent, rentedAt: Number(rentalStatus.rentedAt) }
      : undefined,
    gracePeriod,
  );
  const isOverdue = overdueDerived.isOverdue;
  const daysOverdue = overdueDerived.daysOverdue;
  const accumulatedLateFee = isOverdue ? daysOverdue * feePerDay : 0;
  const graceDays = Math.max(1, Math.round(gracePeriod / 86_400));

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

  // After making or canceling an offer, refresh offer data
  useEffect(() => {
    if (isIndOfferConfirmed || isCancelOfferConfirmed) {
      refetchOffer();
    }
  }, [isIndOfferConfirmed, isCancelOfferConfirmed]);

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

  const isLoading = isPending || isConfirming || isBuyPending || isBuyConfirming || isReturnPending || isReturnConfirming || isKeepPending || isKeepConfirming || isUpgradePending || isUpgradeConfirming || isApprovePending || isApproveConfirming || isCancelOfferPending || isCancelOfferConfirming;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-3xl max-h-[85vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-line bg-panel950 p-0 shadow-2xl focus:outline-none">
          <Dialog.Close className="absolute right-3 top-3 z-10 rounded-full bg-bg/60 p-1.5 text-fg hover:bg-red-600 transition-colors">
            <X className="h-4 w-4" />
          </Dialog.Close>

          <div className="flex flex-col sm:flex-row">
            {/* Poster / Mystery — left side on desktop */}
            <div className="relative w-full sm:w-[280px] sm:min-w-[280px] overflow-hidden rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none bg-panel900">
              <div className="aspect-square sm:aspect-auto sm:h-full">
                {isMystery ? (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-panel950">
                    <span className="text-6xl font-black italic text-red-600 sm:text-8xl">X</span>
                    <span className="mt-2 text-[13px] uppercase tracking-wider text-mute">Restricted</span>
                  </div>
                ) : (
                  <img src={posterUrl} alt={movie.name} className="h-full w-full object-contain" style={{ imageRendering: 'pixelated' }} />
                )}
              </div>
            </div>

            {/* Content — right side on desktop */}
            <div className="flex-1 space-y-3 p-5 sm:overflow-y-auto sm:max-h-[80vh]">
            <Dialog.Title className="text-lg font-bold text-fg">
              {isMystery ? 'Mystery Movie' : movie.name}
            </Dialog.Title>

            {/* OVERDUE banner — surfaces the on-chain late-fee state when this
                wallet is overdue. The two paths below the banner already exist
                via Return / Buy buttons, but become much clearer here. */}
            {isYours && !isPermanent && isOverdue && (
              <div className="rounded-md border-2 border-red-600 bg-red-900/20 p-3 text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="rotate-[-6deg] rounded border border-red-500 px-1.5 py-0.5 text-[12px] font-black uppercase tracking-widest text-red-400">
                    OVERDUE
                  </span>
                  <span className="font-bold text-red-300">
                    {daysOverdue} day{daysOverdue === 1 ? '' : 's'} past grace
                  </span>
                  <span className="ml-auto text-red-400">
                    Late fee: <span className="font-bold">{accumulatedLateFee.toLocaleString()} $ZERO</span>
                  </span>
                </div>
                <ul className="mt-2 space-y-1 text-mute">
                  <li>
                    <span className="text-ok font-bold">Return now</span> — you get your full {depositFormatted.toLocaleString()} $ZERO deposit back. No late fee charged on return.
                  </li>
                  <li>
                    <span className="text-yellow-400 font-bold">Upgrade to permanent</span> — pay the buy price; the {accumulatedLateFee.toLocaleString()} $ZERO late fee is already included below ({dynamicBuyPriceFormatted.toLocaleString()} $ZERO total).
                  </li>
                </ul>
              </div>
            )}

            {/* Status + Stats */}
            {isYours && !isPermanent && !isOverdue && (
              <div className="flex items-center gap-2 text-[13px] text-mute">
                <span className="h-2 w-2 rounded-full bg-ok animate-pulse" />
                Rented {daysSinceRent} day{daysSinceRent !== 1 ? 's' : ''} ago
                {depositFormatted > 0 && <span>· {depositFormatted.toLocaleString()} $ZERO deposit</span>}
                {graceDays - daysSinceRent > 0 && (
                  <span className="text-mute">· {graceDays - daysSinceRent}d before late fees</span>
                )}
              </div>
            )}
            {isYours && !isPermanent && isOverdue && (
              <div className="flex items-center gap-2 text-[13px] text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Tape held {daysSinceRent} day{daysSinceRent !== 1 ? 's' : ''} · {feePerDay.toLocaleString()} $ZERO/day accruing
              </div>
            )}
            {isYours && isPermanent && (
              <div className="flex items-center gap-2 text-[13px] text-yellow-400">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                Yours forever · Earning rewards
              </div>
            )}

            {/* Movie stats bar — visible to everyone */}
            {rentalStatus && (
              <div className="flex items-center justify-around rounded-lg bg-panel900 px-3 py-2">
                <div className="text-center">
                  <p className="text-sm font-bold text-fg">{displayRentCount}</p>
                  <p className="text-[11px] text-mute">Rented</p>
                </div>
                <div className="h-6 w-px bg-line800" />
                <div className="text-center">
                  <p className={`text-sm font-bold ${isYours ? 'text-yellow-400' : isPermanent ? 'text-mute' : 'text-mute'}`}>
                    {isYours ? 'Yours' : isPermanent ? 'Taken' : 'Available'}
                  </p>
                  <p className="text-[11px] text-mute">Status</p>
                </div>
                <div className="h-6 w-px bg-line800" />
                <div className="text-center">
                  {isPermanent ? (
                    <>
                      <p className="text-sm font-bold text-yellow-400">Earning</p>
                      <p className="text-[11px] text-mute">Rewards</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-mute">—</p>
                      <p className="text-[11px] text-mute">No rewards</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Rent vs Buy options */}
            {isAvailable && !isPermanent && (
              <>
                {/* Balance */}
                <div className="rounded-lg bg-panel900 px-3 py-2 text-center">
                  <span className="text-[13px] text-mute">Your Balance: </span>
                  <span className={`text-sm font-bold ${hasEnoughForRent ? 'text-ok' : 'text-red-400'}`}>
                    {balance.toLocaleString(undefined, { maximumFractionDigits: 0 })} $ZERO
                  </span>
                </div>

                {/* Two options side by side */}
                <div className="grid grid-cols-2 gap-2">
                  {/* RENT option */}
                  <div className="rounded-lg border border-line bg-panel900 p-3">
                    <p className="text-[13px] font-bold text-red-400 uppercase tracking-wider">Rent</p>
                    <p className="text-lg font-bold text-fg">{priceFormatted.toLocaleString()}</p>
                    <p className="text-[11px] text-mute">$ZERO · 50% refundable</p>
                    <p className="mt-1 text-[7px] text-mute">Return anytime · No rewards</p>
                    <button onClick={handleRent} disabled={isLoading || !hasEnoughForRent || !isConnected}
                      className={`mt-2 w-full rounded py-2 text-[13px] font-bold transition-all ${
                        isLoading ? 'bg-line700 text-mute'
                        : !hasEnoughForRent || !isConnected ? 'bg-line800 text-mute'
                        : 'bg-red-600 text-fg hover:bg-red-500'
                      }`}>
                      {isPending || isConfirming
                        ? <span className="flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /></span>
                        : 'RENT'}
                    </button>
                  </div>

                  {/* BUY option */}
                  <div className="rounded-lg border border-yellow-600/30 bg-yellow-900/10 p-3">
                    <p className="text-[13px] font-bold text-yellow-400 uppercase tracking-wider">Buy Forever</p>
                    <p className="text-lg font-bold text-fg">{baseBuyPriceFormatted.toLocaleString()}</p>
                    <p className="text-[11px] text-mute">$ZERO · 80% burned</p>
                    <p className="mt-1 text-[7px] text-yellow-600">Yours forever · Earns rewards</p>
                    <button onClick={handleBuy} disabled={isLoading || !hasEnoughForBuy || !isConnected}
                      className={`mt-2 w-full rounded py-2 text-[13px] font-bold transition-all ${
                        isLoading ? 'bg-line700 text-mute'
                        : !hasEnoughForBuy || !isConnected ? 'bg-line800 text-mute'
                        : 'bg-yellow-600 text-black hover:bg-yellow-500'
                      }`}>
                      {isBuyPending || isBuyConfirming
                        ? <span className="flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /></span>
                        : 'BUY'}
                    </button>
                  </div>
                </div>

                {(error || buyError) && <p className="text-center text-xs text-red-400">{((error || buyError) as Error).message?.slice(0, 100)}</p>}
                <p className="text-center text-[13px] text-mute">No approval needed · Single transaction</p>
              </>
            )}

            {/* Currently rented by someone else — allow offers (renter can flip via acceptOfferAsRenter) */}
            {isRentedByOther && !isPermanent && (
              <div className="space-y-2">
                <div className={`rounded-lg p-3 text-center ${isOverdue ? 'border-2 border-red-600 bg-red-900/20' : 'border border-amber-700/40 bg-amber-900/10'}`}>
                  {isOverdue ? (
                    <>
                      <p className="text-xs font-bold text-red-400">Held Overdue · {daysOverdue}d past grace</p>
                      <p className="mt-1 text-[13px] text-mute">
                        The renter has accrued {accumulatedLateFee.toLocaleString()} $ZERO in late fees. Your offer pressures them to accept and unlock the tape.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-amber-400">Currently Rented</p>
                      <p className="mt-1 text-[13px] text-mute">Make an offer — the renter can accept and flip it to you</p>
                    </>
                  )}
                </div>

                <div className="rounded-lg border border-line bg-panel900 p-3">
                  {hasOffer && (
                    <p className="text-[12px] text-mute mb-2">
                      Current offer: <span className="text-yellow-400">{bestOfferAmount.toLocaleString()} $ZERO</span>
                      {isMyOffer && ' (yours)'}
                    </p>
                  )}
                  {isMyOffer ? (
                    <>
                      <button
                        onClick={() => cancelOffer(movie.id)}
                        disabled={isCancelOfferPending || isCancelOfferConfirming}
                        className="w-full rounded bg-line800 py-2 text-[13px] font-bold text-red-400 hover:bg-line700 disabled:opacity-50 transition-colors"
                      >
                        {isCancelOfferPending || isCancelOfferConfirming ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : 'WITHDRAW OFFER'}
                      </button>
                      <p className="mt-1 text-[11px] text-mute">Cancel your offer and unlock your $ZERO.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[13px] text-mute mb-2">Make an offer</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={offerInput}
                          onChange={(e) => setOfferInput(e.target.value)}
                          placeholder="$ZERO amount"
                          className="flex-1 rounded border border-line bg-panel950 px-3 py-2 text-[13px] text-fg placeholder:text-mute focus:border-yellow-600 focus:outline-none"
                        />
                        <button
                          onClick={() => { if (!requireWallet('offer')) return; if (Number(offerInput) > 0) { makeIndOffer(movie.id, Number(offerInput)); setOfferInput(''); } }}
                          disabled={isIndOfferPending || isIndOfferConfirming || !offerInput || Number(offerInput) <= 0}
                          className="rounded bg-yellow-600 px-3 py-2 text-[13px] font-bold text-black hover:bg-yellow-500 disabled:bg-line800 disabled:text-mute transition-colors"
                        >
                          {isIndOfferPending || isIndOfferConfirming ? <Loader2 className="h-3 w-3 animate-spin" /> : 'OFFER'}
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-mute">$ZERO locked. Must outbid current offer. If the renter accepts, it flips to you.</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Someone else owns permanently — make offer */}
            {!isYours && isPermanent && (
              <div className="space-y-2">
                {/* Buy listing if on sale */}
                {isListed && (
                  <button
                    onClick={() => buyListing(movie.id)}
                    disabled={isBuyListingPending || isBuyListingConfirming || balance < currentListingPrice}
                    className="w-full rounded-lg bg-red-600 py-3 text-sm font-bold text-fg hover:bg-red-500 disabled:bg-line800 disabled:text-mute transition-colors"
                  >
                    {isBuyListingPending || isBuyListingConfirming
                      ? <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      : `BUY · ${currentListingPrice.toLocaleString()} $ZERO`}
                  </button>
                )}

                <div className="rounded-lg border border-line bg-panel900 p-3">
                  {hasOffer && (
                    <p className="text-[12px] text-mute mb-2">
                      Current offer: <span className="text-yellow-400">{bestOfferAmount.toLocaleString()} $ZERO</span>
                      {isMyOffer && ' (yours)'}
                    </p>
                  )}
                  {isMyOffer ? (
                    <>
                      <button
                        onClick={() => cancelOffer(movie.id)}
                        disabled={isCancelOfferPending || isCancelOfferConfirming}
                        className="w-full rounded bg-line800 py-2 text-[13px] font-bold text-red-400 hover:bg-line700 disabled:opacity-50 transition-colors"
                      >
                        {isCancelOfferPending || isCancelOfferConfirming ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : 'WITHDRAW OFFER'}
                      </button>
                      <p className="mt-1 text-[11px] text-mute">Cancel your offer and unlock your $ZERO.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[13px] text-mute mb-2">Make an offer</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={offerInput}
                          onChange={(e) => setOfferInput(e.target.value)}
                          placeholder="$ZERO amount"
                          className="flex-1 rounded border border-line bg-panel950 px-3 py-2 text-[13px] text-fg placeholder:text-mute focus:border-yellow-600 focus:outline-none"
                        />
                        <button
                          onClick={() => { if (Number(offerInput) > 0) { makeIndOffer(movie.id, Number(offerInput)); setOfferInput(''); } }}
                          disabled={isIndOfferPending || isIndOfferConfirming || !offerInput || Number(offerInput) <= 0}
                          className="rounded bg-yellow-600 px-3 py-2 text-[13px] font-bold text-black hover:bg-yellow-500 disabled:bg-line800 disabled:text-mute transition-colors"
                        >
                          {isIndOfferPending || isIndOfferConfirming ? <Loader2 className="h-3 w-3 animate-spin" /> : 'OFFER'}
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-mute">$ZERO locked. Must outbid current offer. Owner decides.</p>
                    </>
                  )}
                </div>
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
                    isLoading ? 'bg-line700 text-mute'
                    : !hasEnoughForBuy ? 'bg-line800 text-mute'
                    : 'bg-yellow-600 text-black hover:bg-yellow-500'
                  }`}
                >
                  {isUpgradePending || isUpgradeConfirming
                    ? <span className="flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Upgrading...</span>
                    : `Buy Forever · ${dynamicBuyPriceFormatted.toLocaleString()} $ZERO${hasLateFee ? ' (incl. late fee)' : ''}`}
                </button>

                <div className="relative py-1"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-line"/></div><div className="relative flex justify-center"><span className="bg-panel950 px-2 text-[11px] text-mute">or</span></div></div>

                {/* Step 1: Approve (if needed) */}
                {!nftApproved && (
                  <button onClick={() => approveNft()} disabled={isLoading}
                    className="w-full rounded-lg border border-line bg-line800 py-2.5 text-[11px] font-bold text-fg hover:bg-line700 transition-colors disabled:opacity-50">
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
                        ? 'border-line bg-panel900 text-fg hover:bg-line800'
                        : 'border-line bg-panel950 text-mute cursor-not-allowed'
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

                {/* Accept offer as renter (flip to bidder) */}
                {hasOffer && isBidderSomeoneElse && (
                  <div className="rounded-lg border border-ok/30 bg-ok/10 p-3">
                    <p className="text-[13px] text-mute mb-1">Offer on this movie</p>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-bold text-ok">{bestOfferAmount.toLocaleString()} $ZERO</span>
                        <span className="ml-2 text-[12px] text-mute">from <EnsName address={bestOfferBidder} className="text-ok text-[12px]" /></span>
                      </div>
                    </div>
                    <p className="text-[11px] text-mute mb-2">
                      Accept → auto-buys ({dynamicBuyPriceFormatted.toLocaleString()} $ZERO) + you get {Math.max(0, bestOfferAmount - dynamicBuyPriceFormatted).toLocaleString()} profit
                    </p>
                    <button
                      onClick={() => acceptAsRenter(movie.id)}
                      disabled={isRenterAcceptPending || isRenterAcceptConfirming || bestOfferAmount < dynamicBuyPriceFormatted}
                      className={`w-full rounded py-2 text-[13px] font-bold transition-colors ${
                        bestOfferAmount >= dynamicBuyPriceFormatted
                          ? 'bg-ok text-fg hover:bg-ok'
                          : 'bg-line800 text-mute cursor-not-allowed'
                      }`}
                    >
                      {isRenterAcceptPending || isRenterAcceptConfirming
                        ? <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                        : bestOfferAmount >= dynamicBuyPriceFormatted
                          ? `Accept & Sell (+${Math.max(0, bestOfferAmount - dynamicBuyPriceFormatted).toLocaleString()} profit)`
                          : `Offer too low (need ${dynamicBuyPriceFormatted.toLocaleString()}+)`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* YOURS PERMANENT: List for Sale + Accept Offers */}
            {isYours && isPermanent && (
              <div className="space-y-2">
                {isListed ? (
                  <div className="rounded-lg border border-ok/30 bg-ok/10 p-3">
                    <p className="text-[13px] text-ok mb-2">Listed for <span className="font-bold">{currentListingPrice.toLocaleString()} $ZERO</span></p>
                    <button
                      onClick={() => delist(movie.id)}
                      disabled={isDelistPending || isDelistConfirming}
                      className="w-full rounded py-2 text-[13px] font-bold border border-line text-fg hover:bg-line800 transition-colors"
                    >
                      {isDelistPending || isDelistConfirming ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : 'Remove Listing'}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-line bg-panel900 p-3">
                    <p className="text-[13px] text-mute mb-2">List for sale on the marketplace</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={listPrice}
                        onChange={(e) => setListPrice(e.target.value)}
                        placeholder="Price in $ZERO"
                        className="flex-1 rounded border border-line bg-panel950 px-3 py-2 text-[13px] text-fg placeholder:text-mute focus:border-yellow-600 focus:outline-none"
                      />
                      <button
                        onClick={() => { if (!nftApproved) { approveNft(); } else if (Number(listPrice) > 0) { list(movie.id, Number(listPrice)); } }}
                        disabled={isListPending || isListConfirming || isApprovePending || isApproveConfirming || (!nftApproved ? false : !listPrice || Number(listPrice) <= 0)}
                        className="rounded bg-yellow-600 px-4 py-2 text-[13px] font-bold text-black hover:bg-yellow-500 disabled:bg-line800 disabled:text-mute transition-colors"
                      >
                        {isApprovePending || isApproveConfirming ? 'APPROVING...' : isListPending || isListConfirming ? <Loader2 className="h-3 w-3 animate-spin" /> : !nftApproved ? 'APPROVE' : 'LIST'}
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-mute">5% fee on sale (burned). Buyer must approve NFT transfer.</p>
                  </div>
                )}

                {/* Accept best offer (only if bidder is someone else) */}
                {hasOffer && isBidderSomeoneElse && (
                  <div className="rounded-lg border border-yellow-800/30 bg-yellow-900/10 p-3">
                    <p className="text-[13px] text-mute mb-1">Best offer</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-yellow-400">{bestOfferAmount.toLocaleString()} $ZERO</span>
                        <span className="ml-2 text-[12px] text-mute">from <EnsName address={bestOfferBidder} className="text-ok text-[12px]" /></span>
                      </div>
                      <button
                        onClick={() => { if (!nftApproved) { approveNft(); } else { acceptOffer(movie.id); } }}
                        disabled={isAcceptPending || isAcceptConfirming || isApprovePending || isApproveConfirming}
                        className="rounded bg-yellow-600 px-3 py-1.5 text-[13px] font-bold text-black hover:bg-yellow-500 disabled:opacity-50 transition-colors"
                      >
                        {isApprovePending || isApproveConfirming
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : isAcceptPending || isAcceptConfirming
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : !nftApproved ? 'APPROVE & ACCEPT' : 'ACCEPT'}
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-mute">{!nftApproved ? 'Requires NFT approval first · ' : ''}5% fee: 3% burned + 2% to holders</p>
                  </div>
                )}
                {/* Your own offer */}
                {isMyOffer && (
                  <p className="text-[12px] text-mute">Your offer: {bestOfferAmount.toLocaleString()} $ZERO</p>
                )}

                {/* Collection offers you can accept */}
                {collectionOffers.length > 0 && (
                  <div className="rounded-lg border border-line bg-panel900 p-3">
                    <p className="text-[13px] text-mute mb-2">Collection offers</p>
                    <div className="space-y-1">
                      {collectionOffers.map((co, i) => (
                        <div key={i} className="flex items-center justify-between text-[13px]">
                          <span className="text-mute"><EnsName address={co.bidder} className="text-ok" /> · <span className="text-yellow-400">{co.amountFormatted.toLocaleString()} $ZERO</span></span>
                          <button
                            onClick={() => { if (!nftApproved) { approveNft(); } else { acceptColOffer(movie.id, i); } }}
                            disabled={isAcceptColPending || isAcceptColConfirming || isApprovePending || isApproveConfirming}
                            className="rounded bg-yellow-600 px-2 py-0.5 text-[11px] font-bold text-black hover:bg-yellow-500 disabled:opacity-50"
                          >
                            {isApprovePending || isApproveConfirming ? '...' : !nftApproved ? 'APPROVE' : 'ACCEPT'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>{/* close flex wrapper */}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
