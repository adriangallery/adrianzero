/**
 * Confirm / Cancel strip for an unconfirmed stamp the user is dragging.
 * Floats above the canvas with arrow nudge buttons for fine-grained pixel
 * placement (touch screens often can't drag a 1px shift cleanly).
 */
import { Check, X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTShitStore } from '../store/tshitStore';
import { isPaintable } from '../lib/tshirtMask';

export function PendingStampControls() {
  const pendingStamp = useTShitStore(s => s.pendingStamp);
  const movePendingStamp = useTShitStore(s => s.movePendingStamp);
  const commitPendingStamp = useTShitStore(s => s.commitPendingStamp);
  const cancelPendingStamp = useTShitStore(s => s.cancelPendingStamp);

  if (!pendingStamp) return null;

  const nudge = (dx: number, dy: number) => {
    movePendingStamp(pendingStamp.offsetX + dx, pendingStamp.offsetY + dy);
  };

  return (
    <div className="rounded-lg border border-emerald-700 bg-emerald-950/40 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-emerald-300">
          Position the {pendingStamp.origin}
        </span>
        <span className="text-[10px] text-emerald-200/60 font-mono">
          {pendingStamp.width}×{pendingStamp.height} @ {pendingStamp.offsetX},{pendingStamp.offsetY}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 max-w-[120px] mx-auto">
        <span />
        <button
          onClick={() => nudge(0, -1)}
          className="p-1.5 rounded bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-300"
          aria-label="Nudge up"
        >
          <ArrowUp className="w-4 h-4 mx-auto" />
        </button>
        <span />
        <button
          onClick={() => nudge(-1, 0)}
          className="p-1.5 rounded bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-300"
          aria-label="Nudge left"
        >
          <ArrowLeft className="w-4 h-4 mx-auto" />
        </button>
        <span className="p-1.5 rounded border border-dashed border-zinc-700" />
        <button
          onClick={() => nudge(1, 0)}
          className="p-1.5 rounded bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-300"
          aria-label="Nudge right"
        >
          <ArrowRight className="w-4 h-4 mx-auto" />
        </button>
        <span />
        <button
          onClick={() => nudge(0, 1)}
          className="p-1.5 rounded bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-300"
          aria-label="Nudge down"
        >
          <ArrowDown className="w-4 h-4 mx-auto" />
        </button>
        <span />
      </div>

      <p className="text-[11px] text-emerald-200/70 leading-tight">
        Drag inside the dashed box on the canvas, or use the arrows.
        Pixels falling outside the t-shirt area are clipped on confirm.
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => commitPendingStamp(isPaintable)}
          className="flex-1 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold uppercase flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" /> Confirm
        </button>
        <button
          onClick={cancelPendingStamp}
          className="px-3 py-2 rounded bg-zinc-900 border border-zinc-700 hover:border-rose-600 text-zinc-300 text-sm flex items-center gap-1.5"
        >
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </div>
  );
}
