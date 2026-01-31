/**
 * CustomModule Component
 * Rename NFTs and manage zoom toggles
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useAdrianZeroTokens } from '@/features/adrianzero/hooks/useAdrianZeroTokens';
import { useRenameToken, useNamePrice } from '../hooks/useRename';
import type { AdrianZeroToken } from '@/types/nft.types';

export function CustomModule() {
  const { isConnected } = useAccount();
  const [selectedToken, setSelectedToken] = useState<AdrianZeroToken | null>(null);
  const [newName, setNewName] = useState('');

  const { data: tokens = [] } = useAdrianZeroTokens();
  const { data: namePrice = '0' } = useNamePrice();
  const renameToken = useRenameToken();

  const handleRename = async () => {
    if (!selectedToken || !newName.trim()) return;

    try {
      await renameToken.mutateAsync({
        tokenId: selectedToken.tokenId,
        newName: newName.trim(),
      });

      setNewName('');
      setSelectedToken(null);
    } catch (error) {
      console.error('Failed to rename:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🔌</div>
        <h2 className="text-xl font-semibold text-foreground">Wallet Not Connected</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Customization</h1>
        <p className="text-muted-foreground mt-1">Rename your NFTs</p>
      </div>

      <div className="max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Select NFT
          </label>
          <select
            value={selectedToken?.tokenId || ''}
            onChange={(e) => {
              const token = tokens.find((t) => t.tokenId === e.target.value);
              setSelectedToken(token || null);
            }}
            className="w-full px-3 py-2 bg-muted rounded-lg text-foreground"
          >
            <option value="">-- Select an NFT --</option>
            {tokens.map((token) => (
              <option key={token.tokenId} value={token.tokenId}>
                {token.name || `AdrianZERO #${token.tokenId}`}
              </option>
            ))}
          </select>
        </div>

        {selectedToken && (
          <>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                New Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name..."
                className="w-full px-3 py-2 bg-muted rounded-lg text-foreground"
                maxLength={32}
              />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Price: {namePrice} $ADRIAN tokens
              </p>
            </div>

            <button
              onClick={handleRename}
              disabled={!newName.trim() || renameToken.isPending}
              className="w-full touch-target px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {renameToken.isPending ? 'Renaming...' : 'Rename NFT'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
