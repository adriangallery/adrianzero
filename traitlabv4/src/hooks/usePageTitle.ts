/**
 * usePageTitle Hook
 * Returns dynamic title prefix/accent based on current route
 */

import { useLocation } from 'react-router-dom';

interface PageTitle {
  prefix: string;
  accent: string;
}

const PAGE_TITLES: Record<string, PageTitle> = {
  '/': { prefix: 'Trait', accent: 'LAB' },
  '/onboarding': { prefix: 'Adrian', accent: 'ZERO' },
  '/mint': { prefix: 'Adrian', accent: 'ZERO' },
  '/shop': { prefix: 'Trait', accent: 'SHOP' },
};

const DEFAULT_TITLE: PageTitle = { prefix: 'Trait', accent: 'LAB' };

export function usePageTitle(): PageTitle {
  const location = useLocation();
  return PAGE_TITLES[location.pathname] || DEFAULT_TITLE;
}
