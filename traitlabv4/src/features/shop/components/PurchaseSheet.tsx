/**
 * Hoja de compra (F8, maqueta Shop.dc.html): lo que cuesta, lo que va a
 * pasar y un botón. Precio · Tu saldo después · Firmas («2 · aprobar ZERO
 * + comprar» o «1 · comprar»), y el error humano con el siguiente paso
 * («Te faltan 1 200 ZERO. Cómpralos con ETH en un paso» → /buy).
 *
 * Flujo: aprobar (solo si falta allowance) → comprar, encadenado sin que
 * el usuario tenga que volver a pulsar (patrón que ya tenía ShopCart).
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Minus, Plus, ExternalLink } from 'lucide-react';
import { Button, Sheet, Badge, WalletSheet } from '@/ui';
import { BLOCK_EXPLORER_URL } from '@/config/contracts';
import { humanError, isUserRejection } from '@/lib/web3/humanError';
import { useNotifications } from '@/hooks/useNotifications';
import type { ShopItem } from '../hooks/useShopItems';
import { getFallbackImageUrl } from '../hooks/useShopItems';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { useTokenApproval } from '../hooks/useTokenApproval';
import { useShopPurchase } from '../hooks/useShopPurchase';
import { formatTokenAmount, isPriceConfigured } from '../lib/format';
import type { PaymentToken } from '../types';

export interface PurchaseSheetProps {
  item: ShopItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tras una compra confirmada: refrescar el catálogo (freeRemaining,
   *  userPurchases, sold) para no ofrecer un «FREE» ya gastado — crítico 13-sep. */
  onPurchased?: () => void;
}

type Step = 'idle' | 'approving' | 'buying' | 'done';

function stockLine(item: ShopItem): string {
  const remaining = Math.max(0, item.quantityAvailable - item.sold);
  if (item.isSoldOut || remaining === 0) return 'Sold out';
  if (item.quantityAvailable > 0) return `${remaining} of ${item.quantityAvailable} left`;
  return `${remaining} left`;
}

function afterPurchasePath(item: ShopItem): { label: string; to: string } {
  if (item.category === 'floppy') return { label: 'Open your packs', to: '/packs' };
  if (item.category === 'serum') return { label: 'Use it in My NFTs', to: '/mynfts?tab=serums' };
  return { label: 'Equip it in TraitLab', to: '/traitlab' };
}

