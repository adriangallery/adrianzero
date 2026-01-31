/**
 * useSearch Hook
 * Search and filter NFTs and traits
 */

import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { SearchFilters } from '../types/search.types';
import type { AdrianZeroToken, Trait } from '@/types/nft.types';

export function useSearch<T extends AdrianZeroToken | Trait>(items: T[]) {
  const [filters, setFilters] = useState<SearchFilters>({
    text: '',
    categories: [],
  });

  const debouncedText = useDebounce(filters.text, 300);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Text search
      if (debouncedText) {
        const searchText = debouncedText.toLowerCase();
        const itemName = ('name' in item ? item.name || '' : '').toLowerCase();
        const itemId = item.tokenId.toLowerCase();

        if (!itemName.includes(searchText) && !itemId.includes(searchText)) {
          return false;
        }
      }

      // Category filter (for traits)
      if (filters.categories.length > 0 && 'category' in item) {
        if (!filters.categories.includes(item.category)) {
          return false;
        }
      }

      // Rarity filter (for traits)
      if ('maxSupply' in item) {
        const supply = item.maxSupply || 0;
        if (filters.minRarity !== undefined && supply < filters.minRarity) {
          return false;
        }
        if (filters.maxRarity !== undefined && supply > filters.maxRarity) {
          return false;
        }
      }

      // Traits applied filter (for NFTs)
      if (filters.hasTraitsApplied !== undefined && 'appliedTraits' in item) {
        const hasTraits = (item.appliedTraits?.length || 0) > 0;
        if (filters.hasTraitsApplied !== hasTraits) {
          return false;
        }
      }

      // Custom name filter (for NFTs)
      if (filters.hasCustomName !== undefined && 'name' in item) {
        const hasCustomName = !!item.name && !item.name.startsWith('AdrianZERO #');
        if (filters.hasCustomName !== hasCustomName) {
          return false;
        }
      }

      return true;
    });
  }, [items, debouncedText, filters]);

  return {
    filters,
    setFilters,
    filteredItems,
    resultCount: filteredItems.length,
  };
}
