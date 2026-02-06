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
        <p className="text-muted-foreground">
          Generate Lamborghini variants in different colors
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* NFT Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-foreground">
            Select NFT
          </label>

          {/* NFT Grid - Compact version */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {tokens.map((token) => {
              const imageUrl = token.image?.cachedUrl || token.image?.thumbnailUrl || token.image?.originalUrl || token.metadata?.image;
              const isSelected = selectedToken?.tokenId === token.tokenId;

              return (
                <button
                  key={token.tokenId}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedToken(null);
                    } else {
                      setSelectedToken(token);
                      setImageLoading(true);
                    }
                  }}
                  className={`
                    relative aspect-square rounded-lg overflow-hidden transition-all
                    ${isSelected
                      ? 'ring-2 ring-primary shadow-lg scale-105'
                      : 'hover:ring-1 hover:ring-border hover:shadow-md'
                    }
                    bg-muted
                  `}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={token.name || `#${token.tokenId}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}

                  {/* Token ID Badge */}
                  <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-accent/90 rounded text-[10px] font-medium" style={{ color: '#00ff00' }}>
                    #{token.tokenId}
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview + Color Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-foreground">Preview</label>
          <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
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
                    className="w-full h-full object-contain"
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

          {/* Color Selection - Now below preview */}
          {selectedToken && (
            <>
              <label className="block text-sm font-medium text-foreground mt-6">
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
      </div>
    </div>
  );
}
