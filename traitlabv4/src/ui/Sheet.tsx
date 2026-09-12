import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from './cn';
import { CloseIcon } from './icons';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  /** Altura máxima del contenido scrollable. Por defecto 80vh. */
  maxHeight?: string;
  className?: string;
}

/**
 * Hoja inferior del sistema F3: asa, overlay, cierre por overlay/Escape
 * (los da Radix Dialog), bloqueo de scroll del body (react-remove-scroll
 * interno de Radix), aria-modal, animación CSS de 200ms, safe-area bottom.
 */
export function Sheet({ open, onOpenChange, title, children, maxHeight = '80vh', className }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {open ? (
        <Dialog.Portal forceMount>
          <Dialog.Overlay
            data-testid="ui-sheet-overlay"
            className="ui-sheet-overlay fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <Dialog.Content
            data-testid="ui-sheet-content"
            className={cn(
              'ui-sheet-content fixed inset-x-0 bottom-0 z-50 flex flex-col',
              'rounded-t-[var(--r-lg)] border-2 border-b-0 border-line bg-panel shadow-2xl',
              'max-h-[85vh]',
              className
            )}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            onOpenAutoFocus={(e) => {
              // Evita el salto de foco agresivo en móvil al abrir la hoja.
              e.preventDefault();
            }}
          >
            <div className="flex-none pt-2.5 pb-1 flex items-center justify-center" aria-hidden="true">
              <div className="h-1.5 w-10 rounded-full bg-line" />
            </div>
            {title ? (
              <div className="flex-none flex items-center justify-between px-4 pb-2">
                <Dialog.Title className="font-display text-[11px] text-fg">{title}</Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Cerrar"
                    className="rounded-full p-1.5 text-mute hover:text-fg hover:bg-line/40"
                  >
                    <CloseIcon size={18} />
                  </button>
                </Dialog.Close>
              </div>
            ) : (
              <Dialog.Title className="sr-only">Panel</Dialog.Title>
            )}
            <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight }}>
              {children}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      ) : null}
    </Dialog.Root>
  );
}
