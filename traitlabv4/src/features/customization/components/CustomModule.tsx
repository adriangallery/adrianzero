/**
 * CustomModule Component
 * Rename NFTs and manage visual effect toggles
 */

import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useAdrianZeroTokens } from '@/features/adrianzero/hooks/useAdrianZeroTokens';
import { useRenameToken, useNamePrice } from '../hooks/useRename';
import { useTokenToggle, useSetToggle, AVAILABLE_TOGGLES } from '../hooks/useToggles';
import { useWalletPrompt } from '@/hooks/useWalletPrompt';
import type { AdrianZeroToken } from '@/types/nft.types';

export function CustomModule() {
  const [selectedToken, setSelectedToken] = useState<AdrianZeroToken | null>(null);
  const [newName, setNewName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<number | null>(null);

  const { data: tokens = [] } = useAdrianZeroTokens();
  const { data: namePrice = '0' } = useNamePrice();
  const renameToken = useRenameToken();
  const { requireWallet } = useWalletPrompt();

  // Toggle hooks
  const { data: currentToggle = 0 } = useTokenToggle(selectedToken?.tokenId);
  const setToggle = useSetToggle();

  const handleRename = async () => {
    if (!selectedToken || !newName.trim()) return;

    // Check if wallet is connected before proceeding
    if (!requireWallet('rename your NFT')) {
      return;
    }

    try {
      await renameToken.mutateAsync({
        tokenId: selectedToken.tokenId,
        newName: newName.trim(),
      });

      setNewName('');
    } catch (error) {
      console.error('Failed to rename:', error);
    }
  };

  const handleToggleChange = (toggleId: number) => {
    if (!selectedToken) return;
    setPendingToggle(toggleId);
    setShowPreview(true);
  };

  const handleConfirmToggle = async () => {
    if (!selectedToken || pendingToggle === null) return;

    // Check if wallet is connected before proceeding
    if (!requireWallet('apply visual effects')) {
      return;
    }

    try {
      await setToggle.mutateAsync({
        tokenId: selectedToken.tokenId,
        toggleId: pendingToggle,
      });
      setShowPreview(false);
      setPendingToggle(null);
    } catch (error) {
      console.error('Failed to set toggle:', error);
    }
  };

  const getPreviewUrl = () => {
    if (!selectedToken || pendingToggle === null) return '';
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://adrianlab.vercel.app';
    return `${baseUrl}/api/render/adrianzero/${selectedToken.tokenId}?toggle=${pendingToggle}`;
  };

  const pendingToggleInfo = AVAILABLE_TOGGLES.find((t) => t.id === pendingToggle);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Customization</h1>
        <p className="text-muted-foreground mt-1">Rename your NFTs and apply visual effects</p>
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

            {/* Visual Effects Section */}
            <div className="mt-8 pt-8 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Visual Effects</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Apply special visual effects to your NFT
              </p>

              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_TOGGLES.map((toggle) => (
                  <button
                    key={toggle.id}
                    onClick={() => handleToggleChange(toggle.id)}
                    disabled={setToggle.isPending}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      currentToggle === toggle.id
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50 bg-card'
                    } disabled:opacity-50`}
                  >
                    <div className="font-medium text-foreground text-sm mb-1">
                      {toggle.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {toggle.description}
                    </div>
                    {currentToggle === toggle.id && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                        <Sparkles className="h-3 w-3" />
                        <span>Active</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedToken && pendingToggleInfo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-card rounded-lg max-w-lg w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-foreground mb-2">Preview Effect</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {pendingToggleInfo.name}: {pendingToggleInfo.description}
            </p>

            <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-4">
              <img
                src={getPreviewUrl()}
                alt={`Preview with ${pendingToggleInfo.name}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to original image if preview fails
                  if (selectedToken.image?.cachedUrl) {
                    e.currentTarget.src = selectedToken.image.cachedUrl;
                  }
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 touch-target px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmToggle}
                disabled={setToggle.isPending}
                className="flex-1 touch-target px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {setToggle.isPending ? 'Applying...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
