/**
 * Sidebar Component
 * Navigation sidebar for desktop and mobile
 */

import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useVisibleNavItems } from './useVisibleNavItems';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  variant?: 'desktop' | 'mobile';
}

export function Sidebar({ isOpen = true, onClose, variant = 'desktop' }: SidebarProps) {
  const location = useLocation();
  const { prefix, accent } = usePageTitle();
  const visibleItems = useVisibleNavItems();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  if (variant === 'mobile') {
    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}

        {/* Mobile Sidebar */}
        <motion.aside
          initial={{ x: -280 }}
          animate={{ x: isOpen ? 0 : -280 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed top-0 left-0 h-full w-70 bg-card/95 backdrop-blur-sm border-r border-border z-50 lg:hidden flex flex-col"
        >
          {/* Header - Fixed */}
          <div className="flex-shrink-0 p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground font-adrian">{prefix}<span className="text-[#00ff00]">{accent}</span></h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-1">
              {visibleItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${
                      isActive(item.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    }
                  `}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </motion.aside>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside className="hidden lg:flex w-64 flex-col bg-card/95 backdrop-blur-sm border-r border-border h-screen">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <h2 className="text-xl font-bold text-foreground font-adrian">{prefix}<span className="text-[#00ff00]">{accent}</span></h2>
      </div>

      {/* Navigation - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                ${
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }
              `}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
