/**
 * DashboardModule Component
 * Portfolio overview with statistics and activity
 */

import { useAccount } from 'wagmi';
import { Unplug, Frame, Palette, Package, Sparkles } from 'lucide-react';
import { usePortfolioStats } from '../hooks/usePortfolioStats';
import { useRarityAnalytics } from '../hooks/useRarityAnalytics';
import { useActivityFeed } from '../hooks/useActivityFeed';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RarityChart } from '@/components/dashboard/RarityChart';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { getWalletIcon, getWalletName } from '@/config/wallets';

export function DashboardModule() {
  const { isConnected, connector } = useAccount();
  const { data: stats, isLoading: statsLoading } = usePortfolioStats();
  const { data: analytics, isLoading: analyticsLoading } = useRarityAnalytics();
  const { data: activities = [] } = useActivityFeed();

  const walletIcon = getWalletIcon(connector?.name);
  const walletName = getWalletName(connector?.name);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Unplug className="h-16 w-16 mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Wallet Not Connected</h2>
        <p className="text-muted-foreground mt-2">
          Connect your wallet to view your dashboard
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your AdrianZERO portfolio overview</p>
        </div>
        {connector && (
          <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border">
            <div className="w-6 h-6">{walletIcon}</div>
            <span className="text-sm text-foreground font-medium">{walletName}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total NFTs"
          value={stats?.totalNFTs || 0}
          icon={<Frame className="h-5 w-5" />}
          description="AdrianZERO tokens owned"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Total Traits"
          value={stats?.totalTraits || 0}
          icon={<Palette className="h-5 w-5" />}
          description="Trait items in inventory"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Total Packs"
          value={stats?.totalPacks || 0}
          icon={<Package className="h-5 w-5" />}
          description="Unopened packs"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Customized NFTs"
          value={stats?.traitsAppliedCount || 0}
          icon={<Sparkles className="h-5 w-5" />}
          description="NFTs with applied traits"
          isLoading={statsLoading}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {analyticsLoading ? (
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="skeleton h-8 w-48 mb-4" />
              <div className="skeleton h-64 w-full" />
            </div>
          ) : (
            analytics && <RarityChart buckets={analytics.rarityBuckets} />
          )}
        </div>
        <div>
          <ActivityFeed activities={activities} />
        </div>
      </div>

      {/* Rarest Traits */}
      {analyticsLoading ? (
        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="skeleton h-6 w-48 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="aspect-square skeleton rounded-lg mb-2" />
                <div className="skeleton h-4 w-full mb-1" />
                <div className="skeleton h-3 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        analytics && analytics.rarestTraits.length > 0 && (
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Your Rarest Traits</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {analytics.rarestTraits.map((trait) => (
                <div key={trait.tokenId} className="text-center">
                  <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center">
                    <Palette className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-medium text-foreground truncate">{trait.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Supply: {trait.maxSupply || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
