/**
 * ShopItemGrid Component
 * Grid layout for shop items
 */

import { ShopItemCard } from './ShopItemCard';
import type { ShopItem } from '../hooks/useShopItems';
import { Package } from 'lucide-react';

interface ShopItemGridProps {
  items: ShopItem[];
  isLoading: boolean;
  emptyMessage?: string;
}

export function ShopItemGrid({
  items,
  isLoading,
  emptyMessage = 'No items available',
}: ShopItemGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="aspect-square bg-muted shimmer" />
            <div className="p-2 space-y-1.5">
              <div className="h-3 bg-muted shimmer rounded" />
              <div className="h-3 bg-muted shimmer rounded w-2/3" />
              <div className="h-7 bg-muted shimmer rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="h-16 w-16 mb-4 text-muted-foreground" />
        <p className="text-lg font-medium text-foreground">{emptyMessage}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Check back later for new items
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <ShopItemCard key={item.assetId} item={item} />
      ))}
    </div>
  );
}
