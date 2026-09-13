/**
 * NFTCard Component
 * Displays an individual NFT with image, name, and token ID
 * V4.6: More dramatic selection, compact mode for 3-col mobile, dim when sibling selected
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Frame } from 'lucide-react';
import type { AdrianZeroToken } from '@/types/nft.types';

interface NFTCardProps {
  token: AdrianZeroToken;
  isSelected?: boolean;
  /** True when ANY card in the grid is selected (dims non-selected) */
  hasSelection?: boolean;
  onClick?: () => void;
  showBadge?: boolean;
  /** Compact mode: image-only, no info section (for dense grids) */
  compact?: boolean;
  /** F3.5: si se pasa (y compact=false), pinta un botón "Edit" en el pie
   * que navega ahí en vez de solo seleccionar la tarjeta (patrón MisNFTs.dc.html). */
  editHref?: string;
}

export function NFTCard({
  token,
  isSelected = false,
  hasSelection = false,
  onClick,
  showBadge = true,
  compact = false,
  editHref,
}: NFTCardProps) {
  const imageUrl =
    token.image?.cachedUrl ||
    token.image?.thumbnailUrl ||
    token.image?.originalUrl ||
    token.metadata?.image;

  const displayName = token.name || token.metadata?.name || `#${token.tokenId}`;
  const hasTraits = token.appliedTraits && token.appliedTraits.length > 0;

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative rounded-lg overflow-hidden cursor-pointer
        touch-target
        transition-all duration-200
        border-2
        ${
          isSelected
            ? 'border-acc shadow-lg shadow-[#00ff00]/20 scale-[1.02] z-10'
            : hasSelection
              ? 'border-line opacity-50 hover:opacity-80'
              : 'border-line hover:border-mute'
        }
        bg-panel
      `}
    >
      {/* Image */}
      <div className="aspect-square relative bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayName}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              if (token.image?.originalUrl && e.currentTarget.src !== token.image.originalUrl) {
                e.currentTarget.src = token.image.originalUrl;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Frame className="h-12 w-12" />
          </div>
        )}

        {/* Traits equipped indicator (green dot) */}
        {hasTraits && !isSelected && (
          <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-[#00ff00] ring-2 ring-black/50" />
        )}

        {/* Token ID Badge */}
        {showBadge && !compact && (
          <div className="font-ui absolute top-2 right-2 px-2 py-1 bg-bg/90 border border-line rounded-md text-xs font-medium text-acc">
            #{token.tokenId}
          </div>
        )}

        {/* Compact badge (smaller, bottom-right) */}
        {compact && (
          <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 rounded text-[9px] font-medium text-white/80">
            #{token.tokenId}
          </div>
        )}

        {/* Selection Indicator — green checkmark instead of blue */}
        {isSelected && (
          <div className="absolute inset-0 bg-[#00ff00]/10 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[#00ff00] flex items-center justify-center shadow-lg shadow-[#00ff00]/30">
              <svg
                className="w-6 h-6 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Info — hidden in compact mode */}
      {!compact && (
        <div className="p-2 sm:p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-ui font-medium truncate text-fg text-xs sm:text-sm">{displayName}</h3>
            {hasTraits && (
              <span className="font-ui text-[10px] sm:text-xs text-acc/80 flex-none">
                {token.appliedTraits!.length} traits
              </span>
            )}
          </div>
          {editHref ? (
            <Link
              to={editHref}
              onClick={(e) => e.stopPropagation()}
              className="font-ui h-9 rounded-[var(--r-md)] bg-acc text-acc-fg text-[13px] font-bold flex items-center justify-center"
            >
              Edit
            </Link>
          ) : null}
        </div>
      )}
    </motion.div>
  );
}
