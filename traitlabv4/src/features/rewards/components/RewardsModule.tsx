/**
 * RewardsModule Component
 * Main rewards page for AdrianPunks holders
 */

import { useAccount } from 'wagmi';
import { Unplug, Gift, Loader2 } from 'lucide-react';
import { useRewardsCampaigns } from '../hooks/useRewardsCampaigns';
import { useClaimStatus } from '../hooks/useClaimStatus';
import { useUserPunks } from '@/features/shared/hooks/useUserPunks';
import { useHasAdrianPunks } from '@/features/shared/hooks/useHasAdrianPunks';
import { CampaignGrid } from './CampaignGrid';

export function RewardsModule({ embedded }: { embedded?: boolean } = {}) {
  const { isConnected } = useAccount();
  const { hasPunks, count: punkCount, isLoading: punksLoading } = useHasAdrianPunks();
  const { punkIds, isLoading: idsLoading } = useUserPunks();
  const { campaigns, isLoading: campaignsLoading } = useRewardsCampaigns();
  const campaignIds = campaigns.map((c) => c.id);
  const { claimStatus, isLoading: statusLoading } = useClaimStatus(campaignIds, punkIds);

  const isLoading = punksLoading || idsLoading || campaignsLoading || statusLoading;

  if (!isConnected && !embedded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Unplug className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground max-w-md">
          Connect your wallet to view and claim AdrianPunks rewards.
        </p>
      </div>
    );
  }

  if (punksLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Checking punk ownership...</p>
      </div>
    );
  }

  if (!hasPunks) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Gift className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">No AdrianPunks Found</h2>
        <p className="text-muted-foreground max-w-md">
          You need to own AdrianPunks to access rewards. Get your punks and come back to claim
          exclusive rewards!
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">AdrianPunks Rewards</h1>
        </div>
        <p className="text-muted-foreground">
          Claim exclusive rewards for your {punkCount} AdrianPunk{punkCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading campaigns...</p>
        </div>
      )}

      {/* Campaigns Grid */}
      {!isLoading && (
        <CampaignGrid campaigns={campaigns} userPunks={punkIds} claimStatus={claimStatus} />
      )}
    </div>
  );
}
