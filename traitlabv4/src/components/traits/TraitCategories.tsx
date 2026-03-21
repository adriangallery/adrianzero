/**
 * TraitCategories Component
 * Category tabs with "More" overflow for 15+ categories
 * V4.6: Show top 6 visible + "More" dropdown for the rest
 */

import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
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

const MAX_VISIBLE_TABS = 6;

export function TraitCategories({
  categories,
  traitsByCategory,
  activeCategory,
  onCategoryChange,
}: TraitCategoriesProps) {
  const [showMore, setShowMore] = useState(false);

  const allCount = Object.values(traitsByCategory).reduce(
    (sum, traits) => sum + traits.length,
    0
  );

  // Sort categories: ones with traits first, sorted by count descending
  const activeCategories = useMemo(() => {
    return categories
      .filter((cat) => (traitsByCategory[cat]?.length || 0) > 0)
      .sort((a, b) => (traitsByCategory[b]?.length || 0) - (traitsByCategory[a]?.length || 0));
  }, [categories, traitsByCategory]);

  // If active category is in overflow, promote it to visible
  const visibleCategories = useMemo(() => {
    const visible = activeCategories.slice(0, MAX_VISIBLE_TABS);
    const overflow = activeCategories.slice(MAX_VISIBLE_TABS);

    // If active category is in overflow, swap it into visible
    if (activeCategory !== 'ALL' && overflow.includes(activeCategory as TraitCategory)) {
      const activeIdx = overflow.indexOf(activeCategory as TraitCategory);
      overflow.splice(activeIdx, 1);
      visible.pop();
      visible.push(activeCategory as TraitCategory);
    }

    return { visible, overflow };
  }, [activeCategories, activeCategory]);

  const isOverflowActive = activeCategory !== 'ALL' && visibleCategories.overflow.includes(activeCategory as TraitCategory);

  const renderButton = (
    key: string,
    label: string,
    count: number,
    isActive: boolean,
    onClick: () => void
  ) => (
    <button
      key={key}
      onClick={onClick}
      className={`
        touch-target px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap
        transition-colors
        ${
          isActive
            ? 'bg-[#00ff00] text-black'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        }
      `}
    >
      {label}
      <span className="ml-1 opacity-70">({count})</span>
    </button>
  );

  return (
    <div className="pb-1">
      <div className="flex gap-1.5 flex-nowrap overflow-x-auto no-scrollbar">
        {/* All Category */}
        {renderButton('ALL', 'All', allCount, activeCategory === 'ALL', () =>
          onCategoryChange('ALL')
        )}

        {/* Visible Categories */}
        {visibleCategories.visible.map((category) => {
          const count = traitsByCategory[category]?.length || 0;
          return renderButton(
            category,
            categoryLabels[category] || category,
            count,
            activeCategory === category,
            () => onCategoryChange(category)
          );
        })}

        {/* More Button */}
        {visibleCategories.overflow.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowMore(!showMore)}
              className={`
                touch-target px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap
                transition-colors flex items-center gap-1
                ${
                  isOverflowActive
                    ? 'bg-[#00ff00] text-black'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }
              `}
            >
              More
              <ChevronDown className={`w-3 h-3 transition-transform ${showMore ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {showMore && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMore(false)}
                />
                <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-xl p-2 min-w-[180px] max-h-[300px] overflow-y-auto">
                  {visibleCategories.overflow.map((category) => {
                    const count = traitsByCategory[category]?.length || 0;
                    const isActive = activeCategory === category;
                    return (
                      <button
                        key={category}
                        onClick={() => {
                          onCategoryChange(category);
                          setShowMore(false);
                        }}
                        className={`
                          w-full text-left px-3 py-2 rounded-md text-xs font-medium
                          transition-colors flex items-center justify-between
                          ${
                            isActive
                              ? 'bg-[#00ff00]/20 text-[#00ff00]'
                              : 'text-foreground hover:bg-muted'
                          }
                        `}
                      >
                        <span>{categoryLabels[category] || category}</span>
                        <span className="text-muted-foreground ml-2">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
