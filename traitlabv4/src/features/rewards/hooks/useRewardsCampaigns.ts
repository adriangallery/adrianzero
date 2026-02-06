/**
 * useRewardsCampaigns Hook
 * Loads campaign data from JSON and enriches with on-chain data
 */

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { REWARDS_ABI } from '@/lib/web3/abi';
import campaignsData from '../data/campaigns.json';
import type { Campaign } from '../types/rewards.types';

export function useRewardsCampaigns() {
  const publicClient = usePublicClient();

  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ['rewards-campaigns'],
    queryFn: async () => {
      if (!publicClient) return campaignsData.campaigns as Campaign[];

      // Enrich campaigns with on-chain data
      const enrichedCampaigns = await Promise.all(
        campaignsData.campaigns.map(async (campaign) => {
          try {
            const onChainData = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.REWARDS_CONTRACT as `0x${string}`,
              abi: REWARDS_ABI,
              functionName: 'getCampaign',
              args: [BigInt(campaign.id)],
            });

            return {
              ...campaign,
              startTime: Number(onChainData[2]),
              endTime: Number(onChainData[3]),
              active: onChainData[4],
              totalClaimed: Number(onChainData[5]),
            } as Campaign;
          } catch (err) {
            console.error(`Error loading campaign ${campaign.id}:`, err);
            // Return campaign with default values if on-chain fetch fails
            return {
              ...campaign,
              active: false,
            } as Campaign;
          }
        })
      );

      return enrichedCampaigns;
    },
    enabled: !!publicClient,
    staleTime: 1000 * 60, // 1 minute cache
  });

  return {
    campaigns: campaigns || [],
    isLoading,
    error,
  };
}
