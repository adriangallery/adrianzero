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
 */
import { Flame } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useTShitMint } from '../hooks/useTShitMint';

interface Props {
  isConnected: boolean;
  onOpenMintSheet: () => void;
}

export function MobileMintBar({ isConnected, onOpenMintSheet }: Props) {
  const { openConnectModal } = useConnectModal();
  const { mintPrice, isActive, registeredRemaining } = useTShitMint();

  const priceWhole = Number(mintPrice / 10n ** 18n);
  const noSlots = isActive && registeredRemaining === 0;

  const label = !isConnected
    ? 'Connect wallet'
    : noSlots
      ? 'Mint T-Shit · Restocking…'
      : `Mint T-Shit · ${priceWhole.toLocaleString()} $ZERO`;

  return (
    <div
      className="fixed inset-x-0 z-20 lg:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur"
      style={{ bottom: 'calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px))' }}
    >
      <button
        type="button"
        onClick={() => (isConnected ? onOpenMintSheet() : openConnectModal?.())}
        className="flex w-full items-center justify-center gap-2 px-4 text-sm font-bold uppercase tracking-wide text-white active:bg-zinc-900"
        style={{ height: 'var(--tshit-actionbar-h, 56px)' }}
      >
        <Flame className="h-4 w-4 text-emerald-400" aria-hidden />
        <span className="truncate">{label}</span>
      </button>
    </div>
  );
}
