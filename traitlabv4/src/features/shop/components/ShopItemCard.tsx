/**
 * ShopItemCard Component
 * Individual item card in the shop — shows dual pricing ($ZERO / $ADRIAN)
 */

import { Plus, Minus, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { type ShopItem } from '../hooks/useShopItems';
import { getFallbackImageUrl } from '../hooks/useShopItems';
import { useShopStore } from '../store/shopStore';
import { Badge } from '@/ui';

interface ShopItemCardProps {
  item: ShopItem;
}

// uint128 max — ShopFacet returns this when no price is set
const UINT128_MAX = BigInt('340282366920938463463374607431768211455');

// Check if price is a real configured price (not max/unset)
export function isPriceConfigured(price: bigint): boolean {
  return price > BigInt(0) && price < UINT128_MAX;
}

// Helper to format price
function formatPrice(price: bigint): string {
  if (!isPriceConfigured(price)) return '—';
  const formatted = Number(price) / 1e18;
  if (formatted >= 1000000) {
    return `${(formatted / 1000000).toFixed(1)}M`;
  }
  if (formatted >= 1000) {
    return `${(formatted / 1000).toFixed(1)}K`;
  }
  if (formatted < 1 && formatted > 0) {
    return formatted.toFixed(2);
  }
  return formatted.toLocaleString();
}

export function ShopItemCard({ item }: ShopItemCardProps) {
  const { cart, addToCart, removeFromCart, updateQuantity, paymentToken } = useShopStore();

  const cartItem = cart.find((i) => i.assetId === item.assetId);
  const quantityInCart = cartItem?.quantity ?? 0;

  const hasFreeAvailable = item.freeRemaining > 0;
  const activePrice = paymentToken === 'ZERO' ? item.priceZero : item.priceAdrian;
  const priceFormatted = formatPrice(activePrice);
  const tokenSymbol = paymentToken === 'ZERO' ? '$ZERO' : '$ADRIAN';

  // Check if this item accepts the selected payment token (uint128.max = not configured)
  const tokenAccepted = isPriceConfigured(activePrice);

  const handleAdd = () => {
    addToCart({
      assetId: item.assetId,
      priceZero: item.priceZero,
      priceAdrian: item.priceAdrian,
      useFree: false,
      name: item.name,
      imageUrl: item.imageUrl,
    });
  };

  const handleAddFree = () => {
    addToCart({
      assetId: item.assetId,
      priceZero: item.priceZero,
      priceAdrian: item.priceAdrian,
      useFree: true,
      name: item.name,
      imageUrl: item.imageUrl,
    });
  };

  const handleRemove = () => {
    if (quantityInCart <= 1) {
      removeFromCart(item.assetId);
    } else {
      updateQuantity(item.assetId, quantityInCart - 1);
    }
  };

  const remaining = item.quantityAvailable - item.sold;
  const isSoldOut = item.isSoldOut || remaining <= 0;
  const canAddToCart = !isSoldOut && tokenAccepted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => {
        if (quantityInCart === 0 && canAddToCart) {
          handleAdd();
        }
      }}
      className={`
        relative rounded-[12px] border-2 border-line bg-panel overflow-hidden
        transition-all hover:border-mute
        ${!canAddToCart ? 'opacity-60' : 'cursor-pointer'}
      `}
    >
      {/* Image — bg-line (F3.6: bg-bg era tan oscuro como el panel, no
          arreglaba nada) para que un trait de arte oscuro (p.ej. "Dark
          Mode") no desaparezca: no era 404/CORS (200, PNG real 600x600),
          solo bajo contraste. */}
      <div className="aspect-square relative bg-line">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-contain"
          loading="lazy"
          onError={(e) => {
            const fallback = getFallbackImageUrl(item.assetId);
            if (e.currentTarget.src !== fallback) {
              e.currentTarget.src = fallback;
            }
          }}
        />

        {/* Free badge */}
        {hasFreeAvailable && (
          <Badge tone="ok" className="absolute top-1.5 left-1.5 bg-bg">
            <Gift className="h-3 w-3" />
            {item.freeRemaining} FREE
          </Badge>
        )}

        {/* Sold out banner */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-bg/80 flex items-center justify-center">
            <div className="w-full bg-bad py-2 text-center">
              <span className="font-ui text-acc-fg font-bold text-xs tracking-widest uppercase">SOLD OUT</span>
            </div>
          </div>
        )}

        {/* Quantity in cart */}
        {quantityInCart > 0 && (
          <div className="font-ui absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-acc flex items-center justify-center text-acc-fg font-bold text-xs">
            {quantityInCart}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2">
        {/* Name */}
        <p className="font-ui text-[12px] font-medium text-fg line-clamp-2 leading-tight min-h-[2.2em]">
          {item.name}
        </p>

        {/* Price — $ZERO grande en Pixelify, el equivalente en $ADRIAN chico y mute */}
        <div>
          {tokenAccepted ? (
            <div className="font-ui text-[15px] font-bold text-acc">
              {priceFormatted} <span className="text-[11px] font-normal">{tokenSymbol}</span>
            </div>
          ) : (
            <div className="text-[11px] text-mute italic">
              Not available with {tokenSymbol}
            </div>
          )}
          {/* Show the other price if both exist */}
          {item.priceZero > BigInt(0) && item.priceAdrian > BigInt(0) && (
            <div className="text-[11px] text-mute">
              {paymentToken === 'ZERO'
                ? `or ${formatPrice(item.priceAdrian)} $ADRIAN`
                : `or ${formatPrice(item.priceZero)} $ZERO`
              }
            </div>
          )}
        </div>

        {/* Availability */}
        <div className="text-[11px] text-mute">
          {isSoldOut ? 'Sold out' : `${remaining} left`}
        </div>

        {/* Actions — stepper con altura mínima 44px (tamaño md del sistema) */}
        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          {quantityInCart > 0 ? (
            <>
              <button
                onClick={handleRemove}
                className="flex-1 h-11 flex items-center justify-center rounded-[var(--r-md)] border-2 border-line text-fg hover:border-mute transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-ui flex items-center justify-center px-2 min-w-[28px] text-[15px] font-bold text-fg">
                {quantityInCart}
              </span>
              <button
                onClick={handleAdd}
                disabled={isSoldOut}
                className="flex-1 h-11 flex items-center justify-center rounded-[var(--r-md)] bg-acc text-acc-fg hover:opacity-90 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              {hasFreeAvailable && (
                <button
                  onClick={handleAddFree}
                  className="font-ui flex-1 h-11 flex items-center justify-center gap-1 rounded-[var(--r-md)] bg-ok text-acc-fg text-[13px] font-bold transition-colors"
                >
                  <Gift className="h-3.5 w-3.5" />
                  Free
                </button>
              )}
              <button
                onClick={handleAdd}
                disabled={!canAddToCart}
                className={`font-ui flex-1 h-11 flex items-center justify-center gap-1 rounded-[var(--r-md)] bg-acc text-acc-fg text-[13px] font-bold transition-colors disabled:opacity-50 ${
                  hasFreeAvailable ? '' : 'w-full'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
