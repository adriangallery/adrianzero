/**
 * Rejilla de la Shop (F8): 2 columnas en móvil, 3–4 en pantallas anchas.
 */

import { Package } from 'lucide-react';
import { Skeleton } from '@/ui';
import { ShopItemCard } from './ShopItemCard';
import type { ShopItem } from '../hooks/useShopItems';

interface ShopItemGridProps {
  items: ShopItem[];
  isLoading: boolean;
  emptyMessage?: string;
  onSelect: (item: ShopItem) => void;
}

export function ShopItemGrid({ items, isLoading, emptyMessage = 'Nothing here yet', onSelect }: ShopItemGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[12px] border-2 border-line bg-panel">
            <Skeleton className="aspect-square w-full" />
            <div className="flex flex-col gap-1.5 p-3">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="mb-4 h-12 w-12 text-mute" />
        <p className="font-ui text-[15px] text-fg">{emptyMessage}</p>
        <p className="mt-1 text-[13px] text-mute">Check back later for new drops</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" data-testid="shop-grid">
      {items.map((item) => (
        <ShopItemCard key={item.assetId} item={item} onSelect={onSelect} />
      ))}
    </div>
  );
}
