/**
 * NFTPreview Component
 * Modal for viewing NFT details and performing actions
 */

import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Frame, RefreshCw } from 'lucide-react';
import type { AdrianZeroToken } from '@/types/nft.types';

interface NFTPreviewProps {
  token: AdrianZeroToken | null;
  isOpen: boolean;
  onClose: () => void;
  onActivate?: (tokenId: string) => void;
  onRefreshMetadata?: (tokenId: string) => void;
  isActivating?: boolean;
  isRefreshing?: boolean;
}

export function NFTPreview({
  token,
  isOpen,
  onClose,
  onActivate,
  onRefreshMetadata,
  isActivating = false,
  isRefreshing = false,
}: NFTPreviewProps) {
  if (!token) return null;

  const imageUrl =
    token.image?.cachedUrl ||
    token.image?.pngUrl ||
    token.image?.originalUrl ||
    token.metadata?.image;

  const displayName = token.name || token.metadata?.name || `AdrianZERO #${token.tokenId}`;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-auto bg-background rounded-lg shadow-xl"
              >
                {/* Image */}
                <div className="relative aspect-square bg-muted">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to originalUrl if cachedUrl (GitHub) fails
                        if (token.image?.originalUrl && e.currentTarget.src !== token.image.originalUrl) {
                          e.currentTarget.src = token.image.originalUrl;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Frame className="h-16 w-16" />
                    </div>
                  )}

                  {/* Close Button */}
                  <Dialog.Close className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-black/90 rounded-full text-white transition-colors">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Dialog.Close>
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                  <div>
                    <Dialog.Title className="text-2xl font-bold text-foreground">
                      {displayName}
                    </Dialog.Title>
                    <p className="text-sm text-muted-foreground mt-1">
                      Token ID: #{token.tokenId}
                    </p>
                  </div>

                  {token.metadata?.description && (
                    <p className="text-sm text-foreground">
                      {token.metadata.description}
                    </p>
                  )}

                  {/* Attributes */}
                  {token.metadata?.attributes && token.metadata.attributes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">
                        Attributes
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {token.metadata.attributes.map((attr, index) => (
                          <div
                            key={index}
                            className="p-2 bg-muted rounded-lg"
                          >
                            <p className="text-xs text-muted-foreground">
                              {attr.trait_type}
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {attr.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {onActivate && (
                      <button
                        onClick={() => onActivate(token.tokenId)}
                        disabled={isActivating}
                        className="flex-1 touch-target px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isActivating ? 'Activating...' : 'Activate Token'}
                      </button>
                    )}

                    {onRefreshMetadata && (
                      <button
                        onClick={() => onRefreshMetadata(token.tokenId)}
                        disabled={isRefreshing}
                        className="touch-target px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                      </button>
                    )}
                  </div>

                  {/* Links */}
                  {token.tokenUri && (
                    <div className="pt-4 border-t border-border">
                      <a
                        href={token.tokenUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View Metadata →
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
