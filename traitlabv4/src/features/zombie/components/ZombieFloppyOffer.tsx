/**
 * Upsell after (and beside) the AZombie mint: the ZOMBIE floppy — a ZERO LAB
 * pack with 3 random zombie traits, sold by the Diamond ShopFacet. The purchase
 * itself is the shop's PurchaseSheet (approve $ZERO + purchaseItems), untouched.
 * Hidden unless the item is active on the shop.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatUnits } from 'viem';
import { Minus, Plus } from 'lucide-react';
import { ZOMBIE_FLOPPY_ID } from '@/config/zombie';
import { useShopItem, type ShopItem } from '@/features/shop/hooks/useShopItems';
import { PurchaseSheet } from '@/features/shop/components/PurchaseSheet';
import { isPriceConfigured } from '@/features/shop/lib/format';

const COVER_FALLBACK = '/zombie/cabinet.gif';
const MAX_QTY = 5;

function onSale(item: ShopItem | null): item is ShopItem {
  if (!item || !item.active || item.isSoldOut || !isPriceConfigured(item.priceZero)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (item.startTime > 0 && now < item.startTime) return false;
  if (item.endTime > 0 && now > item.endTime) return false;
  return true;
}

function priceLabel(price: bigint): string {
  return `${Number(formatUnits(price, 18)).toLocaleString('en-US')} $ZERO`;
}

function Cover({ item, className }: { item: ShopItem; className: string }) {
  return (
    <img
      src={item.imageUrl}
      alt="ZOMBIE floppy"
      className={`az-pixel object-contain ${className}`}
      onError={(e) => {
        if (!e.currentTarget.src.endsWith(COVER_FALLBACK)) e.currentTarget.src = COVER_FALLBACK;
      }}
    />
  );
}

export function ZombieFloppyOffer({ compact = false }: { compact?: boolean }) {
  const { item, refetch } = useShopItem(ZOMBIE_FLOPPY_ID);
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);

  if (!onSale(item)) return null;

  const left = Math.max(0, item.quantityAvailable - item.sold);
  const perWallet = item.maxPerWallet > 0 ? Math.max(0, item.maxPerWallet - item.userPurchases) : MAX_QTY;
  const cap = Math.max(1, Math.min(MAX_QTY, left || MAX_QTY, perWallet));

  const sheet = (
    <PurchaseSheet item={item} open={open} onOpenChange={setOpen} onPurchased={() => refetch()} initialQty={compact ? 1 : qty} />
  );

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-3 border-2 border-[var(--az-line)] bg-black/60 p-2">
          <Cover item={item} className="h-11 w-11 flex-none" />
          <p className="az-ui min-w-0 flex-1 text-[12px] leading-tight text-[var(--az-fg)]">
            <span className="text-[var(--az-g)]">ZOMBIE floppy</span> · 3 random zombie traits for any ZERO ·{' '}
            {priceLabel(item.priceZero)}
          </p>
          <button type="button" onClick={() => setOpen(true)} className="az-btn az-btn-sm flex-none">
            Buy
          </button>
        </div>
        {sheet}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 border-2 border-[var(--az-g)] bg-black p-4 text-left">
        <div className="flex items-center gap-3">
          <Cover item={item} className="h-20 w-20 flex-none" />
          <div className="min-w-0">
            <p className="az-display text-[12px] leading-relaxed text-[var(--az-g)]">ARM YOUR ZOMBIE</p>
            <p className="az-ui text-[14px] text-[var(--az-fg)]">ZOMBIE floppy · 3 random zombie traits</p>
            <p className="az-ui text-[13px] text-[var(--az-dim)]">{priceLabel(item.priceZero)} each</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1" aria-label="Quantity">
            <button type="button" aria-label="Less" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))} className="az-btn az-btn-sq">
              <Minus className="h-4 w-4" />
            </button>
            <span className="az-ui min-w-[28px] text-center text-[16px] font-bold">{qty}</span>
            <button type="button" aria-label="More" disabled={qty >= cap} onClick={() => setQty((q) => Math.min(cap, q + 1))} className="az-btn az-btn-sq">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button type="button" onClick={() => setOpen(true)} className="az-btn az-btn-primary flex-1">
            Buy {qty}
          </button>
        </div>
        <Link to="/packs" className="az-ui text-center text-[13px] text-[var(--az-dim)] underline underline-offset-4 hover:text-[var(--az-g)]">
          Open it in TraitLab
        </Link>
      </div>
      {sheet}
    </>
  );
}
