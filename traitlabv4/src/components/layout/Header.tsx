/**
 * Header Component
 * Top navigation bar with wallet connect, Buy $ZERO button, and notifications
 */

import { Link } from 'react-router-dom';
import { DollarSign } from 'lucide-react';
import { ConnectButton } from '../wallet/ConnectButton';
import { NotificationBell } from '../notifications/NotificationBell';
import { useSectionTitle } from '@/hooks/useSectionTitle';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const sectionTitle = useSectionTitle();
  // <768px: la TabBar cubre la navegación (incluida su hoja "More"), así
  // que el menú hamburguesa y la campana sobran — el header se reduce a
  // marca + wallet. 768–1023px (tablet): mantiene el header actual.
  const isCompact = useMediaQuery('(max-width: 767px)');

  return (
    <header className="sticky top-0 z-30 h-[var(--header-h)] bg-bg border-b-2 border-line">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left: Mobile menu + wordmark único "ZERO" + sección actual */}
        <div className="flex items-center gap-4 min-w-0">
          {!isCompact && (
            <button
              onClick={onMenuClick}
              aria-label="Open menu"
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}

          {/* F3.5 (D17): un solo wordmark en toda la app — antes cada página
              llevaba su propio wordmark ("TraitLAB"/"TraitSHOP"/"MyNFTs"). */}
          <div className="flex items-center gap-2.5 min-w-0 lg:hidden">
            <span className="font-display text-[13px] text-acc flex-none">ZERO</span>
            <span className="font-ui text-[13px] text-mute truncate">{sectionTitle}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 min-w-0 max-w-[70%] sm:max-w-none">
          {/* Buy $ZERO */}
          {!isCompact && (
            <Link
              to="/buy"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-acc text-acc-fg text-sm font-bold hover:opacity-90 transition-opacity"
            >
              <DollarSign className="h-4 w-4" />
              <span>Buy $ZERO</span>
            </Link>
          )}

          {/* Notifications */}
          {!isCompact && <NotificationBell />}

          {/* Wallet Connect */}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
