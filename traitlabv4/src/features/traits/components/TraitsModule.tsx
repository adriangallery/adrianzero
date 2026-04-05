/**
 * TraitsModule Component
 * Main module for selecting and applying traits to NFTs
 * Embedded mode: sticky NFT preview (mobile + desktop split layout)
 * Standalone mode: collapsible inline preview
 */

import { useState, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
  AlertTriangle, X, ChevronUp, ChevronDown, Sparkles,
  Frame, Check, ArrowLeftRight,
} from 'lucide-react';
import { TraitCategories } from '@/components/traits/TraitCategories';
import { TraitGrid } from '@/components/traits/TraitGrid';
import { useTraitsByCategory, useTraitCategories } from '../hooks/useTraits';
import { useApplyTraits } from '../hooks/useApplyTraits';
import { useTraitsStore } from '../store/traitsStore';
import { useAdrianZeroStore } from '@/features/adrianzero/store/adrianZeroStore';
import { vercelImageService } from '@/lib/api/vercel/imageService';
import { useWalletDataStore } from '@/stores/walletDataStore';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/common/Pagination';
import { shouldOptimizeForTouch } from '@/lib/web3/utils/walletDetection';
import type { TraitCategory } from '@/types/nft.types';

export function TraitsModule({ embedded }: { embedded?: boolean } = {}) {
  const { isConnected } = useAccount();
  const isMobile = shouldOptimizeForTouch();
  const [activeCategory, setActiveCategory] = useState<TraitCategory | 'ALL'>('ALL');
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);

  // Load traits
  const { data: traitsByCategory, allTraits, isLoading, error } = useTraitsByCategory();
  const categories = useTraitCategories();

  // Store loading progress
  const traitsProgress = useWalletDataStore(state => state.traitsProgress);
  const isLoadingTraits = useWalletDataStore(state => state.isLoadingTraits);

  // Stores
  const {
    selectTrait, deselectTrait, getSelectedTraitsArray, getSelectedTraitIds,
    isTraitSelected, clearSelection, targetTokenId,
  } = useTraitsStore();

  const { selectedToken } = useAdrianZeroStore();

  // Mutations
  const applyTraits = useApplyTraits();

  // Get traits for active category
  const displayTraits = useMemo(() => {
    if (activeCategory === 'ALL') return allTraits;
    return traitsByCategory[activeCategory] || [];
  }, [activeCategory, allTraits, traitsByCategory]);

  // Paginate traits (100 per page)
  const traitsPagination = usePagination(displayTraits, { itemsPerPage: 100 });

  useEffect(() => { traitsPagination.firstPage(); }, [activeCategory]);

  // Selected traits
  const selectedTraits = getSelectedTraitsArray();
  const selectedTraitIds = getSelectedTraitIds();

  // Target token for preview
  const previewTokenId = targetTokenId || selectedToken?.tokenId;
  const nftImageUrl = selectedToken?.image?.cachedUrl || selectedToken?.image?.originalUrl || selectedToken?.metadata?.image;

  // Generate composed preview when traits selected
  useEffect(() => {
    if (selectedTraits.length > 0 && previewTokenId) {
      setIsPreviewExpanded(true);
      setIsPreviewLoading(true);
      const url = vercelImageService.generateCombinedImageUrl({
        tokenId: previewTokenId,
        traitIds: selectedTraitIds,
      });
      setPreviewImageUrl(url);
      vercelImageService.preloadImage(url).finally(() => setIsPreviewLoading(false));
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
    setShowBeforeAfter(false);
  };

  const handleApplyTraits = async () => {
    if (!previewTokenId || selectedTraits.length === 0) return;
    try {
      await applyTraits.mutateAsync({ tokenId: previewTokenId, traitIds: selectedTraitIds });
      clearSelection();
      setIsPreviewExpanded(false);
    } catch (err) {
      console.error('Failed to apply traits:', err);
    }
  };

  const handleTogglePreview = () => {
    if (selectedTraits.length === 0) return;
    setIsPreviewExpanded(!isPreviewExpanded);
  };

  // ─── Loading / Error ─────────────────────────────────────────

  if (isLoading || (isConnected && isLoadingTraits)) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="shimmer w-16 h-16 rounded-full mb-4" />
        <p className="text-muted-foreground">
          Loading your traits... {isLoadingTraits ? `${traitsProgress}%` : ''}
        </p>
        {isLoadingTraits && (
          <div className="w-64 h-2 bg-muted rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-[#00ff00] transition-all duration-300" style={{ width: `${traitsProgress}%` }} />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-16 w-16 mb-4 text-yellow-500" />
        <h2 className="text-xl font-semibold text-foreground">Error Loading Traits</h2>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Failed to load traits'}
        </p>
      </div>
    );
  }

  // ─── Embedded mode: sticky NFT preview layout ────────────────

  if (embedded && selectedToken) {
    if (isMobile) {
      return (
        <div className="flex flex-col h-full">
          {/* Sticky top: NFT preview + categories */}
          <div className="sticky top-0 z-20 bg-background border-b border-border">
            {/* Preview row */}
            <div className="flex items-center gap-2 px-3 pt-2 pb-1">
              {/* NFT preview image */}
              <div className="w-[100px] h-[100px] rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                {selectedTraits.length > 0 && previewImageUrl ? (
                  <img src={previewImageUrl} alt="" className="w-full h-full object-cover" />
                ) : nftImageUrl ? (
                  <img src={nftImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Frame className="w-8 h-8 text-muted-foreground absolute inset-0 m-auto" />
                )}
                {isPreviewLoading && <div className="absolute inset-0 shimmer" />}
                {selectedTraits.length > 0 && previewImageUrl && (
                  <button
                    onTouchStart={() => setShowBeforeAfter(true)}
                    onTouchEnd={() => setShowBeforeAfter(false)}
                    className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-[8px] text-white flex items-center gap-1"
                  >
                    <ArrowLeftRight className="h-2.5 w-2.5" />
                    Compare
                  </button>
                )}
              </div>

              {/* Right: info + actions */}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <span className="text-xs font-medium text-foreground truncate">
                  #{selectedToken.tokenId} — {selectedToken.name || `ZERO #${selectedToken.tokenId}`}
                </span>

                {/* Selected traits pills */}
                {selectedTraits.length > 0 && (
                  <div className="flex gap-1 overflow-x-auto no-scrollbar">
                    {selectedTraits.map((trait) => (
                      <div key={trait.tokenId} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#00ff00]/10 text-[#00ff00] border border-[#00ff00]/20 rounded text-[9px] flex-shrink-0">
                        <span className="truncate max-w-[50px]">{trait.name}</span>
                        <button onClick={() => deselectTrait(trait.category)}><X className="h-2 w-2" /></button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Apply button */}
                {selectedTraits.length > 0 && (
                  <div className="flex gap-1.5">
                    <button onClick={() => clearSelection()} className="px-2 py-1 text-[10px] bg-secondary text-secondary-foreground rounded font-medium">
                      Clear
                    </button>
                    <button onClick={handleApplyTraits} disabled={applyTraits.isPending}
                      className="flex-1 py-1 text-[10px] bg-[#00ff00] text-black rounded font-bold disabled:opacity-50 flex items-center justify-center gap-1">
                      {applyTraits.isPending ? (
                        <div className="h-2.5 w-2.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <Check className="h-2.5 w-2.5" />
                      )}
                      Apply {selectedTraits.length}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="overflow-x-auto no-scrollbar px-3 pb-1">
              <div className="min-w-max">
                <TraitCategories categories={categories} traitsByCategory={traitsByCategory} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
              </div>
            </div>
          </div>

          {/* Scrollable trait grid */}
          <div className="flex-1 overflow-y-auto px-2 pt-2 pb-4">
            <TraitGrid
              traits={traitsPagination.currentItems}
              selectedTraitIds={selectedTraitIds}
              onTraitSelect={handleTraitSelect}
              emptyMessage={activeCategory === 'ALL' ? 'No traits found' : `No ${activeCategory.toLowerCase()} traits`}
            />
            {isConnected && traitsPagination.totalPages > 1 && (
              <div className="mt-3">
                <Pagination currentPage={traitsPagination.currentPage} totalPages={traitsPagination.totalPages}
                  itemsPerPage={traitsPagination.itemsPerPage} totalItems={traitsPagination.totalItems} onPageChange={traitsPagination.goToPage} />
              </div>
            )}
          </div>

          {/* Before/After fullscreen overlay */}
          {showBeforeAfter && nftImageUrl && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8" onTouchEnd={() => setShowBeforeAfter(false)}>
              <img src={nftImageUrl} alt="Original" className="max-w-full max-h-full object-contain rounded-xl" />
              <p className="absolute bottom-8 text-xs text-white/60">Original — release to go back</p>
            </div>
          )}
        </div>
      );
    }

    // ─── Embedded Desktop: split layout ──────────────────────

    return (
      <div className="flex flex-col h-full">
        {/* Split: Left panel (fixed preview) | Right panel (scrollable traits) */}
        <div className="flex flex-row gap-4" style={{ height: 'calc(100vh - 180px)' }}>
          {/* Left: Preview */}
          <div className="w-[280px] flex-shrink-0 flex flex-col">
            <div className="relative bg-muted rounded-xl overflow-hidden w-full aspect-square">
              {isPreviewLoading && <div className="absolute inset-0 shimmer z-10" />}
              {showBeforeAfter && nftImageUrl ? (
                <img src={nftImageUrl} alt="Original" className="w-full h-full object-cover" />
              ) : selectedTraits.length > 0 && previewImageUrl ? (
                <img src={previewImageUrl} alt="Preview" className="w-full h-full object-cover" onLoad={() => setIsPreviewLoading(false)} />
              ) : nftImageUrl ? (
                <img src={nftImageUrl} alt={`ZERO #${selectedToken.tokenId}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Frame className="h-12 w-12 text-muted-foreground" /></div>
              )}
              {selectedTraits.length > 0 && previewImageUrl && (
                <button onMouseDown={() => setShowBeforeAfter(true)} onMouseUp={() => setShowBeforeAfter(false)} onMouseLeave={() => setShowBeforeAfter(false)}
                  className="absolute bottom-2 left-2 px-2.5 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-[10px] font-medium text-white flex items-center gap-1.5 hover:bg-black/80">
                  <ArrowLeftRight className="h-3 w-3" />{showBeforeAfter ? 'Original' : 'Hold to compare'}
                </button>
              )}
            </div>

            <p className="text-xs font-medium text-foreground text-center mt-2 truncate">
              {selectedToken.name || `ZERO #${selectedToken.tokenId}`}
            </p>

            {selectedTraits.length > 0 && (
              <>
                <div className="flex flex-wrap gap-1 justify-center mt-2">
                  {selectedTraits.map((trait) => (
                    <div key={trait.tokenId} className="flex items-center gap-1 px-2 py-0.5 bg-[#00ff00]/10 text-[#00ff00] border border-[#00ff00]/20 rounded text-[10px]">
                      <span className="truncate max-w-[80px]">{trait.name}</span>
                      <button onClick={() => deselectTrait(trait.category)}><X className="h-2.5 w-2.5" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-center mt-3">
                  <button onClick={() => clearSelection()} disabled={applyTraits.isPending} className="px-4 py-2 text-xs bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-80 disabled:opacity-50">Clear</button>
                  <button onClick={handleApplyTraits} disabled={applyTraits.isPending} className="px-4 py-2 text-xs bg-[#00ff00] text-black rounded-lg font-bold hover:bg-[#00ff00]/90 disabled:opacity-50 flex items-center gap-1.5">
                    {applyTraits.isPending ? (<><div className="h-3 w-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />Applying...</>) : (<><Check className="h-3 w-3" />Apply {selectedTraits.length} trait{selectedTraits.length !== 1 ? 's' : ''}</>)}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right: Trait Browser */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            <div className="flex-shrink-0 mb-2">
              <TraitCategories categories={categories} traitsByCategory={traitsByCategory} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4 px-1">
              <TraitGrid
                traits={traitsPagination.currentItems}
                selectedTraitIds={selectedTraitIds}
                onTraitSelect={handleTraitSelect}
                emptyMessage={activeCategory === 'ALL' ? 'No traits found in your wallet' : `No ${activeCategory.toLowerCase()} traits found`}
              />
              {isConnected && traitsPagination.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination currentPage={traitsPagination.currentPage} totalPages={traitsPagination.totalPages}
                    itemsPerPage={traitsPagination.itemsPerPage} totalItems={traitsPagination.totalItems} onPageChange={traitsPagination.goToPage} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Standalone / Embedded without token: original layout ────

  return (
    <div className="flex flex-col h-full">
      {/* Demo Mode Banner */}
      {!embedded && !isConnected && (
        <div className="mb-4 bg-[#00ff00]/10 border border-[#00ff00]/20 rounded-lg p-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#00ff00] flex-shrink-0" />
          <p className="text-xs sm:text-sm text-foreground">
            <span className="font-medium text-[#00ff00]">Demo Mode:</span> Viewing 12 sample traits. Connect your wallet to see your collection.
          </p>
        </div>
      )}

      {/* Header */}
      {!embedded && (
        <div className="flex items-center justify-between py-2 sm:py-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Traits</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{allTraits.length} available</p>
          </div>
          {selectedTraits.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{selectedTraits.length} selected</span>
              <button onClick={clearSelection} className="p-1.5 rounded bg-secondary text-secondary-foreground hover:opacity-80" aria-label="Clear">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* No token selected in embedded mode */}
      {embedded && !selectedToken && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Frame className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Select an NFT in the NFTs tab to start customizing</p>
        </div>
      )}

      {/* Collapsible Preview Panel (standalone mode) */}
      {!embedded && selectedTraits.length > 0 && previewTokenId && (
        <div className="mb-2 border border-border rounded-lg overflow-hidden bg-card">
          <button onClick={handleTogglePreview} className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">Preview #{previewTokenId}</span>
              <span className="text-[10px] text-muted-foreground">({selectedTraits.length} trait{selectedTraits.length !== 1 ? 's' : ''})</span>
            </div>
            {isPreviewExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {isPreviewExpanded && (
            <div className="p-2 pt-0">
              <div className="relative aspect-square max-w-[200px] sm:max-w-[280px] mx-auto bg-muted rounded-lg overflow-hidden mb-2">
                {isPreviewLoading && <div className="absolute inset-0 shimmer" />}
                {previewImageUrl && <img src={previewImageUrl} alt="Preview" className="w-full h-full object-cover" onLoad={() => setIsPreviewLoading(false)} />}
              </div>
              <div className="flex gap-2 justify-center">
                <button onClick={() => { clearSelection(); setIsPreviewExpanded(false); }} disabled={applyTraits.isPending} className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded font-medium hover:opacity-80 disabled:opacity-50">Cancel</button>
                <button onClick={handleApplyTraits} disabled={applyTraits.isPending} className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded font-medium hover:opacity-80 disabled:opacity-50">
                  {applyTraits.isPending ? 'Applying...' : 'Apply'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Tabs + Traits Grid (standalone + embedded-no-token) */}
      {(!embedded || !selectedToken) && (
        <>
          <div className="sticky top-0 z-10 bg-background -mx-4 px-4 pb-2">
            <TraitCategories categories={categories} traitsByCategory={traitsByCategory} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>
          <div className="flex-1 overflow-y-auto pb-4">
            <TraitGrid
              traits={traitsPagination.currentItems}
              selectedTraitIds={selectedTraitIds}
              onTraitSelect={handleTraitSelect}
              emptyMessage={activeCategory === 'ALL' ? 'No traits found in your wallet' : `No ${activeCategory.toLowerCase()} traits found`}
            />
            {isConnected && traitsPagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination currentPage={traitsPagination.currentPage} totalPages={traitsPagination.totalPages}
                  itemsPerPage={traitsPagination.itemsPerPage} totalItems={traitsPagination.totalItems} onPageChange={traitsPagination.goToPage} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
