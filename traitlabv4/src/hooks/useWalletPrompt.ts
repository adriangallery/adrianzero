/**
 * useWalletPrompt Hook
 * Shows prompt to connect wallet when attempting blockchain actions without connection
 */

import { useAccount } from 'wagmi';
import { useNotifications } from './useNotifications';

export function useWalletPrompt() {
  const { isConnected } = useAccount();
  const notifications = useNotifications();

  const requireWallet = (action: string = 'use blockchain features') => {
    if (!isConnected) {
      notifications.error('Wallet Required', `Connect your wallet to ${action}`);
      return false;
    }
    return true;
  };

  return {
    isConnected,
    requireWallet,
  };
}
