/**
 * AdrianZeroModule Component
 * Main module for viewing and managing AdrianZERO NFTs
 * V4.3: Unified inline layout with collapsible preview (like TraitsModule)
 */

import { useState, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { AlertTriangle, ChevronUp, ChevronDown, X, Frame, Check } from 'lucide-react';
import { NFTGrid } from '@/components/nft/NFTGrid';
import { TraitCategories } from '@/components/traits/TraitCategories';
import { TraitGrid } from '@/components/traits/TraitGrid';
import { useAdrianZeroTokens } from '../hooks/useAdrianZeroTokens';
import { useCustomNames } from '../hooks/useCustomNames';
import { useAdrianZeroStore } from '../store/adrianZeroStore';
import { useTraitsByCategory, useTraitCategories } from '@/features/traits/hooks/useTraits';
import { useApplyTraits } from '@/features/traits/hooks/useApplyTraits';
import { useTraitsStore } from '@/features/traits/store/traitsStore';
import { vercelImageService } from '@/lib/api/vercel/imageService';
import type { TraitCategory, Trait } from '@/types/nft.types';

export function AdrianZeroModule() {
  const { isConnected } = useAccount();
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isNFTPreviewExpanded, setIsNFTPreviewExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TraitCategory | 'ALL'>('ALL');
  const [isTraitPreviewExpanded, setIsTraitPreviewExpanded] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Load tokens
  const { data: tokens = [], isLoading, error } = useAdrianZeroTokens();

  // Load custom names
  const tokenIds = tokens.map((t) => t.tokenId);
  const { data: customNames = {} } = useCustomNames(tokenIds);

  // Merge custom names with tokens
  const tokensWithNames = useMemo(() => {
    return tokens.map((token) => ({
      ...token,
      name: customNames[token.tokenId] || token.name,
    }));
  }, [tokens, customNames]);

  // Store
  const { setSelectedToken, sortBy, sortOrder } = useAdrianZeroStore();

  // Load traits
  const { data: traitsByCategory, allTraits, isLoading: traitsLoading } = useTraitsByCategory();
  const categories = useTraitCategories();

  // Trait selection store
  const {
    selectTrait,
    deselectTrait,
    getSelectedTraitsArray,
    getSelectedTraitIds,
    isTraitSelected,
    clearSelection,
  } = useTraitsStore();

  // Apply traits mutation
  const applyTraits = useApplyTraits();

  // Sort tokens
  const sortedTokens = useMemo(() => {
    const sorted = [...tokensWithNames];

    sorted.sort((a, b) => {
      if (sortBy === 'tokenId') {
        const comparison = parseInt(a.tokenId) - parseInt(b.tokenId);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else if (sortBy === 'name') {
        const nameA = a.name || `#${a.tokenId}`;
        const nameB = b.name || `#${b.tokenId}`;
        const comparison = nameA.localeCompare(nameB);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      return 0;
    });

    return sorted;
  }, [tokensWithNames, sortBy, sortOrder]);

  // Get traits for active category
  const displayTraits = useMemo(() => {
    if (activeCategory === 'ALL') {
      return allTraits;
    }
    return traitsByCategory[activeCategory] || [];
  }, [activeCategory, allTraits, traitsByCategory]);

  const selectedTraits = getSelectedTraitsArray();
  const selectedTraitIds = getSelectedTraitIds();

  // Auto-expand NFT preview when selected
  useEffect(() => {
    if (selectedNFT) {
      setIsNFTPreviewExpanded(true);
    }
  }, [selectedNFT]);

  // Auto-expand trait preview when traits are selected
  useEffect(() => {
    if (selectedTraits.length > 0 && selectedNFT) {
      setIsTraitPreviewExpanded(true);
      // Generate preview URL
      setIsPreviewLoading(true);
      const url = vercelImageService.generateCombinedImageUrl({
        tokenId: selectedNFT.tokenId,
        traitIds: selectedTraitIds,
      });
      setPreviewImageUrl(url);
      // Preload
      vercelImageService.preloadImage(url).finally(() => {
        setIsPreviewLoading(false);
      });
    } else if (selectedTraits.length === 0) {
      setIsTraitPreviewExpanded(false);
      setPreviewImageUrl('');
    }
  }, [selectedTraits.length, selectedTraitIds.join(','), selectedNFT?.tokenId]);

  // Handlers
  const handleTokenSelect = (token: any) => {
    if (selectedNFT?.tokenId === token.tokenId) {
      // Deselect if same token clicked
      setSelectedNFT(null);
      setSelectedToken(null);
      clearSelection();
      setIsNFTPreviewExpanded(false);
    } else {
      setSelectedToken(token);
      setSelectedNFT(token);
      clearSelection(); // Clear previous trait selections when switching NFT
    }
  };

  const handleTraitSelect = (trait: Trait) => {
    if (isTraitSelected(trait)) {
      deselectTrait(trait.category);
    } else {
      selectTrait(trait);
    }
  };

  const handleApplyTraits = async () => {
    if (!selectedNFT || selectedTraits.length === 0) return;

    try {
      await applyTraits.mutateAsync({
        tokenId: selectedNFT.tokenId,
        traitIds: selectedTraitIds,
      });

      clearSelection();
      setIsTraitPreviewExpanded(false);
    } catch (error) {
      console.error('Failed to apply traits:', error);
    }
  };

  const handleClearNFTSelection = () => {
    setSelectedNFT(null);
    setSelectedToken(null);
    clearSelection();
    setIsNFTPreviewExpanded(false);
  };

  const nftImageUrl = selectedNFT?.image?.cachedUrl || selectedNFT?.image?.originalUrl || selectedNFT?.metadata?.image;
  const displayName = selectedNFT?.name || selectedNFT?.metadata?.name || (selectedNFT ? `AdrianZERO #${selectedNFT.tokenId}` : '');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="shimmer w-16 h-16 rounded-full mb-4" />
        <p className="text-muted-foreground">Loading your NFTs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-16 w-16 mb-4 text-yellow-500" />
        <h2 className="text-xl font-semibold text-foreground">
          Error Loading NFTs
        </h2>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Failed to load NFTs'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between py-2 sm:py-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">
            AdrianZERO <span className="text-[#00ff00]">NFTs</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {tokens.length} {tokens.length === 1 ? 'NFT' : 'NFTs'} in your collection
          </p>
        </div>

        {/* Selected NFT indicator - Desktop */}
        {selectedNFT && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              #{selectedNFT.tokenId} selected
            </span>
            <button
              onClick={handleClearNFTSelection}
              className="p-1.5 rounded bg-secondary text-secondary-foreground hover:opacity-80"
              aria-label="Clear selection"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Collapsible Selected NFT Panel - Only show when no traits selected */}
      {selectedNFT && selectedTraits.length === 0 && (
        <div className="mb-2 border border-border rounded-lg overflow-hidden bg-card">
          {/* NFT Preview Header - Always visible, clickable to toggle */}
          <button
            onClick={() => setIsNFTPreviewExpanded(!isNFTPreviewExpanded)}
            className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                {nftImageUrl ? (
                  <img src={nftImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Frame className="w-4 h-4 m-2 text-muted-foreground" />
                )}
              </div>
              <span className="text-xs font-medium text-foreground truncate">
                {displayName}
              </span>
              <span className="text-[10px] text-muted-foreground">
                #{selectedNFT.tokenId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearNFTSelection();
                }}
                className="p-1 rounded hover:bg-muted sm:hidden"
                aria-label="Deselect NFT"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
              {isNFTPreviewExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {/* NFT Preview Content - Collapsible */}
          {isNFTPreviewExpanded && (
            <div className="p-2 pt-0">
              <div className="relative aspect-square max-w-[160px] sm:max-w-[200px] mx-auto bg-muted rounded-lg overflow-hidden">
                {nftImageUrl ? (
                  <img
                    src={nftImageUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Frame className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NFT Grid - Hidden when NFT is selected */}
      {!selectedNFT && (
        <NFTGrid
          tokens={sortedTokens}
          selectedTokenId={selectedNFT?.tokenId}
          onTokenSelect={handleTokenSelect}
          emptyMessage="No AdrianZERO NFTs found in your wallet"
        />
      )}

      {/* Trait Selection Section - Only visible when NFT is selected */}
      {selectedNFT && (
        <div className="flex-1 flex flex-col border-t border-border pt-4 mt-2">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="hidden sm:block text-sm font-semibold text-foreground">
              Select <span className="text-[#00ff00]">Traits</span> for #{selectedNFT.tokenId}
            </h2>
            {selectedTraits.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {selectedTraits.length} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="p-1 rounded bg-secondary text-secondary-foreground hover:opacity-80"
                  aria-label="Clear traits"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Collapsible Trait Preview Panel */}
          {selectedTraits.length > 0 && (
            <div className="mb-2 border border-border rounded-lg overflow-hidden bg-card">
              {/* Preview Header */}
              <button
                onClick={() => setIsTraitPreviewExpanded(!isTraitPreviewExpanded)}
                className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
              >
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    <span className="text-[#00ff00]">Preview</span> with traits
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ({selectedTraits.length} trait{selectedTraits.length !== 1 ? 's' : ''})
                  </span>
                </div>
                {isTraitPreviewExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {/* Preview Content - Collapsible */}
              {isTraitPreviewExpanded && (
                <div className="p-2 pt-0">
                  {/* Preview Image */}
                  <div className="relative aspect-square max-w-[200px] sm:max-w-[280px] mx-auto bg-muted rounded-lg overflow-hidden mb-2">
                    {isPreviewLoading && (
                      <div className="absolute inset-0 shimmer" />
                    )}
                    {previewImageUrl && (
                      <img
                        src={previewImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onLoad={() => setIsPreviewLoading(false)}
                      />
                    )}
                  </div>

                  {/* Selected Traits Pills */}
                  <div className="flex flex-wrap gap-1 justify-center mb-2">
                    {selectedTraits.map((trait) => (
                      <div
                        key={trait.tokenId}
                        className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px]"
                      >
                        <span className="truncate max-w-[80px]">{trait.name}</span>
                        <button
                          onClick={() => deselectTrait(trait.category)}
                          className="hover:text-primary-foreground"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        clearSelection();
                        setIsTraitPreviewExpanded(false);
                      }}
                      disabled={applyTraits.isPending}
                      className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded font-medium hover:opacity-80 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApplyTraits}
                      disabled={applyTraits.isPending}
                      className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded font-medium hover:opacity-80 disabled:opacity-50 flex items-center gap-1"
                    >
                      {applyTraits.isPending ? (
                        <>
                          <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3" />
                          Apply
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Category Tabs */}
          <div className="sticky top-0 z-10 bg-background -mx-4 px-4 pb-2">
            <TraitCategories
              categories={categories}
              traitsByCategory={traitsByCategory}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>

          {/* Traits Grid */}
          <div className="flex-1 overflow-y-auto pb-4">
            {traitsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="shimmer w-12 h-12 rounded-full" />
              </div>
            ) : (
              <TraitGrid
                traits={displayTraits}
                selectedTraitIds={selectedTraitIds}
                onTraitSelect={handleTraitSelect}
                emptyMessage={
                  activeCategory === 'ALL'
                    ? 'No traits found in your wallet'
                    : `No ${activeCategory.toLowerCase()} traits found`
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
