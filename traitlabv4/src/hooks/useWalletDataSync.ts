/**
 * useWalletDataSync Hook
 * Synchronizes wallet connection with centralized data store
 * Automatically loads all NFT data when wallet connects
 */

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWalletDataStore } from '@/stores/walletDataStore';

export function useWalletDataSync() {
  const { address } = useAccount();
  const setConnectedAddress = useWalletDataStore(state => state.setConnectedAddress);
  const loadTraitsMetadata = useWalletDataStore(state => state.loadTraitsMetadata);

  // Load metadata on mount (needed for both connected and disconnected states)
  useEffect(() => {
    loadTraitsMetadata();
  }, [loadTraitsMetadata]);

  // Sync wallet address
  useEffect(() => {
    setConnectedAddress(address || null);
  }, [address, setConnectedAddress]);
}
