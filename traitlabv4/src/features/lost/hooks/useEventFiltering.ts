/**
 * Hook for filtering events based on weeks or year selection
 */

import { useMemo } from 'react';
import { useLostStore } from '../store/lostStore';
import { useLostData } from './useLostData';
import type { Event } from '../types/lost.types';

export function useEventFiltering() {
  const { selectedWeeks, selectedYear } = useLostStore();
  const { data2025, data2026, isLoading } = useLostData();

  const events = useMemo(() => {
    if (isLoading || (!data2025 && !data2026)) {
      return [];
    }

    const allEvents: Event[] = [];

    // Year view: collect all events from selected year(s)
    if (selectedYear) {
      if (selectedYear === 'all' || selectedYear === '2025') {
        data2025?.weeks.forEach((week) => {
          allEvents.push(...week.events);
        });
      }
      if (selectedYear === 'all' || selectedYear === '2026') {
        data2026?.weeks.forEach((week) => {
          allEvents.push(...week.events);
        });
      }
      return allEvents;
    }

    // Week view: collect events from most recent N weeks across both years
    const allWeeks = [
      ...(data2025?.weeks || []).map((w) => ({ ...w, year: 2025 })),
      ...(data2026?.weeks || []).map((w) => ({ ...w, year: 2026 })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const recentWeeks = allWeeks.slice(0, selectedWeeks);
    recentWeeks.forEach((week) => {
      allEvents.push(...week.events);
    });

    return allEvents;
  }, [data2025, data2026, selectedWeeks, selectedYear, isLoading]);

  return { events, isLoading };
}
