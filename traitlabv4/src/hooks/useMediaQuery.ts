import { useEffect, useState } from 'react';

/**
 * Suscripción reactiva a un media query. SSR-safe (arranca en `false` sin
 * `window` y se corrige en el primer efecto, igual que el patrón ya usado
 * en MainLayout para el breakpoint de escritorio).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
