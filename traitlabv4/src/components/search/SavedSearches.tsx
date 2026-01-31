/**
 * SavedSearches Component
 * List of saved searches
 */

import type { SavedSearch } from '@/features/search/types/search.types';

interface SavedSearchesProps {
  searches: SavedSearch[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SavedSearches({ searches, onLoad, onDelete }: SavedSearchesProps) {
  if (searches.length === 0) {
    return (
      <div className="bg-card rounded-lg p-4 border border-border">
        <p className="text-sm text-muted-foreground text-center">No saved searches</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border divide-y divide-border">
      {searches.map((search) => (
        <div key={search.id} className="p-3 flex items-center justify-between hover:bg-muted">
          <button
            onClick={() => onLoad(search.id)}
            className="flex-1 text-left text-sm font-medium text-foreground hover:text-primary"
          >
            {search.name}
          </button>
          <button
            onClick={() => onDelete(search.id)}
            className="ml-2 text-muted-foreground hover:text-destructive"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
