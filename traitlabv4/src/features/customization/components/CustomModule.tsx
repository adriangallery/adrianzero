/**
 * CustomModule Component
 * Rename NFTs and manage visual effect toggles
 */

import { useState, useMemo } from 'react';
import { Sparkles, X, Frame } from 'lucide-react';
import { useAdrianZeroTokens } from '@/features/adrianzero/hooks/useAdrianZeroTokens';
import { useAdrianZeroStore } from '@/features/adrianzero/store/adrianZeroStore';
import { useCustomNames } from '@/features/adrianzero/hooks/useCustomNames';
import { useRenameToken, useNamePrice } from '../hooks/useRename';
import { useTokenToggle, useSetToggle, useSetBananaToggle, useTogglePrice, AVAILABLE_TOGGLES, TOGGLE_MODES } from '../hooks/useToggles';
import { useWalletPrompt } from '@/hooks/useWalletPrompt';
import { NFTGrid } from '@/components/nft/NFTGrid';
import { shouldOptimizeForTouch } from '@/lib/web3/utils/walletDetection';
import { useAutoInfiniteLoading } from '@/hooks/useAutoInfiniteLoading';
import type { AdrianZeroToken } from '@/types/nft.types';
import { formatEther } from 'viem';

export function CustomModule({ embedded }: { embedded?: boolean } = {}) {
  const storeToken = useAdrianZeroStore((s) => s.selectedToken);
  const [localSelectedToken, setLocalSelectedToken] = useState<AdrianZeroToken | null>(null);
  const selectedToken = embedded ? (storeToken as AdrianZeroToken | null) : localSelectedToken;
  const setSelectedToken = embedded ? () => {} : setLocalSelectedToken;
  const [newName, setNewName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedToggles, setSelectedToggles] = useState<Set<number>>(new Set());
  const [previewUrl, setPreviewUrl] = useState('');
  const isTouchDevice = shouldOptimizeForTouch();

  const {
    data: tokens = [],
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdrianZeroTokens();
  const { data: namePrice = '0' } = useNamePrice();
  const renameToken = useRenameToken();
  const { requireWallet } = useWalletPrompt();

  // Load custom names from name registry
  const tokenIds = tokens.map((t) => t.tokenId);
  const { data: customNames = {} } = useCustomNames(tokenIds);

  // Merge custom names with tokens
  const tokensWithNames = useMemo(() => {
    return tokens.map((token) => ({
      ...token,
      name: customNames[token.tokenId] || token.name,
    }));
  }, [tokens, customNames]);

  // Toggle hooks
  const { data: currentToggle = 0 } = useTokenToggle(selectedToken?.tokenId);
  const setToggle = useSetToggle();
  const setBananaToggle = useSetBananaToggle();

  // Get banana toggle price
  const { data: bananaPrice = '0' } = useTogglePrice(TOGGLE_MODES.BANANA);

  // Combined loading state for toggles
  const isTogglesLoading = setToggle.isPending || setBananaToggle.isPending;

  useAutoInfiniteLoading({
    enabled: true,
    hasNextPage,
    isFetchingNextPage,
    loadedCount: tokensWithNames.length,
    minimumItems: isTouchDevice ? 80 : 180,
    fetchNextPage,
  });

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

  const handleToggleClick = (toggleId: number) => {
    if (!selectedToken) return;

    const newToggles = new Set(selectedToggles);
    if (newToggles.has(toggleId)) {
      newToggles.delete(toggleId);
    } else {
      // Remove NONE if adding a toggle
      if (toggleId !== 0) {
        newToggles.delete(0);
      }
      // If selecting NONE, clear all others
      if (toggleId === 0) {
        newToggles.clear();
      }
      newToggles.add(toggleId);
    }

    setSelectedToggles(newToggles);
    updatePreview(newToggles);
  };

  // Map toggle IDs to URL parameter names
  const getToggleParam = (toggleId: number): string | null => {
    const toggleMap: Record<number, string> = {
      1: 'closeup',   // Closeup/Zoom
      2: 'shadow',    // Shadow Mode
      3: 'glow',      // Glow Mode
      4: 'bn',        // Black & White
      12: 'blackout', // Blackout (corrected from 11)
      13: 'banana',   // Banana Mode (corrected from 12)
    };
    return toggleMap[toggleId] || null;
  };

  const updatePreview = (toggles: Set<number>) => {
    if (!selectedToken) return;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://adrianlab.vercel.app';

    if (toggles.size === 0 || toggles.has(0)) {
      // No toggles - just the base image
      setPreviewUrl(`${baseUrl}/api/render/${selectedToken.tokenId}.png`);
      setShowPreview(true);
      return;
    }

    // Build URL with multiple toggle parameters
    const params = Array.from(toggles)
      .map(id => getToggleParam(id))
      .filter((param): param is string => param !== null)
      .map(param => `${param}=true`)
      .join('&');

    const url = `${baseUrl}/api/render/${selectedToken.tokenId}.png${params ? '?' + params : ''}`;
    setPreviewUrl(url);
    setShowPreview(true);
  };

  const handleConfirmToggle = async () => {
    if (!selectedToken || selectedToggles.size === 0) return;

    // Check if wallet is connected before proceeding
    if (!requireWallet('apply visual effects')) {
      return;
    }

    // Note: The contract only supports setting ONE toggle at a time
    // We'll set the first selected toggle
    const firstToggle = Array.from(selectedToggles)[0];

    try {
      // Special handling for Banana toggle (requires ADRIAN payment)
      if (firstToggle === TOGGLE_MODES.BANANA) {
        // Check if removing (if current toggle is banana)
        const isRemoving = currentToggle === TOGGLE_MODES.BANANA;

        if (!isRemoving && bananaPrice && bananaPrice !== '0') {
          // Show price confirmation
          const priceFormatted = formatEther(BigInt(bananaPrice));
          const confirmed = confirm(
            `Activate BANANA toggle?\n\n` +
            `Price: ${priceFormatted} ADRIAN\n\n` +
            `This will require:\n` +
            `1. Approve ADRIAN tokens\n` +
            `2. Execute payment transaction`
          );

          if (!confirmed) {
            return;
          }
        }

        await setBananaToggle.mutateAsync({
          tokenId: selectedToken.tokenId,
          isRemoving,
        });
      } else {
        // Standard toggle (free)
        await setToggle.mutateAsync({
          tokenId: selectedToken.tokenId,
          toggleId: firstToggle,
        });
      }

      setShowPreview(false);
      setSelectedToggles(new Set());
    } catch (error) {
      console.error('Failed to set toggle:', error);
    }
  };

  const getSelectedToggleNames = () => {
    return Array.from(selectedToggles)
      .map(id => AVAILABLE_TOGGLES.find(t => t.id === id)?.name)
      .filter(Boolean)
      .join(' + ');
  };

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="text-xl font-bold text-foreground">Customization</h1>
          <p className="text-muted-foreground mt-1">Rename your NFTs and apply visual effects</p>
        </div>
      )}

      <div className={embedded ? '' : 'grid gap-6 md:grid-cols-2'}>
        {/* Left Column: NFT Grid Selection (hidden when embedded) */}
        {!embedded && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-foreground">
              Select NFT
            </label>

            <NFTGrid
              tokens={tokensWithNames}
              selectedTokenId={selectedToken?.tokenId}
              onTokenSelect={(token) => {
                if (selectedToken?.tokenId === token.tokenId) {
                  setLocalSelectedToken(null);
                } else {
                  setLocalSelectedToken(token);
                }
                setNewName('');
              }}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
            />
          </div>
        )}

        {/* Right Column: Preview + Controls */}
        <div className="space-y-4">
          {selectedToken ? (
            <>
              {/* Current NFT Preview */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Current Preview
                </label>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={selectedToken.image?.cachedUrl || selectedToken.image?.originalUrl || selectedToken.metadata?.image}
                    alt={selectedToken.name || `#${selectedToken.tokenId}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {selectedToken.name || `AdrianZERO #${selectedToken.tokenId}`}
                </p>
              </div>

              {/* Rename Section */}
              <div className="border-t border-border pt-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rename NFT
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter new name..."
                  className="w-full px-3 py-2 bg-muted rounded-lg text-foreground mb-2"
                  maxLength={32}
                />
                <p className="text-xs text-muted-foreground mb-3">
                  Price: {namePrice} $ADRIAN tokens
                </p>
                <button
                  onClick={handleRename}
                  disabled={!newName.trim() || renameToken.isPending}
                  className="w-full touch-target px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {renameToken.isPending ? 'Renaming...' : 'Rename NFT'}
                </button>
              </div>

              {/* Visual Effects Section */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Visual Effects</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Select multiple effects to combine them (Preview only)
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_TOGGLES.map((toggle) => {
                    const isSelected = selectedToggles.has(toggle.id);
                    const isCurrentlyActive = currentToggle === toggle.id;
                    const isBanana = toggle.id === TOGGLE_MODES.BANANA;
                    const hasCost = isBanana && bananaPrice && bananaPrice !== '0';

                    return (
                      <button
                        key={toggle.id}
                        onClick={() => handleToggleClick(toggle.id)}
                        disabled={isTogglesLoading}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50 bg-card'
                        } disabled:opacity-50`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-foreground text-xs">
                            {toggle.name}
                            {hasCost && <span className="ml-1 text-yellow-500">💰</span>}
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded bg-primary flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {toggle.description}
                          {hasCost && (
                            <div className="mt-1 text-yellow-600 dark:text-yellow-400 font-medium">
                              Cost: {formatEther(BigInt(bananaPrice))} ADRIAN
                            </div>
                          )}
                        </div>
                        {isCurrentlyActive && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-success">
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>Active on NFT</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedToggles.size > 0 && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">
                      Selected: <span className="text-foreground font-medium">{getSelectedToggleNames()}</span>
                    </p>
                    <p className="text-[10px] text-yellow-600 dark:text-yellow-400">
                      Note: You can only save ONE effect to the blockchain, but you can preview multiple effects combined.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Frame className="h-16 w-16 mx-auto mb-2" />
                <p className="text-sm">Select an NFT to customize</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedToken && previewUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-card rounded-lg max-w-lg w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setShowPreview(false);
                setSelectedToggles(new Set());
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-foreground mb-2">Preview Effects</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedToggles.size === 0 || selectedToggles.has(0)
                ? 'No effects applied'
                : `Combining: ${getSelectedToggleNames()}`
              }
            </p>

            <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-4">
              <img
                src={previewUrl}
                alt="Preview with effects"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to original image if preview fails
                  if (selectedToken.image?.cachedUrl) {
                    e.currentTarget.src = selectedToken.image.cachedUrl;
                  }
                }}
              />
            </div>

            {selectedToggles.size > 1 && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  ⚠️ You can only save ONE effect to the blockchain. The first selected effect ({AVAILABLE_TOGGLES.find(t => t.id === Array.from(selectedToggles)[0])?.name}) will be saved.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setSelectedToggles(new Set());
                }}
                className="flex-1 touch-target px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Cancel
              </button>
              {selectedToggles.size > 0 && !selectedToggles.has(0) && (
                <button
                  onClick={handleConfirmToggle}
                  disabled={isTogglesLoading}
                  className="flex-1 touch-target px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isTogglesLoading ? 'Applying...' : 'Save to NFT'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
