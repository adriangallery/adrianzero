/**
 * TraitPreview Component
 * Modal showing NFT + traits combined preview
 */

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, AlertTriangle } from 'lucide-react';
import type { Trait } from '@/types/nft.types';
import { vercelImageService } from '@/lib/api/vercel/imageService';

interface TraitPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
  traits: Trait[];
  onConfirm: () => void;
  isApplying?: boolean;
}

export function TraitPreview({
  isOpen,
  onClose,
  tokenId,
  traits,
  onConfirm,
  isApplying = false,
}: TraitPreviewProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isOpen || !tokenId || traits.length === 0) {
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const traitIds = traits.map((t) => t.tokenId);
    const url = vercelImageService.generateCombinedImageUrl({
      tokenId,
      traitIds,
    });

    setImageUrl(url);

    // Preload image
    vercelImageService
      .preloadImage(url)
      .then((success) => {
        setIsLoading(false);
        if (!success) {
          setHasError(true);
        }
      })
      .catch(() => {
        setIsLoading(false);
        setHasError(true);
      });
  }, [isOpen, tokenId, traits]);

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
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-auto bg-background rounded-lg shadow-xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div>
                    <Dialog.Title className="text-xl font-bold text-foreground">
                      Preview: AdrianZERO #{tokenId}
                    </Dialog.Title>
                    <p className="text-sm text-muted-foreground mt-1">
                      {traits.length} {traits.length === 1 ? 'trait' : 'traits'}{' '}
                      selected
                    </p>
                  </div>

                  <Dialog.Close className="p-2 hover:bg-muted rounded-full transition-colors">
                    <svg
                      className="w-6 h-6 text-foreground"
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

                {/* Image Preview */}
                <div className="p-6">
                  <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="shimmer w-full h-full" />
                        <div className="absolute text-center">
                          <Palette className="h-12 w-12 mb-2 mx-auto text-muted-foreground" />
                          <p className="text-muted-foreground">
                            Generating preview...
                          </p>
                        </div>
                      </div>
                    )}

                    {hasError && !isLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <AlertTriangle className="h-12 w-12 mb-2 text-yellow-500" />
                        <p className="text-foreground font-medium">
                          Failed to load preview
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          You can still apply the traits
                        </p>
                      </div>
                    )}

                    {!isLoading && !hasError && imageUrl && (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Selected Traits List */}
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">
                      Selected Traits
                    </h3>
                    <div className="space-y-2">
                      {traits.map((trait) => (
                        <div
                          key={trait.tokenId}
                          className="flex items-center justify-between p-2 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {trait.image?.thumbnailUrl && (
                              <img
                                src={trait.image.thumbnailUrl}
                                alt={trait.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {trait.name}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {trait.category.toLowerCase().replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 border-t border-border">
                  <button
                    onClick={onClose}
                    disabled={isApplying}
                    className="flex-1 touch-target px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isApplying}
                    className="flex-1 touch-target px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApplying ? 'Applying...' : 'Apply Traits'}
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
