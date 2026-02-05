/**
 * ShopModule Component
 * Main shop page with tabs, grid, and cart
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Unplug, RefreshCw } from 'lucide-react';
import { useShopItems } from '../hooks/useShopItems';
import { useAdrianBalance } from '../hooks/useAdrianBalance';
import { ShopTabs, type ShopTab } from './ShopTabs';
import { ShopItemGrid } from './ShopItemGrid';
import { ShopCart } from './ShopCart';

export function ShopModule() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<ShopTab>('traits');

  const { items, traits, floppies, serums, isLoading, error, refetch } = useShopItems();
  const { formatted: balanceFormatted } = useAdrianBalance();

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
        <h2 className="text-xl font-semibold text-foreground">
          Wallet Not Connected
        </h2>
        <p className="text-muted-foreground mt-2">
          Please connect your wallet to browse the shop
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Shop</h1>
            <p className="text-muted-foreground mt-1">
              Purchase traits, floppies, and serums with $ADRIAN
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Balance */}
            <div className="hidden sm:block text-right">
              <p className="text-sm text-muted-foreground">Your Balance</p>
              <p className="font-bold text-accent">
                {balanceFormatted.toLocaleString()} $ADRIAN
              </p>
            </div>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive mb-6">
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
        <div className="mt-6">
          <ShopItemGrid
            items={getCurrentItems()}
            isLoading={isLoading}
            emptyMessage={getEmptyMessage()}
          />
        </div>
      </div>

      {/* Cart Sidebar */}
      <ShopCart />
    </div>
  );
}
