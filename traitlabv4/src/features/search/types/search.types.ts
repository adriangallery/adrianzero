/**
 * Search Types
 */

export interface SearchFilters {
  text: string;
  categories: string[];
  minRarity?: number;
  maxRarity?: number;
  hasTraitsApplied?: boolean;
  hasCustomName?: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: Date;
}
