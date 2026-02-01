/**
 * RarityChart Component
 * Display rarity distribution chart with clickable buckets
 * V4.3: Clickable buckets + progress bar based on owned count
 */

import { motion } from 'framer-motion';
import type { RarityBucket } from '@/features/dashboard/hooks/useRarityAnalytics';

interface RarityChartProps {
  buckets: RarityBucket[];
  selectedBucket?: string | null;
  onBucketClick?: (bucket: RarityBucket | null) => void;
}

export function RarityChart({ buckets, selectedBucket, onBucketClick }: RarityChartProps) {
  // Calculate total traits count across all buckets for percentage
  const totalTraits = buckets.reduce((sum, b) => sum + b.count, 0);

  const handleBucketClick = (bucket: RarityBucket) => {
    if (!onBucketClick) return;

    // Toggle selection: if same bucket is clicked, deselect
    if (selectedBucket === bucket.label) {
      onBucketClick(null);
    } else {
      onBucketClick(bucket);
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Rarity Distribution</h3>
        {selectedBucket && onBucketClick && (
          <button
            onClick={() => onBucketClick(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="space-y-4">
        {buckets.map((bucket, index) => {
          const isSelected = selectedBucket === bucket.label;
          const percentage = totalTraits > 0 ? (bucket.count / totalTraits) * 100 : 0;

          return (
            <button
              key={bucket.label}
              onClick={() => handleBucketClick(bucket)}
              disabled={!onBucketClick}
              className={`w-full text-left transition-all ${
                onBucketClick ? 'cursor-pointer hover:bg-muted/30 rounded-lg p-2 -mx-2' : ''
              } ${isSelected ? 'bg-muted/50 rounded-lg p-2 -mx-2' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isSelected ? 'font-semibold text-primary' : 'text-foreground'}`}>
                    {bucket.label}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                      Selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {percentage.toFixed(0)}%
                  </span>
                  <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {bucket.count}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`h-full rounded-full ${isSelected ? 'bg-primary' : 'bg-primary/70'}`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {totalTraits > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Owned Traits</span>
            <span className="font-medium text-foreground">{totalTraits}</span>
          </div>
        </div>
      )}
    </div>
  );
}
