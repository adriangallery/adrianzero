/**
 * SearchModule Component
 * Advanced search for NFTs and traits
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useAdrianZeroTokens } from '@/features/adrianzero/hooks/useAdrianZeroTokens';
import { useSearch } from '../hooks/useSearch';
import { useSavedSearches } from '../hooks/useSavedSearches';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SavedSearches } from '@/components/search/SavedSearches';
import { NFTGrid } from '@/components/nft/NFTGrid';

export function SearchModule() {
  const { isConnected } = useAccount();
  const { data: nfts = [] } = useAdrianZeroTokens();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');

  const { filters, setFilters, filteredItems, resultCount } = useSearch(nfts);
  const { savedSearches, saveSearch, deleteSearch, loadSearch } = useSavedSearches();

  const handleSaveSearch = () => {
    if (searchName.trim()) {
      saveSearch(searchName.trim(), filters);
      setSearchName('');
      setShowSaveDialog(false);
    } else {
      setShowSaveDialog(true);
    }
  };

  const handleLoadSearch = (id: string) => {
    const loadedFilters = loadSearch(id);
    if (loadedFilters) {
      setFilters(loadedFilters);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🔌</div>
        <h2 className="text-xl font-semibold text-foreground">Wallet Not Connected</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Search</h1>
        <p className="text-muted-foreground mt-1">Find your NFTs with advanced filters</p>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={filters.text}
        onChange={(text) => setFilters({ ...filters, text })}
        placeholder="Search by name or token ID..."
      />

      {/* Filters and Saved Searches */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <SearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onSaveSearch={handleSaveSearch}
          />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">Saved Searches</h3>
          <SavedSearches
            searches={savedSearches}
            onLoad={handleLoadSearch}
            onDelete={deleteSearch}
          />
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="bg-card rounded-lg p-4 border border-border">
          <label className="block text-sm font-medium text-foreground mb-2">
            Save this search
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Enter search name..."
              className="flex-1 px-3 py-2 bg-muted rounded-lg text-foreground"
            />
            <button
              onClick={handleSaveSearch}
              disabled={!searchName.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          {resultCount} {resultCount === 1 ? 'result' : 'results'} found
        </p>

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-lg font-medium text-foreground">No results found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your search filters
            </p>
          </div>
        ) : (
          <NFTGrid tokens={filteredItems} />
        )}
      </div>
    </div>
  );
}
