/**
 * DashboardModule Component
 * Portfolio overview with statistics and activity
 * V4.3: Clickable rarity buckets + Serums card
 */

import { useAccount } from 'wagmi';
import { Frame, Palette, Package, FlaskConical, Sparkles, ArrowRight } from 'lucide-react';
import { usePortfolioStats } from '../hooks/usePortfolioStats';
import { useRarityAnalytics } from '../hooks/useRarityAnalytics';
import { useSerums } from '@/features/serum/hooks/useSerums';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { getWalletIcon, getWalletName } from '@/config/wallets';
import { useNavigate } from 'react-router-dom';

export function DashboardModule() {
  const { isConnected, connector } = useAccount();
  const { data: stats, isLoading: statsLoading } = usePortfolioStats();
  const { data: analytics, isLoading: analyticsLoading } = useRarityAnalytics();
  const { data: serums = [] } = useSerums();
  const navigate = useNavigate();

  const walletIcon = getWalletIcon(connector?.name);
  const walletName = getWalletName(connector?.name);

  // Calculate total serum count
  const totalSerums = serums.reduce((sum, serum) => sum + serum.balance, 0);

  // Get rarest traits to display
  const displayTraits = analytics?.rarestTraits || [];

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-[#00ff00]" />
            <h1 className="text-3xl font-bold text-foreground">
              Welcome to <span className="text-[#00ff00]">TraitLAB</span>
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Explore the platform in demo mode or connect your wallet to manage your AdrianZERO NFTs and traits
          </p>
        </div>

        {/* Demo Cards */}
        <div className="grid md:grid-cols-2 gap-4 w-full mb-8">
          {/* NFTs Card */}
          <button
            onClick={() => navigate('/adrianzero')}
            className="group bg-card border border-border rounded-lg p-6 text-left hover:border-[#00ff00] transition-all hover:shadow-lg hover:shadow-[#00ff00]/10"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#00ff00]/10 rounded-lg">
                <Frame className="h-6 w-6 text-[#00ff00]" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#00ff00] transition-colors" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Explore Demo NFT
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              View AdrianZERO #146 and see how the trait application system works
            </p>
            <div className="flex items-center gap-2 text-xs text-[#00ff00]">
              <span className="font-medium">Try Demo</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </button>

          {/* Traits Card */}
          <button
            onClick={() => navigate('/traits')}
            className="group bg-card border border-border rounded-lg p-6 text-left hover:border-[#00ff00] transition-all hover:shadow-lg hover:shadow-[#00ff00]/10"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#00ff00]/10 rounded-lg">
                <Palette className="h-6 w-6 text-[#00ff00]" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#00ff00] transition-colors" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Browse Mock Traits
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Explore 11 sample traits and preview how they look on NFTs
            </p>
            <div className="flex items-center gap-2 text-xs text-[#00ff00]">
              <span className="font-medium">View Traits</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-muted/50 border border-border rounded-lg p-4 w-full">
          <p className="text-sm text-center text-muted-foreground">
            <span className="font-medium text-foreground">Demo Mode:</span> You're viewing sample data.
            <span className="text-[#00ff00] font-medium ml-1">Connect your wallet</span> from the top-right menu to access your real NFTs and traits.
          </p>
        </div>
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

      {/* Rarest Traits Display */}
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
              <h3 className="text-lg font-semibold text-foreground">Your Rarest Traits</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {displayTraits.slice(0, 5).map((trait) => (
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
          </div>
        )
      )}
    </div>
  );
}
