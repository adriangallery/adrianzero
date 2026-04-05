import { useState } from 'react';
import type { NFTType } from '../types/gallery.types';

interface NFTCardProps {
  tokenId: number;
  name: string;
  imageUrl: string;
  type: NFTType;
  owner: string;
  onClick: () => void;
}

const TYPE_COLORS: Record<NFTType, string> = {
  Gen0: 'bg-zinc-600 text-zinc-200',
  SamuraiZERO: 'bg-red-700 text-red-100',
  SubZERO: 'bg-blue-700 text-blue-100',
  ZEROmovies: 'bg-red-600 text-red-100',
  GenZERO: 'bg-pink-600 text-pink-100',
  Unknown: 'bg-gray-700 text-gray-300',
};

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function NFTCard({ name, imageUrl, type, owner, onClick }: NFTCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col rounded bg-zinc-900/80 transition-all duration-200 text-left overflow-hidden min-w-0 hover:scale-105 hover:z-10 hover:shadow-[0_0_20px_rgba(220,38,38,0.2)]"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t bg-black">
        {!loaded && !error && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900" />
        )}
        {error ? (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-600 text-xs">
            No image
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={name}
            className={`h-full w-full object-contain transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ imageRendering: 'pixelated' }}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )}

        {/* Type badge */}
        <div className={`absolute top-1 right-1 rounded px-1.5 py-0.5 text-[7px] font-bold ${TYPE_COLORS[type]}`}>
          {type === 'Unknown' ? '???' : type}
        </div>
      </div>

      {/* Info */}
      <div className="px-1.5 py-1.5 space-y-0.5 min-w-0 overflow-hidden">
        <p className="truncate text-[9px] font-bold text-zinc-300 group-hover:text-white transition-colors">
          {name}
        </p>
        <p className="truncate text-[7px] font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors">
          {truncateAddress(owner)}
        </p>
      </div>
    </button>
  );
}
