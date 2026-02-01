/**
 * LamboModule Component
 * Generate and download Lamborghini variants
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Unplug, Car } from 'lucide-react';
import { useAdrianZeroTokens } from '@/features/adrianzero/hooks/useAdrianZeroTokens';
import { useLambo, LAMBO_COLORS } from '../hooks/useLambo';
import type { AdrianZeroToken } from '@/types/nft.types';

export function LamboModule() {
  const { isConnected } = useAccount();
  const [selectedToken, setSelectedToken] = useState<AdrianZeroToken | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const { data: tokens = [] } = useAdrianZeroTokens();
  const { selectedColor, setSelectedColor, generateLamboUrl, downloadImage } = useLambo();

  const handleDownload = async () => {
    if (!selectedToken) return;

    setIsDownloading(true);
    setImageError(null);
    try {
      await downloadImage(selectedToken.tokenId, selectedColor);
    } catch (error) {
      console.error('Download failed:', error);
      setImageError(error instanceof Error ? error.message : 'Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(null);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError('Failed to load preview. The image generation service may be unavailable.');
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Unplug className="h-16 w-16 mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Wallet Not Connected</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Lambo Variants</h1>
        <p className="text-muted-foreground mt-1">
          Generate Lamborghini variants in different colors
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* NFT Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-foreground">
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

          {/* Color Selection */}
          {selectedToken && (
            <>
              <label className="block text-sm font-medium text-foreground">
                Select Color
              </label>
              <div className="grid grid-cols-3 gap-3">
                {LAMBO_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={`
                      p-3 rounded-lg border-2 transition-all
                      ${
                        selectedColor === color.id
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <div
                      className="w-full h-8 rounded mb-2"
                      style={{
                        backgroundColor: color.hex,
                        border: color.id === 'white' ? '1px solid #ccc' : 'none',
                      }}
                    />
                    <p className="text-xs font-medium text-foreground text-center">
                      {color.name}
                    </p>
                  </button>
                ))}
              </div>

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full touch-target px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isDownloading ? 'Downloading...' : 'Download Image'}
              </button>
            </>
          )}
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-foreground">Preview</label>
          <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
            {selectedToken ? (
              <>
                {imageLoading && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="shimmer w-16 h-16 rounded-full" />
                  </div>
                )}
                {imageError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                    <Car className="h-16 w-16 text-destructive mb-2" />
                    <p className="text-sm text-destructive">{imageError}</p>
                  </div>
                ) : (
                  <img
                    src={generateLamboUrl(selectedToken.tokenId, selectedColor)}
                    alt="Lambo Preview"
                    className="w-full h-full object-cover"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
          {imageError && (
            <p className="text-xs text-destructive">
              Tip: Try selecting a different color or NFT
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
