import '@rainbow-me/rainbowkit/styles.css';
import { useEffect } from 'react';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { reconnect } from 'wagmi/actions';
import { config } from '@/config/wagmi';

interface WagmiProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * F11 (14-sep-2026): Lighthouse móvil daba 46/50 porque, al montar, wagmi reconecta la wallet
 * y eso carga el SDK de MetaMask y WalletConnect (~350 KB) antes del primer pintado. La
 * reconexión se aplaza a cuando el navegador queda libre (máx. 1,5 s): la página pinta antes y
 * la wallet sigue apareciendo conectada sola, solo que un instante después.
 */
function DeferredReconnect() {
  useEffect(() => {
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      void reconnect(config);
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 1500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(run, 600);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}

export function WagmiProviderWrapper({ children }: WagmiProviderWrapperProps) {
  return (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <RainbowKitProvider
        theme={{
          lightMode: lightTheme(),
          darkMode: darkTheme(),
        }}
        modalSize="compact"
      >
        <DeferredReconnect />
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
