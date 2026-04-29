/**
 * Mint button + status strip. Drives the full upload → approve → mint flow
 * through useTShitMint, surfaces every phase to the user, and links to
 * BaseScan + OpenSea on success.
 */
import { Loader2, CheckCircle2, AlertTriangle, Flame } from 'lucide-react';
import { useTShitMint } from '../hooks/useTShitMint';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

const ADRIAN_LAB = CONTRACT_ADDRESSES.ADRIAN_LAB;

const PHASE_LABEL: Record<string, string> = {
  idle: 'Ready',
  'checking-allowance': 'Checking $ZERO allowance…',
  approving: 'Approving $ZERO…',
  'awaiting-approval-confirm': 'Waiting for approval…',
  uploading: 'Uploading SVG…',
  minting: 'Confirm mint in wallet…',
  'awaiting-mint-confirm': 'Mint pending on Base…',
  success: 'Minted!',
  error: 'Failed',
};

export function MintFlow() {
  const { status, mint, reset, mintPrice, isActive, registeredRemaining } = useTShitMint();

  const priceWhole = Number(mintPrice / 10n ** 18n);
  const noSlots = isActive && registeredRemaining === 0;
  const lowSlots = isActive && registeredRemaining > 0 && registeredRemaining <= 10;

  const busy =
    status.phase !== 'idle' &&
    status.phase !== 'success' &&
    status.phase !== 'error';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400 uppercase tracking-wide">Mint price</span>
        <span className="text-emerald-300 font-mono">
          {priceWhole.toLocaleString()} $ZERO <Flame className="inline w-3.5 h-3.5 ml-1 mb-0.5" />
        </span>
      </div>
      {isActive && (
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="uppercase tracking-wide">Slots open</span>
          <span className={`font-mono ${noSlots ? 'text-amber-400' : lowSlots ? 'text-amber-300' : 'text-zinc-300'}`}>
            {registeredRemaining}
          </span>
        </div>
      )}
      {!isActive && (
        <div className="text-xs text-amber-400 border border-amber-700 bg-amber-950/30 rounded p-2">
          T-Shit Studio is currently paused on-chain. Check back soon.
        </div>
      )}
      {noSlots && (
        <div className="text-xs text-amber-300 border border-amber-700 bg-amber-950/30 rounded p-2">
          All current mint slots are filled. Admin is restocking — refresh in a minute.
        </div>
      )}
      {lowSlots && (
        <div className="text-xs text-amber-200 border border-amber-800/60 bg-amber-950/20 rounded p-2">
          Only {registeredRemaining} slot{registeredRemaining === 1 ? '' : 's'} left in this batch.
        </div>
      )}
      <button
        onClick={() => mint()}
        disabled={busy || !isActive || noSlots}
        className="w-full py-3 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        {status.phase === 'success'
          ? `Minted #${status.tokenId ?? '—'}`
          : status.phase === 'error'
          ? 'Try again'
          : busy
          ? PHASE_LABEL[status.phase]
          : noSlots
          ? 'Restocking…'
          : `Mint for ${priceWhole.toLocaleString()} $ZERO (100% burn)`}
      </button>

      {status.phase === 'success' && status.tokenId && (
        <div className="rounded border border-emerald-700 bg-emerald-950/30 p-3 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-bold">Minted Studio T-Shit #{status.tokenId}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-emerald-200/80">
            {status.txHash && (
              <a
                href={`https://basescan.org/tx/${status.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                View tx
              </a>
            )}
            <a
              href={`https://opensea.io/es/item/base/${ADRIAN_LAB}/${status.tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              View on OpenSea
            </a>
            {status.designUrl && (
              <a
                href={status.designUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                Raw SVG
              </a>
            )}
          </div>
          <button
            onClick={() => reset({ clearCanvas: true })}
            className="text-xs text-emerald-200 underline mt-1 hover:text-white"
          >
            Design another
          </button>
        </div>
      )}

      {status.phase === 'error' && (
        <div className="rounded border border-rose-800 bg-rose-950/30 p-3 text-sm text-rose-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Mint failed</div>
            <div className="text-xs break-words">{status.error}</div>
            <button onClick={() => reset()} className="text-xs underline mt-1 hover:text-white">
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
