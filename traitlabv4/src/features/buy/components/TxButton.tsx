/**
 * TxButton Component
 * Transaction button with pending/confirming/success states
 * Adapted from ZEROtoken frontend to TraitLabV4 design system
 */

import { useState } from 'react';
import { useWaitForTransactionReceipt } from 'wagmi';
import type { Hash } from 'viem';

interface TxButtonProps {
  label: string;
  pendingLabel?: string;
  onClick: () => Promise<Hash | undefined>;
  disabled?: boolean;
}

export function TxButton({ label, pendingLabel, onClick, disabled }: TxButtonProps) {
  const [hash, setHash] = useState<Hash>();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  async function handleClick() {
    try {
      setIsPending(true);
      setError(null);
      const txHash = await onClick();
      if (txHash) setHash(txHash);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('User rejected') && !msg.includes('User denied')) {
        setError(msg.length > 120 ? msg.slice(0, 120) + '...' : msg);
      }
    } finally {
      setIsPending(false);
    }
  }

  const busy = isPending || isConfirming;

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={disabled || busy}
        className={`w-full px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
          busy
            ? 'bg-muted text-muted-foreground cursor-wait'
            : disabled
            ? 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
            : 'bg-[#00ff00] text-black hover:bg-[#00dd00]'
        }`}
      >
        {busy ? (pendingLabel || 'CONFIRMING...') : label}
      </button>
      {isSuccess && (
        <p className="text-center text-xs text-[#00ff00] mt-1 font-medium">TX CONFIRMED</p>
      )}
      {error && (
        <p className="text-center text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
