/**
 * CampaignGrid Component
 * Responsive grid of campaign cards
 */

import { CampaignCard } from './CampaignCard';
import type { Campaign } from '../types/rewards.types';

interface CampaignGridProps {
  campaigns: Campaign[];
  userPunks: number[];
  claimStatus: Record<string, boolean>;
}

export function CampaignGrid({ campaigns, userPunks, claimStatus }: CampaignGridProps) {
  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No campaigns available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          userPunks={userPunks}
          claimStatus={claimStatus}
        />
      ))}
    </div>
  );
}
