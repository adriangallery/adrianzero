/**
 * OGClaimModule Component
 * Main OG claim page for AdrianPunks holders
 */

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Unplug, Award, Loader2, Package } from 'lucide-react';
import { useUserPunks } from '@/features/shared/hooks/useUserPunks';
import { useHasAdrianPunks } from '@/features/shared/hooks/useHasAdrianPunks';
import { useClaimStatus } from '../hooks/useClaimStatus';
import { useClaimBatch } from '../hooks/useClaimBatch';
import { useOGClaimStore } from '../store/ogclaimStore';
import { useNotificationStore } from '@/store/notificationStore';
import { StatsSection } from './StatsSection';
import { EligibilityChecker } from './EligibilityChecker';
import { PunksGrid } from './PunksGrid';

export function OGClaimModule({ embedded }: { embedded?: boolean } = {}) {
  const { isConnected } = useAccount();
  const { hasPunks, count: punkCount, isLoading: punksLoading } = useHasAdrianPunks();
  const { punkIds, isLoading: idsLoading } = useUserPunks();
  const { claimStatus, isLoading: statusLoading } = useClaimStatus(punkIds);
  const { selectedPunks, clearSelection } = useOGClaimStore();
  const { claim, isLoading: claiming, errorMessage } = useClaimBatch();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const isLoading = punksLoading || idsLoading || statusLoading;

  // Clear selections on unmount
  useEffect(() => {
    return () => clearSelection();
  }, [clearSelection]);

  const handleBatchClaim = () => {
    if (selectedPunks.length === 0) {
      addNotification('warning', 'No Punks Selected', 'Select punks to claim.');
      return;
    }

    claim(
      { punkIds: selectedPunks },
      {
        onSuccess: () => {
          addNotification(
            'success',
            'Batch Claim Success!',
            `Successfully claimed ${selectedPunks.length} trait${selectedPunks.length > 1 ? 's' : ''}`
          );
          clearSelection();
        },
        onError: () => {
          addNotification('error', 'Batch Claim Failed', errorMessage || 'Failed to claim traits');
        },
      }
    );
  };

  if (!isConnected && !embedded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Unplug className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground max-w-md">
          Connect your wallet to claim OG traits for your AdrianPunks.
        </p>
      </div>
    );
  }

  if (punksLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Checking punk ownership...</p>
      </div>
    );
  }

  if (!hasPunks) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Award className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">No AdrianPunks Found</h2>
        <p className="text-muted-foreground max-w-md">
          You need to own AdrianPunks to claim OG traits. Each punk can claim 1 unique trait (1:1
          mapping).
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">OG Claim</h1>
        </div>
        <p className="text-muted-foreground">
          Claim exclusive OG traits for your {punkCount} AdrianPunk{punkCount !== 1 ? 's' : ''} •
          1:1 mapping to traits #100001-101000
        </p>
      </div>

      {/* Global Stats */}
      <StatsSection />

      {/* Eligibility Checker */}
      <EligibilityChecker />

      {/* Batch Action Bar */}
      {selectedPunks.length > 0 && (
        <div className="sticky top-0 z-10 bg-primary text-primary-foreground rounded-lg p-4 mb-6 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6" />
            <div>
              <p className="font-bold">
                {selectedPunks.length} punk{selectedPunks.length > 1 ? 's' : ''} selected
              </p>
              <p className="text-xs opacity-90">Ready to claim in batch</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleBatchClaim}
              disabled={claiming}
              className="px-6 py-2 bg-white text-primary rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {claiming && <Loader2 className="h-4 w-4 animate-spin" />}
              Claim Selected
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading your punks...</p>
        </div>
      )}

      {/* Punks Grid */}
      {!isLoading && <PunksGrid punkIds={punkIds} claimStatus={claimStatus} />}
    </div>
  );
}
