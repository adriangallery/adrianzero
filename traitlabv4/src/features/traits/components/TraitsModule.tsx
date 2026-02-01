/**
 * TraitsModule Component
 * Main module for selecting and applying traits to NFTs
 * Mobile-optimized with sticky bottom bar
 */

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Unplug, AlertTriangle, X } from 'lucide-react';
import { TraitCategories } from '@/components/traits/TraitCategories';
import { TraitGrid } from '@/components/traits/TraitGrid';
import { TraitPreview } from '@/components/traits/TraitPreview';
import { useTraitsByCategory, useTraitCategories } from '../hooks/useTraits';
import { useApplyTraits } from '../hooks/useApplyTraits';
import { useTraitsStore } from '../store/traitsStore';
import { useAdrianZeroStore } from '@/features/adrianzero/store/adrianZeroStore';
import type { TraitCategory } from '@/types/nft.types';

export function TraitsModule() {
  const { isConnected } = useAccount();
  const [activeCategory, setActiveCategory] = useState<TraitCategory | 'ALL'>('ALL');
  const [showPreview, setShowPreview] = useState(false);

  // Load traits
  const { data: traitsByCategory, allTraits, isLoading, error } = useTraitsByCategory();
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

  // Handlers
  const handleTraitSelect = (trait: any) => {
    if (isTraitSelected(trait)) {
      deselectTrait(trait.category);
    } else {
      selectTrait(trait);
    }
  };

  const handleApplyTraits = async () => {
    const tokenId = targetTokenId || selectedToken?.tokenId;

    if (!tokenId || selectedTraits.length === 0) {
      return;
    }

    try {
      await applyTraits.mutateAsync({
        tokenId,
        traitIds: selectedTraitIds,
      });

      // Clear selection on success
      clearSelection();
      setShowPreview(false);
    } catch (error) {
      console.error('Failed to apply traits:', error);
    }
  };

  const handleShowPreview = () => {
    if (selectedTraits.length === 0) {
      return;
    }

    if (!targetTokenId && !selectedToken?.tokenId) {
      alert('Please select an AdrianZERO NFT first');
      return;
    }

    setShowPreview(true);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Unplug className="h-16 w-16 mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">
          Wallet Not Connected
        </h2>
        <p className="text-muted-foreground mt-2">
          Please connect your wallet to view your traits
        </p>
      </div>
    );
  }

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
      {/* Header - Compact on mobile */}
      <div className="flex items-center justify-between py-2 sm:py-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">Traits</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {allTraits.length} {allTraits.length === 1 ? 'trait' : 'traits'} available
          </p>
        </div>

        {/* Selected Traits Counter - Desktop only */}
        {selectedTraits.length > 0 && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="px-3 py-1 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium text-primary">
                {selectedTraits.length} selected
              </p>
            </div>
            <button
              onClick={handleShowPreview}
              className="touch-target px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Preview & Apply
            </button>
          </div>
        )}
      </div>

      {/* Category Tabs - Sticky on mobile */}
      <div className="sticky top-0 z-10 bg-background -mx-4 px-4 pb-2">
        <TraitCategories
          categories={categories}
          traitsByCategory={traitsByCategory}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* Traits Grid - Fills remaining space, with bottom padding for mobile bar */}
      <div className="flex-1 overflow-y-auto pb-20 sm:pb-4">
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
      </div>

      {/* Mobile Sticky Bottom Bar */}
      {selectedTraits.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-background border-t border-border p-3 z-20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={clearSelection}
                className="p-2 rounded-lg bg-secondary text-secondary-foreground"
                aria-label="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-foreground">
                {selectedTraits.length} trait{selectedTraits.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={handleShowPreview}
              className="touch-target px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <TraitPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        tokenId={targetTokenId || selectedToken?.tokenId || ''}
        traits={selectedTraits}
        onConfirm={handleApplyTraits}
        isApplying={applyTraits.isPending}
      />
    </div>
  );
}
