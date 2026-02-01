/**
 * NFTTraitSelector Component
 * Unified modal for viewing NFT + selecting and applying traits
 */

import { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Frame, Palette, Check } from 'lucide-react';
import { TraitCard } from '@/components/traits/TraitCard';
import { useTraitsByCategory, useTraitCategories } from '@/features/traits/hooks/useTraits';
import { useApplyTraits } from '@/features/traits/hooks/useApplyTraits';
import { useTraitsStore } from '@/features/traits/store/traitsStore';
import { vercelImageService } from '@/lib/api/vercel/imageService';
import type { AdrianZeroToken, TraitCategory, Trait } from '@/types/nft.types';

interface NFTTraitSelectorProps {
  nft: AdrianZeroToken;
  isOpen: boolean;
  onClose: () => void;
}

export function NFTTraitSelector({ nft, isOpen, onClose }: NFTTraitSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<TraitCategory | 'ALL'>('ALL');
  const [showComparison, setShowComparison] = useState(false);

  // Load traits
  const { data: traitsByCategory, allTraits, isLoading } = useTraitsByCategory();
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

  // Get traits for active category
  const displayTraits = useMemo(() => {
    if (activeCategory === 'ALL') {
      return allTraits;
    }
    return traitsByCategory[activeCategory] || [];
  }, [activeCategory, allTraits, traitsByCategory]);

  const selectedTraits = getSelectedTraitsArray();
  const selectedTraitIds = getSelectedTraitIds();

  // Generate preview URL with selected traits
  const previewImageUrl = useMemo(() => {
    if (selectedTraitIds.length === 0) {
      return nft.image?.cachedUrl || nft.image?.originalUrl || nft.metadata?.image;
    }

    return vercelImageService.generateCombinedImageUrl({
      tokenId: nft.tokenId,
      traitIds: selectedTraitIds,
    });
  }, [nft, selectedTraitIds]);

  const currentImageUrl = nft.image?.cachedUrl || nft.image?.originalUrl || nft.metadata?.image;
  const displayName = nft.name || nft.metadata?.name || `AdrianZERO #${nft.tokenId}`;

  // Handlers
  const handleTraitSelect = (trait: Trait) => {
    if (isTraitSelected(trait)) {
      deselectTrait(trait.category);
    } else {
      selectTrait(trait);
    }
  };

  const handleApplyTraits = async () => {
    if (selectedTraits.length === 0) return;

    try {
      await applyTraits.mutateAsync({
        tokenId: nft.tokenId,
        traitIds: selectedTraitIds,
      });

      clearSelection();
      onClose();
    } catch (error) {
      console.error('Failed to apply traits:', error);
    }
  };

  const handleClearSelection = () => {
    clearSelection();
  };

  const handleClose = () => {
    clearSelection();
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-4 md:inset-8 lg:inset-16 z-50 bg-background rounded-lg shadow-xl overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Dialog.Title className="text-lg font-bold text-foreground">
                      {displayName}
                    </Dialog.Title>
                    <span className="px-2 py-1 bg-muted rounded text-xs font-medium text-muted-foreground">
                      #{nft.tokenId}
                    </span>
                  </div>
                  <Dialog.Close className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <X className="h-5 w-5" />
                  </Dialog.Close>
                </div>

                {/* Body - 2 Column Layout */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                  {/* Left Column - NFT Preview */}
                  <div className="w-full md:w-2/5 p-4 border-b md:border-b-0 md:border-r border-border">
                    <div className="sticky top-0 space-y-4">
                      {/* Preview Toggle */}
                      {selectedTraits.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">Preview</span>
                          <button
                            onClick={() => setShowComparison(!showComparison)}
                            className="text-xs text-primary hover:underline"
                          >
                            {showComparison ? 'Hide Original' : 'Compare'}
                          </button>
                        </div>
                      )}

                      {/* Image Preview */}
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                        {showComparison && selectedTraits.length > 0 ? (
                          <div className="grid grid-cols-2 h-full">
                            <div className="relative">
                              <div className="absolute top-2 left-2 px-2 py-1 bg-accent/90 rounded text-xs text-white">
                                Original
                              </div>
                              {currentImageUrl ? (
                                <img src={currentImageUrl} alt="Original" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Frame className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="relative">
                              <div className="absolute top-2 right-2 px-2 py-1 bg-accent/90 rounded text-xs text-white">
                                Preview
                              </div>
                              <img src={previewImageUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        ) : (
                          <>
                            {previewImageUrl ? (
                              <img src={previewImageUrl} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Frame className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Selected Traits */}
                      {selectedTraits.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                              Selected ({selectedTraits.length})
                            </span>
                            <button
                              onClick={handleClearSelection}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedTraits.map((trait) => (
                              <div
                                key={trait.tokenId}
                                className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                              >
                                <span className="truncate max-w-[120px]">{trait.name}</span>
                                <button
                                  onClick={() => deselectTrait(trait.category)}
                                  className="hover:text-primary-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Trait Selector */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Category Tabs */}
                    <div className="p-4 border-b border-border overflow-x-auto">
                      <div className="flex gap-2 min-w-max">
                        <button
                          onClick={() => setActiveCategory('ALL')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            activeCategory === 'ALL'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          All
                        </button>
                        {categories.map((category) => (
                          <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                              activeCategory === category
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {category.toLowerCase().replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Trait Grid */}
                    <div className="flex-1 overflow-auto p-4">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Palette className="h-12 w-12 mx-auto mb-2 text-muted-foreground animate-pulse" />
                            <p className="text-sm text-muted-foreground">Loading traits...</p>
                          </div>
                        </div>
                      ) : displayTraits.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Palette className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No traits available</p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {displayTraits.map((trait) => (
                            <TraitCard
                              key={trait.tokenId}
                              trait={trait}
                              isSelected={isTraitSelected(trait)}
                              onClick={() => handleTraitSelect(trait)}
                              showBalance={true}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer - Actions */}
                <div className="p-4 border-t border-border flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {selectedTraits.length === 0 ? (
                      <span>Select traits to apply to your NFT</span>
                    ) : (
                      <span>
                        {selectedTraits.length} trait{selectedTraits.length !== 1 ? 's' : ''} selected
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApplyTraits}
                      disabled={selectedTraits.length === 0 || applyTraits.isPending}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {applyTraits.isPending ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Apply Traits
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
