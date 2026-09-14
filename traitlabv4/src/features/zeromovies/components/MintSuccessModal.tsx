import * as Dialog from '@radix-ui/react-dialog';
import { Film, Undo2, X } from 'lucide-react';
import { useMoviesStore } from '../store/moviesStore';

interface MintSuccessModalProps {
  movieName: string;
}

export function MintSuccessModal({ movieName }: MintSuccessModalProps) {
  const { isSuccessOpen, lastMintedTokenId, lastAction, returnedDeposit, closeSuccess } = useMoviesStore();

  const isBuy = lastAction === 'buy';
  const isReturn = lastAction === 'return';

  return (
    <Dialog.Root open={isSuccessOpen} onOpenChange={(v) => !v && closeSuccess()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line bg-panel950 p-6 text-center shadow-2xl focus:outline-none">
          <Dialog.Close className="absolute right-3 top-3 rounded-full bg-bg/60 p-1.5 text-fg hover:bg-line700">
            <X className="h-4 w-4" />
          </Dialog.Close>

          {isReturn ? (
            <Undo2 className="mx-auto mb-4 h-12 w-12 text-ok" />
          ) : (
            <Film className={`mx-auto mb-4 h-12 w-12 ${isBuy ? 'text-yellow-400' : 'text-red-500'}`} />
          )}

          <Dialog.Title className="mb-2 text-lg font-bold text-fg">
            {isReturn ? 'Movie Returned!' : isBuy ? 'Movie Purchased!' : 'Movie Rented!'}
          </Dialog.Title>

          <p className="mb-2 text-sm text-mute">
            {isReturn ? (
              <>You returned <span className="font-bold text-ok">{movieName}</span></>
            ) : isBuy ? (
              <>You bought <span className="font-bold text-yellow-400">{movieName}</span> forever</>
            ) : (
              <>You rented <span className="font-bold text-red-400">{movieName}</span></>
            )}
          </p>

          {isReturn ? (
            <p className="mb-4 text-sm font-bold text-ok">
              +{returnedDeposit.toLocaleString()} $ZERO refunded
            </p>
          ) : lastMintedTokenId ? (
            <p className="mb-2 text-[13px] text-mute">AdrianZERO #{lastMintedTokenId}</p>
          ) : null}

          {!isReturn && (
            <p className="mb-4 text-[13px] text-mute">
              {isBuy
                ? 'You now earn rewards from every future rental and purchase'
                : 'Return anytime for a 50% refund, or keep it for 30 days'}
            </p>
          )}

          {isReturn && (
            <p className="mb-4 text-[13px] text-mute">
              The movie is back on the shelf. Someone else can rent it now.
            </p>
          )}

          <button
            onClick={closeSuccess}
            className={`w-full rounded-lg py-2.5 text-sm font-bold transition-colors ${
              isReturn ? 'bg-ok text-acc-fg hover:opacity-90'
                : isBuy ? 'bg-yellow-600 text-black hover:bg-yellow-500'
                : 'bg-red-600 text-fg hover:bg-red-500'
            }`}
          >
            CLOSE
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
