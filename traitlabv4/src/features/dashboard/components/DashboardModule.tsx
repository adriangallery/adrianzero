/**
 * DashboardModule Component
 * Portfolio overview with statistics and activity
 */

import { useAccount } from 'wagmi';
import { usePortfolioStats } from '../hooks/usePortfolioStats';
import { useRarityAnalytics } from '../hooks/useRarityAnalytics';
import { useActivityFeed } from '../hooks/useActivityFeed';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RarityChart } from '@/components/dashboard/RarityChart';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';

export function DashboardModule() {
  const { isConnected } = useAccount();
  const { data: stats, isLoading: statsLoading } = usePortfolioStats();
  const { data: analytics, isLoading: analyticsLoading } = useRarityAnalytics();
  const { data: activities = [] } = useActivityFeed();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🔌</div>
        <h2 className="text-xl font-semibold text-foreground">Wallet Not Connected</h2>
        <p className="text-muted-foreground mt-2">
          Connect your wallet to view your dashboard
        </p>
      </div>
    );
  }

  if (statsLoading || analyticsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="shimmer w-16 h-16 rounded-full mb-4" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your AdrianZERO portfolio overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total NFTs"
          value={stats?.totalNFTs || 0}
          icon="🖼️"
          description="AdrianZERO tokens owned"
        />
        <StatsCard
          title="Total Traits"
          value={stats?.totalTraits || 0}
          icon="🎨"
          description="Trait items in inventory"
        />
        <StatsCard
          title="Total Packs"
          value={stats?.totalPacks || 0}
          icon="📦"
          description="Unopened packs"
        />
        <StatsCard
          title="Customized NFTs"
          value={stats?.traitsAppliedCount || 0}
          icon="✨"
          description="NFTs with applied traits"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {analytics && <RarityChart buckets={analytics.rarityBuckets} />}
        </div>
        <div>
          <ActivityFeed activities={activities} />
        </div>
      </div>

      {/* Rarest Traits */}
      {analytics && analytics.rarestTraits.length > 0 && (
        <div className="bg-card rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Your Rarest Traits</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {analytics.rarestTraits.map((trait) => (
              <div key={trait.tokenId} className="text-center">
                <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center text-4xl">
                  🎨
                </div>
                <p className="text-xs font-medium text-foreground truncate">{trait.name}</p>
                <p className="text-xs text-muted-foreground">
                  Supply: {trait.maxSupply || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
