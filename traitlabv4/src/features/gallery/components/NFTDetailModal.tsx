import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useGalleryStore } from '../store/galleryStore';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import type { NFTMetadata, NFTType } from '../types/gallery.types';
import { deriveNFTType } from '../hooks/useTokenMetadata';
import { useEnsName } from '@/hooks/useEnsName';

const METADATA_API = 'https://adrianlab.vercel.app/api/metadata';
const OPENSEA_BASE = `https://opensea.io/assets/base/${CONTRACT_ADDRESSES.ADRIAN_ZERO}`;

const TYPE_COLORS: Record<NFTType, string> = {
  Gen0: 'bg-zinc-600 text-zinc-200',
  SamuraiZERO: 'bg-red-700 text-red-100',
  SubZERO: 'bg-blue-700 text-blue-100',
  ZEROmovies: 'bg-red-600 text-red-100',
  GenZERO: 'bg-pink-600 text-pink-100',
  Unknown: 'bg-gray-700 text-gray-300',
};

interface NFTDetailModalProps {
  owners: Map<number, string>;
}

export function NFTDetailModal({ owners }: NFTDetailModalProps) {
  const { selectedTokenId, isModalOpen, closeModal, goToNext, goToPrevious, metadataCache, setMetadata } =
    useGalleryStore();
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [localMeta, setLocalMeta] = useState<NFTMetadata | null>(null);

  // Fetch metadata when token changes
  useEffect(() => {
    if (selectedTokenId === null || !isModalOpen) {
      setLocalMeta(null);
      return;
    }

    const cached = metadataCache.get(selectedTokenId);
    if (cached) {
      setLocalMeta(cached);
      return;
    }

    let cancelled = false;
    setIsLoadingMeta(true);

    fetch(`${METADATA_API}/${selectedTokenId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: NFTMetadata) => {
        if (cancelled) return;
        setLocalMeta(data);
        setMetadata(selectedTokenId, data);
      })
      .catch(() => {
        if (cancelled) return;
        const fallback: NFTMetadata = {
          name: `AdrianZero #${selectedTokenId}`,
          image: `https://adrianlab.vercel.app/api/render/${selectedTokenId}.png`,
          attributes: [],
        };
        setLocalMeta(fallback);
        setMetadata(selectedTokenId, fallback);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMeta(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTokenId, isModalOpen, metadataCache, setMetadata]);

  // Keyboard nav
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    },
    [isModalOpen, closeModal, goToNext, goToPrevious]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const ownerAddress = selectedTokenId !== null ? owners.get(selectedTokenId) : undefined;
  const { ensName } = useEnsName(ownerAddress);

  if (selectedTokenId === null) return null;

  const owner = ownerAddress ?? '—';
  const nftType = localMeta ? deriveNFTType(localMeta) : 'Unknown';
  const imageUrl = `https://adrianlab.vercel.app/api/render/${selectedTokenId}.png`;

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-900/95 shadow-2xl backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={closeModal}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 hover:scale-110 transition-all"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="relative flex-shrink-0 flex items-center justify-center bg-black p-4 md:p-6 md:w-1/2">
                  <img
                    src={imageUrl}
                    alt={localMeta?.name ?? `#${selectedTokenId}`}
                    className="max-h-[250px] md:max-h-[400px] w-auto rounded"
                    style={{ imageRendering: 'pixelated' }}
                  />

                  {/* Nav buttons */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                    <button
                      onClick={goToPrevious}
                      className="rounded-full bg-black/70 p-2 text-white hover:bg-black/90 hover:scale-110 transition-all"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={goToNext}
                      className="rounded-full bg-black/70 p-2 text-white hover:bg-black/90 hover:scale-110 transition-all"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex-1 p-4 md:p-6 md:overflow-y-auto md:max-h-[80vh]">
                  {isLoadingMeta ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
                    </div>
                  ) : (
                    <>
                      {/* Name + badge */}
                      <div className="flex items-start gap-2 mb-1">
                        <h2 className="text-2xl font-bold text-white">
                          {localMeta?.name ?? `AdrianZero #${selectedTokenId}`}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${TYPE_COLORS[nftType]}`}>
                          {nftType}
                        </span>
                        <span className="font-mono text-xs text-zinc-500">
                          Token #{selectedTokenId}
                        </span>
                      </div>

                      {/* Owner */}
                      <div className="mb-4 rounded-lg bg-zinc-800/50 p-3">
                        <div className="text-[10px] font-medium uppercase text-zinc-500 mb-1">Owner</div>
                        {ensName ? (
                          <div>
                            <span className="text-sm font-semibold text-emerald-400">{ensName}</span>
                            <div className="font-mono text-[10px] text-zinc-500 mt-0.5 break-all">{owner}</div>
                          </div>
                        ) : (
                          <div className="font-mono text-xs text-zinc-300 break-all">{owner}</div>
                        )}
                      </div>

                      {/* Description */}
                      {localMeta?.description && (
                        <p className="mb-4 text-sm text-zinc-400">{localMeta.description}</p>
                      )}

                      {/* Attributes */}
                      {localMeta?.attributes && localMeta.attributes.length > 0 && (
                        <div className="mb-4">
                          <h3 className="mb-2 text-sm font-semibold text-white">Attributes</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {localMeta.attributes.map((attr, i) => (
                              <div key={i} className="rounded-lg bg-zinc-800/50 p-2.5">
                                <div className="text-[9px] font-medium uppercase text-zinc-500">
                                  {attr.trait_type}
                                </div>
                                <div className="mt-0.5 text-xs font-semibold text-white">
                                  {attr.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Links */}
                      <div className="mt-6 flex flex-col gap-2">
                        <a
                          href={`${OPENSEA_BASE}/${selectedTokenId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                        >
                          View on OpenSea
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <a
                          href={imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
                        >
                          Full Image
                          <ExternalLink className="h-3.5 w-3.5" />
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
