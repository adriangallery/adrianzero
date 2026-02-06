/**
 * CampaignCard Component
 * Individual campaign card with claim functionality
 */

import { useState, useMemo } from 'react';
import { Gift, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { ClaimButton } from './ClaimButton';
import { useClaimReward } from '../hooks/useClaimReward';
import { useNotificationStore } from '@/store/notificationStore';
import { getClaimStatusKey } from '../hooks/useClaimStatus';
import type { Campaign } from '../types/rewards.types';

interface CampaignCardProps {
  campaign: Campaign;
  userPunks: number[];
  claimStatus: Record<string, boolean>;
}

export function CampaignCard({ campaign, userPunks, claimStatus }: CampaignCardProps) {
  const [selectedPunks, setSelectedPunks] = useState<number[]>([]);
  const { claim, isLoading, errorMessage } = useClaimReward();
  const addNotification = useNotificationStore((state) => state.addNotification);

  // Calculate stats
  const stats = useMemo(() => {
    const eligible = userPunks.filter((punkId) => {
      const key = getClaimStatusKey(campaign.id, punkId);
      return !claimStatus[key];
    });

    const claimed = userPunks.filter((punkId) => {
      const key = getClaimStatusKey(campaign.id, punkId);
      return claimStatus[key];
    });

    return {
      eligible: eligible.length,
      claimed: claimed.length,
      total: userPunks.length,
      eligibleIds: eligible,
    };
  }, [campaign.id, userPunks, claimStatus]);

  // Check if campaign is active
  const isActive = campaign.active !== false;
  const now = Math.floor(Date.now() / 1000);
  const isStarted = !campaign.startTime || campaign.startTime <= now;
  const isEnded = campaign.endTime && campaign.endTime < now;

  const canClaim = isActive && isStarted && !isEnded && stats.eligible > 0;

  const handleClaim = async () => {
    const punksToClaim = selectedPunks.length > 0 ? selectedPunks : stats.eligibleIds;

    if (punksToClaim.length === 0) {
      addNotification('warning', 'No Punks Selected', 'Select punks to claim rewards.');
      return;
    }

    try {
      await claim(
        { campaignId: campaign.id, punkIds: punksToClaim },
        {
          onSuccess: () => {
            addNotification(
              'success',
              'Rewards Claimed!',
              `Successfully claimed rewards for ${punksToClaim.length} punk${punksToClaim.length > 1 ? 's' : ''}.`
            );
            setSelectedPunks([]);
          },
          onError: () => {
            addNotification('error', 'Claim Failed', errorMessage || 'Failed to claim rewards.');
          },
        }
      );
    } catch {
      // Error handled by mutation
    }
  };

  const getStatusBadge = () => {
    if (isEnded) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-500">
          <XCircle className="h-3 w-3" />
          Ended
        </span>
      );
    }
    if (!isStarted) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/10 text-yellow-500">
          <Clock className="h-3 w-3" />
          Not Started
        </span>
      );
    }
    if (!isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-500/10 text-gray-500">
          <XCircle className="h-3 w-3" />
          Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-500">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </span>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{campaign.name}</h3>
            <p className="text-sm text-muted-foreground">Asset #{campaign.assetId}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <p className="text-sm text-muted-foreground mb-4">{campaign.description}</p>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Your Punks</p>
        </div>
        <div className="text-center p-3 bg-green-500/10 rounded-lg">
          <p className="text-2xl font-bold text-green-500">{stats.eligible}</p>
          <p className="text-xs text-muted-foreground">Eligible</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-2xl font-bold text-foreground">{stats.claimed}</p>
          <p className="text-xs text-muted-foreground">Claimed</p>
        </div>
      </div>

      <div className="flex gap-2">
        <ClaimButton
          onClick={handleClaim}
          disabled={!canClaim}
          loading={isLoading}
          claimed={stats.eligible === 0 && stats.claimed > 0}
        >
          {stats.eligible === 0 && stats.claimed > 0
            ? 'All Claimed'
            : stats.eligible > 0
              ? `Claim ${stats.eligible} Punk${stats.eligible > 1 ? 's' : ''}`
              : 'No Eligible Punks'}
        </ClaimButton>
      </div>

      {campaign.totalClaimed !== undefined && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Total Claims: {campaign.totalClaimed}
        </p>
      )}
    </div>
  );
}
