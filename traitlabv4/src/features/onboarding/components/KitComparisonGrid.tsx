/**
 * KitComparisonGrid Component
 * Side-by-side layout for kit cards with mobile toggle
 */

import { useState } from 'react';
import { KitCard } from './KitCard';
import type { KitInfo } from '../hooks/useKitInfo';

interface KitComparisonGridProps {
  freeKitInfo: KitInfo | undefined;
  paidKitInfo: KitInfo | undefined;
  isLoading: boolean;
  isPaused: boolean;
  ethPrice: number | undefined;
  paidQuantity: number;
  maxQuantity: number;
  onPaidQuantityIncrement: () => void;
  onPaidQuantityDecrement: () => void;
  onMintFree: () => void;
  onMintPaid: () => void;
  isMintingFree: boolean;
  isMintingPaid: boolean;
  isConnected: boolean;
  canBuyFree: boolean;
  canBuyFreeMessage: string | undefined;
  canBuyPaid: boolean;
  canBuyPaidMessage: string | undefined;
  onConnectWallet?: () => void;
}

export function KitComparisonGrid({
  freeKitInfo,
  paidKitInfo,
  isLoading,
  isPaused,
  ethPrice,
  paidQuantity,
  maxQuantity,
  onPaidQuantityIncrement,
  onPaidQuantityDecrement,
  onMintFree,
  onMintPaid,
  isMintingFree,
  isMintingPaid,
  isConnected,
  canBuyFree,
  canBuyFreeMessage,
  canBuyPaid,
  canBuyPaidMessage,
  onConnectWallet,
}: KitComparisonGridProps) {
  const [activeTab, setActiveTab] = useState<'free' | 'paid'>('free');

  return (
    <div className="space-y-6">
      {/* Mobile Toggle */}
      <div className="flex justify-center md:hidden">
        <div className="inline-flex rounded-full border-2 border-success bg-background p-1">
          <button
            onClick={() => setActiveTab('free')}
            className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${
              activeTab === 'free'
                ? 'bg-success text-black'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            FREE Kit
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${
              activeTab === 'paid'
                ? 'bg-accent text-black'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Premium Kit
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-6 md:grid-cols-2 items-stretch">
        {/* Free Kit Card */}
        <div className={`${activeTab !== 'free' ? 'hidden md:block' : ''}`}>
          <KitCard
            type="free"
            kitInfo={freeKitInfo}
            isLoading={isLoading}
            isPaused={isPaused}
            ethPrice={ethPrice}
            quantity={1}
            maxQuantity={1}
            onQuantityIncrement={() => {}}
            onQuantityDecrement={() => {}}
            onMint={onMintFree}
            isMinting={isMintingFree}
            isConnected={isConnected}
            canBuy={canBuyFree}
            canBuyMessage={canBuyFreeMessage}
            onConnectWallet={onConnectWallet}
          />
        </div>

        {/* Paid Kit Card */}
        <div className={`${activeTab !== 'paid' ? 'hidden md:block' : ''}`}>
          <KitCard
            type="paid"
            kitInfo={paidKitInfo}
            isLoading={isLoading}
            isPaused={isPaused}
            ethPrice={ethPrice}
            quantity={paidQuantity}
            maxQuantity={maxQuantity}
            onQuantityIncrement={onPaidQuantityIncrement}
            onQuantityDecrement={onPaidQuantityDecrement}
            onMint={onMintPaid}
            isMinting={isMintingPaid}
            isConnected={isConnected}
            canBuy={canBuyPaid}
            canBuyMessage={canBuyPaidMessage}
            onConnectWallet={onConnectWallet}
          />
        </div>
      </div>
    </div>
  );
}
