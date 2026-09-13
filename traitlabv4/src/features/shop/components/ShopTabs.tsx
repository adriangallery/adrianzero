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
  { id: 'floppies', label: 'Packs', icon: <Disc className="h-4 w-4" /> },
  { id: 'serums', label: 'Serums', icon: <FlaskConical className="h-4 w-4" /> },
];

export function ShopTabs({ activeTab, onTabChange, counts }: ShopTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      {tabs.map((tab) => {
        const count = counts[tab.id];
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`font-ui flex-none flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 rounded-full text-[13px] transition-colors ${
              isActive
                ? 'bg-acc text-acc-fg font-bold'
                : 'border-2 border-line text-fg hover:border-mute'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {count > 0 && <span className="opacity-80">· {count}</span>}
          </button>
        );
      })}
    </div>
  );
}
