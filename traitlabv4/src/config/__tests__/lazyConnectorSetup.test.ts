import { describe, expect, it, vi } from 'vitest';
import type { CreateConnectorFn } from 'wagmi';
import { withLazySetup } from '../lazyConnectorSetup';

type Params = Parameters<CreateConnectorFn>[0];
const params = {} as Params;

function fakeConnector(type: string, setup: () => Promise<void>): CreateConnectorFn {
  return (() => ({
    id: type,
    name: type,
    type,
    setup,
    rkDetails: { id: type },
    getProvider: async () => ({}),
  })) as unknown as CreateConnectorFn;
}

describe('withLazySetup', () => {
  it('no ejecuta el setup de un conector que descarga SDK', async () => {
    const setup = vi.fn(async () => {});
    const connector = withLazySetup(fakeConnector('walletConnect', setup))(params);
    await connector.setup?.();
    expect(setup).not.toHaveBeenCalled();
  });

  it('deja intacto un conector inyectado', () => {
    const setup = vi.fn(async () => {});
    const connector = withLazySetup(fakeConnector('injected', setup))(params);
    expect(connector.setup).toBe(setup);
  });

  it('conserva el resto del conector (rkDetails de RainbowKit incluido)', () => {
    const connector = withLazySetup(fakeConnector('metaMask', async () => {}))(params) as unknown as {
      id: string;
      rkDetails: { id: string };
    };
    expect(connector.id).toBe('metaMask');
    expect(connector.rkDetails).toEqual({ id: 'metaMask' });
  });
});
