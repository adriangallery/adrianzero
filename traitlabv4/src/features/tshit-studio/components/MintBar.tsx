/**
 * Persistent horizontal mint strip for the desktop workspace footer.
 * Shares useTShitMint with the mobile MintFlow but presents as a bar so the
 * Mint button is always in sight regardless of how far the right panel is
 * scrolled. Success/error states expand inline above the bar.
 */
import { Loader2, CheckCircle2, AlertTriangle, Flame } from 'lucide-react';
import { useTShitMint } from '../hooks/useTShitMint';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

const ADRIAN_LAB = CONTRACT_ADDRESSES.ADRIAN_LAB;

const PHASE_LABEL: Record<string, string> = {
  idle: 'Ready',
  'checking-allowance': 'Checking allowance…',
  approving: 'Approving $ZERO…',
  'awaiting-approval-confirm': 'Waiting for approval…',
  uploading: 'Uploading SVG…',
  minting: 'Confirm in wallet…',
  'awaiting-mint-confirm': 'Mint pending…',
  success: 'Minted!',
  error: 'Failed',
};

export function MintBar({ isConnected }: { isConnected: boolean }) {
  const { status, mint, reset, mintPrice, isActive, registeredRemaining } = useTShitMint();

  const priceWhole = Number(mintPrice / 10n ** 18n);
  const noSlots = isActive && registeredRemaining === 0;
  const lowSlots = isActive && registeredRemaining > 0 && registeredRemaining <= 10;
  const busy =
    status.phase !== 'idle' && status.phase !== 'success' && status.phase !== 'error';

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/80">
      {/* Inline status banners (only when relevant) */}
      {status.phase === 'success' && status.tokenId && (
        <div className="border-b border-emerald-900/60 bg-emerald-950/30 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
            <CheckCircle2 className="w-4 h-4" /> Minted Studio T-Shit #{status.tokenId}
          </span>
          {status.txHash && (
            <a
              href={`https://basescan.org/tx/${status.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-emerald-200 hover:text-white"
            >
              View tx
            </a>
          )}
          <a
            href={`https://opensea.io/es/item/base/${ADRIAN_LAB}/${status.tokenId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-emerald-200 hover:text-white"
          >
            OpenSea
          </a>
          {status.designUrl && (
            <a
              href={status.designUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-emerald-200 hover:text-white"
            >
              Raw SVG
            </a>
          )}
          <button
            onClick={() => reset({ clearCanvas: true })}
            className="ml-auto text-emerald-200 underline hover:text-white"
          >
            Design another
          </button>
        </div>
      )}

      {status.phase === 'error' && (
        <div className="border-b border-rose-900/60 bg-rose-950/30 px-4 py-2 flex items-start gap-2 text-xs text-rose-200">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-bold">Mint failed: </span>
            <span className="break-words">{status.error}</span>
          </div>
          <button onClick={() => reset()} className="underline shrink-0 hover:text-white">
            Reset
          </button>
        </div>
      )}

      {!isActive && isConnected && (
        <div className="border-b border-amber-900/60 bg-amber-950/20 px-4 py-1.5 text-xs text-amber-300 text-center">
          T-Shit Studio is currently paused on-chain.
        </div>
      )}

      {noSlots && (
        <div className="border-b border-amber-900/60 bg-amber-950/20 px-4 py-1.5 text-xs text-amber-300 text-center">
          All current slots are filled. Admin is restocking — refresh in a minute.
        </div>
      )}

      {/* Main bar row */}
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex flex-col text-xs leading-tight">
          <span className="text-zinc-500 uppercase tracking-wide">Mint price</span>
          <span className="text-emerald-300 font-mono text-sm">
            {priceWhole.toLocaleString()} $ZERO
            <Flame className="inline w-3.5 h-3.5 ml-1 mb-0.5" />
          </span>
        </div>

        {isActive && (
          <div className="flex flex-col text-xs leading-tight">
            <span className="text-zinc-500 uppercase tracking-wide">Slots open</span>
            <span
              className={`font-mono text-sm ${
                noSlots ? 'text-amber-400' : lowSlots ? 'text-amber-300' : 'text-zinc-300'
              }`}
            >
              {registeredRemaining}
            </span>
          </div>
        )}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {PHASE_LABEL[status.phase]}
          </div>
        )}

        <div className="flex-1" />

        {isConnected ? (
          <button
            onClick={() => mint()}
            disabled={busy || !isActive || noSlots}
            className="px-6 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-wide flex items-center gap-2 shadow-lg shadow-emerald-900/40"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {status.phase === 'success'
              ? `Minted #${status.tokenId ?? '—'}`
              : status.phase === 'error'
                ? 'Try again'
                : noSlots
                  ? 'Restocking…'
                  : `Mint for ${priceWhole.toLocaleString()} $ZERO`}
          </button>
        ) : (
          <span className="text-sm text-zinc-400 px-4 py-2.5 rounded border border-zinc-700 bg-zinc-900">
            Connect a wallet to mint
          </span>
        )}
      </div>
    </div>
  );
}
