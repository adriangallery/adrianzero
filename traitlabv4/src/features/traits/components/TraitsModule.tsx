/**
 * TraitsModule Component
 * Main module for selecting and applying traits to NFTs
 * Mobile-optimized with collapsible inline preview
 */

import { useState, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { AlertTriangle, X, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { ProgressiveLoadIndicator } from '@/components/common/ProgressiveLoadIndicator';
import { TraitCategories } from '@/components/traits/TraitCategories';
import { TraitGrid } from '@/components/traits/TraitGrid';
import { useTraitsByCategory, useTraitCategories } from '../hooks/useTraits';
import { useApplyTraits } from '../hooks/useApplyTraits';
import { useTraitsStore } from '../store/traitsStore';
import { useAdrianZeroStore } from '@/features/adrianzero/store/adrianZeroStore';
import { vercelImageService } from '@/lib/api/vercel/imageService';
import { shouldOptimizeForTouch } from '@/lib/web3/utils/walletDetection';
import { useAutoInfiniteLoading } from '@/hooks/useAutoInfiniteLoading';
import type { TraitCategory } from '@/types/nft.types';

export function TraitsModule() {
  const { isConnected } = useAccount();
  const [activeCategory, setActiveCategory] = useState<TraitCategory | 'ALL'>('ALL');
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const isTouchDevice = shouldOptimizeForTouch();

  // Load traits
  const {
    data: traitsByCategory,
    allTraits,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    loadedCount,
    totalCount,
  } = useTraitsByCategory();
  const categories = useTraitCategories();

  // Stores
  const {
    selectTrait,
    deselectTrait,
    getSelectedTraitsArray,
    getSelectedTraitIds,
    isTraitSelected,
    clearSelection,
    targetTokenId,
  } = useTraitsStore();

  const { selectedToken } = useAdrianZeroStore();

  // Mutations
  const applyTraits = useApplyTraits();

  // Get traits for active category
  const displayTraits = useMemo(() => {
    if (activeCategory === 'ALL') {
      return allTraits;
    }
    return traitsByCategory[activeCategory] || [];
  }, [activeCategory, allTraits, traitsByCategory]);

  // Selected traits
  const selectedTraits = getSelectedTraitsArray();
  const selectedTraitIds = getSelectedTraitIds();

  // Target token for preview
  const previewTokenId = targetTokenId || selectedToken?.tokenId;

  // Auto-expand preview when traits are selected, collapse when none
  useEffect(() => {
    if (selectedTraits.length > 0 && previewTokenId) {
      setIsPreviewExpanded(true);
      // Generate preview URL
      setIsPreviewLoading(true);
      const url = vercelImageService.generateCombinedImageUrl({
        tokenId: previewTokenId,
        traitIds: selectedTraitIds,
      });
      setPreviewImageUrl(url);
      // Preload
      vercelImageService.preloadImage(url).finally(() => {
        setIsPreviewLoading(false);
      });
    } else if (selectedTraits.length === 0) {
      setIsPreviewExpanded(false);
      setPreviewImageUrl('');
    }
  }, [selectedTraits.length, selectedTraitIds.join(','), previewTokenId]);

  // Handlers
  const handleTraitSelect = (trait: any) => {
    if (isTraitSelected(trait)) {
      deselectTrait(trait.category);
    } else {
      selectTrait(trait);
    }
  };

  const handleApplyTraits = async () => {
    if (!previewTokenId || selectedTraits.length === 0) {
      return;
    }

    try {
      await applyTraits.mutateAsync({
        tokenId: previewTokenId,
        traitIds: selectedTraitIds,
      });

      // Clear selection on success
      clearSelection();
      setIsPreviewExpanded(false);
    } catch (error) {
      console.error('Failed to apply traits:', error);
    }
  };

  const handleTogglePreview = () => {
    if (selectedTraits.length === 0) return;
    setIsPreviewExpanded(!isPreviewExpanded);
  };

  useAutoInfiniteLoading({
    enabled: isConnected,
    hasNextPage,
    isFetchingNextPage,
    loadedCount,
    minimumItems: isTouchDevice ? 160 : 320,
    fetchNextPage,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="shimmer w-16 h-16 rounded-full mb-4" />
        <p className="text-muted-foreground">Loading your traits...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-16 w-16 mb-4 text-yellow-500" />
        <h2 className="text-xl font-semibold text-foreground">
          Error Loading Traits
        </h2>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Failed to load traits'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Demo Mode Banner */}
      {!isConnected && (
        <div className="mb-4 bg-[#00ff00]/10 border border-[#00ff00]/20 rounded-lg p-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#00ff00] flex-shrink-0" />
          <p className="text-xs sm:text-sm text-foreground">
            <span className="font-medium text-[#00ff00]">Demo Mode:</span> Viewing 12 sample traits. Connect your wallet to see your collection.
          </p>
        </div>
      )}

      {/* Header - Compact on mobile */}
      <div className="flex items-center justify-between py-2 sm:py-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">Traits</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {allTraits.length} available
          </p>
        </div>

        {/* Selected Traits Counter - Desktop */}
        {selectedTraits.length > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {selectedTraits.length} selected
            </span>
            <button
              onClick={clearSelection}
              className="p-1.5 rounded bg-secondary text-secondary-foreground hover:opacity-80"
              aria-label="Clear"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Collapsible Preview Panel */}
      {selectedTraits.length > 0 && previewTokenId && (
        <div className="mb-2 border border-border rounded-lg overflow-hidden bg-card">
          {/* Preview Header - Always visible, clickable to toggle */}
          <button
            onClick={handleTogglePreview}
            className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">
                Preview #{previewTokenId}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ({selectedTraits.length} trait{selectedTraits.length !== 1 ? 's' : ''})
              </span>
            </div>
            {isPreviewExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Preview Content - Collapsible */}
          {isPreviewExpanded && (
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

              {/* Action Buttons - Compact */}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => {
                    clearSelection();
                    setIsPreviewExpanded(false);
                  }}
                  disabled={applyTraits.isPending}
                  className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded font-medium hover:opacity-80 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyTraits}
                  disabled={applyTraits.isPending}
                  className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded font-medium hover:opacity-80 disabled:opacity-50"
                >
                  {applyTraits.isPending ? 'Applying...' : 'Apply'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Tabs - Sticky on mobile */}
      <div className="sticky top-0 z-10 bg-background -mx-4 px-4 pb-2">
        <TraitCategories
          categories={categories}
          traitsByCategory={traitsByCategory}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* Traits Grid - Fills remaining space */}
      <div className="flex-1 overflow-y-auto pb-4">
        <TraitGrid
          traits={displayTraits}
          selectedTraitIds={selectedTraitIds}
          onTraitSelect={handleTraitSelect}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          emptyMessage={
            activeCategory === 'ALL'
              ? 'No traits found in your wallet'
              : `No ${activeCategory.toLowerCase()} traits found`
          }
        />

        {isConnected && totalCount > 0 && (
          <div className="mt-4">
            <ProgressiveLoadIndicator
              loadedCount={loadedCount}
              totalCount={totalCount}
              isLoading={isFetchingNextPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
