import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { Menu, Wallet, X } from 'lucide-react';
import { Sidebar } from './Sidebar';

const ADRIANZERO_PROFILE_FALLBACK = 'https://adrianlab.vercel.app/api/render/146.png';

function FloatingWalletButton() {
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
            {!connected ? (
              <button
                onClick={openConnectModal}
                type="button"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 bg-[#0d1b35]/85 px-4 text-sm font-bold uppercase tracking-[0.12em] text-[#dcf7ff] shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur"
              >
                <Wallet className="h-4 w-4" />
                Connect
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                type="button"
                className="inline-flex h-12 items-center rounded-xl border border-red-300/60 bg-red-500/20 px-4 text-sm font-bold uppercase tracking-[0.12em] text-red-100"
              >
                Wrong Network
              </button>
            ) : (
              <button
                onClick={openAccountModal}
                type="button"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 bg-[#0d1b35]/85 px-4 text-sm font-bold uppercase tracking-[0.1em] text-[#dcf7ff] shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur"
              >
                {account.ensAvatar ? (
                  <img
                    src={account.ensAvatar}
                    alt={account.ensName ? `${account.ensName} avatar` : 'Wallet profile avatar'}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <img
                    src={ADRIANZERO_PROFILE_FALLBACK}
                    alt="AdrianZERO profile fallback"
                    className="h-5 w-5 rounded-full object-cover"
                  />
                )}
                {chain.hasIcon && chain.iconUrl ? (
                  <img
                    src={chain.iconUrl}
                    alt={chain.name ?? 'Network'}
                    className="h-5 w-5 rounded-full"
                  />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                <span className="max-w-[120px] truncate sm:max-w-[170px]">{account.displayName}</span>
              </button>
            )}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}

export function ZeroStyleChrome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <div className="pointer-events-none fixed left-4 right-4 top-4 z-[60] flex items-center justify-between sm:left-6 sm:right-6 lg:left-8 lg:right-8">
        <motion.button
          onClick={() => setMenuOpen((prev) => !prev)}
          animate={menuOpen ? { opacity: 0, x: -18, scale: 0.92 } : { opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="pointer-events-auto inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 bg-[#0d1b35]/85 px-4 text-sm font-bold uppercase tracking-[0.12em] text-[#dcf7ff] shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur transition-colors hover:bg-[#14264a]"
          style={{ pointerEvents: menuOpen ? 'none' : 'auto' }}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          Menu
        </motion.button>

        <div className="pointer-events-auto">
          <FloatingWalletButton />
        </div>
      </div>

      <Sidebar
        variant="mobile"
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        forceVisibleOnDesktop
      />
    </>
  );
}
