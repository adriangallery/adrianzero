/**
 * EventCard Component
 * Displays a single event with emoji, title, description, badges, stats, and links
 */

import type { Event } from '../types/lost.types';

interface EventCardProps {
  event: Event;
}

const statusColors = {
  completed: 'bg-ok/20 text-ok border-ok/30',
  'in-progress': 'bg-acc/20 text-acc border-acc/30',
  future: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  announced: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const categoryColors = {
  announcement: 'bg-acc/20 text-acc',
  bot: 'bg-violet-500/20 text-violet-400',
  infrastructure: 'bg-slate-500/20 text-mute',
  mint: 'bg-pink-500/20 text-pink-400',
  social: 'bg-orange-500/20 text-orange-400',
  feature: 'bg-ok/20 text-ok',
  dapp: 'bg-acc/20 text-acc',
  marketplace: 'bg-ok/20 text-ok',
  community: 'bg-rose-500/20 text-rose-400',
  launch: 'bg-fuchsia-500/20 text-fuchsia-400',
  update: 'bg-acc/20 text-acc',
};

export function EventCard({ event }: EventCardProps) {
  return (
    <div className="rounded-lg border border-line bg-panel p-5 transition-all hover:border-acc hover:shadow-lg">
      <div className="mb-3 flex items-start gap-3">
        <span className="text-3xl">{event.emoji}</span>
        <div className="flex-1">
          <h3 className="mb-1 font-bold text-fg">{event.title}</h3>
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

      <p className="mb-3 text-sm text-mute">{event.description}</p>

      {event.stats && Object.keys(event.stats).length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2 rounded-md bg-line/50 p-3">
          {Object.entries(event.stats).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="text-xs text-mute capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="font-bold text-fg">{value}</div>
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
              className="text-xs text-acc hover:underline"
            >
              {link.text} →
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
