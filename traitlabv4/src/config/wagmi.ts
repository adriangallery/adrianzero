import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, mainnet } from 'wagmi/chains';
import { fallback, http } from 'wagmi';
import { buildAlchemyRpcUrls, buildEthMainnetRpcUrl } from './alchemy';

// Build Base transport using Alchemy/Infura first, public RPCs as fallback.
// Without this, wagmi's default http() lands on mainnet.base.org which rate-limits
// (429) under heavy multicall loads (e.g. scanning 600 Samurai NFT states).
const baseRpcUrls = buildAlchemyRpcUrls();
const baseTransport = fallback(
  baseRpcUrls.map((url) => http(url, { retryCount: 2, retryDelay: 250 })),
  { rank: false },
);

export const config = getDefaultConfig({
  appName: 'TraitLAB V4',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [base, mainnet],
  transports: {
    [base.id]: baseTransport,
    [mainnet.id]: http(buildEthMainnetRpcUrl()),
  },
  ssr: false,
});
