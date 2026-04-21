/**
 * TraitCategories Component
 * Horizontal scrollable category tabs with trait counts
 * All categories in a single scrollable line
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
  'PUNK REWARDS': 'Punk Rewards',
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
  const allCount = Object.entries(traitsByCategory).reduce(
    (sum, [category, traits]) => (category === 'PUNK REWARDS' ? sum : sum + traits.length),
    0
  );

  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="flex gap-1.5 min-w-max pb-1">
        {/* All */}
        <button
          onClick={() => onCategoryChange('ALL')}
          className={`px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap transition-colors touch-target ${
            activeCategory === 'ALL'
              ? 'bg-[#00ff00] text-black'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          All<span className="ml-1 opacity-70">({allCount})</span>
        </button>

        {/* All categories — single scrollable line */}
        {categories.map((category) => {
          const count = traitsByCategory[category]?.length || 0;
          if (count === 0) return null;
          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap transition-colors touch-target ${
                activeCategory === category
                  ? 'bg-[#00ff00] text-black'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {categoryLabels[category] || category}<span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
