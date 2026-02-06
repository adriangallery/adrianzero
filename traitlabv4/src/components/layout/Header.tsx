/**
 * Header Component
 * Top navigation bar with wallet connect and notifications
 */

import { ConnectButton } from '../wallet/ConnectButton';
import { NotificationBell } from '../notifications/NotificationBell';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useNotifications } from '@/hooks/useNotifications';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { prefix, accent } = usePageTitle();
  const notifications = useNotifications();

  // TEMPORARY: Test notification button (remove after testing)
  const handleTestNotification = () => {
    notifications.success('Test Success', 'This is a test notification!');
    notifications.info('Test Info', 'This is an info notification', false); // persistent
  };

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
        <div className="flex items-center gap-2 min-w-0 max-w-[60%] sm:max-w-none overflow-hidden">
          {/* TEMPORARY: Test button */}
          <button
            onClick={handleTestNotification}
            className="hidden sm:block px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Test 🔔
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* Wallet Connect */}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
