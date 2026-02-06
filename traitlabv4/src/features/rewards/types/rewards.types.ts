/**
 * REWARDS Module Types
 */

export interface Campaign {
  id: number;
  name: string;
  description: string;
  assetId: number;
  amountPerToken: number;
  // On-chain data (loaded separately)
  startTime?: number;
  endTime?: number;
  active?: boolean;
  totalClaimed?: number;
}

export interface ClaimStatus {
  campaignId: number;
  punkId: number;
  claimed: boolean;
  canClaim: boolean;
  reason?: string;
}

export interface CampaignStats {
  eligiblePunks: number;
  claimedPunks: number;
  unclaimedPunks: number;
}
