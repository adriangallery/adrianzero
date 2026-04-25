import { useAccount } from 'wagmi';
import { useGoldenEligibility } from '../hooks/useGoldenEligibility';

interface S2GoldenClaimBannerProps {
  /** Unix seconds when the on-chain claim window opened (= unpause). */
  unpauseAt?: number;
  /** Set true once the connected wallet's goldenClaimed flag flips on-chain. */
  alreadyClaimed?: boolean;
  /** Triggered when the user clicks "Claim N random movies". */
  onClaim?: (ticketCount: number) => void;
  /** True while a claim tx is being submitted/confirmed. */
  isClaiming?: boolean;
  /** Disable the button (e.g. another action in flight in the same tab). */
  isClaimDisabled?: boolean;
}

const CLAIM_WINDOW_SEC = 7 * 86_400;

export function S2GoldenClaimBanner({
  unpauseAt,
  alreadyClaimed = false,
  onClaim,
  isClaiming = false,
  isClaimDisabled = false,
}: S2GoldenClaimBannerProps) {
  const { isConnected } = useAccount();
  const { isEligible, ticketCount, crossSeasonWeight, snapshotMeta } = useGoldenEligibility();

  if (!isConnected) {
    return (
      <div className="mb-4 rounded border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-center text-[10px] uppercase tracking-widest text-zinc-500">
        Connect wallet to check Golden Mint eligibility
      </div>
    );
  }

  if (!isEligible) {
    return (
      <div className="mb-4 rounded border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-center text-[10px] uppercase tracking-widest text-zinc-500">
        This wallet was not a permanent S1 holder at the Budokai 1 close ({new Date(snapshotMeta.takenAt).toUTCString()}). No tickets to redeem.
      </div>
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const claimWindowOpen = !!unpauseAt && now >= unpauseAt && now <= unpauseAt + CLAIM_WINDOW_SEC;
  const secondsLeft = claimWindowOpen ? (unpauseAt! + CLAIM_WINDOW_SEC) - now : 0;
  const daysLeft = Math.floor(secondsLeft / 86_400);
  const hoursLeft = Math.floor((secondsLeft % 86_400) / 3600);

  return (
    <div className="mb-4 rounded border-2 border-yellow-500/40 bg-gradient-to-r from-yellow-900/20 via-zinc-950 to-yellow-900/20 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-[0.3em] text-yellow-500">Golden Mint</span>
          <span className="font-mono text-sm font-bold text-yellow-300">
            You hold <span className="text-yellow-200">{ticketCount}</span> ticket{ticketCount === 1 ? '' : 's'}
          </span>
          <span className="mt-0.5 text-[9px] text-zinc-500">
            +{crossSeasonWeight} cross-season weight (perpetual share of S2 revenue)
          </span>
        </div>

        <div className="flex flex-col items-end">
          {alreadyClaimed ? (
            <span className="rounded bg-zinc-800 px-3 py-1 text-[9px] font-bold uppercase text-zinc-500">Claimed</span>
          ) : !unpauseAt ? (
            <span className="rounded border border-yellow-500/30 px-3 py-1 text-[9px] font-bold uppercase text-yellow-400">
              Opens at unpause
            </span>
          ) : claimWindowOpen ? (
            <>
              <button
                disabled={isClaimDisabled || isClaiming}
                onClick={() => onClaim?.(ticketCount)}
                className="rounded bg-yellow-500 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-black hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isClaiming
                  ? 'Claiming...'
                  : `Claim ${ticketCount} random ${ticketCount === 1 ? 'movie' : 'movies'}`}
              </button>
              <span className="mt-1 text-[9px] tabular-nums text-zinc-500">
                Window closes in {daysLeft}d {hoursLeft}h
              </span>
            </>
          ) : (
            <span className="rounded bg-red-900/40 px-3 py-1 text-[9px] font-bold uppercase text-red-400">
              Window closed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
