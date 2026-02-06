import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { Menu, Wallet, X } from 'lucide-react';
import { useVisibleNavItems } from './useVisibleNavItems';

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
  const visibleItems = useVisibleNavItems();

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
      <div className="fixed left-4 right-4 top-4 z-[60] flex items-center justify-between sm:left-6 sm:right-6 lg:left-8 lg:right-8">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 bg-[#0d1b35]/85 px-4 text-sm font-bold uppercase tracking-[0.12em] text-[#dcf7ff] shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur transition-colors hover:bg-[#14264a]"
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          Menu
        </button>

        <FloatingWalletButton />
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-50 bg-black/55"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation menu"
            />

            <motion.nav
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="fixed left-4 right-4 top-20 z-[70] max-h-[70vh] overflow-y-auto rounded-2xl border border-white/20 bg-[#0a1124]/95 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur sm:left-6 sm:right-auto sm:w-[340px]"
            >
              <div className="mb-2 px-2 pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#95b8ff]">
                Navigation
              </div>
              <div className="grid grid-cols-1 gap-2">
                {visibleItems.map((item) => {
                  const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`rounded-xl border px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] transition-colors ${
                        isActive
                          ? 'border-[#7ef7c7]/55 bg-[#7ef7c7]/18 text-[#d8fff1]'
                          : 'border-white/10 bg-white/5 text-[#def4ff] hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
