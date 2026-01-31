/**
 * PacksModule Component
 * View and open Floppy Discs and Action Packs
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence } from 'framer-motion';
import { usePacks } from '../hooks/usePacks';
import { useOpenPack } from '../hooks/useOpenPack';
import type { Pack } from '@/types/nft.types';

export function PacksModule() {
  const { isConnected } = useAccount();
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Load packs
  const { data: packs = [], isLoading, error } = usePacks();

  // Mutations
  const openPack = useOpenPack();

  // Handlers
  const handleOpenPack = async () => {
    if (!selectedPack) return;

    try {
      await openPack.mutateAsync({
        packId: selectedPack.packId,
        packType: selectedPack.type,
        quantity,
      });

      setSelectedPack(null);
      setQuantity(1);
    } catch (error) {
      console.error('Failed to open pack:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🔌</div>
        <h2 className="text-xl font-semibold text-foreground">
          Wallet Not Connected
        </h2>
        <p className="text-muted-foreground mt-2">
          Please connect your wallet to view your packs
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="shimmer w-16 h-16 rounded-full mb-4" />
        <p className="text-muted-foreground">Loading your packs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-foreground">
          Error Loading Packs
        </h2>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Failed to load packs'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Packs</h1>
        <p className="text-muted-foreground mt-1">
          {packs.length} {packs.length === 1 ? 'pack' : 'packs'} available
        </p>
      </div>

      {/* Packs Grid */}
      {packs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-lg font-medium text-foreground">No packs found</p>
          <p className="text-sm text-muted-foreground mt-2">
            You don't have any Floppy Discs or Action Packs
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {packs.map((pack) => (
            <PackCard
              key={pack.packId}
              pack={pack}
              onClick={() => setSelectedPack(pack)}
            />
          ))}
        </div>
      )}

      {/* Open Pack Modal */}
      <Dialog.Root
        open={!!selectedPack}
        onOpenChange={() => setSelectedPack(null)}
      >
        <AnimatePresence>
          {selectedPack && (
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
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-background rounded-lg shadow-xl"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-muted">
                    {selectedPack.image?.cachedUrl ? (
                      <img
                        src={selectedPack.image.cachedUrl}
                        alt={selectedPack.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        📦
                      </div>
                    )}

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
                      <Dialog.Title className="text-xl font-bold text-foreground">
                        {selectedPack.name}
                      </Dialog.Title>
                      <p className="text-sm text-muted-foreground mt-1">
                        You have {selectedPack.balance}{' '}
                        {selectedPack.balance === 1 ? 'pack' : 'packs'}
                      </p>
                    </div>

                    {/* Quantity Selector (if balance > 1) */}
                    {selectedPack.balance > 1 && (
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Quantity to open
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={selectedPack.balance}
                          value={quantity}
                          onChange={(e) =>
                            setQuantity(
                              Math.min(
                                Math.max(1, parseInt(e.target.value) || 1),
                                selectedPack.balance
                              )
                            )
                          }
                          className="mt-2 w-full px-3 py-2 bg-muted rounded-lg text-foreground"
                        />
                      </div>
                    )}

                    {/* Open Button */}
                    <button
                      onClick={handleOpenPack}
                      disabled={openPack.isPending}
                      className="w-full touch-target px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {openPack.isPending
                        ? 'Opening...'
                        : `Open ${quantity} ${quantity === 1 ? 'Pack' : 'Packs'}`}
                    </button>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </div>
  );
}

// Pack Card Component
function PackCard({ pack, onClick }: { pack: Pack; onClick: () => void }) {
  const imageUrl =
    pack.image?.cachedUrl ||
    pack.image?.thumbnailUrl ||
    pack.image?.originalUrl;

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative rounded-lg overflow-hidden cursor-pointer hover:shadow-md hover:ring-1 hover:ring-border transition-all bg-card"
    >
      <div className="aspect-square relative bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={pack.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            📦
          </div>
        )}

        {pack.balance > 1 && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded-md text-xs font-medium text-white">
            x{pack.balance}
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-medium truncate text-foreground text-sm">
          {pack.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 capitalize">
          {pack.type.replace('_', ' ').toLowerCase()}
        </p>
      </div>
    </motion.div>
  );
}
