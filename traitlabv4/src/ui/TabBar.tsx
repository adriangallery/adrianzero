import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from './cn';
import { Sheet } from './Sheet';
import { HomeIcon, GridIcon, FlaskIcon, BagIcon, MoreIcon } from './icons';
import { useVisibleNavItems } from '@/components/layout/useVisibleNavItems';

const PINNED_PATHS = new Set(['/zero', '/mynfts', '/shop']);

interface TabDest {
  key: string;
  to: string;
  label: string;
  icon: (active: boolean) => ReactNode;
  isActive: (pathname: string, search: string) => boolean;
}

const DESTS: TabDest[] = [
  {
    key: 'home',
    to: '/zero',
    label: 'Home',
    icon: (active) => <HomeIcon size={22} className={active ? 'text-acc' : 'text-mute'} />,
    isActive: (pathname) => pathname === '/zero' || pathname === '/',
  },
  {
    key: 'mynfts',
    to: '/mynfts',
    label: 'My NFTs',
    icon: (active) => <GridIcon size={22} className={active ? 'text-acc' : 'text-mute'} />,
    isActive: (pathname, search) => pathname.startsWith('/mynfts') && !search.includes('tab=traits'),
  },
  {
    key: 'traitlab',
    to: '/mynfts?tab=traits',
    label: 'TraitLab',
    icon: (active) => <FlaskIcon size={22} className={active ? 'text-acc' : 'text-mute'} />,
    isActive: (pathname, search) => pathname.startsWith('/mynfts') && search.includes('tab=traits'),
  },
  {
    key: 'shop',
    to: '/shop',
    label: 'Shop',
    icon: (active) => <BagIcon size={22} className={active ? 'text-acc' : 'text-mute'} />,
    isActive: (pathname) => pathname.startsWith('/shop'),
  },
];

export interface TabBarProps {
  /** true en /ui-kit: la dibuja en flujo normal (no fixed) para poder verla junto al resto. */
  embedded?: boolean;
}

/**
 * Tab bar inferior fija (móvil, < 768px): 5 destinos — Home, My NFTs,
 * TraitLab, Shop y More (hoja con el resto de NAV_ITEMS visibles).
 */
export function TabBar({ embedded = false }: TabBarProps) {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const visibleItems = useVisibleNavItems();

  const moreItems = visibleItems.filter((item) => !PINNED_PATHS.has(item.path));
  const isMoreActive = moreItems.some((item) => location.pathname.startsWith(item.path));

  return (
    <>
      <nav
        data-testid="ui-tabbar"
        aria-label="Navegación principal"
        className={cn(
          'inset-x-0 bottom-0 z-30 h-16 border-t-2 border-line bg-bg grid grid-cols-5 items-center',
          embedded ? 'relative' : 'fixed'
        )}
        style={embedded ? undefined : { paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {DESTS.map((dest) => {
          const active = dest.isActive(location.pathname, location.search);
          return (
            <Link
              key={dest.key}
              to={dest.to}
              className="flex flex-col items-center justify-center gap-1 h-full min-w-0"
              aria-current={active ? 'page' : undefined}
            >
              {dest.icon(active)}
              <span className={cn('text-[10px] leading-none', active ? 'text-acc font-bold' : 'text-mute')}>
                {dest.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          data-testid="ui-tabbar-more"
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center gap-1 h-full min-w-0"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <MoreIcon size={22} className={isMoreActive ? 'text-acc' : 'text-mute'} />
          <span className={cn('text-[10px] leading-none', isMoreActive ? 'text-acc font-bold' : 'text-mute')}>
            More
          </span>
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen} title="Más">
        <div className="flex flex-col gap-1 pb-2">
          {moreItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              target={item.external ? '_top' : undefined}
              onClick={() => setMoreOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-[var(--r-md)] px-3 py-3 text-[15px]',
                item.highlight ? 'text-acc font-bold' : 'text-fg',
                'hover:bg-line/40'
              )}
            >
              <span className="text-mute [&_svg]:h-5 [&_svg]:w-5">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          {moreItems.length === 0 ? (
            <p className="text-sm text-mute px-3 py-2">No hay más destinos disponibles.</p>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}