export function PurchaseSheet({ item, open, onOpenChange, onPurchased }: PurchaseSheetProps) {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const { isConnected } = useAccount();
  const { zeroBalance, adrianBalance, refetch: refetchBalances } = useTokenBalance();

  const bothPrices = !!item && isPriceConfigured(item.priceZero) && isPriceConfigured(item.priceAdrian);
  const defaultToken: PaymentToken = item && !isPriceConfigured(item.priceZero) && isPriceConfigured(item.priceAdrian) ? 'ADRIAN' : 'ZERO';
  const [paymentToken, setPaymentToken] = useState<PaymentToken>(defaultToken);
  const [qty, setQty] = useState(1);
  const [useFree, setUseFree] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [walletOpen, setWalletOpen] = useState(false);

  const approval = useTokenApproval(paymentToken);
  const purchase = useShopPurchase();

  // Reset al abrir con otro ítem
  useEffect(() => {
    if (!open) return;
    setPaymentToken(defaultToken);
    setQty(1);
    setUseFree(false);
    setStep('idle');
    approval.resetApprove();
    purchase.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.assetId]);

  const price = paymentToken === 'ZERO' ? item?.priceZero : item?.priceAdrian;
  const unit = isPriceConfigured(price) ? price : 0n;
  const remaining = item ? Math.max(0, item.quantityAvailable - item.sold) : 0;
  const perWalletLeft = item && item.maxPerWallet > 0 ? Math.max(0, item.maxPerWallet - item.userPurchases) : Infinity;
  const maxQty = Math.max(1, Math.min(remaining || 1, perWalletLeft === Infinity ? 99 : perWalletLeft));
  const hasFree = !!item && item.freeRemaining > 0;

  const total = useFree ? 0n : unit * BigInt(qty);
  const balance = paymentToken === 'ZERO' ? zeroBalance : adrianBalance;
  const after = balance !== undefined ? balance - total : undefined;
  const short = after !== undefined && after < 0n ? -after : 0n;
  const needsApproval = total > 0n && approval.needsApproval(total);
  const signatures = total === 0n ? 1 : needsApproval ? 2 : 1;
  const symbol = paymentToken === 'ZERO' ? 'ZERO' : 'ADRIAN';

  // Encadenar aprobación → compra
  useEffect(() => {
    if (step === 'approving' && approval.isConfirmed && item) {
      approval.refetchAllowance();
      setStep('buying');
      purchase.batchPurchase([{ assetId: item.assetId, quantity: qty, useFree }], paymentToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, approval.isConfirmed]);

  useEffect(() => {
    if (step === 'buying' && purchase.isConfirmed) {
      setStep('done');
      refetchBalances();
      onPurchased?.();
      notifications.success('Purchase confirmed', item ? `${qty} × ${item.name}` : '', true, purchase.txHash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, purchase.isConfirmed]);

  // Errores → volver a idle con mensaje humano (el rechazo en wallet no es un fallo)
  const rawError = step === 'approving' ? approval.approveError : step === 'buying' ? purchase.error : null;
  useEffect(() => {
    if (!rawError) return;
    setStep('idle');
    if (!isUserRejection(rawError)) {
      notifications.error('Purchase failed', humanError(rawError), true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawError]);

  const busy = step === 'approving' || step === 'buying';
  const ctaLabel = useMemo(() => {
    if (!isConnected) return 'Connect wallet';
    if (step === 'approving') return approval.isApproving ? 'Approve in your wallet… (1/2)' : 'Approving ZERO… (1/2)';
    if (step === 'buying') return purchase.isPending ? `Confirm in your wallet… (${signatures}/${signatures})` : 'Buying…';
    if (useFree) return 'Claim 1 free';
    return `Buy ${qty} · ${formatTokenAmount(total)} ${symbol}`;
  }, [isConnected, step, approval.isApproving, purchase.isPending, useFree, qty, total, symbol, signatures]);

  const handleBuy = () => {
    if (!item) return;
    if (!isConnected) {
      setWalletOpen(true);
      return;
    }
    if (short > 0n) return;
    if (needsApproval) {
      setStep('approving');
      approval.approve(total);
      return;
    }
    setStep('buying');
    purchase.batchPurchase([{ assetId: item.assetId, quantity: qty, useFree }], paymentToken);
  };

  if (!item) return null;
  const next = afterPurchasePath(item);

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => (busy ? null : onOpenChange(o))} title={step === 'done' ? 'Done' : 'Buy'}>
        {/* Ítem */}
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 flex-none overflow-hidden rounded-[var(--r-md)] border-2 border-line bg-line">
            <img
              src={item.imageUrl}
              alt=""
              className="h-full w-full object-contain"
              onError={(e) => {
                const fb = getFallbackImageUrl(item.assetId);
                if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-ui text-[15px] font-bold text-fg truncate">{item.name}</p>
            <p className="text-[13px] text-mute">{stockLine(item)}</p>
            {hasFree ? (
              <Badge tone="ok" className="mt-1">{item.freeRemaining} free for you</Badge>
            ) : null}
          </div>
          {step !== 'done' ? (
            <div className="flex flex-none items-center gap-1" aria-label="Quantity">
              <button
                type="button"
                aria-label="Less"
                disabled={busy || useFree || qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-11 w-11 place-items-center rounded-[var(--r-md)] border-2 border-line text-fg disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-ui min-w-[28px] text-center text-[16px] font-bold text-fg">{useFree ? 1 : qty}</span>
              <button
                type="button"
                aria-label="More"
                disabled={busy || useFree || qty >= maxQty}
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                className="grid h-11 w-11 place-items-center rounded-[var(--r-md)] border-2 border-line text-fg disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>

        {step === 'done' ? (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-[15px] text-fg">
              {useFree ? 'Claimed.' : `Bought ${qty} × ${item.name}.`}
            </p>
            {purchase.txHash ? (
              <a
                href={`${BLOCK_EXPLORER_URL}/tx/${purchase.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[13px] text-acc"
              >
                View on BaseScan <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
            <Button size="lg" full onClick={() => { onOpenChange(false); navigate(next.to); }}>
              {next.label}
            </Button>
            <Button size="md" variant="secondary" full onClick={() => onOpenChange(false)}>
              Keep shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Pago: token (solo si hay dos precios) y gratis */}
            {(bothPrices || hasFree) ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {bothPrices ? (
                  <>
                    <Toggle active={paymentToken === 'ZERO' && !useFree} disabled={busy} onClick={() => { setUseFree(false); setPaymentToken('ZERO'); }}>Pay in ZERO</Toggle>
                    <Toggle active={paymentToken === 'ADRIAN' && !useFree} disabled={busy} onClick={() => { setUseFree(false); setPaymentToken('ADRIAN'); }}>Pay in ADRIAN</Toggle>
                  </>
                ) : null}
                {hasFree ? (
                  <Toggle active={useFree} disabled={busy} onClick={() => setUseFree((v) => !v)}>Use my free one</Toggle>
                ) : null}
              </div>
            ) : null}

            {/* Desglose */}
            <dl className="mt-4 flex flex-col gap-2 rounded-[var(--r-md)] border-2 border-line p-3 text-[14px]">
              <Row label="Price">
                <span className="font-ui font-bold text-fg">{useFree ? 'Free' : `${formatTokenAmount(total)} ${symbol}`}</span>
              </Row>
              <Row label="Your balance after">
                {!isConnected ? (
                  <span className="text-mute">Connect to see</span>
                ) : after === undefined ? (
                  <span className="text-mute">…</span>
                ) : (
                  <span className={after < 0n ? 'text-bad' : 'text-fg'}>{formatTokenAmount(after)} {symbol}</span>
                )}
              </Row>
              <Row label="Signatures">
                <span className="text-fg">{signatures} · {signatures === 2 ? `approve ${symbol} + buy` : useFree ? 'claim' : 'buy'}</span>
              </Row>
            </dl>

            {/* Error humano con siguiente paso */}
            {isConnected && short > 0n ? (
              <div className="mt-3 flex flex-col gap-2 rounded-[var(--r-md)] border-2 border-warn/60 bg-warn/10 p-3 text-[14px] text-fg">
                <span>You're short {formatTokenAmount(short)} {symbol}.</span>
                {paymentToken === 'ZERO' ? (
                  <Button size="md" variant="secondary" full onClick={() => { onOpenChange(false); navigate('/buy'); }}>
                    Buy ZERO with ETH in one step
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4">
              <Button
                size="lg"
                full
                loading={busy}
                disabled={busy || item.isSoldOut || (isConnected && short > 0n) || (!useFree && !isPriceConfigured(price))}
                onClick={handleBuy}
                trailing={!busy && isConnected ? `${signatures} signature${signatures === 1 ? '' : 's'} · Base` : undefined}
              >
                {ctaLabel}
              </Button>
            </div>
          </>
        )}
      </Sheet>
      <WalletSheet open={walletOpen} onOpenChange={setWalletOpen} />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-mute">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function Toggle({ active, disabled, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`font-ui rounded-full px-3.5 py-2 text-[13px] transition-colors disabled:opacity-50 ${
        active ? 'bg-acc text-acc-fg font-bold' : 'border-2 border-line text-fg hover:border-mute'
      }`}
    >
      {children}
    </button>
  );
}
