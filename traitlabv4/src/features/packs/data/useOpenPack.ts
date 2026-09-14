import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { ADRIAN_FLOPPY_DISCS_DATA_ABI, OPENPACK_V4_DATA_ABI, ACTION_PACKS_DATA_ABI } from './packsData.abi';
import { humanError } from '@/lib/web3/humanError';
import { resolvePackOpenContract } from './packRegistry';
import { decodeOpenPackEvent } from './decodeOpenPackEvent';
import { useWalletDataStore } from '@/stores/walletDataStore';
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
 * `docs/history/PACKS_FLOPPIES_MISMATCH_REPORT.md`: 10014/10018 nunca se añadieron a
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
  const invalidateWalletTraits = useWalletDataStore((s) => s.invalidateTraits);

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

      return decodeOpenPackEvent({
        contract: route.contract,
        contractAddress: route.address,
        txHash,
        packId,
        logs: receipt.logs,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs-owned'] });
      queryClient.invalidateQueries({ queryKey: ['traits'] });
      // El inventario que lee TraitLab (TraitsModule/MyNFTsModule) sale de
      // `walletDataStore`, no de React Query — tiene su propio TTL de 5 min
      // (recon §8.9, mismo motivo que `useApplyTraitlabChanges.ts` invalida
      // esto además de React Query). Sin esto, tras abrir un pack "Equip
      // now" llevaría a TraitLab sin ver el trait recién obtenido.
      invalidateWalletTraits();
    },
  });

  return { ...mutation, humanErrorMessage: mutation.error ? humanError(mutation.error) : null };
}
