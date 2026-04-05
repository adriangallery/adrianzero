/**
 * DashboardPanel Component
 * Compact portfolio overview for embedding in Home/Landing page
 * Shows stats, rarest traits, and quick action links
 */

import { Link } from 'react-router-dom';
import { Frame, Palette, Package, FlaskConical, ArrowRight } from 'lucide-react';
import { usePortfolioStats } from '../hooks/usePortfolioStats';
import { useRarityAnalytics } from '../hooks/useRarityAnalytics';
import { useSerums } from '@/features/serum/hooks/useSerums';

export function DashboardPanel() {
  const { data: stats, isLoading: statsLoading } = usePortfolioStats();
  const { data: analytics } = useRarityAnalytics();
  const { data: serums = [] } = useSerums();

  const totalSerums = serums.reduce((sum, serum) => sum + serum.balance, 0);
  const displayTraits = analytics?.rarestTraits?.slice(0, 5) || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-white/20 bg-[#0d1a33]/80 p-6 backdrop-blur">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black uppercase tracking-[0.08em] text-white">
            Your Portfolio
          </h3>
          <Link
            to="/mynfts"
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#00ff00] hover:underline"
          >
            My NFTs <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
          <StatPill
            icon={<Frame className="h-4 w-4" />}
            label="NFTs"
            value={statsLoading ? '...' : String(stats?.totalNFTs || 0)}
          />
          <StatPill
            icon={<Palette className="h-4 w-4" />}
            label="Traits"
            value={statsLoading ? '...' : String(stats?.totalTraits || 0)}
          />
          <StatPill
            icon={<Package className="h-4 w-4" />}
            label="Packs"
            value={statsLoading ? '...' : String(stats?.totalPacks || 0)}
          />
          <StatPill
            icon={<FlaskConical className="h-4 w-4" />}
            label="Serums"
            value={statsLoading ? '...' : String(totalSerums)}
          />
        </div>

        {/* Rarest Traits */}
        {displayTraits.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9dc8ff] mb-3">
              Your Rarest Traits
            </p>
            <div className="grid grid-cols-5 gap-2">
              {displayTraits.map((trait) => (
                <div key={trait.tokenId} className="text-center">
                  <div className="aspect-square bg-[#0a1020] rounded-lg overflow-hidden border border-white/10">
                    {trait.image?.cachedUrl || trait.image?.originalUrl ? (
                      <img
                        src={trait.image.cachedUrl || trait.image.originalUrl}
                        alt={trait.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Palette className="h-6 w-6 text-white/20" />
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] text-white/70 mt-1 truncate">{trait.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!statsLoading && stats?.totalNFTs === 0 && (
          <div className="mt-4 rounded-lg border border-[#00ff00]/30 bg-[#00ff00]/10 p-3 flex items-center justify-between">
            <p className="text-sm text-white font-medium">No NFTs yet — mint your first ZERO!</p>
            <Link
              to="/mint"
              className="flex-shrink-0 px-3 py-1.5 bg-[#00ff00] text-black text-xs font-bold rounded-lg"
            >
              Mint Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[#00ff00]">{icon}</div>
      <div>
        <p className="text-lg font-black text-white leading-none">{value}</p>
        <p className="text-[10px] uppercase tracking-wider text-white/50">{label}</p>
      </div>
    </div>
  );
}
