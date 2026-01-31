/**
 * TraitCategories Component
 * Horizontal scrollable category tabs with trait counts
 */

import type { TraitCategory, Trait } from '@/types/nft.types';

interface TraitCategoriesProps {
  categories: TraitCategory[];
  traitsByCategory: Record<TraitCategory, Trait[]>;
  activeCategory: TraitCategory | 'ALL';
  onCategoryChange: (category: TraitCategory | 'ALL') => void;
}

const categoryLabels: Record<TraitCategory, string> = {
  BACKGROUND: 'Background',
  EAR: 'Ears',
  EYES: 'Eyes',
  MOUTH: 'Mouth',
  NECK: 'Neck',
  NOSE: 'Nose',
  OUTFIT: 'Outfit',
  ACCESSORY: 'Accessory',
  HEAD: 'Head',
  HANDS: 'Hands',
  SPECIAL: 'Special',
  HAIR: 'Hair',
  CLOTHING: 'Clothing',
};

export function TraitCategories({
  categories,
  traitsByCategory,
  activeCategory,
  onCategoryChange,
}: TraitCategoriesProps) {
  const allCount = Object.values(traitsByCategory).reduce(
    (sum, traits) => sum + traits.length,
    0
  );

  return (
    <div className="border-b border-border overflow-x-auto custom-scrollbar">
      <div className="flex gap-1 p-1 min-w-max">
        {/* All Category */}
        <button
          onClick={() => onCategoryChange('ALL')}
          className={`
            touch-target px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap
            transition-colors
            ${
              activeCategory === 'ALL'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }
          `}
        >
          All
          <span className="ml-2 text-xs opacity-75">({allCount})</span>
        </button>

        {/* Category Tabs */}
        {categories.map((category) => {
          const count = traitsByCategory[category]?.length || 0;

          if (count === 0) return null;

          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`
                touch-target px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap
                transition-colors
                ${
                  activeCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }
              `}
            >
              {categoryLabels[category] || category}
              <span className="ml-2 text-xs opacity-75">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
