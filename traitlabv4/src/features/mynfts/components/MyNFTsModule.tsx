/**
 * My NFTs Hub Module
 * Central hub for managing NFTs with tabbed interface:
 * NFTs | Traits | Packs | Serums | Customize | Craft
 */

import { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TabBar, type Tab } from './TabBar';
import { useAdrianZeroStore } from '@/features/adrianzero/store/adrianZeroStore';
import { Frame, Palette, Package, FlaskConical, Edit3, Hammer } from 'lucide-react';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

// Lazy load tab content
const NFTsTab = lazy(() =>
  import('@/features/adrianzero/components/AdrianZeroModule').then((m) => ({
    default: m.AdrianZeroModule,
  }))
);
const TraitsTab = lazy(() =>
  import('@/features/traits/components/TraitsModule').then((m) => ({
    default: m.TraitsModule,
  }))
);
const PacksTab = lazy(() =>
  import('@/features/packs/components/PacksModule').then((m) => ({
    default: m.PacksModule,
  }))
);
const SerumsTab = lazy(() =>
  import('@/features/serum/components/SerumModule').then((m) => ({
    default: m.SerumModule,
  }))
);
const CustomizeTab = lazy(() =>
  import('@/features/customization/components/CustomModule').then((m) => ({
    default: m.CustomModule,
  }))
);
const CraftTab = lazy(() =>
  import('@/features/crafting/components/CraftingModule').then((m) => ({
    default: m.CraftingModule,
  }))
);

const TABS: Tab[] = [
  { id: 'nfts', label: 'NFTs', icon: <Frame className="h-4 w-4" /> },
  { id: 'traits', label: 'Traits', icon: <Palette className="h-4 w-4" /> },
  { id: 'packs', label: 'Packs', icon: <Package className="h-4 w-4" /> },
  { id: 'serums', label: 'Serums', icon: <FlaskConical className="h-4 w-4" /> },
  { id: 'customize', label: 'Customize', icon: <Edit3 className="h-4 w-4" /> },
  { id: 'craft', label: 'Craft', icon: <Hammer className="h-4 w-4" /> },
];

const TAB_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType<{ embedded?: boolean }>>> = {
  nfts: NFTsTab,
  traits: TraitsTab,
  packs: PacksTab,
  serums: SerumsTab,
  customize: CustomizeTab,
  craft: CraftTab,
};

export function MyNFTsModule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'nfts';
  const selectedToken = useAdrianZeroStore((s) => s.selectedToken);

  const handleTabChange = (tabId: string) => {
    if (tabId === 'nfts') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: tabId });
    }
  };

  const ActiveComponent = TAB_COMPONENTS[activeTab] || TAB_COMPONENTS.nfts;

  return (
    <div className="flex flex-col h-full">
      {/* Selected NFT Banner */}
      {selectedToken && activeTab !== 'nfts' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border text-sm">
          <img
            src={`https://adrianlab.vercel.app/api/adrian-zero/render/${selectedToken}`}
            alt={`ZERO #${selectedToken}`}
            className="h-8 w-8 rounded border border-border"
          />
          <span className="text-muted-foreground">Working on:</span>
          <span className="font-bold text-[#00ff00]">ZERO #{selectedToken}</span>
          <button
            onClick={() => handleTabChange('nfts')}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
          >
            Change
          </button>
        </div>
      )}

      {/* Tab Bar */}
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={<LoadingSkeleton />}>
          <ActiveComponent embedded />
        </Suspense>
      </div>
    </div>
  );
}
