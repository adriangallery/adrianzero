/**
 * DashboardModule Component
 * Portfolio overview with statistics and activity
 * V4.3: Clickable rarity buckets + Serums card
 */

import { useAccount } from 'wagmi';
import { Unplug, Frame, Palette, Package, FlaskConical } from 'lucide-react';
import { usePortfolioStats } from '../hooks/usePortfolioStats';
import { useSerums } from '@/features/serum/hooks/useSerums';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { getWalletIcon, getWalletName } from '@/config/wallets';

export function DashboardModule() {
  const { isConnected, connector } = useAccount();
  const { data: stats, isLoading: statsLoading } = usePortfolioStats();
  const { data: serums = [] } = useSerums();

  const walletIcon = getWalletIcon(connector?.name);
  const walletName = getWalletName(connector?.name);

  // Calculate total serum count
  const totalSerums = serums.reduce((sum, serum) => sum + serum.balance, 0);

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

    </div>
  );
}
