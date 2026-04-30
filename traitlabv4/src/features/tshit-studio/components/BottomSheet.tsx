import { useRef, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  /** Max height of the sheet content area. Default 80vh. */
  maxHeight?: string;
}

export function BottomSheet({ open, onOpenChange, title, children, maxHeight = '80vh' }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                ref={contentRef}
                className="fixed inset-x-0 bottom-0 z-50 lg:hidden rounded-t-2xl border-t border-zinc-700 bg-zinc-950 shadow-2xl"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={handleDragEnd}
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              >
                <div
                  className="mx-auto mt-2 mb-1 h-1.5 w-12 rounded-full bg-zinc-700"
                  aria-hidden
                />
                <div className="flex items-center justify-between px-4 pt-1 pb-2">
                  <Dialog.Title className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
                    {title ?? ''}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Dialog.Close>
                </div>
                <div
                  className="overflow-y-auto px-4 pb-4"
                  style={{ maxHeight }}
                >
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
