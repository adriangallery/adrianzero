import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import {
  ADRIAN_FLOPPY_DISCS_DATA_ABI,
  ADRIAN_FLOPPY_ETH_DATA_ABI,
  ADRIAN_FLOPPY_MERKLE_DATA_ABI,
} from './packsData.abi';
import { ERC20_ABI } from '@/lib/web3/abi';
import { humanError } from '@/lib/web3/humanError';
import type { CatalogPack } from './types';

export interface BuyPackParams {
  pack: CatalogPack;
  quantity: bigint;
  /** Índice en `pack.prices` a pagar (por defecto 0: el primero disponible). */
  priceIndex?: number;
  /**
   * Prueba Merkle, solo si `pack` viene de FLOPPY_MERKLE y el batch exige
   * allowlist. Fuera del alcance normal de "comprar del catálogo público"
   * (esa es la página de claim de D15, aún no construida) — se admite
   * aquí para no bloquear ese caso el día que exista.
   */
  merkleProof?: readonly `0x${string}`[];
}

export interface BuyPackResult {
  txHash: `0x${string}`;
  approvalTxHash: `0x${string}` | null;
}

/**
 * Compra un pack del catálogo (`usePackCatalog`). Aprueba el ERC20 del
 * precio elegido SOLO si la allowance actual no alcanza; para ETH manda
 * `value` exacto. `simulateContract` corre la llamada real antes de pedir
 * cualquier firma — mismo patrón que
 * `features/traitlab/hooks/useApplyTraitlabChanges.ts` (F4).
 */
