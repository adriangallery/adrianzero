import { Sheet, Button } from '@/ui';
import { formatEther } from 'viem';

export type Movie2ConfirmActionKind = 'rent' | 'buy' | 'return' | 'upgrade';

const ACTION_LABEL: Record<Movie2ConfirmActionKind, string> = {
  rent: 'Rent',
  buy: 'Buy permanently',
  return: 'Return tape',
  upgrade: 'Upgrade to buy',
};

const ACTION_ACCENT: Record<Movie2ConfirmActionKind, string> = {
  rent: 'bg-sky-500 text-black hover:bg-sky-400',
  buy: 'bg-yellow-500 text-black hover:bg-yellow-400',
  return: 'bg-emerald-500 text-black hover:bg-emerald-400',
  upgrade: 'bg-yellow-500 text-black hover:bg-yellow-400',
};

interface Movie2ConfirmSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: Movie2ConfirmActionKind;
  movieName: string;
  /** Total cost in wei — 0n for the always-free `return` action. */
  costWei: bigint;
  /** Connected wallet's current $ZERO balance, in wei. */
  balanceWei: bigint;
  /** True when an approve tx is needed before the main action (2 signatures total). */
  needsApproval: boolean;
  isPending: boolean;
  onConfirm: () => void;
}

function fmt(wei: bigint): string {
  return Number(formatEther(wei)).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

/**
 * Bottom sheet confirming an on-chain ZEROmovies S2 action before it fires —
 * price, balance after, and exactly how many wallet signatures it takes
 * (1 if already approved, 2 if an approve tx has to go first). Mirrors the
 * layout in `orquestacion-fable/design/adrianzero-redesign/Shop.dc.html`
 * (Precio / Tu saldo después / Firmas).
 */
export function Movie2ConfirmSheet({
  open,
  onOpenChange,
  action,
  movieName,
  costWei,
  balanceWei,
  needsApproval,
  isPending,
  onConfirm,
}: Movie2ConfirmSheetProps) {
  const isFree = costWei === 0n;
  const balanceAfter = balanceWei - costWei;
  const insufficientBalance = !isFree && balanceAfter < 0n;
  const signatures = isFree ? 1 : needsApproval ? 2 : 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={movieName}>
      <div className="flex flex-col gap-3 pt-1 text-[13px]">
        <div className="flex flex-col gap-1.5 text-mute">
          <div className="flex items-center justify-between">
            <span>Precio</span>
            <span className="text-fg">{isFree ? 'Free' : `${fmt(costWei)} $ZERO`}</span>
          </div>
          {!isFree && (
            <div className="flex items-center justify-between">
              <span>Tu saldo después</span>
              <span className={insufficientBalance ? 'text-bad' : 'text-fg'}>
                {balanceAfter < 0n ? `-${fmt(-balanceAfter)}` : fmt(balanceAfter)} $ZERO
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>Firmas</span>
            <span className="text-fg">
              {signatures} {signatures === 2 ? '· aprobar $ZERO + ' + ACTION_LABEL[action].toLowerCase() : ''}
            </span>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          full
          loading={isPending}
          disabled={isPending || insufficientBalance}
          onClick={onConfirm}
          className={ACTION_ACCENT[action]}
        >
          {isPending
            ? 'Confirming…'
            : needsApproval && !isFree
              ? `Approve & ${ACTION_LABEL[action]}`
              : ACTION_LABEL[action]}
        </Button>

        {insufficientBalance && (
          <div className="flex items-center gap-2 rounded-[var(--r-md)] border-2 border-bad px-3 py-2.5 text-fg">
            You're short {fmt(-balanceAfter)} $ZERO for this.
          </div>
        )}
      </div>
    </Sheet>
  );
}
