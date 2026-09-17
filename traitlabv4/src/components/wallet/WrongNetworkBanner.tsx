/**
 * Aviso de red equivocada — se monta en `MainLayout`.
 *
 * Las lecturas ya van siempre a Base (`syncConnectedChain: false` en config/wagmi.ts), pero las firmas
 * salen por la red en la que esté la wallet. Si alguien entra con la wallet en Ethereum:
 *  1. al conectar se le pide UNA vez cambiar a Base (un solo toque en la wallet);
 *  2. si lo rechaza o la wallet no puede cambiar sola, queda una barra fija con el botón «Switch to Base».
 */

import { useEffect, useRef } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { AlertIcon, SpinnerIcon } from '@/ui';

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  10: 'Optimism',
  56: 'BNB Chain',
  137: 'Polygon',
  42161: 'Arbitrum',
};

export function WrongNetworkBanner() {
  const { isConnected, chainId, address } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const askedFor = useRef<string | null>(null);

  const wrongNetwork = isConnected && chainId !== undefined && chainId !== base.id;

  // Pedir el cambio automáticamente una sola vez por wallet conectada, no en cada render.
  useEffect(() => {
    if (!wrongNetwork || !address) return;
    if (askedFor.current === address) return;
    askedFor.current = address;
    switchChain({ chainId: base.id });
  }, [wrongNetwork, address, switchChain]);

  if (!wrongNetwork) return null;

  const current = CHAIN_NAMES[chainId as number] ?? 'another network';

  return (
    <div
      role="alert"
      data-testid="wrong-network-banner"
      className="fixed inset-x-0 top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-[#f5a524] px-4 py-2 text-[13px] font-bold text-black"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))' }}
    >
      <span className="inline-flex items-center gap-1.5">
        <AlertIcon size={14} />
        Your wallet is on {current}. ZERO runs on Base.
      </span>
      <button
        type="button"
        onClick={() => switchChain({ chainId: base.id })}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1 text-[13px] font-bold text-white disabled:opacity-70"
      >
        {isPending && <SpinnerIcon size={12} />}
        {isPending ? 'Check your wallet…' : 'Switch to Base'}
      </button>
    </div>
  );
}
