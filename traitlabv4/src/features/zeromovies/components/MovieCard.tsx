import type { Movie } from '../types';
import { useAccount } from 'wagmi';

interface MovieCardProps {
  movie: Movie;
  posterUrl: string;
  onClick: () => void;
  isCurrentlyRented?: boolean;
  isPermanent?: boolean;
  renterAddr?: string;
  listingPrice?: number;
  /** True when block.timestamp > rentedAt + gracePeriod (5d on S1). */
  isOverdue?: boolean;
  daysOverdue?: number;
}

export function MovieCard({
  movie,
  posterUrl,
  onClick,
  isCurrentlyRented,
  isPermanent,
  renterAddr,
  listingPrice,
  isOverdue = false,
  daysOverdue = 0,
}: MovieCardProps) {
  const { address } = useAccount();

  const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
  const hasRenter = renterAddr && renterAddr !== ZERO_ADDR;
  const isYoursRental = isCurrentlyRented && !isPermanent && hasRenter && renterAddr?.toLowerCase() === address?.toLowerCase();
  const isYoursPermanent = isPermanent && (
    (hasRenter && renterAddr?.toLowerCase() === address?.toLowerCase()) ||
    (!hasRenter && movie.mintedBy?.toLowerCase() === address?.toLowerCase())
  );
  const isYours = isYoursRental || isYoursPermanent;
  const isOthers = (isCurrentlyRented || isPermanent) && !isYours;
  const isOnSale = (listingPrice ?? 0) > 0 && !isYours;

  return (
    <button
      onClick={onClick}
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded transition-all duration-300 text-left
        ${isOthers ? 'cursor-pointer hover:opacity-90' : 'cursor-pointer hover:scale-105 hover:z-10'}
        ${isYoursPermanent ? 'border-2 border-yellow-400' : ''}
        ${isYoursRental && !isOverdue ? 'border-2 border-sky-400' : ''}
        ${isOverdue ? 'border-2 border-red-600' : ''}
      `}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-t bg-zinc-900">
        <img
          src={posterUrl}
          alt={movie.name}
          className={`h-full w-full object-contain ${isOthers && !isOnSale && !isOverdue ? 'opacity-20 saturate-0' : ''}`}
          style={{ imageRendering: 'pixelated' }}
          loading="lazy"
        />

        {/* OVERDUE overlay (any S1 NFT past gracePeriod) — wins over status badges */}
        {isOverdue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40">
            <span className="rotate-[-12deg] rounded border-2 border-red-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-red-400">
              OVERDUE
            </span>
            <span className="mt-1 text-[8px] font-bold uppercase tracking-wider text-red-300">
              {daysOverdue}d
            </span>
          </div>
        )}

        {/* Status badges (only when not overdue) */}
        {!isOverdue && isYoursPermanent && (
          <div className="absolute top-1 right-1 rounded bg-yellow-400 px-1.5 py-0.5 text-[7px] font-bold text-black">
            OWNED
          </div>
        )}
        {!isOverdue && isYoursRental && (
          <div className="absolute top-1 right-1 rounded bg-sky-400 px-1.5 py-0.5 text-[7px] font-bold text-black">
            RENTING
          </div>
        )}
        {!isOverdue && isOnSale && (
          <div className="absolute bottom-1 left-1 rounded bg-green-600 px-1.5 py-0.5 text-[7px] font-bold text-white">
            ON SALE
          </div>
        )}
        {!isOverdue && isOthers && !isOnSale && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded bg-red-900/70 px-2 py-0.5 text-[8px] font-bold uppercase text-red-400">
              Rented
            </span>
          </div>
        )}
      </div>

      <div className="px-1 py-1.5">
        <p className={`truncate text-[9px] font-bold transition-colors ${
          isOverdue ? 'text-red-400' : isOthers ? 'text-zinc-600' : 'text-zinc-300 group-hover:text-white'
        }`}>
          {movie.name}
        </p>
      </div>
    </button>
  );
}
