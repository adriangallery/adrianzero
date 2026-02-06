/**
 * ProgressiveLoadIndicator Component
 * Shows loading progress and "Load More" button for progressive loading
 */

import { Loader2 } from 'lucide-react';

interface ProgressiveLoadIndicatorProps {
  loadedCount: number;
  totalCount: number;
  isLoading?: boolean;
  onLoadMore?: () => void;
  onLoadAll?: () => void;
  showProgress?: boolean;
  className?: string;
}

export function ProgressiveLoadIndicator({
  loadedCount,
  totalCount,
  isLoading = false,
  onLoadMore,
  onLoadAll,
  showProgress = true,
  className = '',
}: ProgressiveLoadIndicatorProps) {
  const progress = totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 100;
  const hasMore = loadedCount < totalCount;
  const hasActions = Boolean(onLoadMore || onLoadAll);

  if (!hasMore && !isLoading) {
    return null; // Nothing to show if all loaded
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {loadedCount} / {totalCount}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      {hasMore && hasActions && (
        <div className="flex items-center justify-center gap-3">
          {onLoadMore && (
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Load More ({Math.min(totalCount - loadedCount, 25)})
            </button>
          )}

          {onLoadAll && totalCount - loadedCount > 25 && (
            <button
              onClick={onLoadAll}
              disabled={isLoading}
              className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Load All ({totalCount - loadedCount} remaining)
            </button>
          )}
        </div>
      )}

      {hasMore && !hasActions && !isLoading && (
        <div className="text-center text-sm text-muted-foreground">
          Loading automatically as you browse
        </div>
      )}

      {/* Loading State */}
      {isLoading && !hasMore && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      )}
    </div>
  );
}
