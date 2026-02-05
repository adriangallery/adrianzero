/**
 * ShopItemCard Component
 * Individual item card in the shop
 */

import { Plus, Minus, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { type ShopItem, getFallbackImageUrl } from '../hooks/useShopItems';
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
  return formatted.toLocaleString();
}

export function ShopItemCard({ item }: ShopItemCardProps) {
  const { cart, addToCart, removeFromCart, updateQuantity } = useShopStore();

  const cartItem = cart.find((i) => i.assetId === item.assetId);
  const quantityInCart = cartItem?.quantity ?? 0;

  const hasFreeAvailable = item.freeRemaining > 0;
  const priceFormatted = formatPrice(item.price);

  const handleAdd = () => {
    addToCart({
      assetId: item.assetId,
      price: item.price,
      useFree: false,
      name: item.name,
      imageUrl: item.imageUrl,
    });
  };

  const handleAddFree = () => {
    addToCart({
      assetId: item.assetId,
      price: item.price,
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

  const isOutOfStock = item.quantityAvailable <= 0;
  const isQuantityError = item.purchaseError === 'Insufficient quantity' ||
    item.purchaseError === 'TraitsCore supply exceeded';
  const isSoldOut = (isOutOfStock && item.sold > 0) || isQuantityError;

  // "Insufficient balance" from contract means no approval yet, not actually out of funds.
  // Allow adding to cart — approval happens at checkout.
  const isApprovalError =
    item.purchaseError === 'Insufficient balance' ||
    item.purchaseError === 'Insufficient allowance';
  const canAddToCart = item.canPurchase || isApprovalError;
  // Don't show raw error text — we show SOLD OUT overlay instead for quantity errors
  const showError = !canAddToCart && !isQuantityError && !isApprovalError && !!item.purchaseError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative rounded-xl border border-border bg-card overflow-hidden
        transition-all hover:border-primary/50 hover:shadow-lg
        ${isOutOfStock && !canAddToCart ? 'opacity-60' : ''}
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

        {/* Sold out badge */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-sm">SOLD OUT</span>
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
      <div className="p-2 space-y-1">
        {/* Name */}
        <p className="text-xs font-medium text-foreground truncate">
          {item.name}
        </p>

        {/* Price + availability */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold text-accent truncate">
            {priceFormatted} $ADRIAN
          </span>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {item.quantityAvailable} left
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
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
                disabled={isOutOfStock}
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

        {/* Error message — only for truly blocking errors */}
        {showError && (
          <p className="text-[10px] text-destructive text-center truncate">
            {item.purchaseError}
          </p>
        )}
      </div>
    </motion.div>
  );
}
