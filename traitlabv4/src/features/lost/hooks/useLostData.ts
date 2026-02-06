/**
 * Hook for loading LOST timeline data from JSON files
 */

import { useState, useEffect } from 'react';
import type { LostData } from '../types/lost.types';

export function useLostData() {
  const [data2025, setData2025] = useState<LostData | null>(null);
  const [data2026, setData2026] = useState<LostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [data25, data26] = await Promise.all([
          import('../data/lost-data-2025.json'),
          import('../data/lost-data-2026.json'),
        ]);
        setData2025((data25.default || data25) as LostData);
        setData2026((data26.default || data26) as LostData);
      } catch (error) {
        console.error('Error loading LOST data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return { data2025, data2026, isLoading };
}
