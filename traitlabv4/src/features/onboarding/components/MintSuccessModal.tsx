/**
 * MintSuccessModal Component
 * Shows success dialog after minting with navigation options
 */

import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Sparkles, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MintSuccessModalProps {
  open: boolean;
  onClose: () => void;
  kitType: 'free' | 'paid' | null;
  quantity: number;
}

export function MintSuccessModal({
  open,
  onClose,
  kitType,
  quantity,
}: MintSuccessModalProps) {
  const isFree = kitType === 'free';

  const title = isFree ? 'SubZERO Minted!' : 'AdrianZERO Purchased!';

  const message = isFree
    ? "Awesome! Your quirky SubZERO is ready. Now let's make it even cooler with some traits! Remember, no EYE traits though - those eyes are too close together for glasses!"
    : `Excellent choice! Your ${quantity > 1 ? `${quantity} ` : ''}premium AdrianZERO${quantity > 1 ? 's are' : ' is'} ready. Now let's customize ${quantity > 1 ? 'them' : 'it'} with all the traits you want - including those fancy glasses!`;

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-success bg-background p-8 shadow-2xl"
              >
                {/* Close Button */}
                <Dialog.Close className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <X className="h-5 w-5" />
                </Dialog.Close>

                {/* Content */}
                <div className="text-center">
                  {/* Title */}
                  <Dialog.Title className="mb-4 text-3xl font-bold text-success">
                    {title}
                  </Dialog.Title>

                  {/* Message */}
                  <Dialog.Description className="mb-8 text-muted-foreground">
                    {message}
                  </Dialog.Description>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link
                      to="/custom"
                      onClick={onClose}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-success px-6 py-3 font-bold text-black transition-all hover:bg-success/90"
                    >
                      <Sparkles className="h-5 w-5" />
                      Customize in TraitLAB
                    </Link>

                    <Link
                      to="/traits"
                      onClick={onClose}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-success bg-transparent px-6 py-3 font-bold text-success transition-all hover:bg-success/10"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      Browse Traits
                    </Link>
                  </div>

                  {/* Cross-sell suggestion */}
                  {kitType && (
                    <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground">
                        {isFree ? (
                          <>
                            <span className="font-bold text-accent">
                              Want Normal Eyes?
                            </span>{' '}
                            Get the full AdrianZERO experience with proper eye
                            spacing and full trait compatibility!
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-success">
                              Want a FREE One Too?
                            </span>{' '}
                            Complete your collection with the quirky SubZERO!
                            It's FREE and has eyes that are... unique!
                          </>
                        )}
                      </p>
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
