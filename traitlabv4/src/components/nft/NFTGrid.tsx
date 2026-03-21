/**
 * NFTGrid Component
 * Responsive grid for displaying NFTs with virtualization on mobile
 * V4.6: 3-col compact mobile grid, dim non-selected cards, search support
 */

import { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Frame } from 'lucide-react';
import { NFTCard } from './NFTCard';
import type { AdrianZeroToken } from '@/types/nft.types';
import { shouldOptimizeForTouch } from '@/lib/web3/utils/walletDetection';

interface NFTGridProps {
  tokens: AdrianZeroToken[];
  selectedTokenId?: string | null;
  onTokenSelect?: (token: AdrianZeroToken) => void;
  onEndReached?: () => void;
  emptyMessage?: string;
}

export function NFTGrid({
  tokens,
  selectedTokenId,
  onTokenSelect,
  onEndReached,
  emptyMessage = 'No NFTs found',
}: NFTGridProps) {
  const isMobile = shouldOptimizeForTouch();
  const hasSelection = !!selectedTokenId;

  // 3 cols on mobile for denser grid (compact mode), 4+ on desktop
  const itemsPerRow = isMobile ? 3 : 4;

  // Group tokens into rows for virtualization
  const rows = useMemo(() => {
    const result: AdrianZeroToken[][] = [];

    for (let i = 0; i < tokens.length; i += itemsPerRow) {
      result.push(tokens.slice(i, i + itemsPerRow));
    }

    return result;
  }, [tokens, itemsPerRow]);

  if (tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Frame className="h-16 w-16 mb-4 text-muted-foreground" />
        <p className="text-lg font-medium text-foreground">{emptyMessage}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Connect your wallet to view your NFTs
        </p>
      </div>
    );
  }

  // Use virtualization on mobile for better performance
  if (isMobile && tokens.length > 20) {
    return (
      <Virtuoso
        style={{ height: 'calc(100vh - 200px)' }}
        totalCount={rows.length}
        endReached={() => onEndReached?.()}
        itemContent={(index) => {
          const row = rows[index];
          return (
            <div className="grid grid-cols-3 gap-2 mb-2 px-1">
              {row.map((token) => (
                <NFTCard
                  key={token.tokenId}
                  token={token}
                  isSelected={token.tokenId === selectedTokenId}
                  hasSelection={hasSelection}
                  onClick={() => onTokenSelect?.(token)}
                  compact={isMobile}
                />
              ))}
            </div>
          );
        }}
      />
    );
  }

  // Regular grid for desktop or small collections
  return (
    <div
      className={`grid gap-2 sm:gap-3 ${
        isMobile
          ? 'grid-cols-3'
          : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7'
      }`}
    >
      {tokens.map((token) => (
        <NFTCard
          key={token.tokenId}
          token={token}
          isSelected={token.tokenId === selectedTokenId}
          hasSelection={hasSelection}
          onClick={() => onTokenSelect?.(token)}
          compact={isMobile}
        />
      ))}
    </div>
  );
}
