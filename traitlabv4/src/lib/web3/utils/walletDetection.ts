/**
 * Wallet Detection Utilities
 * Detect mobile wallets, browser context, and wallet type
 */

export type WalletContext = 'mobile-wallet' | 'mobile-browser' | 'desktop';

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function isMobileWallet(): boolean {
  if (typeof window === 'undefined') return false;

  const { ethereum } = window as any;
  if (!ethereum) return false;

  // Check for MetaMask Mobile
  if (ethereum.isMetaMask && isMobileDevice()) {
    return true;
  }

  // Check for Trust Wallet
  if (ethereum.isTrust) {
    return true;
  }

  // Check for Coinbase Wallet Mobile
  if (ethereum.isCoinbaseWallet && isMobileDevice()) {
    return true;
  }

  // Check for Rainbow Wallet
  if (ethereum.isRainbow) {
    return true;
  }

  return false;
}

export function getWalletContext(): WalletContext {
  const isMobile = isMobileDevice();
  const isWallet = isMobileWallet();

  if (isWallet) {
    return 'mobile-wallet';
  }

  if (isMobile) {
    return 'mobile-browser';
  }

  return 'desktop';
}

export function getWalletName(): string | null {
  if (typeof window === 'undefined') return null;

  const { ethereum } = window as any;
  if (!ethereum) return null;

  if (ethereum.isMetaMask) return 'MetaMask';
  if (ethereum.isTrust) return 'Trust Wallet';
  if (ethereum.isCoinbaseWallet) return 'Coinbase Wallet';
  if (ethereum.isRainbow) return 'Rainbow';

  return 'Unknown Wallet';
}

export function shouldOptimizeForTouch(): boolean {
  return isMobileDevice() || isMobileWallet();
}
