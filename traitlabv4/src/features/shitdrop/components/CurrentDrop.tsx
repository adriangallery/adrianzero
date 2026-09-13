import { useAccount } from 'wagmi';
import { ExternalLink, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { useShitdrop } from '../hooks/useShitdrop';
import { useCurrentDrop } from '../hooks/useDropsData';
import { useCountdown } from '../hooks/useCountdown';
import { humanError, isUserRejection } from '@/lib/web3/humanError';

export function CurrentDrop() {
  const { isConnected } = useAccount();
  const { currentDrop } = useCurrentDrop();
  const {
    isActive,
    userMinted,
    config,
    mint,
    isMinting,
    mintError,
    mintSuccess,
  } = useShitdrop();

  // Normalize timestamps: convert BigInt and handle milliseconds vs seconds
  const normalizeTimestamp = (value: bigint | undefined): number => {
    if (!value) return 0;
    let n = Number(value);
    // If looks like milliseconds (> 1e12), convert to seconds
    if (n > 1e12) {
      return Math.floor(n / 1000);
    }
    return n;
  };

  const startTime = config ? normalizeTimestamp(config.startTime) : 0;
  const endTime = config ? normalizeTimestamp(config.endTime) : 0;
  const maxPerWallet = config ? Number(config.maxPerWallet) : 1;

  const countdown = useCountdown(startTime, endTime, isActive);

  if (!currentDrop) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📭</div>
        <div className="text-xl font-semibold text-fg mb-2">
          No Active Drop
        </div>
        <div className="text-mute">
          Check back soon for the next drop
        </div>
      </div>
    );
  }

  const canMint = isConnected && isActive && userMinted < maxPerWallet;
  const hasReachedLimit = userMinted >= maxPerWallet;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-fg mb-2">
          Current Drop
        </h2>
        <p className="text-mute">
          Weekly-ish drops — whenever the artist is inspired
        </p>
      </div>

      {/* Main Card */}
      <div className="overflow-hidden rounded-2xl border-2 border-line bg-panel shadow-xl">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Image Section */}
          <div className="relative bg-line p-8">
            <img
              src={currentDrop.image}
              alt={currentDrop.title}
              className="w-full max-w-md mx-auto rounded-lg border-3 border-acc2 shadow-2xl"
            />

            {/* Badges */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <span className="rounded-full bg-ok/10 border border-ok/30 px-4 py-2 text-sm font-semibold text-ok">
                FREE
              </span>
              <span className="rounded-full bg-acc/10 border border-acc/30 px-4 py-2 text-sm font-semibold text-acc">
                1 per wallet
              </span>
              <span className="rounded-full bg-acc2/10 border border-acc2/30 px-4 py-2 text-sm font-semibold text-acc2">
                Base
              </span>
            </div>
          </div>

          {/* Info Section */}
          <div className="flex flex-col justify-between p-8">
            {/* Title & Description */}
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-acc2">
                {currentDrop.title}
              </h3>
              <p className="text-lg text-fg leading-relaxed">
                {currentDrop.short}
              </p>

              {/* Status Info */}
              <div className="space-y-3 rounded-lg bg-line p-4">
                <div className="flex items-center justify-between">
                  <span className="text-mute">Status:</span>
                  <span
                    className={`font-semibold ${
                      isActive ? 'text-ok' : 'text-bad'
                    }`}
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {isConnected && (
                  <div className="flex items-center justify-between">
                    <span className="text-mute">You minted:</span>
                    <span className="font-semibold text-fg">
                      {userMinted} / {maxPerWallet}
                    </span>
                  </div>
                )}

                {config && (
                  <div className="flex items-center justify-between">
                    <span className="text-mute">Token ID:</span>
                    <span className="font-mono text-sm font-semibold text-fg">
                      #{config.tokenId.toString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-mute flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {countdown.label}:
                  </span>
                  <span className="font-semibold text-fg">
                    {countdown.timeRemaining}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4 mt-6">
              {!isConnected ? (
                <div className="w-full">
                  <ConnectButton />
                </div>
              ) : (
                <>
                  <button
                    onClick={() => mint()}
                    disabled={!canMint || isMinting}
                    className={`w-full rounded-lg px-6 py-4 text-lg font-bold transition-all ${
                      canMint && !isMinting
                        ? 'bg-ok text-black hover:bg-ok hover:shadow-lg hover:shadow-lime-500/25'
                        : 'bg-line text-mute cursor-not-allowed'
                    }`}
                  >
                    {isMinting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Minting...
                      </span>
                    ) : hasReachedLimit ? (
                      'Limit Reached'
                    ) : !isActive ? (
                      'Mint Not Active'
                    ) : (
                      'Mint ShitDROP (FREE)'
                    )}
                  </button>

                  {/* Status Messages */}
                  {mintSuccess && (
                    <div className="flex items-center gap-2 rounded-lg bg-ok/10 border border-ok/30 p-4 text-ok">
                      <CheckCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="font-semibold">
                        Success! You minted ShitDROP.
                      </span>
                    </div>
                  )}

                  {mintError && !isUserRejection(mintError) && (
                    <div className="flex items-center gap-2 rounded-lg bg-bad/10 border border-bad/30 p-4 text-bad">
                      <XCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{humanError(mintError)}</span>
                    </div>
                  )}
                </>
              )}

              {/* OpenSea Link */}
              <a
                href={currentDrop.opensea}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-line bg-panel px-6 py-3 font-medium text-fg transition-colors hover:bg-line"
              >
                View on OpenSea
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
