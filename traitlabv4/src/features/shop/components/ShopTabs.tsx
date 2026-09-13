/**
 * Pestañas de la Shop como chips del sistema (F8, maqueta Shop.dc.html):
 * Packs · Traits · Serums · Studio. Studio no es un filtro: lleva al
 * T-Shit Studio.
 */

import { useNavigate } from 'react-router-dom';
import { Chip } from '@/ui';

export type ShopTab = 'floppies' | 'traits' | 'serums';

interface ShopTabsProps {
  activeTab: ShopTab;
  onTabChange: (tab: ShopTab) => void;
  counts: Record<ShopTab, number>;
}

const TABS: { id: ShopTab; label: string }[] = [
  { id: 'floppies', label: 'Packs' },
  { id: 'traits', label: 'Traits' },
  { id: 'serums', label: 'Serums' },
];

export function ShopTabs({ activeTab, onTabChange, counts }: ShopTabsProps) {
  const navigate = useNavigate();
  return (
    <div className="scroll -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: 'none' }} role="tablist">
      {TABS.map((tab) => (
        <Chip
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          selected={activeTab === tab.id}
          count={counts[tab.id] > 0 ? counts[tab.id] : undefined}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </Chip>
      ))}
      <Chip onClick={() => navigate('/tshit')}>Studio ›</Chip>
    </div>
  );
}
