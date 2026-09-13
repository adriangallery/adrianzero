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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="rounded-[12px] border-2 border-line bg-panel overflow-hidden">
            <div className="aspect-square bg-bg shimmer" />
            <div className="p-2 space-y-1.5">
              <div className="h-3 bg-bg shimmer rounded" />
              <div className="h-3 bg-bg shimmer rounded w-2/3" />
              <div className="h-7 bg-bg shimmer rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="h-16 w-16 mb-4 text-mute" />
        <p className="text-lg font-medium text-fg">{emptyMessage}</p>
        <p className="text-sm text-mute mt-2">
          Check back later for new items
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <ShopItemCard key={item.assetId} item={item} />
      ))}
    </div>
  );
}
