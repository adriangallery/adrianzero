/**
 * Tarjeta de la Shop (F8): imagen, nombre, precio y stock. Un toque abre la
 * hoja de compra (PurchaseSheet) — sin stepper ni carrito en la tarjeta
 * (maqueta Shop.dc.html: «lo que cuesta, lo que va a pasar, un botón»).
 */

import { Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/ui';
import type { ShopItem } from '../hooks/useShopItems';
import { getFallbackImageUrl } from '../hooks/useShopItems';
import { formatPrice, isPriceConfigured } from '../lib/format';

export { isPriceConfigured } from '../lib/format';

interface ShopItemCardProps {
  item: ShopItem;
  onSelect: (item: ShopItem) => void;
}

export function ShopItemCard({ item, onSelect }: ShopItemCardProps) {
  const remaining = Math.max(0, item.quantityAvailable - item.sold);
  const isSoldOut = item.isSoldOut || remaining <= 0;
  const hasFree = item.freeRemaining > 0;
  const zero = isPriceConfigured(item.priceZero);
  const adrian = isPriceConfigured(item.priceAdrian);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(item)}
      disabled={isSoldOut}
      aria-label={`${item.name}, ${isSoldOut ? 'sold out' : `${formatPrice(zero ? item.priceZero : item.priceAdrian)} ${zero ? 'ZERO' : 'ADRIAN'}`}`}
      className={`relative flex flex-col overflow-hidden rounded-[12px] border-2 border-line bg-panel text-left transition-colors hover:border-mute disabled:cursor-default ${
        isSoldOut ? 'opacity-60' : ''
      }`}
    >
      {/* Imagen — bg-line (F3.6) para que el arte oscuro no desaparezca */}
      <div className="relative aspect-square w-full bg-line">
        <img
          src={item.imageUrl}
          alt=""
          className="h-full w-full object-contain"
          loading="lazy"
          onError={(e) => {
            const fallback = getFallbackImageUrl(item.assetId);
            if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
          }}
        />
        {hasFree ? (
          <Badge tone="ok" className="absolute left-1.5 top-1.5 bg-bg">
            <Gift className="h-3 w-3" />
            {item.freeRemaining} FREE
          </Badge>
        ) : null}
        {isSoldOut ? (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/80">
            <div className="w-full bg-bad py-2 text-center">
              <span className="font-ui text-xs font-bold uppercase tracking-widest text-acc-fg">SOLD OUT</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1 p-3">
        <p className="font-ui min-h-[2.2em] text-[12px] font-medium leading-tight text-fg line-clamp-2">{item.name}</p>
        {zero ? (
          <p className="font-ui text-[15px] font-bold text-acc">
            {formatPrice(item.priceZero)} <span className="text-[11px] font-normal">ZERO</span>
          </p>
        ) : adrian ? (
          <p className="font-ui text-[15px] font-bold text-acc">
            {formatPrice(item.priceAdrian)} <span className="text-[11px] font-normal">ADRIAN</span>
          </p>
        ) : (
          <p className="text-[12px] italic text-mute">Not for sale</p>
        )}
        <p className="text-[11px] text-mute">
          {isSoldOut ? 'Sold out' : item.quantityAvailable > 0 ? `${remaining} of ${item.quantityAvailable} left` : `${remaining} left`}
        </p>
      </div>
    </motion.button>
  );
}
