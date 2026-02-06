import { useAccount } from 'wagmi';
import { ExternalLink, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { useShitdrop } from '../hooks/useShitdrop';
import { useCurrentDrop } from '../hooks/useDropsData';
import { useCountdown } from '../hooks/useCountdown';

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
        <div className="text-xl font-semibold text-foreground mb-2">
          No Active Drop
        </div>
        <div className="text-muted-foreground">
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
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Current Drop
        </h2>
        <p className="text-muted-foreground">
          Weekly-ish drops — whenever the artist is inspired
        </p>
      </div>

      {/* Main Card */}
      <div className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-xl">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Image Section */}
          <div className="relative bg-muted p-8">
            <img
              src={currentDrop.image}
              alt={currentDrop.title}
              className="w-full max-w-md mx-auto rounded-lg border-3 border-accent shadow-2xl"
            />

            {/* Badges */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <span className="rounded-full bg-success/10 border border-success/30 px-4 py-2 text-sm font-semibold text-success">
                FREE
              </span>
              <span className="rounded-full bg-primary/10 border border-primary/30 px-4 py-2 text-sm font-semibold text-primary">
                1 per wallet
              </span>
              <span className="rounded-full bg-accent/10 border border-accent/30 px-4 py-2 text-sm font-semibold text-accent">
                Base
              </span>
            </div>
          </div>

          {/* Info Section */}
          <div className="flex flex-col justify-between p-8">
            {/* Title & Description */}
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-accent">
                {currentDrop.title}
              </h3>
              <p className="text-lg text-foreground leading-relaxed">
                {currentDrop.short}
              </p>

              {/* Status Info */}
              <div className="space-y-3 rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={`font-semibold ${
                      isActive ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {isConnected && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">You minted:</span>
                    <span className="font-semibold text-foreground">
                      {userMinted} / {maxPerWallet}
                    </span>
                  </div>
                )}

                {config && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Token ID:</span>
                    <span className="font-mono text-sm font-semibold text-foreground">
                      #{config.tokenId.toString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {countdown.label}:
                  </span>
                  <span className="font-semibold text-foreground">
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
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
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
                    <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/30 p-4 text-success">
                      <CheckCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="font-semibold">
                        Success! You minted ShitDROP.
                      </span>
                    </div>
                  )}

                  {mintError && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-destructive">
                      <XCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">
                        {mintError instanceof Error
                          ? mintError.message
                          : 'Mint failed'}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* OpenSea Link */}
              <a
                href={currentDrop.opensea}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 font-medium text-foreground transition-colors hover:bg-muted"
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
