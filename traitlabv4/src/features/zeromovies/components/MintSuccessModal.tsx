import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle, X } from 'lucide-react';
import { useMoviesStore } from '../store/moviesStore';

interface MintSuccessModalProps {
  movieName: string;
}

export function MintSuccessModal({ movieName }: MintSuccessModalProps) {
  const { isSuccessOpen, lastMintedTokenId, closeSuccess } = useMoviesStore();

  return (
    <Dialog.Root open={isSuccessOpen} onOpenChange={(v) => !v && closeSuccess()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-green-800/50 bg-zinc-950 p-6 text-center shadow-2xl focus:outline-none">
          <Dialog.Close className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-zinc-700">
            <X className="h-4 w-4" />
          </Dialog.Close>

          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-400" />

          <Dialog.Title className="mb-2 text-lg font-bold text-white">
            Movie Minted!
          </Dialog.Title>

          <p className="mb-4 text-sm text-zinc-400">
            You minted <span className="font-bold text-red-400">{movieName}</span>
            {lastMintedTokenId ? (
              <> as AdrianZERO <span className="text-white">#{lastMintedTokenId}</span></>
            ) : null}
          </p>

          <button
            onClick={closeSuccess}
            className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition-colors"
          >
            CLOSE
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
