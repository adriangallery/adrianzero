import { useCallback, useState } from 'react';
import { useAccount, usePublicClient, useConfig, useWriteContract, useReadContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { base } from 'wagmi/chains';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZERO_MOVIES_FACET_2_ABI, ERC20_ABI } from '@/lib/web3/abi';
import { useNotificationStore } from '@/store/notificationStore';
import { useMovies2Catalog } from './useMovies2Catalog';
import { useGoldenEligibility } from './useGoldenEligibility';
import { useWalletRentalCap } from './useWalletRentalCap';
import { parseMovie2Error } from '../lib/parseMovie2Error';
import {
  needsApproval as computeNeedsApproval,
  computeUpgradeTotalWei,
  computeUpgradeApprovalWei,
  canClaimGolden,
} from '../lib/movie2ActionMath';

const DIAMOND = CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`;

type S2ActionName = 'rent' | 'buy' | 'return' | 'upgrade' | 'claimGolden';

const SUCCESS_COPY: Record<S2ActionName, { title: string; message: string }> = {
  rent: { title: 'Tape rented', message: 'You have 7 days of grace before late fees.' },
  buy: { title: 'Tape bought', message: 'Permanent. The S1 cross-season pool just grew.' },
  return: { title: 'Tape returned', message: 'Back on the shelf — you can rent it again.' },
  upgrade: { title: 'Upgraded to permanent', message: 'Diff (+ late fees) paid — yours forever.' },
  claimGolden: { title: 'Golden Mint redeemed', message: 'Random tape(s) airdropped to your wallet.' },
};

/**
 * Real on-chain actions for ZEROmovies S2, wired against `ZEROmoviesFacet2`
 * on the $ZERO Diamond (0x542b…D0A0, Base). Replaces the `fakeWait()` mock
 * that shipped through the M3 checkpoint (2026-09-13 recon: catalog reads
 * were real, every write was a 1.5s `setTimeout` + local Zustand mutation —
 * confirmed live in the deployed bundle, not just local code).
 *
 * The Diamond IS the $ZERO ERC20 token, so `address` and `spender` for the
 * allowance check are the same address (see `useSamuraiApproval` for the
 * precedent already used elsewhere in this app). Every paid action:
 *   1. reads the LIVE allowance (not the react-query-cached one — a stale
 *      read here would either force an unnecessary approve or, worse, let
 *      an under-approved tx revert on-chain after the user already waited)
 *   2. approves the exact amount if short
 *   3. fires the action tx and waits for its receipt
 *   4. refetches the catalog so the UI reflects the real chain state
 *   5. raises a success/error toast via the app-wide notification store
 *      (`src/ui/Toast`), with a BaseScan link on success
 *
 * `returnMovie2` / `upgradeRent2ToBuy` take the AdrianLabCore **tokenId**,
 * not the movieId — callers must pass `rental.tokenId` (see `types/index.ts`).
 */
export function useMovie2Actions() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: base.id });
  const wagmiConfig = useConfig();
  const { writeContractAsync } = useWriteContract();
  const { config, refetch: refetchCatalog } = useMovies2Catalog();
  const { refetch: refetchCap } = useWalletRentalCap();
  const { ticketCount, crossSeasonWeight, proof, refetchClaimed } = useGoldenEligibility();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [pendingAction, setPendingAction] = useState<S2ActionName | null>(null);
  const isPending = pendingAction !== null;

  // Live allowance for the confirm sheet — NOT used to gate the actual tx
  // (each action re-reads it fresh right before acting; see `ensureAllowance`).
  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: DIAMOND,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, DIAMOND] : undefined,
    chainId: base.id,
    query: { enabled: !!address, staleTime: 10_000 },
  });
  const allowanceWei = (allowanceRaw as bigint | undefined) ?? 0n;

  const ensureAllowance = useCallback(
    async (amountWei: bigint) => {
      if (!address || !publicClient) throw new Error('Wallet not connected');
      if (amountWei <= 0n) return;

      const current = (await publicClient.readContract({
        address: DIAMOND,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, DIAMOND],
      })) as bigint;
      if (!computeNeedsApproval(current, amountWei)) return;

      const approveHash = await writeContractAsync({
        address: DIAMOND,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [DIAMOND, amountWei],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: approveHash });
      await refetchAllowance();
    },
    [address, publicClient, writeContractAsync, wagmiConfig, refetchAllowance]
  );

  const runAction = useCallback(
    async (
      name: S2ActionName,
      write: () => Promise<`0x${string}`>,
      opts: { amountWei?: bigint } = {}
    ) => {
      if (!address) return;
      setPendingAction(name);
      try {
        if (opts.amountWei && opts.amountWei > 0n) {
          await ensureAllowance(opts.amountWei);
        }
        const hash = await write();
        await waitForTransactionReceipt(wagmiConfig, { hash });

        refetchCatalog();
        refetchCap();
        if (name === 'claimGolden') refetchClaimed();

        const copy = SUCCESS_COPY[name];
        addNotification('success', copy.title, copy.message, true, hash);
      } catch (err) {
        const message = parseMovie2Error(err);
        addNotification('error', 'Transaction failed', message);
        throw err;
      } finally {
        setPendingAction(null);
      }
    },
    [address, ensureAllowance, wagmiConfig, refetchCatalog, refetchCap, refetchClaimed, addNotification]
  );

  const rent2 = useCallback(
    (movieId: number) =>
      runAction(
        'rent',
        () =>
          writeContractAsync({
            address: DIAMOND,
            abi: ZERO_MOVIES_FACET_2_ABI,
            functionName: 'rentMovie2',
            args: [BigInt(movieId)],
          }),
        { amountWei: config.rentPriceWei }
      ),
    [runAction, writeContractAsync, config.rentPriceWei]
  );

  const buy2 = useCallback(
    (movieId: number) =>
      runAction(
        'buy',
        () =>
          writeContractAsync({
            address: DIAMOND,
            abi: ZERO_MOVIES_FACET_2_ABI,
            functionName: 'buyMovie2',
            args: [BigInt(movieId)],
          }),
        { amountWei: config.buyPriceWei }
      ),
    [runAction, writeContractAsync, config.buyPriceWei]
  );

  /** @param tokenId AdrianLabCore tokenId (rental.tokenId) — NOT the movieId. Free, no allowance needed. */
  const returnMovie2 = useCallback(
    (tokenId: number) =>
      runAction('return', () =>
        writeContractAsync({
          address: DIAMOND,
          abi: ZERO_MOVIES_FACET_2_ABI,
          functionName: 'returnMovie2',
          args: [BigInt(tokenId)],
        })
      ),
    [runAction, writeContractAsync]
  );

  /**
   * @param tokenId AdrianLabCore tokenId (rental.tokenId) — NOT the movieId.
   * Reads `getMovie2RentalInfo(tokenId)` fresh right before approving so the
   * approve amount includes the exact on-chain `lateFeeOwed` at call time
   * (client-side day-boundary estimates can undershoot by the time the tx
   * lands, which would revert the approve-then-spend with InsufficientAllowance).
   */
  const upgradeRent2ToBuy = useCallback(
    (tokenId: number) =>
      runAction(
        'upgrade',
        async () => {
          if (!publicClient) throw new Error('No public client available');
          const info = (await publicClient.readContract({
            address: DIAMOND,
            abi: ZERO_MOVIES_FACET_2_ABI,
            functionName: 'getMovie2RentalInfo',
            args: [BigInt(tokenId)],
          })) as readonly [bigint, bigint, string, boolean, boolean, bigint, bigint];
          const lateFeeOwed = info[6];
          const total = computeUpgradeTotalWei(config.buyPriceWei, config.rentPriceWei, lateFeeOwed);
          // Approve total + 1 extra day's late fee (finite buffer, not
          // infinite) — absorbs one day-boundary crossing between this read
          // and the tx landing. See computeUpgradeApprovalWei's docstring.
          await ensureAllowance(computeUpgradeApprovalWei(total, config.lateFeePerDayWei));
          return writeContractAsync({
            address: DIAMOND,
            abi: ZERO_MOVIES_FACET_2_ABI,
            functionName: 'upgradeRent2ToBuy',
            args: [BigInt(tokenId)],
          });
        }
        // amountWei omitted: the allowance is ensured inline above, once the
        // exact late fee is known — runAction's own ensureAllowance step is
        // skipped for this action (opts.amountWei stays undefined).
      ),
    [runAction, publicClient, config.buyPriceWei, config.rentPriceWei, ensureAllowance, writeContractAsync]
  );

  /**
   * Redeems the connected wallet's Golden Mint ticket(s). Ignores its
   * `_ticketCountHint` argument (kept only so `S2GoldenClaimBanner`'s
   * `onClaim?.(ticketCount)` call site doesn't need to change) — the actual
   * on-chain call needs `ticketCount` + `crossSeasonWeight` + `proof`
   * together (they're bound into the same Merkle leaf), so it always uses
   * the values `useGoldenEligibility()` fetched server-side for this wallet.
   */
  const claimGoldenMint = useCallback(
    (_ticketCountHint?: number) => {
      void _ticketCountHint;
      if (!canClaimGolden(ticketCount, proof.length)) return Promise.resolve();
      return runAction('claimGolden', () =>
        writeContractAsync({
          address: DIAMOND,
          abi: ZERO_MOVIES_FACET_2_ABI,
          functionName: 'claimGoldenMint',
          args: [proof, BigInt(ticketCount), BigInt(crossSeasonWeight)],
        })
      );
    },
    [runAction, writeContractAsync, ticketCount, crossSeasonWeight, proof]
  );

  return {
    rent2,
    buy2,
    returnMovie2,
    upgradeRent2ToBuy,
    claimGoldenMint,
    isPending,
    pendingAction,
    allowanceWei,
    isMock: false as const,
  };
}
