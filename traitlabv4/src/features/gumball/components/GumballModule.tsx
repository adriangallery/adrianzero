/**
 * GumballZERO — standalone page (link-only, not in menu): /gumball
 *
 * Pull a random pre-seeded AdrianZERO from the Diamond's GumballMintFacet.
 * Closed series of 100, paid in $ZERO. Reuses the SamuraiMint $ZERO plumbing
 * pattern (approve to the Diamond, then call the facet) with a retro
 * gumball-machine visual ported from the v1 standalone.
 *
 * Until the facet is live on mainnet the page renders a "coming soon" state.
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import {
  useGumballConfig,
  useGumballApproval,
  useGumballPull,
} from '../hooks/useGumballMint';

const QTY_OPTIONS = [1, 3, 5, 10] as const;

export function GumballModule() {
  const { isConnected } = useAccount();
  const { config, notLive } = useGumballConfig();
  const { allowance, approveTokens, isApproving, isApprovalConfirming } =
    useGumballApproval();
  const { pull, isPending, isConfirming, isConfirmed, error, reset } =
    useGumballPull();

  const [qty, setQty] = useState<number>(1);

  const totalCost = config.pricePerPull * BigInt(qty);
  const needsApproval = allowance < totalCost;
  const soldOut = config.poolRemaining === 0n;
  const disabled =
    notLive || config.paused || soldOut || isPending || isConfirming;

  const priceLabel = `${formatEther(config.pricePerPull)} $ZERO`;
  const totalLabel = `${formatEther(totalCost)} $ZERO`;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0a0a16] via-[#10101f] to-black text-white flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-1">
          Gumball<span className="text-pink-400">ZERO</span>
        </h1>
        <p className="text-sm text-white/60 mb-6">
          Inserta $ZERO · recibe un AdrianZERO al azar. Serie cerrada de 100.
        </p>

        <div className="relative rounded-2xl border border-white/10 bg-black/40 p-5 shadow-2xl">
          <img
            src="/gumball-machine.gif"
            alt="Gumball machine"
            className="mx-auto w-56 h-auto select-none pointer-events-none [image-rendering:pixelated]"
            draggable={false}
          />

          <div className="mt-4 flex items-center justify-between text-xs text-white/60">
            <span>
              Stock:{' '}
              <span className="text-white font-semibold">
                {config.poolRemaining.toString()} / {config.totalSeeded.toString()}
              </span>
            </span>
            <span>
              Precio: <span className="text-white font-semibold">{priceLabel}</span>
            </span>
          </div>

          {/* Quantity selector */}
          <div className="mt-5 grid grid-cols-4 gap-2">
            {QTY_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => {
                  setQty(n);
                  reset();
                }}
                className={`rounded-lg py-2 text-sm font-bold transition ${
                  qty === n
                    ? 'bg-pink-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="mt-3 text-sm text-white/70">
            Total: <span className="text-white font-semibold">{totalLabel}</span>
          </div>

          {/* Status / actions */}
          <div className="mt-5 space-y-3">
            {notLive && (
              <div className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 py-2 text-xs text-amber-300">
                Próximamente — la máquina aún no está activa on-chain.
              </div>
            )}
            {!notLive && config.paused && (
              <div className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 py-2 text-xs text-amber-300">
                En pausa. Vuelve pronto.
              </div>
            )}
            {!notLive && soldOut && (
              <div className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white/70">
                Sold out — los 100 ya se dispensaron.
              </div>
            )}

            {isConfirmed ? (
              <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-3 text-sm text-emerald-300">
                ¡Dispensado! 🎉 Revisa tu wallet o la sección{' '}
                <a href="/mynfts" className="underline">
                  My NFTs
                </a>
                .
              </div>
            ) : !isConnected ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-white/50">
                  Conecta tu wallet para tirar.
                </p>
                <ConnectButton />
              </div>
            ) : needsApproval ? (
              <button
                disabled={disabled || isApproving || isApprovalConfirming}
                onClick={() => approveTokens(totalCost)}
                className="w-full rounded-xl bg-pink-500 hover:bg-pink-400 disabled:opacity-40 disabled:cursor-not-allowed py-3 font-bold transition"
              >
                {isApproving || isApprovalConfirming
                  ? 'Aprobando…'
                  : `Aprobar ${totalLabel}`}
              </button>
            ) : (
              <button
                disabled={disabled}
                onClick={() => pull(qty)}
                className="w-full rounded-xl bg-pink-500 hover:bg-pink-400 disabled:opacity-40 disabled:cursor-not-allowed py-3 font-bold transition"
              >
                {isPending || isConfirming
                  ? 'Tirando…'
                  : `Tirar ×${qty}`}
              </button>
            )}

            {error && (
              <p className="text-xs text-red-400 break-words">
                {error.message.slice(0, 140)}
              </p>
            )}
          </div>
        </div>

        <p className="mt-6 text-[11px] text-white/30">
          Pago 100% revenue · traits preasignados aleatorios · AdrianLAB by HalfxTiger
        </p>
      </div>
    </div>
  );
}
