import { useEffect, useRef, useMemo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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

function getColumnCount(width: number): number {
  if (width >= 1280) return 8;
  if (width >= 1024) return 6;
  if (width >= 768) return 5;
  if (width >= 640) return 4;
  return 3;
}

export function GalleryModule() {
  const { totalSupply, owners, loadedCount, isLoadingSupply, isLoadingPage, hasMore, loadNextPage, error } =
    useTokenList();
  const { activeFilter, setActiveFilter, openModal, setTokenIds, metadataCache } = useGalleryStore();

  // Responsive column count
  const [columns, setColumns] = useState(() =>
    getColumnCount(typeof window !== 'undefined' ? window.innerWidth : 375)
  );

  useEffect(() => {
    const onResize = () => setColumns(getColumnCount(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Build sorted token ID list from loaded owners
  const allTokenIds = useMemo(() => {
    return Array.from(owners.keys()).sort((a, b) => a - b);
  }, [owners]);

  // Fetch metadata for currently loaded tokens
  useTokenMetadata(allTokenIds);

  // Filter by type (try-catch to prevent crash on malformed metadata)
  const filteredTokenIds = useMemo(() => {
    if (activeFilter === 'All') return allTokenIds;
    return allTokenIds.filter((id) => {
      const meta = metadataCache.get(id);
      if (!meta) return false;
      try {
        return deriveNFTType(meta) === activeFilter;
      } catch {
        return false;
      }
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

  // Count per type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allTokenIds.length };
    for (const id of allTokenIds) {
      const meta = metadataCache.get(id);
      if (meta) {
        try {
          const t = deriveNFTType(meta);
          counts[t] = (counts[t] || 0) + 1;
        } catch {
          // skip malformed metadata
        }
      }
    }
    return counts;
  }, [allTokenIds, metadataCache]);

  // Virtual scrolling
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowCount = Math.ceil(filteredTokenIds.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 160,
    overscan: 3,
  });

  // Infinite scroll: load more when near the bottom or when filter has no results yet
  const virtualItems = rowVirtualizer.getVirtualItems();
  useEffect(() => {
    if (!hasMore || isLoadingPage) return;
    // If filtered list is empty but more tokens exist, keep loading
    if (filteredTokenIds.length === 0) {
      loadNextPage();
      return;
    }
    const lastItem = virtualItems[virtualItems.length - 1];
    if (lastItem && lastItem.index >= rowCount - 2) {
      loadNextPage();
    }
  }, [virtualItems, rowCount, hasMore, isLoadingPage, loadNextPage, filteredTokenIds.length]);

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
    const shortMessage = error.message?.split('\n')[0]?.slice(0, 120) || 'Failed to load collection';
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">!!!</div>
          <div className="text-lg font-semibold text-white">Failed to Load</div>
          <div className="mt-2 text-xs text-zinc-500">{shortMessage}</div>
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
    <div className="flex flex-col h-screen w-full bg-black">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 bg-black/90 backdrop-blur-sm px-4 py-3">
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

      {/* Virtual scroll container */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-3 py-4">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
            width: '100%',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const startIdx = virtualRow.index * columns;
            const rowTokenIds = filteredTokenIds.slice(startIdx, startIdx + columns);

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div
                  className="grid gap-2 pb-2"
                  style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                >
                  {rowTokenIds.map((tokenId) => {
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
              </div>
            );
          })}
        </div>

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
