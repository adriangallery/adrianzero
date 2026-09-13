/**
 * TraitCard Component
 * Displays an individual trait with selection state
 * F3.5 (13-sep-2026): pasado al sistema de diseño (Card/Badge/CheckIcon) —
 * antes usaba bg-card/ring-primary/bg-primary, clases sin CSS real porque
 * tailwind.config.js no se carga en v4 sin @config (bug previo, no de esta
 * rama) — la tarjeta era literalmente transparente, sin "feeling de app".
 */
import { Palette } from 'lucide-react';
import { Card, Badge, CheckIcon } from '@/ui';
import { cn } from '@/ui/cn';
import type { Trait } from '@/types/nft.types';

interface TraitCardProps {
  trait: Trait;
  isSelected?: boolean;
  onClick?: () => void;
  showBalance?: boolean;
}

const RARITY_TONE = {
  common: 'mute',
  rare: 'acc',
  epic: 'acc',
  legendary: 'warn',
} as const;

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

  return (
    <Card
      onClick={onClick}
      className={cn(
        'relative rounded-[12px] overflow-hidden cursor-pointer flex flex-col',
        'transition-all duration-200 touch-target active:scale-95',
        isSelected ? 'border-acc shadow-[0_0_16px_rgba(0,255,0,0.2)]' : 'hover:border-mute'
      )}
    >
      {/* Image */}
      <div className="aspect-square relative bg-bg">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={trait.name}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              const fallbacks = [
                trait.image?.thumbnailUrl,
                trait.image?.originalUrl,
                trait.metadata?.image,
              ].filter(Boolean) as string[];
              const next = fallbacks.find((url) => url !== e.currentTarget.src);
              if (next) {
                e.currentTarget.src = next;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-mute">
            <Palette className="h-8 w-8 sm:h-12 sm:w-12" />
          </div>
        )}

        {/* Balance Badge */}
        {showBalance && trait.balance > 1 && (
          <Badge tone="acc" className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-bg">
            ×{trait.balance}
          </Badge>
        )}

        {/* Rarity Badge */}
        {trait.rarity && (
          <Badge tone={RARITY_TONE[trait.rarity]} className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-bg capitalize">
            {trait.rarity}
          </Badge>
        )}

        {/* Selection Indicator — check en círculo, borde --acc en la tarjeta */}
        {isSelected && (
          <div className="absolute inset-0 bg-acc/10 flex items-center justify-center">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-acc flex items-center justify-center shadow-lg">
              <CheckIcon size={18} className="text-acc-fg" />
            </div>
          </div>
        )}
      </div>

      {/* Info — nombre en 2 líneas, sin truncar a 1 */}
      <div className="p-2 flex flex-col gap-0.5">
        <h3 className="font-ui font-medium text-fg text-[11px] sm:text-xs leading-tight line-clamp-2 min-h-[2.4em]">
          {trait.name}
        </h3>
        <p className="text-[10px] text-mute capitalize hidden sm:block">
          {trait.category.toLowerCase().replace('_', ' ')}
        </p>
      </div>
    </Card>
  );
}
