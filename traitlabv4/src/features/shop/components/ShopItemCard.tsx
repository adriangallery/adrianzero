/**
 * ShopItemCard Component
 * Individual item card in the shop — shows dual pricing ($ZERO / $ADRIAN)
 */

import { Plus, Minus, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { type ShopItem } from '../hooks/useShopItems';
import { getFallbackImageUrl } from '../hooks/useShopItems';
import { useShopStore } from '../store/shopStore';

interface ShopItemCardProps {
  item: ShopItem;
}

// Helper to format price
function formatPrice(price: bigint): string {
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

  // Check if this item accepts the selected payment token
  const tokenAccepted = activePrice > BigInt(0);

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
        relative rounded-xl border border-border bg-card overflow-hidden
        transition-all hover:border-primary/50 hover:shadow-lg
        ${!canAddToCart ? 'opacity-60' : 'cursor-pointer'}
      `}
    >
      {/* Image */}
      <div className="aspect-square relative bg-muted">
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
          <div className="absolute top-1 left-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-success text-white text-[10px] font-bold">
            <Gift className="h-3 w-3" />
            {item.freeRemaining} FREE
          </div>
        )}

        {/* Sold out banner */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-full bg-red-600 py-2 text-center rotate-0">
              <span className="text-white font-black text-sm tracking-widest uppercase">SOLD OUT</span>
            </div>
          </div>
        )}

        {/* Quantity in cart */}
        {quantityInCart > 0 && (
          <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
            {quantityInCart}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        {/* Name */}
        <p className="text-[11px] font-medium text-foreground line-clamp-2 leading-tight min-h-[2.2em]">
          {item.name}
        </p>

        {/* Price — show active token price, secondary in smaller text */}
        <div>
          {tokenAccepted ? (
            <div className="text-[11px] font-bold text-accent">
              {priceFormatted} {tokenSymbol}
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground italic">
              Not available with {tokenSymbol}
            </div>
          )}
          {/* Show the other price if both exist */}
          {item.priceZero > BigInt(0) && item.priceAdrian > BigInt(0) && (
            <div className="text-[9px] text-muted-foreground">
              {paymentToken === 'ZERO'
                ? `or ${formatPrice(item.priceAdrian)} $ADRIAN`
                : `or ${formatPrice(item.priceZero)} $ZERO`
              }
            </div>
          )}
        </div>

        {/* Availability */}
        <div className="text-[10px] text-muted-foreground">
          {isSoldOut ? 'Sold out' : `${remaining} left`}
        </div>

        {/* Actions */}
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {quantityInCart > 0 ? (
            <>
              <button
                onClick={handleRemove}
                className="flex-1 flex items-center justify-center py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="flex items-center justify-center px-2 text-sm font-bold text-foreground">
                {quantityInCart}
              </span>
              <button
                onClick={handleAdd}
                disabled={isSoldOut}
                className="flex-1 flex items-center justify-center py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
              </button>
            </>
          ) : (
            <>
              {hasFreeAvailable && (
                <button
                  onClick={handleAddFree}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-success hover:bg-success/90 text-white text-xs font-medium transition-colors"
                >
                  <Gift className="h-3 w-3" />
                  Free
                </button>
              )}
              <button
                onClick={handleAdd}
                disabled={!canAddToCart}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors disabled:opacity-50 ${
                  hasFreeAvailable ? '' : 'w-full'
                }`}
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
