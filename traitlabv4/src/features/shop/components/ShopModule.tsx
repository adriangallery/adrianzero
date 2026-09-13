/**
 * Shop (F8, maqueta Shop.dc.html): el catálogo se ve SIN wallet (antes la
 * página entera era «Wallet Not Connected»); la wallet solo hace falta al
 * comprar, y se pide desde la hoja de compra. Saldo arriba a la derecha,
 * chips de categoría, rejilla, hoja de compra por ítem.
 */

import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { RefreshCw } from 'lucide-react';
import { useShopItems, type ShopItem } from '../hooks/useShopItems';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { formatTokenAmount } from '../lib/format';
import { ShopTabs, type ShopTab } from './ShopTabs';
import { ShopItemGrid } from './ShopItemGrid';
import { PurchaseSheet } from './PurchaseSheet';

const EMPTY: Record<ShopTab, string> = {
  floppies: 'No packs on sale right now',
  traits: 'No traits on sale right now',
  serums: 'No serums on sale right now',
};

function isShopTab(v: string | null): v is ShopTab {
  return v === 'floppies' || v === 'traits' || v === 'serums';
}

export function ShopModule() {
  const { isConnected } = useAccount();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<ShopTab>(isShopTab(tabParam) ? tabParam : 'floppies');
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { traits, floppies, serums, isLoading, error, refetch } = useShopItems();
  const { zeroBalance } = useTokenBalance();

  const byTab: Record<ShopTab, ShopItem[]> = useMemo(
    () => ({ floppies, traits, serums }),
    [floppies, traits, serums]
  );

  const changeTab = (tab: ShopTab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  const openItem = (item: ShopItem) => {
    setSelected(item);
    setSheetOpen(true);
  };

  return (
    <div className="flex min-w-0 flex-col gap-3 lg:px-2">
      {/* Cabecera: título + saldo */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-ui text-[15px] font-bold text-fg">Shop</h1>
        <div className="flex items-center gap-2">
          {isConnected && zeroBalance !== undefined ? (
            <span className="rounded-full border-2 border-line px-3 py-1.5 text-[13px] text-fg" data-testid="shop-balance">
              <span className="font-ui font-bold text-acc">{formatTokenAmount(zeroBalance)}</span> ZERO
            </span>
          ) : (
            <span className="text-[13px] text-mute">Browse freely · connect to buy</span>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            aria-label="Refresh"
            className="grid h-9 w-9 place-items-center rounded-full text-mute hover:bg-panel hover:text-fg disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-[var(--r-md)] border-2 border-bad bg-bad/10 p-3 text-[14px] text-bad">
          Could not load the shop. Pull to refresh or try again in a moment.
        </div>
      ) : null}

      <ShopTabs
        activeTab={activeTab}
        onTabChange={changeTab}
        counts={{ floppies: floppies.length, traits: traits.length, serums: serums.length }}
      />

      <div className="pb-4">
        <ShopItemGrid items={byTab[activeTab]} isLoading={isLoading} emptyMessage={EMPTY[activeTab]} onSelect={openItem} />
      </div>

      <PurchaseSheet item={selected} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
