/**
 * SearchModule Component
 * Advanced search for all wallet assets (NFTs, Traits, Packs, Serums)
 */

import { useState, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Unplug, Search } from 'lucide-react';
import { useAdrianZeroTokens } from '@/features/adrianzero/hooks/useAdrianZeroTokens';
import { useTraits } from '@/features/traits/hooks/useTraits';
import { usePacks } from '@/features/packs/hooks/usePacks';
import { useSerums } from '@/features/serum/hooks/useSerums';
import { useSearch } from '../hooks/useSearch';
import { useSavedSearches } from '../hooks/useSavedSearches';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SavedSearches } from '@/components/search/SavedSearches';
import { NFTGrid } from '@/components/nft/NFTGrid';
import { TraitGrid } from '@/components/traits/TraitGrid';
import { ProgressiveLoadIndicator } from '@/components/common/ProgressiveLoadIndicator';
import { shouldOptimizeForTouch } from '@/lib/web3/utils/walletDetection';

type AssetType = 'all' | 'nfts' | 'traits' | 'packs' | 'serums';

export function SearchModule() {
  const { isConnected } = useAccount();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('all');
  const isTouchDevice = shouldOptimizeForTouch();

  // Load all asset types
  const {
    data: nfts = [],
    fetchNextPage: fetchNextNFTPage,
    hasNextPage: hasNextNFTPage,
    isFetchingNextPage: isFetchingNextNFTPage,
    loadedCount: loadedNFTCount,
    totalCount: totalNFTCount,
  } = useAdrianZeroTokens();
  const {
    data: traits = [],
    fetchNextPage: fetchNextTraitPage,
    hasNextPage: hasNextTraitPage,
    isFetchingNextPage: isFetchingNextTraitPage,
    loadedCount: loadedTraitCount,
    totalCount: totalTraitCount,
  } = useTraits();
  const { data: packs = [] } = usePacks();
  const { data: serums = [] } = useSerums();

  // Combine all assets with type tagging - using any to avoid complex type unions
  const allAssets = useMemo(() => {
    return [
      ...nfts.map(nft => ({ ...nft, assetType: 'nft' as const })),
      ...traits.map(trait => ({ ...trait, assetType: 'trait' as const })),
      ...packs.map(pack => ({ ...pack, assetType: 'pack' as const, tokenId: pack.packId })),
      ...serums.map(serum => ({ ...serum, assetType: 'serum' as const })),
    ] as any[];
  }, [nfts, traits, packs, serums]);

  // Filter by asset type
  const filteredAssets = useMemo(() => {
    if (assetType === 'all') return allAssets;
    const typeMap = { nfts: 'nft', traits: 'trait', packs: 'pack', serums: 'serum' };
    return allAssets.filter(asset => asset.assetType === typeMap[assetType]);
  }, [allAssets, assetType]);

  const { filters, setFilters, filteredItems, resultCount } = useSearch(filteredAssets as any);
  const { savedSearches, saveSearch, deleteSearch, loadSearch } = useSavedSearches();

  useEffect(() => {
    if (assetType !== 'nfts' || !filters.text) return;
    if (!hasNextNFTPage || isFetchingNextNFTPage) return;

    const minimumMatchCount = isTouchDevice ? 20 : 40;
    if (filteredItems.length < minimumMatchCount) {
      fetchNextNFTPage();
    }
  }, [assetType, filters.text, hasNextNFTPage, isFetchingNextNFTPage, filteredItems.length, isTouchDevice, fetchNextNFTPage]);

  useEffect(() => {
    if (assetType !== 'traits' || !filters.text) return;
    if (!hasNextTraitPage || isFetchingNextTraitPage) return;

    const minimumMatchCount = isTouchDevice ? 30 : 60;
    if (filteredItems.length < minimumMatchCount) {
      fetchNextTraitPage();
    }
  }, [assetType, filters.text, hasNextTraitPage, isFetchingNextTraitPage, filteredItems.length, isTouchDevice, fetchNextTraitPage]);

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
        <Unplug className="h-16 w-16 mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Wallet Not Connected</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Search</h1>
        <p className="text-muted-foreground mt-1">Find your assets with advanced filters</p>
      </div>

      {/* Asset Type Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setAssetType('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            assetType === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All Assets ({allAssets.length})
        </button>
        <button
          onClick={() => setAssetType('nfts')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            assetType === 'nfts'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          NFTs ({nfts.length})
        </button>
        <button
          onClick={() => setAssetType('traits')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            assetType === 'traits'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Traits ({traits.length})
        </button>
        <button
          onClick={() => setAssetType('packs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            assetType === 'packs'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Packs ({packs.length})
        </button>
        <button
          onClick={() => setAssetType('serums')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            assetType === 'serums'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Serums ({serums.length})
        </button>
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
            <Search className="h-16 w-16 mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">No results found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your search filters or selecting a different asset type
            </p>
          </div>
        ) : (
          <>
            {assetType === 'nfts' && (
              <>
                <NFTGrid
                  tokens={filteredItems as any}
                  onEndReached={() => {
                    if (!filters.text && hasNextNFTPage && !isFetchingNextNFTPage) {
                      fetchNextNFTPage();
                    }
                  }}
                />
                {!filters.text && totalNFTCount > 0 && (
                  <div className="mt-4">
                    <ProgressiveLoadIndicator
                      loadedCount={loadedNFTCount}
                      totalCount={totalNFTCount}
                      isLoading={isFetchingNextNFTPage}
                    />
                  </div>
                )}
              </>
            )}
            {assetType === 'traits' && (
              <>
                <TraitGrid
                  traits={filteredItems as any}
                  selectedTraitIds={[]}
                  onTraitSelect={() => {}}
                  onEndReached={() => {
                    if (!filters.text && hasNextTraitPage && !isFetchingNextTraitPage) {
                      fetchNextTraitPage();
                    }
                  }}
                />
                {!filters.text && totalTraitCount > 0 && (
                  <div className="mt-4">
                    <ProgressiveLoadIndicator
                      loadedCount={loadedTraitCount}
                      totalCount={totalTraitCount}
                      isLoading={isFetchingNextTraitPage}
                    />
                  </div>
                )}
              </>
            )}
            {(assetType === 'packs' || assetType === 'serums') && (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredItems.map((item: any) => (
                  <div key={item.tokenId || item.packId} className="bg-card rounded-lg p-4 border border-border">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {item.assetType}
                    </p>
                    {item.balance && (
                      <p className="text-xs text-muted-foreground">
                        Balance: {item.balance}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {assetType === 'all' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">NFTs</h3>
                  <NFTGrid tokens={filteredItems.filter((item: any) => item.assetType === 'nft') as any} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Traits</h3>
                  <TraitGrid
                    traits={filteredItems.filter((item: any) => item.assetType === 'trait') as any}
                    selectedTraitIds={[]}
                    onTraitSelect={() => {}}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