export function useBuyPack() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();

  const mutation = useMutation<BuyPackResult, Error, BuyPackParams>({
    mutationFn: async ({ pack, quantity, priceIndex = 0, merkleProof }) => {
      if (!address || !publicClient) throw new Error('Wallet not connected');
      if (quantity <= 0n) throw new Error('Quantity must be greater than 0');

      const price = pack.prices[priceIndex];
      if (!price) throw new Error('This pack has no configured price');

      let approvalTxHash: `0x${string}` | null = null;

      // Approve-if-needed: solo para precios en ERC20 (ETH no lleva approval).
      if (price.currency === 'ERC20' && price.tokenAddress) {
        const totalCost = price.amount * quantity;
        const allowance = (await publicClient.readContract({
          address: price.tokenAddress,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, pack.saleContractAddress],
        })) as bigint;

        if (allowance < totalCost) {
          await publicClient.simulateContract({
            account: address,
            address: price.tokenAddress,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [pack.saleContractAddress, totalCost],
          });
          approvalTxHash = await writeContractAsync({
            address: price.tokenAddress,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [pack.saleContractAddress, totalCost],
          });
          await publicClient.waitForTransactionReceipt({ hash: approvalTxHash });
        }
      }

      let txHash: `0x${string}`;

      if (pack.saleContract === 'FLOPPY_DISCS') {
        if (price.currency !== 'ERC20') {
          throw new Error('FloppyDiscs only sells in its configured ERC20 (paymentToken)');
        }

        const [canPurchase, reason] = (await publicClient.readContract({
          address: pack.saleContractAddress,
          abi: ADRIAN_FLOPPY_DISCS_DATA_ABI,
          functionName: 'canPurchasePack',
          args: [address, pack.packId, quantity, false],
        })) as [boolean, string];
        if (!canPurchase) throw new Error(reason || 'Cannot purchase this pack right now');

        await publicClient.simulateContract({
          account: address,
          address: pack.saleContractAddress,
          abi: ADRIAN_FLOPPY_DISCS_DATA_ABI,
          functionName: 'purchasePack',
          args: [pack.packId, quantity, false],
        });
        txHash = await writeContractAsync({
          address: pack.saleContractAddress,
          abi: ADRIAN_FLOPPY_DISCS_DATA_ABI,
          functionName: 'purchasePack',
          args: [pack.packId, quantity, false],
        });
      } else if (pack.saleContract === 'FLOPPY_ETH') {
        // FloppyETH no tiene overload con merkleProof — solo FloppyMerkle.
        if (pack.saleBatchId === null) throw new Error('Missing batch id for this pack');
        if (merkleProof) throw new Error('FloppyETH does not support a merkle proof');
        const batchId = pack.saleBatchId;

        if (price.currency === 'ETH') {
          const value = price.amount * quantity;
          await publicClient.simulateContract({
            account: address,
            address: pack.saleContractAddress,
            abi: ADRIAN_FLOPPY_ETH_DATA_ABI,
            functionName: 'mint',
            args: [batchId, quantity],
            value,
          });
          txHash = await writeContractAsync({
            address: pack.saleContractAddress,
            abi: ADRIAN_FLOPPY_ETH_DATA_ABI,
            functionName: 'mint',
            args: [batchId, quantity],
            value,
          });
        } else {
          await publicClient.simulateContract({
            account: address,
            address: pack.saleContractAddress,
            abi: ADRIAN_FLOPPY_ETH_DATA_ABI,
            functionName: 'mintWithToken',
            args: [batchId, quantity],
          });
          txHash = await writeContractAsync({
            address: pack.saleContractAddress,
            abi: ADRIAN_FLOPPY_ETH_DATA_ABI,
            functionName: 'mintWithToken',
            args: [batchId, quantity],
          });
        }
      } else {
        // FLOPPY_MERKLE — mint(batchId, quantity[, merkleProof]) / mintWithToken(igual).
        if (pack.saleBatchId === null) throw new Error('Missing batch id for this pack');
        const batchId = pack.saleBatchId;

        if (price.currency === 'ETH') {
          const value = price.amount * quantity;
          if (merkleProof) {
            await publicClient.simulateContract({
              account: address,
              address: pack.saleContractAddress,
              abi: ADRIAN_FLOPPY_MERKLE_DATA_ABI,
              functionName: 'mint',
              args: [batchId, quantity, merkleProof],
              value,
            });
            txHash = await writeContractAsync({
              address: pack.saleContractAddress,
              abi: ADRIAN_FLOPPY_MERKLE_DATA_ABI,
              functionName: 'mint',
              args: [batchId, quantity, merkleProof],
              value,
            });
          } else {
            await publicClient.simulateContract({
              account: address,
              address: pack.saleContractAddress,
              abi: ADRIAN_FLOPPY_MERKLE_DATA_ABI,
              functionName: 'mint',
              args: [batchId, quantity],
              value,
            });
            txHash = await writeContractAsync({
              address: pack.saleContractAddress,
              abi: ADRIAN_FLOPPY_MERKLE_DATA_ABI,
              functionName: 'mint',
              args: [batchId, quantity],
              value,
            });
          }
        } else if (merkleProof) {
          await publicClient.simulateContract({
            account: address,
            address: pack.saleContractAddress,
            abi: ADRIAN_FLOPPY_MERKLE_DATA_ABI,
            functionName: 'mintWithToken',
            args: [batchId, quantity, merkleProof],
          });
          txHash = await writeContractAsync({
            address: pack.saleContractAddress,
            abi: ADRIAN_FLOPPY_MERKLE_DATA_ABI,
            functionName: 'mintWithToken',
            args: [batchId, quantity, merkleProof],
          });
        } else {
          await publicClient.simulateContract({
            account: address,
            address: pack.saleContractAddress,
            abi: ADRIAN_FLOPPY_MERKLE_DATA_ABI,
            functionName: 'mintWithToken',
            args: [batchId, quantity],
          });
          txHash = await writeContractAsync({
            address: pack.saleContractAddress,
            abi: ADRIAN_FLOPPY_MERKLE_DATA_ABI,
            functionName: 'mintWithToken',
            args: [batchId, quantity],
          });
        }
      }

      await publicClient.waitForTransactionReceipt({ hash: txHash });
      return { txHash, approvalTxHash };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs-owned'] });
      queryClient.invalidateQueries({ queryKey: ['packs-registry'] });
    },
  });

  // `mutation.error` conserva el error crudo (útil para depurar); esto es
  // el mensaje ya traducido para un toast, sin forzar a quien construya la
  // UI (el orquestador) a importar `humanError` aparte.
  return { ...mutation, humanErrorMessage: mutation.error ? humanError(mutation.error) : null };
}
