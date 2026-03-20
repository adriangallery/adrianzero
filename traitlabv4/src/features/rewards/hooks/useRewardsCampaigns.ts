/**
 * useRewardsCampaigns Hook
 * Loads campaign data from JSON and enriches with on-chain data
 * V4.5: Batched with multicall to eliminate N sequential RPC calls
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

      const contractAddress = CONTRACT_ADDRESSES.REWARDS_CONTRACT as `0x${string}`;

      // Batch all getCampaign calls into a single multicall
      const campaignCalls = campaignsData.campaigns.map((campaign) => ({
        address: contractAddress,
        abi: REWARDS_ABI,
        functionName: 'getCampaign' as const,
        args: [BigInt(campaign.id)],
      }));

      const results = await publicClient.multicall({
        contracts: campaignCalls,
        allowFailure: true,
      });

      return campaignsData.campaigns.map((campaign, index) => {
        const result = results[index];
        if (result.status === 'success' && result.result) {
          const onChainData = result.result as readonly unknown[];
          return {
            ...campaign,
            startTime: Number(onChainData[2]),
            endTime: Number(onChainData[3]),
            active: onChainData[4],
            totalClaimed: Number(onChainData[5]),
          } as Campaign;
        }
        return { ...campaign, active: false } as Campaign;
      });
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
