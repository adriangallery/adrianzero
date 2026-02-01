/**
 * TraitsModule Component
 * Main module for selecting and applying traits to NFTs
 */

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Unplug, AlertTriangle } from 'lucide-react';
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
    console.log('[TraitsModule] Active category:', activeCategory);
    console.log('[TraitsModule] traitsByCategory keys:', Object.keys(traitsByCategory));

    if (activeCategory === 'ALL') {
      console.log('[TraitsModule] Showing ALL traits:', allTraits.length);
      return allTraits;
    }

    const filtered = traitsByCategory[activeCategory] || [];
    console.log('[TraitsModule] Filtered traits for', activeCategory, ':', filtered.length);
    console.log('[TraitsModule] Sample filtered:', filtered.slice(0, 3).map(t => `${t.name} (${t.category})`));

    return filtered;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Traits</h1>
          <p className="text-muted-foreground mt-1">
            {allTraits.length} {allTraits.length === 1 ? 'trait' : 'traits'} available
          </p>
        </div>

        {/* Selected Traits Counter */}
        {selectedTraits.length > 0 && (
          <div className="flex items-center gap-3">
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

      {/* Category Tabs */}
      <TraitCategories
        categories={categories}
        traitsByCategory={traitsByCategory}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Traits Grid */}
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
