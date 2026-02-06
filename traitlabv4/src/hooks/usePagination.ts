/**
 * usePagination Hook
 * Traditional pagination for desktop with large collections (>300 items)
 * Alternative to infinite scroll for better navigation control
 */

import { useState, useMemo, useCallback } from 'react';
import { detectDeviceCapabilities } from '@/lib/web3/utils/deviceCapabilities';

export interface PaginationConfig {
  itemsPerPage?: number;
  initialPage?: number;
}

export interface PaginationState<T> {
  currentItems: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;

  hasNextPage: boolean;
  hasPrevPage: boolean;

  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
}

export function usePagination<T>(
  items: T[],
  config: PaginationConfig = {}
): PaginationState<T> {
  const capabilities = useMemo(() => detectDeviceCapabilities(), []);

  // Default items per page based on device
  const defaultItemsPerPage = capabilities.isMobile ? 50 : 100;
  const itemsPerPage = config.itemsPerPage ?? defaultItemsPerPage;
  const initialPage = config.initialPage ?? 1;

  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Calculate current page items
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);

      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [hasNextPage, currentPage, goToPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      goToPage(currentPage - 1);
    }
  }, [hasPrevPage, currentPage, goToPage]);

  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const lastPage = useCallback(() => {
    goToPage(totalPages);
  }, [totalPages, goToPage]);

  return {
    currentItems,
    currentPage,
    totalPages,
    totalItems: items.length,
    itemsPerPage,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
  };
}
