import { useEffect } from 'react';

interface UseAutoInfiniteLoadingParams {
  enabled?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  loadedCount: number;
  minimumItems: number;
  fetchNextPage: () => Promise<unknown>;
}

export function useAutoInfiniteLoading({
  enabled = true,
  hasNextPage = false,
  isFetchingNextPage = false,
  loadedCount,
  minimumItems,
  fetchNextPage,
}: UseAutoInfiniteLoadingParams) {
  useEffect(() => {
    if (!enabled || !hasNextPage || isFetchingNextPage) {
      return;
    }

    if (loadedCount >= minimumItems) {
      return;
    }

    fetchNextPage();
  }, [enabled, hasNextPage, isFetchingNextPage, loadedCount, minimumItems, fetchNextPage]);
}
