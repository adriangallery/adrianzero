/**
 * Wallet Store
 * Global state for wallet connection status
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  setWallet: (address: string, chainId: number) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      isConnected: false,
      address: null,
      chainId: null,
      setWallet: (address, chainId) =>
        set({ isConnected: true, address, chainId }),
      disconnect: () => set({ isConnected: false, address: null, chainId: null }),
    }),
    {
      name: 'wallet-storage',
    }
  )
);
