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
  '/zero': { prefix: 'Trait', accent: 'LAB' },
  '/mint': { prefix: 'Adrian', accent: 'ZERO' },
  '/mynfts': { prefix: 'My', accent: 'NFTs' },
  '/shop': { prefix: 'Trait', accent: 'SHOP' },
  '/buy': { prefix: 'Buy', accent: '$ZERO' },
  '/zeromovies': { prefix: 'ZERO', accent: 'movies' },
  '/gallery': { prefix: 'Gallery', accent: '' },
  '/punks': { prefix: 'Adrian', accent: 'Punks' },
  '/shitdrop': { prefix: 'Shit', accent: 'DROP' },
  '/timeline': { prefix: 'Time', accent: 'line' },
  '/about': { prefix: 'About', accent: '' },
};

const DEFAULT_TITLE: PageTitle = { prefix: 'Trait', accent: 'LAB' };

export function usePageTitle(): PageTitle {
  const location = useLocation();

  if (location.pathname === '/') {
    return DEFAULT_TITLE;
  }

  return PAGE_TITLES[location.pathname] || DEFAULT_TITLE;
}
