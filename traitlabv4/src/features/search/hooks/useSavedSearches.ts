/**
 * useSavedSearches Hook
 * Manage saved searches in localStorage
 */

import { useState, useEffect } from 'react';
import type { SavedSearch, SearchFilters } from '../types/search.types';

const STORAGE_KEY = 'traitlab-saved-searches';

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedSearches(parsed);
      } catch (error) {
        console.error('Failed to parse saved searches:', error);
      }
    }
  }, []);

  const saveSearch = (name: string, filters: SearchFilters) => {
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      filters,
      createdAt: new Date(),
    };

    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteSearch = (id: string) => {
    const updated = savedSearches.filter((search) => search.id !== id);
    setSavedSearches(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const loadSearch = (id: string): SearchFilters | null => {
    const search = savedSearches.find((s) => s.id === id);
    return search ? search.filters : null;
  };

  return {
    savedSearches,
    saveSearch,
    deleteSearch,
    loadSearch,
  };
}
