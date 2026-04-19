import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZERO_MOVIES_FACET_ABI } from '@/lib/web3/abi';
import { formatEther, parseEther } from 'viem';

export interface Listing {
  movieId: number;
  price: bigint;
  priceFormatted: number;
}

export interface CollectionOffer {
  bidder: string;
  amount: bigint;
  amountFormatted: number;
}

export interface IndividualOffer {
  movieId: number;
  bidder: string;
  amount: bigint;
  amountFormatted: number;
  timestamp: number;
}

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

export function useAllIndividualOffers(movieIds: number[]) {
  const { data, refetch } = useReadContracts({
    contracts: movieIds.map(id => ({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'getOffer',
      args: [BigInt(id)],
    })),
    query: { refetchInterval: 15_000, enabled: movieIds.length > 0 },
  });

  const offers: IndividualOffer[] = [];
  if (data) {
    data.forEach((r, i) => {
      if (r.status !== 'success' || !r.result) return;
      const [bidder, amount, timestamp] = r.result as unknown as [string, bigint, bigint];
      if (bidder === ZERO_ADDR || amount === 0n) return;
      offers.push({
        movieId: movieIds[i],
        bidder,
        amount,
        amountFormatted: Number(formatEther(amount)),
        timestamp: Number(timestamp),
      });
    });
  }

  return { offers, refetch };
}

export function useAllListings() {
  const { data, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: ZERO_MOVIES_FACET_ABI,
    functionName: 'getAllListings',
    query: { refetchInterval: 15_000 },
  });

  const listings: Listing[] = [];
  if (data) {
    const [ids, prices] = data as [bigint[], bigint[]];
    for (let i = 0; i < ids.length; i++) {
      listings.push({
        movieId: Number(ids[i]),
        price: prices[i],
        priceFormatted: Number(formatEther(prices[i])),
      });
    }
  }

  return { listings, refetch };
}

export function useCollectionOffers() {
  const { data, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: ZERO_MOVIES_FACET_ABI,
    functionName: 'getCollectionOffers',
    query: { refetchInterval: 15_000 },
  });

  const offers: CollectionOffer[] = [];
  if (data) {
    const [bidders, amounts] = data as [string[], bigint[]];
    for (let i = 0; i < bidders.length; i++) {
      offers.push({
        bidder: bidders[i],
        amount: amounts[i],
        amountFormatted: Number(formatEther(amounts[i])),
      });
    }
  }

  return { offers, refetch };
}

function useWriteAction() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  return { writeContract, isPending, isConfirming, isConfirmed, error, reset };
}

export function useListMovie() {
  const { writeContract, ...rest } = useWriteAction();
  const list = (movieId: number, priceZero: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'listMovie',
      args: [BigInt(movieId), parseEther(String(priceZero))],
    });
  };
  return { list, ...rest };
}

export function useDelistMovie() {
  const { writeContract, ...rest } = useWriteAction();
  const delist = (movieId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'delistMovie',
      args: [BigInt(movieId)],
    });
  };
  return { delist, ...rest };
}

export function useBuyListing() {
  const { writeContract, ...rest } = useWriteAction();
  const buy = (movieId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'buyListing',
      args: [BigInt(movieId)],
    });
  };
  return { buy, ...rest };
}

export function useMakeOffer() {
  const { writeContract, ...rest } = useWriteAction();
  const offer = (movieId: number, amountZero: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'makeOffer',
      args: [BigInt(movieId), parseEther(String(amountZero))],
    });
  };
  return { offer, ...rest };
}

export function useCancelOffer() {
  const { writeContract, ...rest } = useWriteAction();
  const cancel = (movieId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'cancelOffer',
      args: [BigInt(movieId)],
    });
  };
  return { cancel, ...rest };
}

export function useMakeCollectionOffer() {
  const { writeContract, ...rest } = useWriteAction();
  const offer = (amountZero: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'makeCollectionOffer',
      args: [parseEther(String(amountZero))],
    });
  };
  return { offer, ...rest };
}

export function useAcceptOffer() {
  const { writeContract, ...rest } = useWriteAction();
  const accept = (movieId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'acceptOffer',
      args: [BigInt(movieId)],
    });
  };
  return { accept, ...rest };
}

export function useAcceptOfferAsRenter() {
  const { writeContract, ...rest } = useWriteAction();
  const accept = (movieId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'acceptOfferAsRenter',
      args: [BigInt(movieId)],
    });
  };
  return { accept, ...rest };
}

export function useAcceptCollectionOffer() {
  const { writeContract, ...rest } = useWriteAction();
  const accept = (movieId: number, offerIndex: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'acceptCollectionOffer',
      args: [BigInt(movieId), BigInt(offerIndex)],
    });
  };
  return { accept, ...rest };
}
