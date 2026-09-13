/**
 * useSectionTitle Hook
 * Título corto de la sección actual (Home, Shop, My NFTs...) para mostrar
 * junto al wordmark único "ZERO" en el header móvil (F3.5, D17 13-sep-2026).
 * Espeja el mapeo de NAV_ITEMS que ya usa MainLayout.getPageTitle() para
 * document.title, sin duplicar la lista de labels.
 */
import { useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '@/components/layout/navigation';

const EXTRA_TITLES: Record<string, string> = {
  '/explain-to-jb': 'Explain to JB',
  '/traitlab': 'TraitLab',
};

export function useSectionTitle(): string {
  const { pathname } = useLocation();

  if (EXTRA_TITLES[pathname]) return EXTRA_TITLES[pathname];

  const match = NAV_ITEMS.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)
  );

  return match?.label ?? 'Home';
}
