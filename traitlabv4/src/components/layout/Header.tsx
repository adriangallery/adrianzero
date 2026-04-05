/**
 * Header Component
 * Top navigation bar with wallet connect, Buy $ZERO button, and notifications
 */

import { Link } from 'react-router-dom';
import { DollarSign } from 'lucide-react';
import { ConnectButton } from '../wallet/ConnectButton';
import { NotificationBell } from '../notifications/NotificationBell';
import { usePageTitle } from '@/hooks/usePageTitle';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { prefix, accent } = usePageTitle();

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Mobile menu + Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
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

          <h1 className="text-lg font-bold text-foreground lg:hidden font-adrian">{prefix}<span className="text-[#00ff00]">{accent}</span></h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 min-w-0 max-w-[70%] sm:max-w-none">
          {/* Buy $ZERO */}
          <Link
            to="/buy"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#00ff00] text-black text-sm font-bold hover:bg-[#00dd00] transition-colors"
          >
            <DollarSign className="h-4 w-4" />
            <span>Buy $ZERO</span>
          </Link>

          {/* Notifications */}
          <NotificationBell />

          {/* Wallet Connect */}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
