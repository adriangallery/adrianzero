/**
 * ShopTabs Component
 * Tab navigation for shop categories
 */

import { Palette, Disc, FlaskConical } from 'lucide-react';

export type ShopTab = 'traits' | 'floppies' | 'serums';

interface ShopTabsProps {
  activeTab: ShopTab;
  onTabChange: (tab: ShopTab) => void;
  counts: {
    traits: number;
    floppies: number;
    serums: number;
  };
}

const tabs: { id: ShopTab; label: string; icon: React.ReactNode }[] = [
  { id: 'traits', label: 'Traits', icon: <Palette className="h-4 w-4" /> },
  { id: 'floppies', label: 'Floppies', icon: <Disc className="h-4 w-4" /> },
  { id: 'serums', label: 'Serums', icon: <FlaskConical className="h-4 w-4" /> },
];

export function ShopTabs({ activeTab, onTabChange, counts }: ShopTabsProps) {
  return (
    <div className="flex gap-2 border-b border-border pb-2">
      {tabs.map((tab) => {
        const count = counts[tab.id];
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors
              ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {count > 0 && (
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs
                  ${isActive ? 'bg-white/20' : 'bg-muted'}
                `}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
