/**
 * TraitCard Component
 * Displays an individual trait with selection state
 */

import { Palette } from 'lucide-react';
import type { Trait } from '@/types/nft.types';

interface TraitCardProps {
  trait: Trait;
  isSelected?: boolean;
  onClick?: () => void;
  showBalance?: boolean;
}

export function TraitCard({
  trait,
  isSelected = false,
  onClick,
  showBalance = true,
}: TraitCardProps) {
  const imageUrl =
    trait.image?.cachedUrl ||
    trait.image?.thumbnailUrl ||
    trait.image?.originalUrl ||
    trait.metadata?.image;

  const rarityColors = {
    common: 'bg-gray-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-yellow-500',
  };

  const rarityColor = trait.rarity ? rarityColors[trait.rarity] : 'bg-gray-500';

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-lg overflow-hidden cursor-pointer
        transition-all duration-200 touch-target active:scale-95
        ${
          isSelected
            ? 'ring-2 ring-primary shadow-lg'
            : 'hover:shadow-md hover:ring-1 hover:ring-border'
        }
        bg-card
      `}
    >
      {/* Image */}
      <div className="aspect-square relative bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={trait.name}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to originalUrl if cachedUrl fails
              if (trait.image?.originalUrl && e.currentTarget.src !== trait.image.originalUrl) {
                e.currentTarget.src = trait.image.originalUrl;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Palette className="h-12 w-12" />
          </div>
        )}

        {/* Balance Badge */}
        {showBalance && trait.balance > 1 && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-accent/90 rounded-md text-xs font-medium text-white">
            x{trait.balance}
          </div>
        )}

        {/* Rarity Badge */}
        {trait.rarity && (
          <div
            className={`absolute top-2 left-2 px-2 py-1 ${rarityColor} rounded-md text-xs font-medium text-white`}
          >
            {trait.rarity}
          </div>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium truncate text-foreground text-sm">
          {trait.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 capitalize">
          {trait.category.toLowerCase().replace('_', ' ')}
        </p>
      </div>
    </div>
  );
}
