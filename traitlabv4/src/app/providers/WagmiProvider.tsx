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
 * F11 (14-sep-2026): wagmi reconecta al montar y `reconnect` sin argumentos prueba TODOS los
 * conectores, lo que descarga los SDK de MetaMask, WalletConnect y Base Account aunque nadie haya
 * conectado nunca. Se aplaza a cuando el navegador queda libre (máx. 1,5 s) y solo se intenta si
 * hubo una conexión, y con esa wallet: quien entra por primera vez no descarga ningún SDK.
 */
function DeferredReconnect() {
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      let recentId: string | null | undefined;
      try {
        recentId = await config.storage?.getItem('recentConnectorId');
      } catch {
        recentId = null;
      }
      if (cancelled || !recentId) return;
      const recent = config.connectors.find((c) => c.id === recentId);
      void reconnect(config, recent ? { connectors: [recent] } : undefined);
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => void run(), { timeout: 1500 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
      };
    }
    const t = window.setTimeout(() => void run(), 600);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
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
