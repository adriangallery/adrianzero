/**
 * TraitGrid Component
 * Responsive grid for displaying traits with virtualization on mobile
 */

import { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Palette } from 'lucide-react';
import { TraitCard } from './TraitCard';
import type { Trait } from '@/types/nft.types';
import { shouldOptimizeForTouch } from '@/lib/web3/utils/walletDetection';

interface TraitGridProps {
  traits: Trait[];
  selectedTraitIds: string[];
  onTraitSelect?: (trait: Trait) => void;
  onEndReached?: () => void;
  emptyMessage?: string;
}

export function TraitGrid({
  traits,
  selectedTraitIds,
  onTraitSelect,
  onEndReached,
  emptyMessage = 'No traits found',
}: TraitGridProps) {
  const isMobile = shouldOptimizeForTouch();

  // Group traits into rows for virtualization
  const rows = useMemo(() => {
    const itemsPerRow = isMobile ? 3 : 4;
    const result: Trait[][] = [];

    for (let i = 0; i < traits.length; i += itemsPerRow) {
      result.push(traits.slice(i, i + itemsPerRow));
    }

    return result;
  }, [traits, isMobile]);

  if (traits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Palette className="h-16 w-16 mb-4 text-muted-foreground" />
        <p className="text-lg font-medium text-foreground">{emptyMessage}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try selecting a different category
        </p>
      </div>
    );
  }

  // Use virtualization on mobile for better performance
  // Key forces remount when traits change to avoid stale data
  const virtuosoKey = traits.map(t => t.tokenId).join('-').slice(0, 100);

  if (isMobile && traits.length > 20) {
    return (
      <Virtuoso
        key={virtuosoKey}
        style={{ height: 'calc(100vh - 220px)' }}
        totalCount={rows.length}
        data={rows}
        endReached={() => onEndReached?.()}
        itemContent={(_index, row) => {
          return (
            <div className="grid grid-cols-3 gap-2 mb-2 px-1">
              {row.map((trait) => (
                <TraitCard
                  key={trait.tokenId}
                  trait={trait}
                  isSelected={selectedTraitIds.includes(trait.tokenId)}
                  onClick={() => onTraitSelect?.(trait)}
                />
              ))}
            </div>
          );
        }}
      />
    );
  }

  // Regular grid for desktop or small collections
  // Use key to force remount when traits change
  const gridKey = `grid-${traits.length}-${traits[0]?.tokenId || 'empty'}`;

  // p-1 -m-1 prevents ring-2/shadow clipping on edge cards
  return (
    <div
      key={gridKey}
      className="grid gap-2 sm:gap-3 grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 p-1 -m-1"
    >
      {traits.map((trait) => (
        <TraitCard
          key={trait.tokenId}
          trait={trait}
          isSelected={selectedTraitIds.includes(trait.tokenId)}
          onClick={() => onTraitSelect?.(trait)}
        />
      ))}
    </div>
  );
}
