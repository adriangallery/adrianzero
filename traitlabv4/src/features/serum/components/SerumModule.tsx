/**
 * SerumModule Component
 * Apply serums to AdrianZERO NFTs
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { Unplug, FlaskConical } from 'lucide-react';
import { useSerums } from '../hooks/useSerums';
import { useApplySerum } from '../hooks/useApplySerum';
import { useAdrianZeroTokens } from '@/features/adrianzero/hooks/useAdrianZeroTokens';
import { useAdrianZeroStore } from '@/features/adrianzero/store/adrianZeroStore';
import { NFTGrid } from '@/components/nft/NFTGrid';
import { shouldOptimizeForTouch } from '@/lib/web3/utils/walletDetection';
import { useAutoInfiniteLoading } from '@/hooks/useAutoInfiniteLoading';
import type { Serum } from '@/types/nft.types';
import type { AdrianZeroToken } from '@/types/nft.types';

export function SerumModule({ embedded }: { embedded?: boolean } = {}) {
  const { isConnected } = useAccount();
  const storeToken = useAdrianZeroStore((s) => s.selectedToken);
  const [localSelectedNFT, setLocalSelectedNFT] = useState<AdrianZeroToken | null>(null);
  const selectedNFT = embedded ? (storeToken as AdrianZeroToken | null) : localSelectedNFT;
  const setSelectedNFT = embedded ? () => {} : setLocalSelectedNFT;
  const [selectedSerum, setSelectedSerum] = useState<Serum | null>(null);
  const isTouchDevice = shouldOptimizeForTouch();

  // Load data
  const { data: serums = [], isLoading: serumsLoading } = useSerums();
  const {
    data: nfts = [],
    isLoading: nftsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdrianZeroTokens();

  // Mutations
  const applySerum = useApplySerum();

  useAutoInfiniteLoading({
    enabled: isConnected,
    hasNextPage,
    isFetchingNextPage,
    loadedCount: nfts.length,
    minimumItems: isTouchDevice ? 80 : 180,
    fetchNextPage,
  });

  const isLoading = serumsLoading || nftsLoading;

  // Handlers
  const handleApplySerum = async () => {
    if (!selectedNFT || !selectedSerum) return;

    try {
      await applySerum.mutateAsync({
        tokenId: selectedNFT.tokenId,
        serumId: selectedSerum.tokenId,
      });

      setSelectedNFT(null);
      setSelectedSerum(null);
    } catch (error) {
      console.error('Failed to apply serum:', error);
    }
  };

  if (!isConnected && !embedded) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Unplug className="h-16 w-16 mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">
          Wallet Not Connected
        </h2>
        <p className="text-muted-foreground mt-2">
          Please connect your wallet to use serums
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="shimmer w-16 h-16 rounded-full mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {!embedded && (
        <div>
          <h1 className="text-xl font-bold text-foreground">Serum</h1>
          <p className="text-muted-foreground mt-1">
            Apply serums to your AdrianZERO NFTs
          </p>
        </div>
      )}

      {/* No Serums */}
      {serums.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FlaskConical className="h-16 w-16 mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground">No serums found</p>
          <p className="text-sm text-muted-foreground mt-2">
            You don't have any serums in your wallet
          </p>
        </div>
      )}

      {/* Serums Available */}
      {serums.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Select NFT */}
          {embedded ? (
            <div className="space-y-4">
              {selectedNFT ? (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <img
                    src={`https://adrianlab.vercel.app/api/adrian-zero/render/${selectedNFT.tokenId}`}
                    alt={`ZERO #${selectedNFT.tokenId}`}
                    className="h-10 w-10 rounded border border-border"
                  />
                  <span className="text-sm font-medium">ZERO #{selectedNFT.tokenId}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                  Select an NFT in the NFTs tab first
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                1. Select NFT
              </h2>
              {nfts.length === 0 ? (
                <p className="text-muted-foreground">No NFTs found</p>
              ) : (
                <NFTGrid
                  tokens={nfts}
                  selectedTokenId={selectedNFT?.tokenId}
                  onTokenSelect={(token) => setLocalSelectedNFT(token)}
                  onEndReached={() => {
                    if (hasNextPage && !isFetchingNextPage) {
                      fetchNextPage();
                    }
                  }}
                  emptyMessage="No NFTs found"
                />
              )}
            </div>
          )}

          {/* Select Serum */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              2. Select Serum
            </h2>
            <div className="grid grid-cols-2 gap-3 p-1">
              {serums.map((serum) => {
                const imageUrl = serum.image?.cachedUrl || serum.image?.thumbnailUrl || serum.image?.originalUrl || serum.metadata?.image;
                return (
                  <SelectableCard
                    key={serum.tokenId}
                    isSelected={selectedSerum?.tokenId === serum.tokenId}
                    onClick={() => setSelectedSerum(serum)}
                    imageUrl={imageUrl}
                    label={serum.name}
                    badge={serum.balance > 1 ? `x${serum.balance}` : undefined}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Apply Button */}
      {selectedNFT && selectedSerum && (
        <div className="flex justify-center pt-6">
          <button
            onClick={handleApplySerum}
            disabled={applySerum.isPending}
            className="touch-target px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applySerum.isPending ? 'Applying...' : 'Apply Serum'}
          </button>
        </div>
      )}
    </div>
  );
}

// Selectable Card Component
function SelectableCard({
  isSelected,
  onClick,
  imageUrl,
  label,
  badge,
}: {
  isSelected: boolean;
  onClick: () => void;
  imageUrl?: string;
  label: string;
  badge?: string;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative rounded-lg overflow-hidden cursor-pointer transition-all
        ${
          isSelected
            ? 'ring-2 ring-primary shadow-lg'
            : 'hover:shadow-md hover:ring-1 hover:ring-border'
        }
        bg-card
      `}
    >
      <div className="aspect-square relative bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FlaskConical className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {badge && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-accent/90 rounded-md text-xs font-medium text-white">
            {badge}
          </div>
        )}

        {isSelected && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="p-2">
        <p className="text-sm font-medium truncate text-foreground">{label}</p>
      </div>
    </motion.div>
  );
}
