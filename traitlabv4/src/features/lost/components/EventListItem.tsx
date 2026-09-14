/**
 * EventListItem Component
 * Compact list view for year mode
 */

import type { Event } from '../types/lost.types';

interface EventListItemProps {
  event: Event;
}

const statusColors = {
  completed: 'text-ok',
  'in-progress': 'text-acc',
  future: 'text-purple-400',
  announced: 'text-yellow-400',
};

export function EventListItem({ event }: EventListItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-line bg-panel p-3 transition-all hover:border-acc">
      <span className="text-2xl">{event.emoji}</span>
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h4 className="font-semibold text-fg">{event.title}</h4>
          <span className={`text-xs ${statusColors[event.status]}`}>
            {event.status === 'completed' ? '✓' : event.status === 'in-progress' ? '⏳' : ''}
          </span>
        </div>
        <p className="text-sm text-mute">{event.description}</p>
      </div>
    </div>
  );
}
