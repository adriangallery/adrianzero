/**
 * Wallet Configuration
 * Wallet logos and metadata
 */

export interface WalletConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
}

// SVG wallet icons (simplified versions - replace with custom SVGs from adrianzero.com when available)
export const WALLET_ICONS = {
  metaMask: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8L20 2L8 8L8 22C8 29 14 34 20 38C26 34 32 29 32 22L32 8Z" fill="#FF6C37"/>
      <path d="M20 12L16 18L24 18L20 12Z" fill="white"/>
    </svg>
  ),
  walletConnect: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="#3B99FC"/>
      <path d="M12 16C16 12 24 12 28 16L29 17L26 20L25 19C22.5 16.5 17.5 16.5 15 19L14 20L11 17L12 16Z" fill="white"/>
    </svg>
  ),
  coinbaseWallet: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="20" fill="#0052FF"/>
      <rect x="14" y="14" width="12" height="12" rx="2" fill="white"/>
    </svg>
  ),
  rainbow: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B"/>
          <stop offset="33%" stopColor="#FFD93D"/>
          <stop offset="66%" stopColor="#6BCB77"/>
          <stop offset="100%" stopColor="#4D96FF"/>
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="8" fill="url(#rainbow)"/>
      <path d="M20 10C14 10 9 15 9 21H13C13 17 16 14 20 14C24 14 27 17 27 21H31C31 15 26 10 20 10Z" fill="white"/>
    </svg>
  ),
  safe: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="#12FF80"/>
      <path d="M20 8L10 13V21C10 27 14.5 32 20 34C25.5 32 30 27 30 21V13L20 8Z" fill="#000"/>
    </svg>
  ),
  default: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="#64748B"/>
      <path d="M20 12C15.6 12 12 15.6 12 20C12 24.4 15.6 28 20 28C24.4 28 28 24.4 28 20C28 15.6 24.4 12 20 12ZM20 25C17.2 25 15 22.8 15 20C15 17.2 17.2 15 20 15C22.8 15 25 17.2 25 20C25 22.8 22.8 25 20 25Z" fill="white"/>
    </svg>
  ),
};

export const WALLET_CONFIGS: Record<string, WalletConfig> = {
  metaMask: {
    id: 'metaMask',
    name: 'MetaMask',
    icon: WALLET_ICONS.metaMask,
  },
  walletConnect: {
    id: 'walletConnect',
    name: 'WalletConnect',
    icon: WALLET_ICONS.walletConnect,
  },
  coinbaseWallet: {
    id: 'coinbaseWallet',
    name: 'Coinbase Wallet',
    icon: WALLET_ICONS.coinbaseWallet,
  },
  rainbow: {
    id: 'rainbow',
    name: 'Rainbow',
    icon: WALLET_ICONS.rainbow,
  },
  safe: {
    id: 'safe',
    name: 'Safe',
    icon: WALLET_ICONS.safe,
  },
};

export function getWalletIcon(walletId?: string): React.ReactNode {
  if (!walletId) return WALLET_ICONS.default;

  const normalizedId = walletId.toLowerCase();

  // Try exact match
  if (WALLET_CONFIGS[normalizedId]) {
    return WALLET_CONFIGS[normalizedId].icon;
  }

  // Try partial match
  for (const [key, config] of Object.entries(WALLET_CONFIGS)) {
    if (normalizedId.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedId)) {
      return config.icon;
    }
  }

  return WALLET_ICONS.default;
}

export function getWalletName(walletId?: string): string {
  if (!walletId) return 'Wallet';

  const normalizedId = walletId.toLowerCase();

  // Try exact match
  if (WALLET_CONFIGS[normalizedId]) {
    return WALLET_CONFIGS[normalizedId].name;
  }

  // Try partial match
  for (const [key, config] of Object.entries(WALLET_CONFIGS)) {
    if (normalizedId.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedId)) {
      return config.name;
    }
  }

  return walletId;
}
