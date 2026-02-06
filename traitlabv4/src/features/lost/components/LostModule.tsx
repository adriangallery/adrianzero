/**
 * LostModule Component
 * Main container for LOST timeline feature
 */

import { LostHero } from './LostHero';
import { LostSelectors } from './LostSelectors';
import { EventsGrid } from './EventsGrid';
import { YearView } from './YearView';
import { useLostStore } from '../store/lostStore';
import { useEventFiltering } from '../hooks/useEventFiltering';

export function LostModule() {
  const { selectedYear } = useLostStore();
  const { events, isLoading } = useEventFiltering();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <p className="text-muted-foreground">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lost-module mx-auto max-w-7xl px-4 py-8">
      <LostHero />
      <LostSelectors />

      {selectedYear ? (
        <YearView events={events} year={selectedYear} />
      ) : (
        <EventsGrid events={events} />
      )}
    </div>
  );
}
