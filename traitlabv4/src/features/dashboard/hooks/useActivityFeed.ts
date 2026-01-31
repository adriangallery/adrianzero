/**
 * useActivityFeed Hook
 * Track recent user activity
 */

import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { formatDistanceToNow } from 'date-fns';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

export interface ActivityItem {
  id: string;
  type: 'TRAIT_APPLIED' | 'PACK_OPENED' | 'TRAIT_CRAFTED' | 'NFT_RENAMED' | 'SERUM_APPLIED';
  description: string;
  timestamp: Date;
  txHash?: string;
  relativeTime: string;
}

export function useActivityFeed() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['activity-feed', address],
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!publicClient || !address) return [];

      // Get recent blocks (last ~1000 blocks = ~1 hour on Base)
      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock = latestBlock - 1000n;

      // Fetch logs for all relevant contracts
      const activities: ActivityItem[] = [];

      try {
        // Traits applied events
        const traitsLogs = await publicClient.getLogs({
          address: CONTRACT_ADDRESSES.TRAITS_EXTENSIONS as `0x${string}`,
          fromBlock,
          toBlock: 'latest',
        });

        traitsLogs.forEach((log) => {
          activities.push({
            id: `${log.transactionHash}-${log.logIndex}`,
            type: 'TRAIT_APPLIED',
            description: 'Applied traits to NFT',
            timestamp: new Date(),
            txHash: log.transactionHash,
            relativeTime: formatDistanceToNow(new Date(), { addSuffix: true }),
          });
        });

        // Name changed events
        const nameRegistryLogs = await publicClient.getLogs({
          address: CONTRACT_ADDRESSES.ADRIAN_NAME_REGISTRY as `0x${string}`,
          fromBlock,
          toBlock: 'latest',
        });

        nameRegistryLogs.forEach((log) => {
          activities.push({
            id: `${log.transactionHash}-${log.logIndex}`,
            type: 'NFT_RENAMED',
            description: 'Renamed NFT',
            timestamp: new Date(),
            txHash: log.transactionHash,
            relativeTime: formatDistanceToNow(new Date(), { addSuffix: true }),
          });
        });

        // Sort by timestamp descending (most recent first)
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Return last 20 activities
        return activities.slice(0, 20);
      } catch (error) {
        console.error('Error fetching activity feed:', error);
        return [];
      }
    },
    enabled: !!address && !!publicClient,
    staleTime: 1000 * 60, // 1 minute
  });
}
