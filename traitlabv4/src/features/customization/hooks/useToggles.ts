/**
 * useToggles Hook
 * Manage visual effect toggles (Closeup, Shadow, Glow, etc.)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZOOM_TOGGLE_ABI, ERC20_ABI } from '@/lib/web3/abi';
import { useNotifications } from '@/hooks/useNotifications';
import { formatEther, parseEther } from 'viem';

// Toggle IDs (corrected from traitlabold)
export const TOGGLE_MODES = {
  NONE: 0,
  CLOSEUP: 1,
  SHADOW: 2,
  GLOW: 3,
  BLACK_WHITE: 4,
  BLACKOUT: 12,  // Corrected from 11
  BANANA: 13,     // Corrected from 12
} as const;

export interface ToggleMode {
  id: number;
  name: string;
  description: string;
}

export const AVAILABLE_TOGGLES: ToggleMode[] = [
  { id: TOGGLE_MODES.NONE, name: 'None', description: 'No visual effects' },
  { id: TOGGLE_MODES.CLOSEUP, name: 'Closeup/Zoom', description: 'Zoomed in view' },
  { id: TOGGLE_MODES.SHADOW, name: 'Shadow Mode', description: 'Add shadow effects' },
  { id: TOGGLE_MODES.GLOW, name: 'Glow Mode', description: 'Add glow effects' },
  { id: TOGGLE_MODES.BLACK_WHITE, name: 'Black & White', description: 'Grayscale filter' },
  { id: TOGGLE_MODES.BLACKOUT, name: 'Blackout', description: 'Dark mode effect' },
  { id: TOGGLE_MODES.BANANA, name: 'Banana Mode', description: 'Special banana effect' },
];

// Get current toggle for a token
export function useTokenToggle(tokenId?: string) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['token-toggle', tokenId],
    queryFn: async () => {
      if (!publicClient || !tokenId) {
        return 0;
      }

      const toggleId = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ZOOM_TOGGLE,
        abi: ZOOM_TOGGLE_ABI,
        functionName: 'getTokenToggle',
        args: [BigInt(tokenId)],
      })) as bigint;

      return Number(toggleId);
    },
    enabled: !!publicClient && !!tokenId,
  });
}

// Get toggle price
export function useTogglePrice(toggleId: number) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['toggle-price', toggleId],
    queryFn: async () => {
      if (!publicClient || toggleId === TOGGLE_MODES.NONE) {
        return '0';
      }

      const price = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ZOOM_TOGGLE,
        abi: ZOOM_TOGGLE_ABI,
        functionName: 'getTogglePrice',
        args: [BigInt(toggleId)],
      })) as bigint;

      return price.toString();
    },
    enabled: !!publicClient && toggleId !== TOGGLE_MODES.NONE,
  });
}

// Check if user can set toggle
export function useCanSetToggle(tokenId?: string, toggleId?: number) {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  return useQuery({
    queryKey: ['can-set-toggle', address, tokenId, toggleId],
    queryFn: async () => {
      if (!publicClient || !address || !tokenId || toggleId === undefined) {
        return { canSet: false, reason: 'Missing parameters' };
      }

      const [canSet, reason] = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ZOOM_TOGGLE,
        abi: ZOOM_TOGGLE_ABI,
        functionName: 'canSetToggle',
        args: [address, BigInt(tokenId), BigInt(toggleId)],
      })) as [boolean, string];

      return { canSet, reason };
    },
    enabled: !!publicClient && !!address && !!tokenId && toggleId !== undefined,
  });
}

// Set toggle mutation (for standard toggles)
export function useSetToggle() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const notifications = useNotifications();

  const mutation = useMutation({
    mutationFn: async ({ tokenId, toggleId }: { tokenId: string; toggleId: number }) => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.ZOOM_TOGGLE,
        abi: ZOOM_TOGGLE_ABI,
        functionName: 'setToggle',
        args: [BigInt(tokenId), BigInt(toggleId)],
      });

      console.log('Set toggle transaction sent:', hash);

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
    onSuccess: (hash, variables) => {
      console.log('Toggle set successfully:', hash);
      const toggleName = AVAILABLE_TOGGLES.find(t => t.id === variables.toggleId)?.name || 'effect';
      notifications.success(
        'Visual Effect Applied!',
        `${toggleName} has been applied to your NFT`
      );
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['token-toggle', variables.tokenId] });
      queryClient.invalidateQueries({ queryKey: ['adrianzero-tokens'] });
    },
    onError: (error) => {
      console.error('Error setting toggle:', error);
      notifications.error('Failed to Apply Effect', 'Could not apply visual effect. Please try again.');
    },
  });

  return mutation;
}

// Special mutation for Banana toggle (requires ADRIAN token payment)
export function useSetBananaToggle() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const notifications = useNotifications();

  const mutation = useMutation({
    mutationFn: async ({ tokenId, isRemoving = false }: { tokenId: string; isRemoving?: boolean }) => {
      if (!publicClient || !address) {
        throw new Error('Wallet not connected');
      }

      // If removing, just set toggle to 0 (free)
      if (isRemoving) {
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.ZOOM_TOGGLE,
          abi: ZOOM_TOGGLE_ABI,
          functionName: 'setToggle',
          args: [BigInt(tokenId), BigInt(0)],
        });

        await publicClient.waitForTransactionReceipt({ hash });
        return hash;
      }

      // Check price for banana toggle (ID 13)
      const togglePrice = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ZOOM_TOGGLE,
        abi: ZOOM_TOGGLE_ABI,
        functionName: 'getTogglePrice',
        args: [BigInt(TOGGLE_MODES.BANANA)],
      })) as bigint;

      console.log('🍌 Banana toggle price:', formatEther(togglePrice), 'ADRIAN');

      // If price is 0, activate directly without payment
      if (togglePrice === 0n) {
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.ZOOM_TOGGLE,
          abi: ZOOM_TOGGLE_ABI,
          functionName: 'setToggle',
          args: [BigInt(tokenId), BigInt(TOGGLE_MODES.BANANA)],
        });

        await publicClient.waitForTransactionReceipt({ hash });
        return hash;
      }

      // Check current allowance
      const currentAllowance = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ADRIAN_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, CONTRACT_ADDRESSES.ZOOM_TOGGLE as `0x${string}`],
      })) as bigint;

      console.log('Current ADRIAN allowance:', formatEther(currentAllowance));
      console.log('Required amount:', formatEther(togglePrice));

      // If insufficient allowance, approve tokens
      if (currentAllowance < togglePrice) {
        console.log('💳 Approving ADRIAN tokens for toggle contract...');

        // Approve a larger amount to avoid multiple approvals (10k ADRIAN)
        const approveAmount = parseEther('10000');
        const approveHash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.ADRIAN_TOKEN as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.ZOOM_TOGGLE as `0x${string}`, approveAmount],
        });

        console.log('⏳ Waiting for approval transaction...');
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        console.log('✅ ADRIAN tokens approved');

        notifications.success(
          'Tokens Approved',
          'ADRIAN tokens approved. Now activating Banana mode...'
        );
      } else {
        console.log('✅ Sufficient allowance already exists');
      }

      // Execute setToggle to activate banana (this will charge the ADRIAN tokens)
      console.log('💾 Activating BANANA toggle (ID=13) for token', tokenId);
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.ZOOM_TOGGLE,
        abi: ZOOM_TOGGLE_ABI,
        functionName: 'setToggle',
        args: [BigInt(tokenId), BigInt(TOGGLE_MODES.BANANA)],
      });

      console.log('⏳ Waiting for transaction confirmation...');
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
    onSuccess: (hash, variables) => {
      console.log('Banana toggle success:', hash);
      if (variables.isRemoving) {
        notifications.success(
          'Banana Mode Removed',
          'Banana effect has been removed from your NFT'
        );
      } else {
        notifications.success(
          '🍌 Banana Mode Activated!',
          'Banana effect has been applied to your NFT'
        );
      }
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['token-toggle', variables.tokenId] });
      queryClient.invalidateQueries({ queryKey: ['adrianzero-tokens'] });
    },
    onError: (error) => {
      console.error('Error setting banana toggle:', error);
      notifications.error(
        'Banana Mode Failed',
        'Could not apply banana effect. Please check you have enough ADRIAN tokens.'
      );
    },
  });

  return mutation;
}
