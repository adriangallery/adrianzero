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

const categoryLabels: Record<string, string> = {
  '3D': '3D',
  'ACTION PACKS': 'Action Packs',
  'ARMOUR': 'Armour',
  'BACKGROUND': 'Background',
  'BEARD': 'Beard',
  'EAR': 'Ears',
  'EYES': 'Eyes',
  'FLOPPY DISCS': 'Floppy Discs',
  'GEAR': 'Gear',
  'GI': 'GI',
  'HAIR': 'Hair',
  'HAT': 'Hat',
  'HEAD': 'Head',
  'KIMONO': 'Kimono',
  'MASK': 'Mask',
  'MOUTH': 'Mouth',
  'NECK': 'Neck',
  'NOSE': 'Nose',
  'PAGERS': 'Pagers',
  'RANDOMSHIT': 'Random Stuff',
  'SKIN': 'Skin',
  'SKINTRAIT': 'Skin Trait',
  'SWAG': 'Swag',
  'TOP': 'Top',
  'WEAPON': 'Weapon',
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
