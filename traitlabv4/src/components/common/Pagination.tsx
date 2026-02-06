/**
 * Pagination Component
 * Traditional pagination controls for desktop (>300 items)
 * Shows page numbers, navigation buttons, and item counts
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  className = '',
}: PaginationProps) {
  // Don't show pagination if only one page
  if (totalPages <= 1) {
    return null;
  }

  // Calculate visible page numbers (show 5 pages max)
  const getVisiblePages = () => {
    const delta = 2; // Pages to show on each side of current
    const pages: (number | string)[] = [];

    const rangeStart = Math.max(1, currentPage - delta);
    const rangeEnd = Math.min(totalPages, currentPage + delta);

    // First page
    if (rangeStart > 1) {
      pages.push(1);
      if (rangeStart > 2) {
        pages.push('...');
      }
    }

    // Middle pages
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    // Last page
    if (rangeEnd < totalPages) {
      if (rangeEnd < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  // Calculate item range for current page
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Item count */}
      <div className="text-sm text-muted-foreground">
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{' '}
        <strong>{totalItems}</strong> items
      </div>

      {/* Navigation controls */}
      <div className="flex items-center gap-2">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-1 text-muted-foreground">
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Compact pagination for mobile/smaller spaces
 */
export function CompactPagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: Omit<PaginationProps, 'itemsPerPage' | 'totalItems'>) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <span className="text-sm text-muted-foreground">
        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
