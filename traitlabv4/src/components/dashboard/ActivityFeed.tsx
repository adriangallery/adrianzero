/**
 * ActivityFeed Component
 * Display recent user activity
 */

import { motion } from 'framer-motion';
import type { ActivityItem } from '@/features/dashboard/hooks/useActivityFeed';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const activityIcons: Record<ActivityItem['type'], string> = {
  TRAIT_APPLIED: '🎨',
  PACK_OPENED: '📦',
  TRAIT_CRAFTED: '⚒️',
  NFT_RENAMED: '✏️',
  SERUM_APPLIED: '🧪',
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>

      <div className="space-y-3">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 p-3 bg-muted rounded-lg"
          >
            <div className="text-2xl">{activityIcons[activity.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {activity.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{activity.relativeTime}</p>
            </div>
            {activity.txHash && (
              <a
                href={`https://basescan.org/tx/${activity.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                View
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
