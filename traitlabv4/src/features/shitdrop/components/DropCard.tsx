import { ExternalLink } from 'lucide-react';
import type { Drop } from '../types/shitdrop.types';

interface DropCardProps {
  drop: Drop;
}

export function DropCard({ drop }: DropCardProps) {
  return (
    <a
      href={drop.opensea}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="overflow-hidden rounded-lg border-2 border-line bg-panel transition-all duration-300 hover:border-acc hover:shadow-lg hover:shadow-primary/20">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-line">
          <img
            src={drop.image}
            alt={drop.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />

          {/* OpenSea icon overlay */}
          <div className="absolute right-2 top-2 rounded-full bg-bg/70 p-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <ExternalLink className="h-4 w-4 text-fg" />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="mb-2 line-clamp-1 text-lg font-bold text-acc2">
            {drop.title}
          </h3>
          <p className="line-clamp-2 text-sm text-mute">
            {drop.short}
          </p>

          {drop.totalMinted && (
            <div className="mt-3 text-xs text-mute">
              Minted: {drop.totalMinted}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
