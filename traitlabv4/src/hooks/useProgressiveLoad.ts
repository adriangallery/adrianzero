/**
 * useProgressiveLoad Hook
 * Progressive loading with batching for large datasets
 * Prevents mobile crashes by loading items in chunks
 */

import { useState, useCallback, useMemo } from 'react';
import { detectDeviceCapabilities, getBatchSize } from '@/lib/web3/utils/deviceCapabilities';

export interface ProgressiveLoadConfig {
  initialCount?: number;   // Override initial load count
  batchSize?: number;      // Override batch size
  autoLoad?: boolean;      // Auto-load all items on mount
}

export interface ProgressiveLoadState<T> {
  visibleItems: T[];       // Items loaded currently
  allItems: T[];           // Full dataset

  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  progress: number;        // 0-100%

  loadedCount: number;
  totalCount: number;
  currentBatch: number;

  loadMore: () => void;
  loadAll: () => void;
  reset: () => void;
}

export function useProgressiveLoad<T>(
  items: T[],
  config: ProgressiveLoadConfig = {}
): ProgressiveLoadState<T> {
  const capabilities = useMemo(() => detectDeviceCapabilities(), []);

  const initialCount = config.initialCount ?? getBatchSize(capabilities, true);
  const batchSize = config.batchSize ?? capabilities.batchSize;

  const [loadedCount, setLoadedCount] = useState(() => {
    if (config.autoLoad) {
      return items.length; // Load all immediately if autoLoad
    }
    return Math.min(initialCount, items.length);
  });

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const visibleItems = useMemo(() => {
    return items.slice(0, loadedCount);
  }, [items, loadedCount]);

  const hasMore = loadedCount < items.length;
  const progress = items.length > 0 ? Math.round((loadedCount / items.length) * 100) : 100;
  const currentBatch = Math.ceil(loadedCount / batchSize);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);

    // Simulate async loading for smoother UX
    requestAnimationFrame(() => {
      setLoadedCount((prev) => Math.min(prev + batchSize, items.length));
      setIsLoadingMore(false);
    });
  }, [hasMore, isLoadingMore, batchSize, items.length]);

  const loadAll = useCallback(() => {
    if (!hasMore) return;

    setIsLoadingMore(true);
    requestAnimationFrame(() => {
      setLoadedCount(items.length);
      setIsLoadingMore(false);
    });
  }, [hasMore, items.length]);

  const reset = useCallback(() => {
    setLoadedCount(Math.min(initialCount, items.length));
    setIsLoadingMore(false);
  }, [initialCount, items.length]);

  return {
    visibleItems,
    allItems: items,
    isLoading: false, // Not async, so never "loading" initially
    isLoadingMore,
    hasMore,
    progress,
    loadedCount,
    totalCount: items.length,
    currentBatch,
    loadMore,
    loadAll,
    reset,
  };
}
