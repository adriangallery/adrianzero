/**
 * PunkCard Component
 * Individual punk card with checkbox and claim button
 */

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useOGClaimStore } from '../store/ogclaimStore';
import { useClaimSingle } from '../hooks/useClaimSingle';
import { useNotificationStore } from '@/store/notificationStore';

interface PunkCardProps {
  punkId: number;
  isClaimed: boolean;
}

export function PunkCard({ punkId, isClaimed }: PunkCardProps) {
  const { isSelected, togglePunkSelection } = useOGClaimStore();
  const { claim, isLoading, errorMessage } = useClaimSingle();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const selected = isSelected(punkId);
  const traitId = 100000 + punkId;

  const handleClaim = () => {
    claim(
      { punkId },
      {
        onSuccess: () => {
          addNotification('success', 'Claimed!', `Successfully claimed trait #${traitId}`);
        },
        onError: () => {
          addNotification('error', 'Claim Failed', errorMessage || 'Failed to claim trait');
        },
      }
    );
  };

  return (
    <div
      className={`relative bg-card border rounded-lg p-4 transition-all ${
        isClaimed
          ? 'border-green-500/50 bg-green-500/5'
          : selected
            ? 'border-primary shadow-lg'
            : 'border-border hover:border-primary/50'
      }`}
    >
      {/* Selection Checkbox (only if not claimed) */}
      {!isClaimed && (
        <div className="absolute top-3 right-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => togglePunkSelection(punkId)}
            className="h-5 w-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
        </div>
      )}

      {/* Claimed Badge */}
      {isClaimed && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        </div>
      )}

      {/* Content */}
      <div className="mb-3">
        <p className="text-sm text-muted-foreground">AdrianPunk</p>
        <p className="text-2xl font-bold text-foreground">#{punkId}</p>
      </div>

      <div className="mb-4 pb-3 border-b border-border">
        <p className="text-xs text-muted-foreground">Claims Trait</p>
        <p className="text-lg font-semibold text-primary">#{traitId}</p>
      </div>

      {/* Claim Button */}
      <button
        onClick={handleClaim}
        disabled={isClaimed || isLoading}
        className={`w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
          isClaimed
            ? 'bg-green-600 text-white cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        } disabled:opacity-50`}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isClaimed ? 'Claimed' : 'Claim'}
      </button>
    </div>
  );
}
