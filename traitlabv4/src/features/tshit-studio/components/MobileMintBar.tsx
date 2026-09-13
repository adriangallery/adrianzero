/**
 * Mobile "buy" strip — fixed just above the TabBar so the mint call to
 * action is always reachable regardless of how far the canvas/tools are
 * scrolled. Tapping it opens the existing mint BottomSheet (price, balance
 * after mint, signatures and the mint button all already live there — this
 * bar is only the entry point) or, when disconnected, opens the wallet
 * connect modal directly.
 *
 * BUG (13-sep hotfix): this component didn't exist. The only way to reach
 * mint on mobile was a small icon+label button buried in the second row of
 * `MobileToolbar`, which was itself `fixed inset-x-0 bottom-0 z-30` — the
 * EXACT same box as the global `TabBar` (`src/ui/TabBar.tsx`, also
 * `fixed inset-x-0 bottom-0 z-30`). Same position, same z-index: whichever
 * mounts later in the DOM paints on top, so the toolbar's bottom row
 * (including the mint button) rendered underneath the TabBar and was
 * unreachable — "el bloque de mint ha quedado ... bajo la TabBar".
 *
 * BUG (13-sep hotfix, round 2): `bottom` used to add
 * `env(safe-area-inset-bottom, 0px)` on top of `--tabbar-h`, double-counting
 * the inset — `TabBar` already absorbs it inside its own fixed height (see
 * `useMeasuredHeightVar` for the full explanation) — which left a ~16px gap
 * of visible canvas between this bar and the TabBar on devices with a
 * non-zero safe area. Also, its own height is now measured for real instead
 * of trusting a hardcoded `56px` guess.
 *
 * FIX (critic review, round 4): colors used to be raw `bg-zinc-950/95` /
 * `border-zinc-800` (+ `backdrop-blur`) instead of the F3.5/D11 design-system
 * tokens (`bg-bg`, `border-line`) that `TabBar` itself uses right below —
 * two visually different "black bars" stacked directly on top of each other.
 * `bg-bg` is fully opaque, so `backdrop-blur` was a no-op behind it anyway.
 */
import { Flame } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useTShitMint } from '../hooks/useTShitMint';
import { useMeasuredHeightVar } from '../hooks/useMeasuredHeightVar';

interface Props {
  isConnected: boolean;
  onOpenMintSheet: () => void;
}

export function MobileMintBar({ isConnected, onOpenMintSheet }: Props) {
  const { openConnectModal } = useConnectModal();
  const { mintPrice, isActive, registeredRemaining } = useTShitMint();
  const barRef = useMeasuredHeightVar<HTMLDivElement>('--tshit-actionbar-h');

  const priceWhole = Number(mintPrice / 10n ** 18n);
  const noSlots = isActive && registeredRemaining === 0;

  const label = !isConnected
    ? 'Connect wallet'
    : noSlots
      ? 'Mint T-Shit · Restocking…'
      : `Mint T-Shit · ${priceWhole.toLocaleString()} $ZERO`;

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 z-20 lg:hidden border-t border-line bg-bg"
      style={{ bottom: 'var(--tabbar-h)' }}
    >
      <button
        type="button"
        onClick={() => (isConnected ? onOpenMintSheet() : openConnectModal?.())}
        className="flex h-14 w-full items-center justify-center gap-2 px-4 text-sm font-bold uppercase tracking-wide text-fg active:bg-line"
      >
        <Flame className="h-4 w-4 text-emerald-400" aria-hidden />
        <span className="truncate">{label}</span>
      </button>
    </div>
  );
}
