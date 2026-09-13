import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { parseEventLogs } from 'viem';
import { ADRIAN_FLOPPY_DISCS_DATA_ABI, OPENPACK_V4_DATA_ABI, ACTION_PACKS_DATA_ABI } from './packsData.abi';
import { humanError } from '@/lib/web3/humanError';
import { resolvePackOpenContract } from './packRegistry';
import type { OpenPackResult } from './types';

export interface OpenPackParams {
  packId: bigint;
  /** Solo tiene efecto en OpenPack v4 (`openPacks(packId, quantity)`); el resto abre de 1 en 1. */
  quantity?: bigint;
}

/**
 * Abre un pack con el contrato que de verdad lo tiene configurado — resuelto
 * en vivo con `resolvePackOpenContract` (mismo criterio que
 * `packRegistry.ts`), no con una tabla `OPENPACK_V4_TOKENS`/
 * `ACTION_PACK_TOKENS` a mano (la causa raíz de
 * `PACKS_FLOPPIES_MISMATCH_REPORT.md`: 10014/10018 nunca se añadieron a
 * esa lista y no se podían abrir).
 *
 * Decodifica el evento REAL del receipt (`PackOpened` en
 * FloppyDiscs/ActionPacks, `PacksOpened` en OpenPack v4 — nombres y
 * shapes distintos, verificados contra el ABI de Blockscout, ver
 * `__tests__/abiCrossCheck.test.ts`) para devolver los traitIds obtenidos,
 * listos para pasar a TraitLab.
 */
export function useOpenPack() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();

  const mutation = useMutation<OpenPackResult, Error, OpenPackParams>({
    mutationFn: async ({ packId, quantity = 1n }) => {
      if (!address || !publicClient) throw new Error('Wallet not connected');

      const route = await resolvePackOpenContract(publicClient, packId);
      if (!route) throw new Error('This pack has no contract configured to open it');

      let txHash: `0x${string}`;

      if (route.contract === 'OPENPACK_V4') {
        const [canOpen, reason] = (await publicClient.readContract({
          address: route.address,
          abi: OPENPACK_V4_DATA_ABI,
          functionName: 'canOpenPack',
          args: [address, packId],
        })) as [boolean, string];
        if (!canOpen) throw new Error(reason || 'Cannot open this pack right now');

        await publicClient.simulateContract({
          account: address,
          address: route.address,
          abi: OPENPACK_V4_DATA_ABI,
          functionName: 'openPacks',
          args: [packId, Number(quantity)],
        });
        txHash = await writeContractAsync({
          address: route.address,
          abi: OPENPACK_V4_DATA_ABI,
          functionName: 'openPacks',
          args: [packId, Number(quantity)],
        });
      } else if (route.contract === 'ACTION_PACKS') {
        const [canOpen, reason] = (await publicClient.readContract({
          address: route.address,
          abi: ACTION_PACKS_DATA_ABI,
          functionName: 'canOpenPack',
          args: [address, packId],
        })) as [boolean, string];
        if (!canOpen) throw new Error(reason || 'Cannot open this pack right now');

        await publicClient.simulateContract({
          account: address,
          address: route.address,
          abi: ACTION_PACKS_DATA_ABI,
          functionName: 'openPack',
          args: [packId],
        });
        txHash = await writeContractAsync({
          address: route.address,
          abi: ACTION_PACKS_DATA_ABI,
          functionName: 'openPack',
          args: [packId],
        });
      } else {
        const [canOpen, reason] = (await publicClient.readContract({
          address: route.address,
          abi: ADRIAN_FLOPPY_DISCS_DATA_ABI,
          functionName: 'canOpenPack',
          args: [address, packId],
        })) as [boolean, string];
        if (!canOpen) throw new Error(reason || 'Cannot open this pack right now');

        await publicClient.simulateContract({
          account: address,
          address: route.address,
          abi: ADRIAN_FLOPPY_DISCS_DATA_ABI,
          functionName: 'openPack',
          args: [packId],
        });
        txHash = await writeContractAsync({
          address: route.address,
          abi: ADRIAN_FLOPPY_DISCS_DATA_ABI,
          functionName: 'openPack',
          args: [packId],
        });
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      if (route.contract === 'OPENPACK_V4') {
        const [event] = parseEventLogs({
          abi: OPENPACK_V4_DATA_ABI,
          eventName: 'PacksOpened',
          logs: receipt.logs,
        });
        const rewards = (event?.args as { rewards?: readonly bigint[] } | undefined)?.rewards ?? [];
        return { txHash, packId, traitIds: [...rewards], amounts: null };
      }

      if (route.contract === 'ACTION_PACKS') {
        const [event] = parseEventLogs({ abi: ACTION_PACKS_DATA_ABI, eventName: 'PackOpened', logs: receipt.logs });
        const args = event?.args as { assetIds?: readonly bigint[]; amounts?: readonly bigint[] } | undefined;
        return { txHash, packId, traitIds: [...(args?.assetIds ?? [])], amounts: args?.amounts ? [...args.amounts] : null };
      }

      const [event] = parseEventLogs({ abi: ADRIAN_FLOPPY_DISCS_DATA_ABI, eventName: 'PackOpened', logs: receipt.logs });
      const args = event?.args as { assetIds?: readonly bigint[]; amounts?: readonly bigint[] } | undefined;
      return { txHash, packId, traitIds: [...(args?.assetIds ?? [])], amounts: args?.amounts ? [...args.amounts] : null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs-owned'] });
      queryClient.invalidateQueries({ queryKey: ['traits'] });
    },
  });

  return { ...mutation, humanErrorMessage: mutation.error ? humanError(mutation.error) : null };
}
