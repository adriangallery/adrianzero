import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, mainnet } from 'wagmi/chains';
import { http } from 'wagmi';
import { buildEthMainnetRpcUrl } from './alchemy';

export const config = getDefaultConfig({
  appName: 'TraitLAB V4',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [base, mainnet],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(buildEthMainnetRpcUrl()),
  },
  ssr: false,
});
