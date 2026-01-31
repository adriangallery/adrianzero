/**
 * NFTGrid Component
 * Responsive grid for displaying NFTs with virtualization on mobile
 */

import { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { NFTCard } from './NFTCard';
import type { AdrianZeroToken } from '@/types/nft.types';
import { shouldOptimizeForTouch } from '@/lib/web3/utils/walletDetection';

interface NFTGridProps {
  tokens: AdrianZeroToken[];
  selectedTokenId?: string | null;
  onTokenSelect?: (token: AdrianZeroToken) => void;
  emptyMessage?: string;
}

export function NFTGrid({
  tokens,
  selectedTokenId,
  onTokenSelect,
  emptyMessage = 'No NFTs found',
}: NFTGridProps) {
  const isMobile = shouldOptimizeForTouch();

  // Group tokens into rows for virtualization
  const rows = useMemo(() => {
    const itemsPerRow = isMobile ? 2 : 4;
    const result: AdrianZeroToken[][] = [];

    for (let i = 0; i < tokens.length; i += itemsPerRow) {
      result.push(tokens.slice(i, i + itemsPerRow));
    }

    return result;
  }, [tokens, isMobile]);

  if (tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🖼️</div>
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
        itemContent={(index) => {
          const row = rows[index];
          return (
            <div className="grid grid-cols-2 gap-4 mb-4 px-4">
              {row.map((token) => (
                <NFTCard
                  key={token.tokenId}
                  token={token}
                  isSelected={token.tokenId === selectedTokenId}
                  onClick={() => onTokenSelect?.(token)}
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
      className={`
        grid gap-4
        grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
      `}
    >
      {tokens.map((token) => (
        <NFTCard
          key={token.tokenId}
          token={token}
          isSelected={token.tokenId === selectedTokenId}
          onClick={() => onTokenSelect?.(token)}
        />
      ))}
    </div>
  );
}
