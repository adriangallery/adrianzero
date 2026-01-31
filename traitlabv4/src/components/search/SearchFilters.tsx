/**
 * SearchFilters Component
 * Advanced search filters
 */

import { useState } from 'react';
import type { SearchFilters as ISearchFilters } from '@/features/search/types/search.types';
import { TRAIT_CATEGORIES } from '@/types/nft.types';

interface SearchFiltersProps {
  filters: ISearchFilters;
  onFiltersChange: (filters: ISearchFilters) => void;
  onSaveSearch: () => void;
}

export function SearchFilters({ filters, onFiltersChange, onSaveSearch }: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const clearFilters = () => {
    onFiltersChange({
      text: '',
      categories: [],
      minRarity: undefined,
      maxRarity: undefined,
      hasTraitsApplied: undefined,
      hasCustomName: undefined,
    });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.minRarity !== undefined ||
    filters.maxRarity !== undefined ||
    filters.hasTraitsApplied !== undefined ||
    filters.hasCustomName !== undefined;

  return (
    <div className="bg-card rounded-lg border border-border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-foreground hover:bg-muted transition-colors"
      >
        <span className="font-medium">Filters</span>
        <svg
          className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-border space-y-4">
          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Categories</label>
            <div className="grid grid-cols-2 gap-2">
              {TRAIT_CATEGORIES.map((category) => (
                <label
                  key={category}
                  className="flex items-center gap-2 cursor-pointer text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  {category}
                </label>
              ))}
            </div>
          </div>

          {/* Rarity Range */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Rarity (Max Supply)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minRarity || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    minRarity: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="px-3 py-2 bg-muted rounded-lg text-foreground"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxRarity || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    maxRarity: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="px-3 py-2 bg-muted rounded-lg text-foreground"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
              <input
                type="checkbox"
                checked={filters.hasTraitsApplied || false}
                onChange={(e) =>
                  onFiltersChange({ ...filters, hasTraitsApplied: e.target.checked })
                }
                className="rounded border-border text-primary focus:ring-primary"
              />
              Has Traits Applied
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
              <input
                type="checkbox"
                checked={filters.hasCustomName || false}
                onChange={(e) =>
                  onFiltersChange({ ...filters, hasCustomName: e.target.checked })
                }
                className="rounded border-border text-primary focus:ring-primary"
              />
              Has Custom Name
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="flex-1 px-3 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              Clear All
            </button>
            <button
              onClick={onSaveSearch}
              className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Save Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
