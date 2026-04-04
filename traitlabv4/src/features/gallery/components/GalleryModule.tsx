import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useTokenList } from '../hooks/useTokenList';
import { useTokenMetadata, deriveNFTType } from '../hooks/useTokenMetadata';
import { useGalleryStore } from '../store/galleryStore';
import { NFTCard } from './NFTCard';
import { NFTDetailModal } from './NFTDetailModal';
import type { NFTType } from '../types/gallery.types';

const FILTER_OPTIONS: Array<NFTType | 'All'> = ['All', 'Gen0', 'SamuraiZERO', 'SubZERO', 'ZEROmovies', 'GenZERO'];

const FILTER_COLORS: Record<string, string> = {
  All: 'bg-white text-black',
  Gen0: 'bg-zinc-600 text-zinc-100',
  SamuraiZERO: 'bg-red-700 text-red-100',
  SubZERO: 'bg-blue-700 text-blue-100',
  ZEROmovies: 'bg-red-600 text-red-100',
  GenZERO: 'bg-pink-600 text-pink-100',
};

const FILTER_INACTIVE = 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700';

export function GalleryModule() {
  const { totalSupply, owners, loadedCount, isLoadingSupply, isLoadingPage, hasMore, loadNextPage, error } =
    useTokenList();
  const { activeFilter, setActiveFilter, openModal, setTokenIds, metadataCache } = useGalleryStore();

  // Build sorted token ID list from loaded owners
  const allTokenIds = useMemo(() => {
    return Array.from(owners.keys()).sort((a, b) => a - b);
  }, [owners]);

  // Fetch metadata for currently loaded tokens
  useTokenMetadata(allTokenIds);

  // Filter by type
  const filteredTokenIds = useMemo(() => {
    if (activeFilter === 'All') return allTokenIds;
    return allTokenIds.filter((id) => {
      const meta = metadataCache.get(id);
      if (!meta) return false;
      return deriveNFTType(meta) === activeFilter;
    });
  }, [allTokenIds, activeFilter, metadataCache]);

  // Keep store in sync for modal navigation
  useEffect(() => {
    setTokenIds(filteredTokenIds);
  }, [filteredTokenIds, setTokenIds]);

  // Auto-load first page on mount
  useEffect(() => {
    if (totalSupply > 0 && loadedCount === 0 && !isLoadingPage) {
      loadNextPage();
    }
  }, [totalSupply, loadedCount, isLoadingPage, loadNextPage]);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore && !isLoadingPage) {
        loadNextPage();
      }
    },
    [hasMore, isLoadingPage, loadNextPage]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '600px',
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  // Count per type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allTokenIds.length };
    for (const id of allTokenIds) {
      const meta = metadataCache.get(id);
      if (meta) {
        const t = deriveNFTType(meta);
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    return counts;
  }, [allTokenIds, metadataCache]);

  // --- Loading state ---
  if (isLoadingSupply) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="text-center">
          <div className="mb-4 h-14 w-14 animate-spin rounded-full border-4 border-red-500 border-t-transparent mx-auto" />
          <div className="text-lg font-semibold text-white">Loading Collection...</div>
          <div className="mt-2 text-xs text-zinc-500">Reading AdrianZERO contract</div>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">!!!</div>
          <div className="text-lg font-semibold text-white">Failed to Load</div>
          <div className="mt-2 text-xs text-zinc-500">{error.message}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-zinc-800 bg-black/90 backdrop-blur-sm px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">AdrianZERO Collection</h1>
            <p className="text-[10px] text-zinc-500">
              {loadedCount} / {totalSupply} loaded
              {isLoadingPage && ' — loading...'}
            </p>
          </div>

          {/* Type filters */}
          <div className="flex flex-wrap gap-1.5">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`rounded px-2 py-0.5 text-[9px] font-bold transition-colors ${
                  activeFilter === f ? FILTER_COLORS[f] : FILTER_INACTIVE
                }`}
              >
                {f}{typeCounts[f] !== undefined ? ` (${typeCounts[f]})` : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-3 py-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {filteredTokenIds.map((tokenId) => {
            const meta = metadataCache.get(tokenId);
            const name = meta?.name ?? `AdrianZero #${tokenId}`;
            const type = meta ? deriveNFTType(meta) : 'Unknown';
            const imageUrl = `https://adrianlab.vercel.app/api/render/${tokenId}.png`;
            const owner = owners.get(tokenId) ?? '';

            return (
              <NFTCard
                key={tokenId}
                tokenId={tokenId}
                name={name}
                imageUrl={imageUrl}
                type={type}
                owner={owner}
                onClick={() => openModal(tokenId)}
              />
            );
          })}
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-20 w-full" />

        {/* Loading indicator */}
        {isLoadingPage && (
          <div className="flex justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
          </div>
        )}

        {/* All loaded */}
        {!hasMore && loadedCount > 0 && (
          <div className="py-6 text-center text-xs text-zinc-600">
            All {totalSupply} NFTs loaded
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <NFTDetailModal owners={owners} />
    </div>
  );
}
