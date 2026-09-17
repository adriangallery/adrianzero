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

// Todo el ecosistema vive en Base. Si la wallet está en otra red (p. ej. Ethereum), wagmi movía TODAS
// las lecturas sin `chainId` a esa red: el Diamond no existe allí y la tienda salía vacía o con error
// (17-sep-2026). `syncConnectedChain: false` deja el chainId de la app fijo en Base; la red de la wallet
// solo importa al firmar, y de eso se encarga `WrongNetworkBanner`.
const WAGMI_STORE_KEY = 'wagmi.store';
try {
  // Un chainId de Ethereum persistido de sesiones anteriores seguiría ganando al rehidratar.
  const raw = localStorage.getItem(WAGMI_STORE_KEY);
  if (raw) {
    const persisted = JSON.parse(raw);
    if (persisted?.state && persisted.state.chainId !== base.id) {
      persisted.state.chainId = base.id;
      localStorage.setItem(WAGMI_STORE_KEY, JSON.stringify(persisted));
    }
  }
} catch {
  // Sin localStorage o con JSON roto: wagmi arranca en la primera cadena (Base).
}

export const config = createConfig({
  connectors,
  chains: [base, mainnet],
  transports: {
    [base.id]: baseTransport,
    [mainnet.id]: mainnetTransport,
  },
  syncConnectedChain: false,
  ssr: false,
});
