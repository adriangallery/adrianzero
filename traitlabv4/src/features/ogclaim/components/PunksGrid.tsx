/**
 * PunksGrid Component
 * Grid of user's punks with select all/clear functionality
 * Includes virtualization for large collections to prevent mobile crashes
 */

import { useMemo } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { PunkCard } from './PunkCard';
import { useOGClaimStore } from '../store/ogclaimStore';
import { shouldOptimizeForTouch } from '@/lib/web3/utils/walletDetection';
import { detectDeviceCapabilities, shouldVirtualize } from '@/lib/web3/utils/deviceCapabilities';

interface PunksGridProps {
  punkIds: number[];
  claimStatus: Record<number, boolean>;
}

export function PunksGrid({ punkIds, claimStatus }: PunksGridProps) {
  const { selectedPunks, selectAllPunks, clearSelection } = useOGClaimStore();

  // Device capabilities for performance optimization
  const isMobile = shouldOptimizeForTouch();
  const capabilities = useMemo(() => detectDeviceCapabilities(), []);
  const useVirtualization = shouldVirtualize(punkIds.length, capabilities);

  const { unclaimedPunks, claimedPunks } = useMemo(() => {
    const unclaimed = punkIds.filter((id) => !claimStatus[id]);
    const claimed = punkIds.filter((id) => claimStatus[id]);
    return { unclaimedPunks: unclaimed, claimedPunks: claimed };
  }, [punkIds, claimStatus]);

  // Group punks into rows for virtualized rendering
  const rows = useMemo(() => {
    const itemsPerRow = isMobile ? 2 : 4; // 2 cols mobile, 4 cols desktop
    const result: number[][] = [];
    for (let i = 0; i < punkIds.length; i += itemsPerRow) {
      result.push(punkIds.slice(i, i + itemsPerRow));
    }
    return result;
  }, [punkIds, isMobile]);

  const allSelected = selectedPunks.length === unclaimedPunks.length && unclaimedPunks.length > 0;

  const handleToggleAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAllPunks(unclaimedPunks);
    }
  };

  if (punkIds.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No punks found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Select All Toggle */}
      {unclaimedPunks.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAll}
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="h-5 w-5 text-primary" />
              ) : (
                <Square className="h-5 w-5" />
              )}
              <span className="font-medium">
                {allSelected ? 'Deselect All' : 'Select All Unclaimed'}
              </span>
            </button>
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedPunks.length} selected • {unclaimedPunks.length} unclaimed •{' '}
            {claimedPunks.length} claimed
          </div>
        </div>
      )}

      {/* Grid - Virtualized for large collections */}
      {useVirtualization ? (
        <Virtuoso
          style={{ height: 'calc(100vh - 300px)' }}
          totalCount={rows.length}
          itemContent={(index) => {
            const row = rows[index];
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {row.map((punkId) => (
                  <PunkCard
                    key={punkId}
                    punkId={punkId}
                    isClaimed={claimStatus[punkId] || false}
                  />
                ))}
              </div>
            );
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {punkIds.map((punkId) => (
            <PunkCard key={punkId} punkId={punkId} isClaimed={claimStatus[punkId] || false} />
          ))}
        </div>
      )}
    </div>
  );
}
