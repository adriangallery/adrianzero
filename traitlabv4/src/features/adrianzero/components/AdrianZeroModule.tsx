/**
 * AdrianZeroModule Component
 * Main module for viewing and managing AdrianZERO NFTs
 * V4.6: Split layout with permanent preview, search, before/after, NFT switcher
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, X, Frame, Check, Sparkles, Rocket, ArrowRight,
  Search, ChevronLeft, ChevronRight, ArrowLeftRight,
} from 'lucide-react';
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
import { useWalletDataStore } from '@/stores/walletDataStore';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/common/Pagination';
import { shouldOptimizeForTouch } from '@/lib/web3/utils/walletDetection';
import type { TraitCategory, Trait } from '@/types/nft.types';

export function AdrianZeroModule() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();
  const isMobile = shouldOptimizeForTouch();

  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<TraitCategory | 'ALL'>('ALL');
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
  const { data: traitsByCategory, allTraits } = useTraitsByCategory();
  const categories = useTraitCategories();

  // Trait selection store
  const {
    selectTrait, deselectTrait, getSelectedTraitsArray, getSelectedTraitIds,
    isTraitSelected, clearSelection,
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
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      return 0;
    });
    return sorted;
  }, [tokensWithNames, sortBy, sortOrder]);

  // Filter tokens by search query
  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return sortedTokens;
    const q = searchQuery.toLowerCase().replace('#', '');
    return sortedTokens.filter((t) => {
      const name = (t.name || '').toLowerCase();
      return t.tokenId.includes(q) || name.includes(q);
    });
  }, [sortedTokens, searchQuery]);

  // Get traits for active category
  const displayTraits = useMemo(() => {
    if (activeCategory === 'ALL') return allTraits;
    return traitsByCategory[activeCategory] || [];
  }, [activeCategory, allTraits, traitsByCategory]);

  const selectedTraits = getSelectedTraitsArray();
  const selectedTraitIds = getSelectedTraitIds();

  // Index of selected NFT in sorted list (for prev/next navigation)
  const selectedIndex = useMemo(() => {
    if (!selectedNFT) return -1;
    return sortedTokens.findIndex((t) => t.tokenId === selectedNFT.tokenId);
  }, [selectedNFT, sortedTokens]);

  // Auto-select first NFT in demo mode
  useEffect(() => {
    if (!isConnected && sortedTokens.length > 0 && !selectedNFT) {
      const firstToken = sortedTokens[0];
      setSelectedNFT(firstToken);
      setSelectedToken(firstToken);
    }
  }, [isConnected, sortedTokens, selectedNFT, setSelectedToken]);

  // Generate composed image when traits are selected
  useEffect(() => {
    if (selectedTraits.length > 0 && selectedNFT) {
      setIsPreviewLoading(true);
      const url = vercelImageService.generateCombinedImageUrl({
        tokenId: selectedNFT.tokenId,
        traitIds: selectedTraitIds,
      });
      setPreviewImageUrl(url);
      vercelImageService.preloadImage(url).finally(() => setIsPreviewLoading(false));
    } else {
      setPreviewImageUrl('');
      setIsPreviewLoading(false);
    }
  }, [selectedTraits.length, selectedTraitIds.join(','), selectedNFT?.tokenId]);

  // Handlers
  const handleTokenSelect = useCallback((token: any) => {
    if (selectedNFT?.tokenId === token.tokenId) {
      setSelectedNFT(null);
      setSelectedToken(null);
      clearSelection();
    } else {
      setSelectedToken(token);
      setSelectedNFT(token);
      clearSelection();
    }
    setShowBeforeAfter(false);
  }, [selectedNFT, setSelectedToken, clearSelection]);

  const handleTraitSelect = useCallback((trait: Trait) => {
    if (isTraitSelected(trait)) {
      deselectTrait(trait.category);
    } else {
      selectTrait(trait);
    }
    setShowBeforeAfter(false);
  }, [isTraitSelected, deselectTrait, selectTrait]);

  const handleApplyTraits = async () => {
    if (!selectedNFT || selectedTraits.length === 0) return;
    if (!isConnected) { navigate('/onboarding'); return; }
    try {
      await applyTraits.mutateAsync({
        tokenId: selectedNFT.tokenId,
        traitIds: selectedTraitIds,
      });
      clearSelection();
    } catch (err) {
      console.error('Failed to apply traits:', err);
    }
  };

  const handleClearNFTSelection = useCallback(() => {
    setSelectedNFT(null);
    setSelectedToken(null);
    clearSelection();
    setSearchQuery('');
  }, [setSelectedToken, clearSelection]);

  const handlePrevNFT = useCallback(() => {
    if (selectedIndex > 0) {
      const prev = sortedTokens[selectedIndex - 1];
      setSelectedToken(prev);
      setSelectedNFT(prev);
      clearSelection();
      setShowBeforeAfter(false);
    }
  }, [selectedIndex, sortedTokens, setSelectedToken, clearSelection]);

  const handleNextNFT = useCallback(() => {
    if (selectedIndex < sortedTokens.length - 1) {
      const next = sortedTokens[selectedIndex + 1];
      setSelectedToken(next);
      setSelectedNFT(next);
      clearSelection();
      setShowBeforeAfter(false);
    }
  }, [selectedIndex, sortedTokens, setSelectedToken, clearSelection]);

  // Loading progress
  const zerosProgress = useWalletDataStore((s) => s.zerosProgress);
  const traitsProgress = useWalletDataStore((s) => s.traitsProgress);
  const isLoadingZeros = useWalletDataStore((s) => s.isLoadingZeros);
  const isLoadingTraits = useWalletDataStore((s) => s.isLoadingTraits);

  // Pagination
  const zerosPagination = usePagination(filteredTokens, { itemsPerPage: 100 });
  const traitsPagination = usePagination(displayTraits, { itemsPerPage: 100 });

  useEffect(() => { traitsPagination.firstPage(); }, [activeCategory]);

  const nftImageUrl = selectedNFT?.image?.cachedUrl || selectedNFT?.image?.originalUrl || selectedNFT?.metadata?.image;
  const displayName = selectedNFT?.name || selectedNFT?.metadata?.name || (selectedNFT ? `AdrianZERO #${selectedNFT.tokenId}` : '');

  // ─── Loading / Error states ────────────────────────────────

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
        <h2 className="text-xl font-semibold text-foreground">Error Loading NFTs</h2>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Failed to load NFTs'}
        </p>
      </div>
    );
  }

  // ─── Empty state (hero CTA) ────────────────────────────────

  if (isConnected && tokens.length === 0 && !isLoading && !isLoadingZeros) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="relative w-32 h-32 mb-6">
          <div className="absolute inset-0 bg-[#00ff00]/20 rounded-full animate-pulse" />
          <div className="absolute inset-2 bg-[#00ff00]/10 rounded-full flex items-center justify-center">
            <Rocket className="h-12 w-12 text-[#00ff00]" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Get Your First <span className="text-[#00ff00]">ZERO</span>
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Mint your AdrianZERO NFT and start customizing it with 900+ traits, visual effects, and more.
        </p>
        <button
          onClick={() => navigate('/onboarding')}
          className="group inline-flex items-center gap-2 px-6 py-3 bg-[#00ff00] text-black font-bold rounded-xl hover:bg-[#00ff00]/90 transition-all"
        >
          Start Minting
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  // ─── NFT Grid Mode (no NFT selected) ──────────────────────

  if (!selectedNFT) {
    return (
      <div className="flex flex-col h-full">
        {/* Demo Mode Banner */}
        {!isConnected && (
          <div className="mb-3 bg-[#00ff00]/10 border border-[#00ff00]/20 rounded-lg p-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00ff00] flex-shrink-0" />
            <p className="text-xs sm:text-sm text-foreground">
              <span className="font-medium text-[#00ff00]">Demo Mode:</span> Viewing sample NFT #146. Connect your wallet to see your collection.
            </p>
          </div>
        )}

        {/* Header with search */}
        <div className="flex items-center justify-between gap-3 py-2 sm:py-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-foreground">
              {!isConnected ? (
                <>Build your <span className="text-[#00ff00]">ZERO</span></>
              ) : (
                <>My <span className="text-[#00ff00]">NFTs</span></>
              )}
            </h1>
            {isConnected && (
              <p className="text-xs text-muted-foreground">
                {tokens.length} NFT{tokens.length !== 1 ? 's' : ''} — tap to customize
              </p>
            )}
          </div>

          {/* Search */}
          {isConnected && tokens.length > 6 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search #id or name..."
                className="pl-8 pr-3 py-1.5 bg-muted rounded-lg text-xs text-foreground w-36 sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#00ff00]/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading progress */}
        {isLoadingZeros && isConnected && (
          <div className="text-center py-8">
            <div className="shimmer w-16 h-16 rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading AdrianZERO NFTs... {zerosProgress}%</p>
            <div className="w-64 h-2 bg-muted rounded-full mx-auto mt-2 overflow-hidden">
              <div className="h-full bg-[#00ff00] transition-all duration-300" style={{ width: `${zerosProgress}%` }} />
            </div>
          </div>
        )}

        {/* NFT Grid */}
        {!isLoadingZeros && (
          <>
            {searchQuery && filteredTokens.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No NFTs matching "<span className="text-foreground">{searchQuery}</span>"
                </p>
              </div>
            ) : (
              <NFTGrid
                tokens={zerosPagination.currentItems}
                selectedTokenId={null}
                onTokenSelect={handleTokenSelect}
                emptyMessage="No AdrianZERO NFTs found in your wallet"
              />
            )}

            {isConnected && zerosPagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={zerosPagination.currentPage}
                  totalPages={zerosPagination.totalPages}
                  itemsPerPage={zerosPagination.itemsPerPage}
                  totalItems={zerosPagination.totalItems}
                  onPageChange={zerosPagination.goToPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ─── Trait Editor Mode (NFT selected) — Split Layout ──────

  // Mobile: compact sticky header + full-height scrollable trait grid
  // Desktop: side-by-side split layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-full -mx-4 -mt-6">
        {/* ─── Sticky top section ─── */}
        <div className="sticky top-0 z-20 bg-background px-3 pt-2 pb-1 border-b border-border">
          {/* Row 1: Back + NFT thumbnail + name + nav + close */}
          <div className="flex items-center gap-2 mb-1.5">
            <button onClick={handleClearNFTSelection} className="p-1 -ml-1">
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* NFT thumbnail */}
            <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0 relative">
              {/* Show composed or original */}
              {selectedTraits.length > 0 && previewImageUrl ? (
                <img src={previewImageUrl} alt="" className="w-full h-full object-cover" />
              ) : nftImageUrl ? (
                <img src={nftImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Frame className="w-5 h-5 text-muted-foreground absolute inset-0 m-auto" />
              )}
              {isPreviewLoading && <div className="absolute inset-0 shimmer" />}
            </div>

            {/* NFT switcher */}
            <button onClick={handlePrevNFT} disabled={selectedIndex <= 0} className="p-0.5 disabled:opacity-20">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-medium text-foreground flex-1 text-center truncate">
              #{selectedNFT.tokenId}
            </span>
            <button onClick={handleNextNFT} disabled={selectedIndex >= sortedTokens.length - 1} className="p-0.5 disabled:opacity-20">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            {/* Before/after + close */}
            {selectedTraits.length > 0 && previewImageUrl && (
              <button
                onTouchStart={() => setShowBeforeAfter(true)}
                onTouchEnd={() => setShowBeforeAfter(false)}
                className="p-1 rounded bg-muted"
              >
                <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
            <button onClick={handleClearNFTSelection} className="p-1">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Row 2 (conditional): Selected traits pills + Apply */}
          {selectedTraits.length > 0 && (
            <div className="flex items-center gap-1.5 mb-1.5 overflow-x-auto no-scrollbar">
              <div className="flex gap-1 flex-shrink-0">
                {selectedTraits.map((trait) => (
                  <div
                    key={trait.tokenId}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#00ff00]/10 text-[#00ff00] border border-[#00ff00]/20 rounded text-[9px] flex-shrink-0"
                  >
                    <span className="truncate max-w-[60px]">{trait.name}</span>
                    <button onClick={() => deselectTrait(trait.category)}>
                      <X className="h-2 w-2" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 flex-shrink-0 ml-auto">
                <button
                  onClick={() => clearSelection()}
                  className="px-2 py-1 text-[10px] bg-secondary text-secondary-foreground rounded font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={handleApplyTraits}
                  disabled={applyTraits.isPending}
                  className="px-2.5 py-1 text-[10px] bg-[#00ff00] text-black rounded font-bold disabled:opacity-50 flex items-center gap-1"
                >
                  {applyTraits.isPending ? (
                    <div className="h-2.5 w-2.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <Check className="h-2.5 w-2.5" />
                  )}
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Row 3: Category tabs — horizontal scroll, single line */}
          <div className="overflow-x-auto no-scrollbar -mx-1">
            <TraitCategories
              categories={categories}
              traitsByCategory={traitsByCategory}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>
        </div>

        {/* ─── Scrollable trait grid ─── */}
        <div className="flex-1 overflow-y-auto px-2 pt-2 pb-4">
          {isLoadingTraits && isConnected ? (
            <div className="text-center py-8">
              <div className="shimmer w-10 h-10 rounded-full mx-auto mb-3" />
              <p className="text-muted-foreground text-xs">Loading traits... {traitsProgress}%</p>
              <div className="w-40 h-1 bg-muted rounded-full mx-auto mt-2 overflow-hidden">
                <div className="h-full bg-[#00ff00] transition-all duration-300" style={{ width: `${traitsProgress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <TraitGrid
                traits={traitsPagination.currentItems}
                selectedTraitIds={selectedTraitIds}
                onTraitSelect={handleTraitSelect}
                emptyMessage={
                  activeCategory === 'ALL'
                    ? 'No traits found in your wallet'
                    : `No ${activeCategory.toLowerCase()} traits found`
                }
              />
              {isConnected && traitsPagination.totalPages > 1 && (
                <div className="mt-3">
                  <Pagination
                    currentPage={traitsPagination.currentPage}
                    totalPages={traitsPagination.totalPages}
                    itemsPerPage={traitsPagination.itemsPerPage}
                    totalItems={traitsPagination.totalItems}
                    onPageChange={traitsPagination.goToPage}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Before/After fullscreen overlay */}
        {showBeforeAfter && nftImageUrl && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
            onTouchEnd={() => setShowBeforeAfter(false)}
          >
            <img src={nftImageUrl} alt="Original" className="max-w-full max-h-full object-contain rounded-xl" />
            <p className="absolute bottom-8 text-xs text-white/60">Original — release to go back</p>
          </div>
        )}
      </div>
    );
  }

  // ─── Desktop: side-by-side split layout ──────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2 py-2 border-b border-border mb-3">
        <button
          onClick={handleClearNFTSelection}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to collection
        </button>

        <div className="flex items-center gap-2">
          <button onClick={handlePrevNFT} disabled={selectedIndex <= 0} className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium text-foreground min-w-[80px] text-center">{displayName}</span>
          <button onClick={handleNextNFT} disabled={selectedIndex >= sortedTokens.length - 1} className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {selectedTraits.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#00ff00]">{selectedTraits.length} trait{selectedTraits.length !== 1 ? 's' : ''}</span>
            <button onClick={clearSelection} className="p-1 rounded hover:bg-muted">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Split: Preview | Traits */}
      <div className="flex-1 flex flex-row gap-4 overflow-y-auto">
        {/* Left: Preview — sticky so it stays while traits scroll */}
        <div className="w-[320px] flex-shrink-0 sticky top-0 self-start flex flex-col">
          <div className="relative bg-muted rounded-xl overflow-hidden w-full aspect-square">
            {isPreviewLoading && <div className="absolute inset-0 shimmer z-10" />}
            {showBeforeAfter && nftImageUrl ? (
              <img src={nftImageUrl} alt={`${displayName} (original)`} className="w-full h-full object-cover" />
            ) : selectedTraits.length > 0 && previewImageUrl ? (
              <img src={previewImageUrl} alt="Preview with traits" className="w-full h-full object-cover" onLoad={() => setIsPreviewLoading(false)} />
            ) : nftImageUrl ? (
              <img src={nftImageUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Frame className="h-12 w-12 text-muted-foreground" /></div>
            )}
            {selectedTraits.length > 0 && previewImageUrl && (
              <button
                onMouseDown={() => setShowBeforeAfter(true)}
                onMouseUp={() => setShowBeforeAfter(false)}
                onMouseLeave={() => setShowBeforeAfter(false)}
                className="absolute bottom-2 left-2 px-2.5 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-[10px] font-medium text-white flex items-center gap-1.5 hover:bg-black/80"
              >
                <ArrowLeftRight className="h-3 w-3" />
                {showBeforeAfter ? 'Original' : 'Hold to compare'}
              </button>
            )}
          </div>

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
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0 mb-2">
            <TraitCategories categories={categories} traitsByCategory={traitsByCategory} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>
          {/* p-1 padding prevents ring-2 clipping on edge trait cards */}
          <div className="flex-1 overflow-y-auto pb-4 p-1 -m-1">
            {isLoadingTraits && isConnected ? (
              <div className="text-center py-8">
                <div className="shimmer w-12 h-12 rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">Loading traits... {traitsProgress}%</p>
                <div className="w-48 h-1.5 bg-muted rounded-full mx-auto mt-2 overflow-hidden">
                  <div className="h-full bg-[#00ff00] transition-all duration-300" style={{ width: `${traitsProgress}%` }} />
                </div>
              </div>
            ) : (
              <>
                <TraitGrid traits={traitsPagination.currentItems} selectedTraitIds={selectedTraitIds} onTraitSelect={handleTraitSelect}
                  emptyMessage={activeCategory === 'ALL' ? 'No traits found in your wallet' : `No ${activeCategory.toLowerCase()} traits found`} />
                {isConnected && traitsPagination.totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination currentPage={traitsPagination.currentPage} totalPages={traitsPagination.totalPages}
                      itemsPerPage={traitsPagination.itemsPerPage} totalItems={traitsPagination.totalItems} onPageChange={traitsPagination.goToPage} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
