/**
 * usePageTitle Hook
 * Returns dynamic title prefix/accent based on current route and wallet state
 */

import { useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';

interface PageTitle {
  prefix: string;
  accent: string;
}

const PAGE_TITLES: Record<string, PageTitle> = {
  '/onboarding': { prefix: 'Adrian', accent: 'ZERO' },
  '/mint': { prefix: 'Adrian', accent: 'ZERO' },
  '/shop': { prefix: 'Trait', accent: 'SHOP' },
  '/lambo': { prefix: 'Adrian', accent: 'LAMBO' },
  '/shitdrop': { prefix: 'Shit', accent: 'DROP' },
};

const DEFAULT_TITLE: PageTitle = { prefix: 'Trait', accent: 'LAB' };

export function usePageTitle(): PageTitle {
  const location = useLocation();
  const { isConnected } = useAccount();

  // Dynamic title for root route based on wallet connection
  if (location.pathname === '/') {
    if (isConnected) {
      // Dashboard with wallet connected → AdrianZERO
      return { prefix: 'Adrian', accent: 'ZERO' };
    } else {
      // Should redirect to /adrianzero, but show TraitLAB as fallback
      return DEFAULT_TITLE;
    }
  }

  // AdrianZero route → always show AdrianZERO
  if (location.pathname === '/adrianzero') {
    return { prefix: 'Adrian', accent: 'ZERO' };
  }

  return PAGE_TITLES[location.pathname] || DEFAULT_TITLE;
}
