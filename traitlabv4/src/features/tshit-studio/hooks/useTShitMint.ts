/**
 * Orchestrates the full mint flow:
 *  1. Build SVG from canvas pixels + T-shirt template
 *  2. Upload SVG to Vercel Blob (returns immutable URL)
 *  3. Approve $ZERO if allowance < mintPrice
 *  4. Call TShitMintFacet.mintTShit(url) on the Diamond
 *  5. Wait for receipt, parse the TShitMinted event for the assigned tokenId
 *
 * Each step updates a single `status` object so the UI can render a clear
 * progress strip without keeping multiple ref counters in sync.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { decodeEventLog } from 'viem';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ERC20_ABI } from '@/lib/web3/abi';
import { TSHIT_FACET_ABI } from '../lib/abi';
import { buildDesignSvg } from '../lib/svgExport';
import { isPaintable } from '../lib/tshirtMask';
import { useUploadDesign } from './useUploadDesign';
import { useTShitStore } from '../store/tshitStore';
import type { MintStatus } from '../types/tshit.types';
import { clearDraft } from './useDraftAutosave';

const DIAMOND = CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`;

export function useTShitMint() {
  const { address } = useAccount();
  const [status, setStatus] = useState<MintStatus>({ phase: 'idle' });

  // Read mint price (default 1000e18) — admin rarely changes it, cache for 5 min
  const { data: mintPrice } = useReadContract({
    address: DIAMOND,
    abi: TSHIT_FACET_ABI,
    functionName: 'tshitMintPrice',
    query: { staleTime: 5 * 60_000, gcTime: 10 * 60_000 },
  });

  // Pause toggle — also rare; refresh on tab focus is enough
  const { data: isActive } = useReadContract({
    address: DIAMOND,
    abi: TSHIT_FACET_ABI,
    functionName: 'tshitIsActive',
    query: { staleTime: 5 * 60_000, gcTime: 10 * 60_000, refetchOnWindowFocus: true },
  });

  // Registered slots — only changes when admin tops up or someone mints. 60s
  // poll is plenty for the "Slots open: N" badge; we also re-fetch right
  // after a successful mint inside the success effect below.
  const { data: registeredRemaining, refetch: refetchRemaining } = useReadContract({
    address: DIAMOND,
    abi: TSHIT_FACET_ABI,
    functionName: 'tshitRegisteredRemaining',
    query: { refetchInterval: 60_000, staleTime: 30_000 },
  });

  // Allowance check
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: DIAMOND,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, DIAMOND] : undefined,
    query: { enabled: !!address },
  });

  const { upload } = useUploadDesign();
  const { writeContractAsync } = useWriteContract();
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
    query: { enabled: !!pendingTxHash },
  });

  // Parse the TShitMinted event when the receipt lands
  useEffect(() => {
    if (!receipt || status.phase !== 'awaiting-mint-confirm') return;
    let parsedTokenId: number | undefined;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: TSHIT_FACET_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'TShitMinted') {
          parsedTokenId = Number(decoded.args.tokenId);
          break;
        }
      } catch {
        // not our event — skip
      }
    }
    setStatus(prev => ({
      ...prev,
      phase: 'success',
      tokenId: parsedTokenId,
      txHash: receipt.transactionHash,
    }));
    clearDraft();
    // Drop "slots open" by 1 immediately after our own mint instead of
    // waiting for the next 60s poll.
    refetchRemaining();
  }, [receipt, status.phase, refetchRemaining]);

  const mint = useCallback(
    async (opts?: { title?: string }) => {
      if (!address) {
        setStatus({ phase: 'error', error: 'Wallet not connected' });
        return;
      }
      if (isActive === false) {
        setStatus({ phase: 'error', error: 'T-Shit Studio is currently paused' });
        return;
      }
      const remaining = (registeredRemaining as bigint | undefined) ?? 0n;
      if (remaining === 0n) {
        setStatus({
          phase: 'error',
          error: 'No mint slots available right now — admin is restocking. Try again shortly.',
        });
        return;
      }
      const price = (mintPrice as bigint | undefined) ?? 1000n * 10n ** 18n;
      // Auto-commit any unconfirmed stamp the user is still dragging — without
      // this the pending pixels would be discarded silently when we read
      // getAllPixels() below.
      if (useTShitStore.getState().pendingStamp) {
        useTShitStore.getState().commitPendingStamp(isPaintable);
      }
      const pixels = useTShitStore.getState().getAllPixels();
      if (pixels.length === 0) {
        setStatus({ phase: 'error', error: 'Canvas is empty' });
        return;
      }

      try {
        // ─── 1. Build SVG ───
        const tshirtBaseColor = useTShitStore.getState().tshirtBaseColor;
        const svg = buildDesignSvg({
          pixels,
          title: opts?.title,
          tshirtBaseColor,
          paintable: tshirtBaseColor ? isPaintable : undefined,
        });

        // ─── 2. Upload ───
        setStatus({ phase: 'uploading' });
        const { url } = await upload(svg, address);

        // ─── 3. Approve if needed ───
        const currentAllowance = (allowance as bigint | undefined) ?? 0n;
        if (currentAllowance < price) {
          setStatus({ phase: 'approving', designUrl: url });
          const approveTx = await writeContractAsync({
            address: DIAMOND,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [DIAMOND, price],
          });
          setStatus({ phase: 'awaiting-approval-confirm', txHash: approveTx, designUrl: url });
          // Wait briefly for the approve to land before issuing the mint.
          // Wagmi's useWaitForTransactionReceipt is hook-based; we poll allowance
          // a few times instead so we stay inside this useCallback.
          let confirmed = false;
          for (let i = 0; i < 30 && !confirmed; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const fresh = await refetchAllowance();
            if ((fresh.data as bigint | undefined ?? 0n) >= price) confirmed = true;
          }
          if (!confirmed) {
            throw new Error('Approval did not confirm within 60s');
          }
        }

        // ─── 4. Mint ───
        setStatus({ phase: 'minting', designUrl: url });
        const mintTx = await writeContractAsync({
          address: DIAMOND,
          abi: TSHIT_FACET_ABI,
          functionName: 'mintTShit',
          args: [url],
          // Real consumption is ~390k (ERC20 burn + multiple SSTOREs + external
          // ERC1155 mint on AdrianTraitsCore + event emission). Keep a healthy
          // headroom for storage-heavy paths like first-mint-in-a-batch.
          gas: 600_000n,
        });
        setStatus({ phase: 'awaiting-mint-confirm', txHash: mintTx, designUrl: url });
        setPendingTxHash(mintTx);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Mint failed';
        setStatus({ phase: 'error', error: msg });
      }
    },
    [address, allowance, isActive, mintPrice, refetchAllowance, registeredRemaining, upload, writeContractAsync]
  );

  const reset = useCallback((opts?: { clearCanvas?: boolean }) => {
    setStatus({ phase: 'idle' });
    setPendingTxHash(undefined);
    if (opts?.clearCanvas) {
      useTShitStore.getState().clear();
    }
  }, []);

  return {
    status,
    mint,
    reset,
    mintPrice: (mintPrice as bigint | undefined) ?? 1000n * 10n ** 18n,
    isActive: isActive === true,
    registeredRemaining: Number((registeredRemaining as bigint | undefined) ?? 0n),
    refetchRemaining,
  };
}
