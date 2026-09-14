import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  baseAccount,
  metaMaskWallet,
  rainbowWallet,
  safeWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { base, mainnet } from 'wagmi/chains';
import { createConfig, fallback, http } from 'wagmi';
import { buildAlchemyRpcUrls, buildEthMainnetRpcUrls } from './alchemy';
import { withLazySetup } from './lazyConnectorSetup';

// Build Base transport using Alchemy/Infura first, public RPCs as fallback.
// Without this, wagmi's default http() lands on mainnet.base.org which rate-limits
// (429) under heavy multicall loads (e.g. scanning 600 Samurai NFT states).
const baseRpcUrls = buildAlchemyRpcUrls();
// retryCount: 0 = fail fast so the fallback chain reaches Infura/public immediately
// when Alchemy returns 429 (monthly cap). Retrying within a capped key wastes time.
const baseTransport = fallback(
  baseRpcUrls.map((url) => http(url, { retryCount: 0 })),
  { rank: false },
);

// Mainnet for ENS — same rotation strategy. Single http() with one key 429s on burst
// wallet connects (per-second rate limit, not monthly cap).
const mainnetTransport = fallback(
  buildEthMainnetRpcUrls().map((url) => http(url, { retryCount: 0 })),
  { rank: false },
);

// Misma lista de wallets que `getDefaultConfig` de RainbowKit 2.2.10; lo único que cambia es
// que los SDK se descargan al usarlos y no al arrancar (ver lazyConnectorSetup.ts).
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [safeWallet, rainbowWallet, baseAccount, metaMaskWallet, walletConnectWallet],
    },
  ],
  {
    appName: 'TraitLAB V4',
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  },
).map(withLazySetup);

export const config = createConfig({
  connectors,
  chains: [base, mainnet],
  transports: {
    [base.id]: baseTransport,
    [mainnet.id]: mainnetTransport,
  },
  ssr: false,
});
