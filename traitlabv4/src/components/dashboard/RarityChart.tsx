/**
 * RarityChart Component
 * Display rarity distribution chart
 */

import { motion } from 'framer-motion';
import type { RarityBucket } from '@/features/dashboard/hooks/useRarityAnalytics';

interface RarityChartProps {
  buckets: RarityBucket[];
}

export function RarityChart({ buckets }: RarityChartProps) {
  const maxCount = Math.max(...buckets.map((b) => b.count));

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">Rarity Distribution</h3>

      <div className="space-y-4">
        {buckets.map((bucket, index) => (
          <div key={bucket.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-foreground">{bucket.label}</span>
              <span className="text-sm font-medium text-foreground">{bucket.count}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(bucket.count / maxCount) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
