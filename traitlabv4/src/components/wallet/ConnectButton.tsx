import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';

const ADRIANZERO_PROFILE_FALLBACK = 'https://adrianlab.vercel.app/api/render/146.png';

export function ConnectButton() {
  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="touch-target px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="touch-target px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Wrong Network
                  </button>
                );
              }

              // Format balance - handle NaN and undefined
              const balance = account.displayBalance;
              const formattedBalance = balance && !balance.toLowerCase().includes('nan')
                ? ` (${balance})`
                : '';
              const profileImage = account.ensAvatar || ADRIANZERO_PROFILE_FALLBACK;

              return (
                <div className="flex gap-1 sm:gap-2 items-center max-w-full min-w-0">
                  {/* Chain button - icon only on mobile */}
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="touch-target flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex-shrink-0"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 20,
                          height: 20,
                          borderRadius: 999,
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 20, height: 20 }}
                          />
                        )}
                      </div>
                    )}
                    <span className="hidden sm:inline">{chain.name}</span>
                  </button>

                  {/* Account button - compact on mobile */}
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="touch-target inline-flex items-center gap-2 px-2 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity text-sm sm:text-base truncate max-w-[120px] sm:max-w-[220px] min-w-0 overflow-hidden"
                  >
                    <img
                      src={profileImage}
                      alt={account.ensName ? `${account.ensName} avatar` : 'Wallet profile avatar'}
                      className="h-5 w-5 rounded-full object-cover flex-shrink-0"
                    />
                    <span className="truncate">{account.displayName}</span>
                    <span className="hidden sm:inline">{formattedBalance}</span>
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
