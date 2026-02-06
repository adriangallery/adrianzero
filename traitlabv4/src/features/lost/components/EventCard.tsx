/**
 * EventCard Component
 * Displays a single event with emoji, title, description, badges, stats, and links
 */

import type { Event } from '../types/lost.types';

interface EventCardProps {
  event: Event;
}

const statusColors = {
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  'in-progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  future: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  announced: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const categoryColors = {
  announcement: 'bg-cyan-500/20 text-cyan-400',
  bot: 'bg-violet-500/20 text-violet-400',
  infrastructure: 'bg-slate-500/20 text-slate-400',
  mint: 'bg-pink-500/20 text-pink-400',
  social: 'bg-orange-500/20 text-orange-400',
  feature: 'bg-green-500/20 text-green-400',
  dapp: 'bg-blue-500/20 text-blue-400',
  marketplace: 'bg-emerald-500/20 text-emerald-400',
  community: 'bg-rose-500/20 text-rose-400',
  launch: 'bg-fuchsia-500/20 text-fuchsia-400',
  update: 'bg-indigo-500/20 text-indigo-400',
};

export function EventCard({ event }: EventCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-lg">
      <div className="mb-3 flex items-start gap-3">
        <span className="text-3xl">{event.emoji}</span>
        <div className="flex-1">
          <h3 className="mb-1 font-bold text-foreground">{event.title}</h3>
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[event.status]}`}
            >
              {event.status}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[event.category]}`}
            >
              {event.category}
            </span>
          </div>
        </div>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">{event.description}</p>

      {event.stats && Object.keys(event.stats).length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2 rounded-md bg-muted/50 p-3">
          {Object.entries(event.stats).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="text-xs text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="font-bold text-foreground">{value}</div>
            </div>
          ))}
        </div>
      )}

      {event.links && event.links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {event.links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              {link.text} →
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
