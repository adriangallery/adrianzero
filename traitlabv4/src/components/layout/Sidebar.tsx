/**
 * Sidebar Component
 * Navigation sidebar for desktop and mobile
 */

import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Frame,
  Palette,
  Package,
  FlaskConical,
  Hammer,
  Edit3,
  Car,
  Search,
  Rocket,
  ShoppingBag,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAccount } from 'wagmi';
import { useHasAdrianZero } from '@/features/onboarding/hooks/useHasAdrianZero';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  requiresAdrianZero?: boolean;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <BarChart3 className="h-5 w-5" /> },
  { path: '/adrianzero', label: 'My NFTs', icon: <Frame className="h-5 w-5" /> },
  { path: '/traits', label: 'Traits', icon: <Palette className="h-5 w-5" /> },
  { path: '/packs', label: 'Packs', icon: <Package className="h-5 w-5" /> },
  { path: '/serum', label: 'Serum', icon: <FlaskConical className="h-5 w-5" /> },
  { path: '/crafting', label: 'Crafting', icon: <Hammer className="h-5 w-5" />, requiresAdrianZero: true },
  { path: '/custom', label: 'Custom', icon: <Edit3 className="h-5 w-5" />, requiresAdrianZero: true },
  { path: '/lambo', label: 'Lambo', icon: <Car className="h-5 w-5" />, requiresAdrianZero: true },
  { path: '/search', label: 'Search', icon: <Search className="h-5 w-5" />, requiresAdrianZero: true },
  { path: '/onboarding', label: 'Mint', icon: <Rocket className="h-5 w-5" /> },
  { path: '/shop', label: 'Shop', icon: <ShoppingBag className="h-5 w-5" /> },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  variant?: 'desktop' | 'mobile';
}

export function Sidebar({ isOpen = true, onClose, variant = 'desktop' }: SidebarProps) {
  const location = useLocation();
  const { prefix, accent } = usePageTitle();
  const { isConnected } = useAccount();
  const { hasAdrianZero } = useHasAdrianZero();

  // Hide restricted items if wallet disconnected or no AdrianZERO
  const visibleItems = navItems.filter(
    (item) => !item.requiresAdrianZero || (isConnected && hasAdrianZero)
  );

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
          className="fixed top-0 left-0 h-full w-70 bg-card/95 backdrop-blur-sm border-r border-border z-50 lg:hidden"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
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
    <aside className="hidden lg:flex w-64 flex-col bg-card/95 backdrop-blur-sm border-r border-border">
      <div className="p-4">
        <h2 className="text-xl font-bold text-foreground mb-6 font-adrian">{prefix}<span className="text-[#00ff00]">{accent}</span></h2>

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
