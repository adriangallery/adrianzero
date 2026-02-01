/**
 * DashboardModule Component
 * Portfolio overview with statistics and activity
 * V4.3: Clickable rarity buckets + Serums card
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Unplug, Frame, Palette, Package, FlaskConical } from 'lucide-react';
import { usePortfolioStats } from '../hooks/usePortfolioStats';
import { useRarityAnalytics, type RarityBucket } from '../hooks/useRarityAnalytics';
import { useActivityFeed } from '../hooks/useActivityFeed';
import { useSerums } from '@/features/serum/hooks/useSerums';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RarityChart } from '@/components/dashboard/RarityChart';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { getWalletIcon, getWalletName } from '@/config/wallets';

export function DashboardModule() {
  const { isConnected, connector } = useAccount();
  const { data: stats, isLoading: statsLoading } = usePortfolioStats();
  const { data: analytics, isLoading: analyticsLoading } = useRarityAnalytics();
  const { data: activities = [] } = useActivityFeed();
  const { data: serums = [] } = useSerums();

  // Selected rarity bucket for filtering traits display
  const [selectedBucket, setSelectedBucket] = useState<RarityBucket | null>(null);

  const walletIcon = getWalletIcon(connector?.name);
  const walletName = getWalletName(connector?.name);

  // Calculate total serum count
  const totalSerums = serums.reduce((sum, serum) => sum + serum.balance, 0);

  // Get traits to display - either from selected bucket or rarest traits
  const displayTraits = selectedBucket?.traits || analytics?.rarestTraits || [];
  const traitsTitle = selectedBucket
    ? `${selectedBucket.label} Traits (${selectedBucket.count})`
    : 'Your Rarest Traits';

  const handleBucketClick = (bucket: RarityBucket | null) => {
    setSelectedBucket(bucket);
  };

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
          <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border max-w-full min-w-0 overflow-hidden">
            <div className="w-6 h-6 flex-shrink-0">{walletIcon}</div>
            <span className="text-sm text-foreground font-medium truncate">{walletName}</span>
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
          title="Serums"
          value={totalSerums}
          icon={<FlaskConical className="h-5 w-5" />}
          description="Available serums"
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
            analytics && (
              <RarityChart
                buckets={analytics.rarityBuckets}
                selectedBucket={selectedBucket?.label}
                onBucketClick={handleBucketClick}
              />
            )
          )}
        </div>
        <div>
          <ActivityFeed activities={activities} />
        </div>
      </div>

      {/* Traits Display - Shows selected rarity bucket or rarest traits */}
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
        displayTraits.length > 0 && (
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{traitsTitle}</h3>
              {selectedBucket && (
                <button
                  onClick={() => setSelectedBucket(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Show rarest instead
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {displayTraits.slice(0, selectedBucket ? 10 : 5).map((trait) => (
                <div key={trait.tokenId} className="text-center">
                  <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                    {trait.image?.cachedUrl || trait.image?.originalUrl ? (
                      <img
                        src={trait.image.cachedUrl || trait.image.originalUrl}
                        alt={trait.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to originalUrl if cachedUrl fails
                          if (trait.image?.originalUrl && e.currentTarget.src !== trait.image.originalUrl) {
                            e.currentTarget.src = trait.image.originalUrl;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Palette className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-foreground truncate">{trait.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Supply: {trait.maxSupply || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
            {selectedBucket && selectedBucket.traits.length > 10 && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Showing 10 of {selectedBucket.traits.length} traits
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}
