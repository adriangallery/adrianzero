/**
 * useAdrianZeroTokens Hook
 * Fetches AdrianZERO ERC721 tokens for the connected wallet
 * Shows mock data when wallet is not connected
 *
 * OPTIMIZED: Uses centralized walletDataStore to load ALL zeros once
 * No more infinite query pagination - data is loaded upfront and stored
 */

import { useAccount } from 'wagmi';
import { useWalletDataStore, selectAdrianZeros } from '@/stores/walletDataStore';
import type { AdrianZeroToken } from '@/types/nft.types';

const MOCK_TOKEN: AdrianZeroToken = {
  tokenId: '146',
  owner: '0x0000000000000000000000000000000000000000',
  name: 'AdrianZERO #146',
  metadata: {
    name: 'AdrianZERO #146',
    description: 'AdrianZERO Collection',
    image: 'https://adrianlab.vercel.app/api/render/146',
  },
  image: {
    cachedUrl: 'https://adrianlab.vercel.app/api/render/146',
    originalUrl: 'https://adrianlab.vercel.app/api/render/146',
  },
  tokenUri: '',
};

export function useAdrianZeroTokens() {
  const { address } = useAccount();

  // Get data from centralized store (loads ALL zeros once on wallet connect)
  const zeros = useWalletDataStore(selectAdrianZeros);
  const isLoadingZeros = useWalletDataStore(state => state.isLoadingZeros);
  const zerosError = useWalletDataStore(state => state.zerosError);

  const data = address ? zeros : [MOCK_TOKEN];
  const isLoading = Boolean(address) && isLoadingZeros;

  return {
    data,
    isLoading,
    error: zerosError,
    refetch: () => {}, // No-op: data loaded once, no refetch needed
    fetchNextPage: () => Promise.resolve(), // No-op for API compatibility
    hasNextPage: false, // All data loaded
    isFetchingNextPage: false, // All data loaded
    loadedCount: data.length,
    totalCount: data.length, // We have everything
  };
}
