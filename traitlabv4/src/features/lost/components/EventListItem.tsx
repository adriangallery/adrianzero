/**
 * EventListItem Component
 * Compact list view for year mode
 */

import type { Event } from '../types/lost.types';

interface EventListItemProps {
  event: Event;
}

const statusColors = {
  completed: 'text-green-400',
  'in-progress': 'text-blue-400',
  future: 'text-purple-400',
  announced: 'text-yellow-400',
};

export function EventListItem({ event }: EventListItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-card p-3 transition-all hover:border-primary">
      <span className="text-2xl">{event.emoji}</span>
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h4 className="font-semibold text-foreground">{event.title}</h4>
          <span className={`text-xs ${statusColors[event.status]}`}>
            {event.status === 'completed' ? '✓' : event.status === 'in-progress' ? '⏳' : ''}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{event.description}</p>
      </div>
    </div>
  );
}
