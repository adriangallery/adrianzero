/**
 * Punks Module
 * Merged Rewards + OG Claim for AdrianPunks holders
 * Will be fleshed out in Phase 5
 */

import { Suspense, lazy, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

const RewardsModule = lazy(() =>
  import('@/features/rewards/components/RewardsModule').then((m) => ({
    default: m.RewardsModule,
  }))
);
const OGClaimModule = lazy(() =>
  import('@/features/ogclaim/components/OGClaimModule').then((m) => ({
    default: m.OGClaimModule,
  }))
);

const TABS = [
  { id: 'rewards', label: 'Rewards' },
  { id: 'ogclaim', label: 'OG Claims' },
] as const;

export function PunksModule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'rewards';

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Adrian<span className="text-[#00ff00]">Punks</span>
      </h1>

      {/* Tab Bar */}
      <div className="flex gap-2 border-b border-border pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSearchParams(tab.id === 'rewards' ? {} : { tab: tab.id })}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#00ff00] text-black font-bold'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <Suspense fallback={<LoadingSkeleton />}>
        {activeTab === 'ogclaim' ? <OGClaimModule embedded /> : <RewardsModule embedded />}
      </Suspense>
    </div>
  );
}
