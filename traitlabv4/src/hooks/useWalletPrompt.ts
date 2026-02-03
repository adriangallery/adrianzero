/**
 * useWalletPrompt Hook
 * Shows prompt to connect wallet when attempting blockchain actions without connection
 */

import { useAccount } from 'wagmi';
import { toast } from 'sonner';

export function useWalletPrompt() {
  const { isConnected } = useAccount();

  const requireWallet = (action: string = 'use blockchain features') => {
    if (!isConnected) {
      toast.error('Wallet Required', {
        description: `Connect your wallet to ${action}`,
      });
      return false;
    }
    return true;
  };

  return {
    isConnected,
    requireWallet,
  };
}
