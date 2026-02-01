/**
 * AdrianZeroModule Component
 * Main module for viewing and managing AdrianZERO NFTs
 */

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Unplug, AlertTriangle } from 'lucide-react';
import { NFTGrid } from '@/components/nft/NFTGrid';
import { NFTTraitSelector } from '@/components/nft/NFTTraitSelector';
import { useAdrianZeroTokens } from '../hooks/useAdrianZeroTokens';
import { useCustomNames } from '../hooks/useCustomNames';
import { useAdrianZeroStore } from '../store/adrianZeroStore';

export function AdrianZeroModule() {
  const { isConnected } = useAccount();
  const [previewToken, setPreviewToken] = useState<any>(null);

  // Load tokens
  const { data: tokens = [], isLoading, error } = useAdrianZeroTokens();

  // Load custom names
  const tokenIds = tokens.map((t) => t.tokenId);
  const { data: customNames = {} } = useCustomNames(tokenIds);

  // Merge custom names with tokens
  const tokensWithNames = useMemo(() => {
    return tokens.map((token) => ({
      ...token,
      name: customNames[token.tokenId] || token.name,
    }));
  }, [tokens, customNames]);

  // Store
  const { setSelectedToken, sortBy, sortOrder } = useAdrianZeroStore();

  // Sort tokens
  const sortedTokens = useMemo(() => {
    const sorted = [...tokensWithNames];

    sorted.sort((a, b) => {
      if (sortBy === 'tokenId') {
        const comparison = parseInt(a.tokenId) - parseInt(b.tokenId);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else if (sortBy === 'name') {
        const nameA = a.name || `#${a.tokenId}`;
        const nameB = b.name || `#${b.tokenId}`;
        const comparison = nameA.localeCompare(nameB);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      return 0;
    });

    return sorted;
  }, [tokensWithNames, sortBy, sortOrder]);

  // Handlers
  const handleTokenSelect = (token: any) => {
    setSelectedToken(token);
    setPreviewToken(token);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Unplug className="h-16 w-16 mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">
          Wallet Not Connected
        </h2>
        <p className="text-muted-foreground mt-2">
          Please connect your wallet to view your AdrianZERO NFTs
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="shimmer w-16 h-16 rounded-full mb-4" />
        <p className="text-muted-foreground">Loading your NFTs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-16 w-16 mb-4 text-yellow-500" />
        <h2 className="text-xl font-semibold text-foreground">
          Error Loading NFTs
        </h2>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Failed to load NFTs'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">AdrianZERO NFTs</h1>
          <p className="text-muted-foreground mt-1">
            {tokens.length} {tokens.length === 1 ? 'NFT' : 'NFTs'} in your collection
          </p>
        </div>
      </div>

      {/* Grid */}
      <NFTGrid
        tokens={sortedTokens}
        selectedTokenId={previewToken?.tokenId}
        onTokenSelect={handleTokenSelect}
        emptyMessage="No AdrianZERO NFTs found in your wallet"
      />

      {/* Trait Selector Modal */}
      {previewToken && (
        <NFTTraitSelector
          nft={previewToken}
          isOpen={!!previewToken}
          onClose={() => setPreviewToken(null)}
        />
      )}
    </div>
  );
}
