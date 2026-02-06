import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FREE_MINTER_ABI } from '@/lib/web3/abi/freeminter.abi';
import type { MintConfig } from '../types/shitdrop.types';

const FREE_MINTER_ADDRESS = '0xC7504Da92303ed991704A6eaeeF99B569b2B57Bf' as `0x${string}`;

export function useShitdrop() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();

  // Query: Is mint active
  const { data: isActive = false } = useQuery({
    queryKey: ['shitdrop-active'],
    queryFn: async () => {
      if (!publicClient) return false;

      try {
        const result = await publicClient.readContract({
          address: FREE_MINTER_ADDRESS,
          abi: FREE_MINTER_ABI,
          functionName: 'isActiveNow',
        });

        return result as boolean;
      } catch (error) {
        console.error('Error checking if active:', error);
        return false;
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    enabled: !!publicClient,
  });

  // Query: User minted count
  const { data: userMinted = 0 } = useQuery({
    queryKey: ['shitdrop-user-minted', address],
    queryFn: async () => {
      if (!publicClient || !address) return 0;

      try {
        const result = await publicClient.readContract({
          address: FREE_MINTER_ADDRESS,
          abi: FREE_MINTER_ABI,
          functionName: 'getUserMinted',
          args: [address],
        });

        return Number(result);
      } catch (error) {
        console.error('Error getting user minted:', error);
        return 0;
      }
    },
    enabled: !!publicClient && !!address,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Query: Mint configuration
  const { data: config = null } = useQuery<MintConfig | null>({
    queryKey: ['shitdrop-config'],
    queryFn: async () => {
      if (!publicClient) return null;

      try {
        const result = await publicClient.readContract({
          address: FREE_MINTER_ADDRESS,
          abi: FREE_MINTER_ABI,
          functionName: 'config',
        });

        const [tokenId, startTime, endTime, maxPerWallet] = result as [
          bigint,
          bigint,
          bigint,
          bigint
        ];

        return {
          tokenId,
          startTime,
          endTime,
          maxPerWallet,
        };
      } catch (error) {
        console.error('Error getting config:', error);
        return null;
      }
    },
    enabled: !!publicClient,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mutation: Mint
  const mintMutation = useMutation({
    mutationFn: async () => {
      if (!walletClient || !address) {
        throw new Error('Wallet not connected');
      }

      if (!isActive) {
        throw new Error('Mint is not active');
      }

      if (config && userMinted >= Number(config.maxPerWallet)) {
        throw new Error('You have reached the per-wallet limit');
      }

      // Call mint function
      const hash = await walletClient.writeContract({
        address: FREE_MINTER_ADDRESS,
        abi: FREE_MINTER_ABI,
        functionName: 'mint',
        args: [1n],
        gas: 300000n,
      });

      // Wait for transaction
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      return hash;
    },
    onSuccess: () => {
      // Refetch user minted count
      queryClient.invalidateQueries({ queryKey: ['shitdrop-user-minted'] });
    },
  });

  return {
    isActive,
    userMinted,
    config,
    mint: mintMutation.mutate,
    isMinting: mintMutation.isPending,
    mintError: mintMutation.error,
    mintSuccess: mintMutation.isSuccess,
  };
}
