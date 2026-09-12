/**
 * My NFTs Hub Module
 * Central hub for managing NFTs with tabbed interface:
 * NFTs | Traits | Packs | Serums | Customize | Craft
 */

import { Suspense, lazy, useCallback } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { TabBar, type Tab } from './TabBar';
import { useAdrianZeroStore } from '@/features/adrianzero/store/adrianZeroStore';
import { AdrianZeroModule } from '@/features/adrianzero/components/AdrianZeroModule';
import { Frame, Package, FlaskConical } from 'lucide-react';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

// Lazy load all tabs except NFTs (needs onTokenSelected prop)
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

// F3.5 (D17, 13-sep): segmento visible reducido a 4 destinos (patrón
// MisNFTs.dc.html) — Customize/Craft siguen accesibles por ?tab= directo,
// solo dejan de tener entrada visible en el segmentado.
const TABS: Tab[] = [
  { id: 'nfts', label: 'NFTs', icon: <Frame className="h-4 w-4" /> },
  { id: 'packs', label: 'Packs', icon: <Package className="h-4 w-4" /> },
  { id: 'serums', label: 'Serums', icon: <FlaskConical className="h-4 w-4" /> },
];

export function MyNFTsModule() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'nfts';
  const selectedToken = useAdrianZeroStore((s) => s.selectedToken);

  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === 'nfts') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: tabId });
    }
  }, [setSearchParams]);

  // F4 (13-sep-2026): "Editar" un NFT ya no cambia de pestaña interna — va
  // directo al editor TraitLab dedicado (`/traitlab`), que lee el token
  // seleccionado en `adrianZeroStore` como hint inicial.
  const handleTokenSelected = useCallback(() => {
    navigate('/traitlab');
  }, [navigate]);

  return (
    <div className="flex flex-col h-full">
      {/* F3.5: banner "Working on" + segmentado pegados juntos como UN bloque
          sticky opaco (antes el fondo era bg-card, roto/transparente sin
          tailwind.config — se veían las tarjetas de la rejilla pasando por
          debajo). z-20: por encima del contenido, por debajo del Header
          (z-30) y de la Sheet/overlay (z-40+). */}
      <div className="sticky top-0 z-20 bg-bg flex flex-col gap-2 pb-2">
        {selectedToken && activeTab !== 'nfts' && (
          <div className="flex items-center gap-2 px-4 pt-2 text-sm">
            <img
              src={selectedToken.image?.cachedUrl || selectedToken.image?.originalUrl || selectedToken.metadata?.image || ''}
              alt={`ZERO #${selectedToken.tokenId}`}
              className="h-8 w-8 rounded border-2 border-line object-cover flex-none"
            />
            <span className="text-mute">Working on:</span>
            <span className="font-ui font-bold text-acc">ZERO #{selectedToken.tokenId}</span>
            <button
              onClick={() => handleTabChange('nfts')}
              className="font-ui ml-auto text-[12px] text-mute hover:text-fg underline"
            >
              Change
            </button>
          </div>
        )}

        <div className="px-4">
          <TabBar tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pb-[calc(var(--tabbar-h)+16px)]">
        <Suspense fallback={<LoadingSkeleton />}>
          {activeTab === 'nfts' && (
            <AdrianZeroModule embedded onTokenSelected={handleTokenSelected} />
          )}
          {/* Legado: /mynfts?tab=traits redirige al editor dedicado (F4). */}
          {activeTab === 'traits' && <Navigate to="/traitlab" replace />}
          {activeTab === 'packs' && <PacksTab embedded />}
          {activeTab === 'serums' && <SerumsTab embedded />}
          {activeTab === 'customize' && <CustomizeTab embedded />}
          {activeTab === 'craft' && <CraftTab embedded />}
        </Suspense>
      </div>
    </div>
  );
}
