/**
 * TabBar Component (My NFTs)
 * F3.5 (13-sep, D17): segmented control de 4 destinos (patrón MisNFTs.dc.html)
 * en vez de la fila de 6 pestañas con scroll horizontal — Customize/Craft
 * siguen accesibles por URL directa (?tab=customize|craft), solo dejan de
 * tener entrada visible en el segmento.
 */

import type { ReactNode } from 'react';
import { cn } from '@/ui/cn';

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
    <div
      data-testid="mynfts-segmented-tabs"
      className="flex gap-1.5 border-2 border-line rounded-[var(--r-lg)] p-1 bg-bg"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-pressed={isActive}
            className={cn(
              'font-ui flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[var(--r-md)] text-[13px] transition-colors',
              isActive ? 'bg-line text-fg font-bold' : 'text-mute hover:text-fg'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
