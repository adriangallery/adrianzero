/**
 * TraitGrid Component
 * Responsive grid for displaying traits with virtualization on mobile
 * F3.5 (13-sep-2026): Virtuoso necesita un alto explícito para virtualizar
 * (no puede vivir en un contenedor auto-height) — antes era un
 * `calc(100vh-220px)` sin explicar, tallado para el header viejo y ya
 * desfasado con el header D17. Ahora se expresa con los tokens reales
 * (--header-h, --tabbar-h); el único residual (56px) es la barra sticky de
 * categorías + su padding, documentado en vez de un "220" sin más. gap-3
 * (12px) y nombre en 2 líneas (Card F3.5 en TraitCard).
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

// header + tabbar (tokens reales) + barra sticky de categorías encima de la
// rejilla (~56px: chip row + padding) — el único número "mágico" que queda,
// y ahora con nombre.
const CATEGORIES_BAR_H = '56px';
const VIRTUOSO_HEIGHT = `calc(100vh - var(--header-h) - var(--tabbar-h) - ${CATEGORIES_BAR_H})`;

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
        <Palette className="h-16 w-16 mb-4 text-mute" />
        <p className="text-lg font-medium text-fg">{emptyMessage}</p>
        <p className="text-sm text-mute mt-2">
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
        style={{ height: VIRTUOSO_HEIGHT }}
        totalCount={rows.length}
        data={rows}
        endReached={() => onEndReached?.()}
        itemContent={(_index, row) => {
          return (
            <div className="grid grid-cols-3 gap-3 mb-3 px-1">
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
      className="grid gap-3 grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 pb-[calc(var(--tabbar-h)+16px)]"
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
