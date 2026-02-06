/**
 * YearView Component
 * Month-grouped list view for year mode
 */

import { useMemo } from 'react';
import { EventListItem } from './EventListItem';
import type { Event } from '../types/lost.types';

interface YearViewProps {
  events: Event[];
  year: string;
}

export function YearView({ events, year }: YearViewProps) {
  // Group events by month (simplified - events don't have dates, so we'll just show all)
  const eventsByMonth = useMemo(() => {
    // For now, just return all events in a single group
    // In a real implementation, you'd group by month based on event metadata
    return [{ month: year, events }];
  }, [events, year]);

  if (events.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No events found for {year}.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {eventsByMonth.map((group) => (
        <div key={group.month}>
          <h3 className="mb-4 text-xl font-bold text-foreground">
            {group.month} <span className="text-sm text-muted-foreground">({group.events.length} events)</span>
          </h3>
          <div className="space-y-3">
            {group.events.map((event, index) => (
              <EventListItem key={index} event={event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
