/**
 * StatsSection Component
 * Displays global OG claim statistics with progress bar
 */

import { TrendingUp, Award } from 'lucide-react';
import { useOGClaimStats } from '../hooks/useOGClaimStats';

export function StatsSection() {
  const { stats, isLoading } = useOGClaimStats();

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-12 bg-muted rounded mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Award className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Global Statistics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-3xl font-bold text-foreground">{stats.totalClaimed}</p>
          <p className="text-sm text-muted-foreground">Total Claimed</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-3xl font-bold text-foreground">
            {stats.totalSupply - stats.totalClaimed}
          </p>
          <p className="text-sm text-muted-foreground">Unclaimed</p>
        </div>
        <div className="text-center p-4 bg-primary/10 rounded-lg">
          <p className="text-3xl font-bold text-primary">{stats.percentClaimed.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">Progress</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Claim Progress</span>
          <span className="text-sm font-medium text-foreground">
            {stats.totalClaimed} / {stats.totalSupply}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary to-green-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1"
            style={{ width: `${stats.percentClaimed}%` }}
          >
            {stats.percentClaimed > 5 && (
              <TrendingUp className="h-3 w-3 text-white animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
