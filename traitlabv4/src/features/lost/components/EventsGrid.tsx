/**
 * EventsGrid Component
 * Responsive grid view for events
 */

import { EventCard } from './EventCard';
import type { Event } from '../types/lost.types';

interface EventsGridProps {
  events: Event[];
}

export function EventsGrid({ events }: EventsGridProps) {
  if (events.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No events found for this selection.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event, index) => (
        <EventCard key={index} event={event} />
      ))}
    </div>
  );
}
