import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useGalleryStore } from '../store/galleryStore';
import type { NFTMetadata } from '../types/gallery.types';

export function GalleryModal() {
  const { selectedNFT, isModalOpen, closeModal, goToNext, goToPrevious, metadataCache, setMetadata } =
    useGalleryStore();
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadata, setLocalMetadata] = useState<NFTMetadata | null>(null);

  // Load metadata when modal opens
  useEffect(() => {
    if (!selectedNFT || !isModalOpen) {
      setLocalMetadata(null);
      return;
    }

    // Check cache first
    const cached = metadataCache.get(selectedNFT.tokenId);
    if (cached) {
      setLocalMetadata(cached);
      return;
    }

    // Fetch metadata from Vercel API
    const fetchMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const response = await fetch(
          `https://adrianlab.vercel.app/api/metadata/${selectedNFT.tokenId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch metadata');
        }

        const data = await response.json();
        const nftMetadata: NFTMetadata = {
          tokenId: selectedNFT.tokenId,
          name: data.name,
          description: data.description,
          attributes: data.attributes,
        };

        setLocalMetadata(nftMetadata);
        setMetadata(selectedNFT.tokenId, nftMetadata);
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
        // Set minimal metadata on error
        setLocalMetadata({
          tokenId: selectedNFT.tokenId,
          name: `AdrianZERO #${selectedNFT.tokenId}`,
        });
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [selectedNFT, isModalOpen, metadataCache, setMetadata]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isModalOpen) return;

      switch (e.key) {
        case 'Escape':
          closeModal();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    },
    [isModalOpen, closeModal, goToNext, goToPrevious]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!selectedNFT) return null;

  const openSeaUrl = `https://opensea.io/assets/base/0x9e12da21b64dae6ab88f0c0e8bdc5b98f8b8c0f9/${selectedNFT.tokenId}`;

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeModal}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-gray-900/95 shadow-2xl backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70 hover:scale-110"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="relative flex-shrink-0 bg-black/50 p-8 md:w-1/2">
                  <motion.img
                    layoutId={`gallery-image-${selectedNFT.tokenId}`}
                    src={selectedNFT.imageUrl}
                    alt={`AdrianZERO #${selectedNFT.tokenId}`}
                    className="h-auto w-full rounded-lg object-contain"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Navigation buttons */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <button
                      onClick={goToPrevious}
                      className="rounded-full bg-black/70 p-3 text-white transition-all hover:bg-black/90 hover:scale-110"
                      aria-label="Previous NFT"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={goToNext}
                      className="rounded-full bg-black/70 p-3 text-white transition-all hover:bg-black/90 hover:scale-110"
                      aria-label="Next NFT"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Metadata Section */}
                <div className="flex-1 overflow-y-auto p-8">
                  {isLoadingMetadata ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-400 border-t-transparent" />
                    </div>
                  ) : (
                    <>
                      {/* Title */}
                      <h2 className="mb-2 text-3xl font-bold text-white">
                        {metadata?.name || `AdrianZERO #${selectedNFT.tokenId}`}
                      </h2>

                      {/* Token ID */}
                      <div className="mb-6 font-mono text-sm text-green-400">
                        Token ID: #{selectedNFT.tokenId}
                      </div>

                      {/* Description */}
                      {metadata?.description && (
                        <div className="mb-6">
                          <p className="text-gray-300">{metadata.description}</p>
                        </div>
                      )}

                      {/* Attributes */}
                      {metadata?.attributes && metadata.attributes.length > 0 && (
                        <div className="mb-6">
                          <h3 className="mb-3 text-lg font-semibold text-white">Attributes</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {metadata.attributes.map((attr, index) => (
                              <div
                                key={index}
                                className="rounded-lg bg-gray-800/50 p-3 backdrop-blur-sm"
                              >
                                <div className="text-xs font-medium uppercase text-gray-400">
                                  {attr.trait_type}
                                </div>
                                <div className="mt-1 text-sm font-semibold text-white">
                                  {attr.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* External Links */}
                      <div className="mt-8 flex flex-col gap-3">
                        <a
                          href={openSeaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          View on OpenSea
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <a
                          href={selectedNFT.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 font-medium text-white transition-colors hover:bg-gray-800"
                        >
                          View Full Image
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
