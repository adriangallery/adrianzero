import type { CreateConnectorFn } from 'wagmi';

/**
 * F11 (14-sep-2026): wagmi llama a `connector.setup()` al crear la config, y en WalletConnect,
 * MetaMask SDK y Base Account ese `setup` hace `getProvider()`, que descarga su SDK (~600 KB
 * entre los tres) antes de que nadie pulse «Connect». Sin `setup`, cada SDK se descarga cuando
 * de verdad se usa: al conectar (`connect` ya espera a `getProvider`) o al reconectar esa wallet.
 * Los conectores inyectados (extensión o navegador de la wallet) no descargan nada y se dejan tal cual.
 */
export function withLazySetup(connectorFn: CreateConnectorFn): CreateConnectorFn {
  return (params) => {
    const connector = connectorFn(params);
    if (connector.type === 'injected') return connector;
    return { ...connector, async setup() {} };
  };
}
