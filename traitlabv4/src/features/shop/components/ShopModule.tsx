/**
 * ShopModule Component
 * Main shop page with tabs, grid, and cart — dual-token support
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Unplug, RefreshCw } from 'lucide-react';
import { useShopItems } from '../hooks/useShopItems';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { ShopTabs, type ShopTab } from './ShopTabs';
import { ShopItemGrid } from './ShopItemGrid';
import { ShopCart } from './ShopCart';

export function ShopModule() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<ShopTab>('traits');

  const { items, traits, floppies, serums, isLoading, error, refetch } = useShopItems();
  const { zeroFormatted, adrianFormatted } = useTokenBalance();

  // Get items for current tab
  const getCurrentItems = () => {
    switch (activeTab) {
      case 'traits':
        return traits;
      case 'floppies':
        return floppies;
      case 'serums':
        return serums;
      default:
        return items;
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'traits':
        return 'No traits available';
      case 'floppies':
        return 'No floppies available';
      case 'serums':
        return 'No serums available';
      default:
        return 'No items available';
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Unplug className="h-16 w-16 mb-4 text-muted-foreground" />
        <h2 className="font-ui text-xl font-semibold text-foreground">
          Wallet Not Connected
        </h2>
        <p className="text-muted-foreground mt-2">
          Please connect your wallet to browse the shop
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0">
      {/* Main Content — sin padding propio en móvil: el Container ya da
          16px (F3.5: el p-4 de aquí lo doblaba, y el flex sin min-w-0
          dejaba que el contenido empujara la página fuera del viewport). */}
      <div className="flex-1 min-w-0 overflow-y-auto lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="font-ui text-xl font-bold text-fg">Shop</h1>
            <p className="text-mute text-[13px] mt-0.5 truncate-2">
              Purchase traits, floppies, and serums with $ZERO or $ADRIAN
            </p>
          </div>

          <div className="flex items-center gap-2 flex-none">
            {/* Balances */}
            <div className="hidden sm:block text-right">
              <p className="text-[13px] text-mute">Your Balances</p>
              <p className="font-ui font-bold text-acc text-sm">
                {zeroFormatted.toLocaleString()} $ZERO
              </p>
              <p className="text-xs text-mute">
                {adrianFormatted.toLocaleString()} $ADRIAN
              </p>
            </div>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-panel text-mute hover:text-fg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-[var(--r-md)] border-2 border-bad bg-bad/10 text-bad mb-4 text-sm">
            Failed to load shop items. Please try again.
          </div>
        )}

        {/* Tabs */}
        <ShopTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{
            traits: traits.length,
            floppies: floppies.length,
            serums: serums.length,
          }}
        />

        {/* Items Grid */}
        <div className="mt-4 pb-[calc(var(--tabbar-h)+80px)]">
          <ShopItemGrid
            items={getCurrentItems()}
            isLoading={isLoading}
            emptyMessage={getEmptyMessage()}
          />
        </div>
      </div>

      {/* Cart Sidebar (desktop) / ActionBar flotante (móvil, dentro de ShopCart) */}
      <ShopCart />
    </div>
  );
}
