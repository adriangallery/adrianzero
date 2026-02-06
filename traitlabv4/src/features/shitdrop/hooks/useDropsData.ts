import { useQuery } from '@tanstack/react-query';
import type { DropsData, Drop } from '../types/shitdrop.types';
import dropsDataJson from '../data/drops.json';

export function useDropsData() {
  return useQuery<DropsData>({
    queryKey: ['shitdrop-drops'],
    queryFn: async () => {
      // Use imported JSON as fallback/primary source
      return dropsDataJson as DropsData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useCurrentDrop() {
  const { data } = useDropsData();

  // First drop is the current/active one
  const currentDrop: Drop | null = data?.drops?.[0] || null;

  return { currentDrop };
}

export function usePreviousDrops() {
  const { data } = useDropsData();

  // All drops except the first one
  const previousDrops: Drop[] = data?.drops?.slice(1) || [];

  // Sort by date descending
  const sortedDrops = [...previousDrops].sort((a, b) =>
    String(b.date || '').localeCompare(String(a.date || ''))
  );

  return { previousDrops: sortedDrops };
}
