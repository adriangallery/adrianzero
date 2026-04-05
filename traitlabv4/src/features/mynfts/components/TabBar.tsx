/**
 * TabBar Component
 * Horizontal scrollable tab bar — mobile-first design
 */

import type { ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon: ReactNode;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="border-b border-border bg-card sticky top-0 z-10">
      <div className="flex overflow-x-auto no-scrollbar px-3 py-2 gap-1.5">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                whitespace-nowrap flex-shrink-0 transition-colors
                ${isActive
                  ? 'bg-[#00ff00] text-black font-bold'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
