/**
 * Compact confirm strip for the unconfirmed stamp the user is dragging on
 * the canvas. Big primary Confirm button + small Cancel + a single nudge row
 * for fine 1px adjustments. The dashed bbox on the canvas is the primary
 * affordance — this panel is just the close-it-out controls.
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

  const nudge = (dx: number, dy: number) =>
    movePendingStamp(pendingStamp.offsetX + dx, pendingStamp.offsetY + dy);

  return (
    <div className="rounded-lg border border-emerald-700 bg-emerald-950/40 p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => commitPendingStamp(isPaintable)}
          className="flex-1 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase flex items-center justify-center gap-1.5"
          title="Lock this stamp in place"
        >
          <Check className="w-3.5 h-3.5" /> Place
        </button>
        <button
          onClick={() => nudge(-1, 0)}
          className="p-2 rounded bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-300"
          aria-label="Nudge left"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => nudge(0, -1)}
          className="p-2 rounded bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-300"
          aria-label="Nudge up"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => nudge(0, 1)}
          className="p-2 rounded bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-300"
          aria-label="Nudge down"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => nudge(1, 0)}
          className="p-2 rounded bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-300"
          aria-label="Nudge right"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={cancelPendingStamp}
          className="p-2 rounded bg-zinc-900 border border-zinc-700 hover:border-rose-600 text-zinc-300"
          aria-label="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-[10px] text-emerald-200/60 leading-tight">
        Drag the dashed box to move. Pixels outside the t-shirt are clipped on Place.
      </p>
    </div>
  );
}
