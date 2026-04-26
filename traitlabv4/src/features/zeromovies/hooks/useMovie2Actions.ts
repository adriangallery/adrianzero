import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useMovies2Store } from '../store/movies2Store';
import { useMovies2Catalog } from './useMovies2Catalog';

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

/**
 * Mock action hook for ZEROmovies S2. Each function pretends to dispatch a tx,
 * waits ~1.5s for the "block confirmation" feel, then mutates local state via
 * `useMovies2Store.setRental` so the UI reacts as if the chain confirmed.
 *
 * When the on-chain ZEROmoviesFacet2 lands, swap each function for the
 * matching wagmi `useWriteContract` hook (rentMovie2, buyMovie2,
 * returnMovie2, upgradeRent2ToBuy, claimGoldenMint). The exposed shape
 * (isPending / error / call signatures) is identical so consumers don't change.
 */
export function useMovie2Actions() {
  const { address } = useAccount();
  const { setRental, showSuccess, markGoldenClaimed } = useMovies2Store();
  const { rentalMap } = useMovies2Catalog();

  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const isPending = pendingAction !== null;

  function fakeWait(ms = 1500) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  async function rent2(movieId: number) {
    if (!address) return;
    setPendingAction('rent');
    try {
      await fakeWait();
      setRental(movieId, {
        renter: address,
        rentedAt: Math.floor(Date.now() / 1000),
        permanent: false,
        isOverdue: false,
        daysOverdue: 0,
      });
      showSuccess(movieId, 'rent');
    } finally {
      setPendingAction(null);
    }
  }

  async function buy2(movieId: number) {
    if (!address) return;
    setPendingAction('buy');
    try {
      await fakeWait();
      setRental(movieId, {
        renter: address,
        rentedAt: Math.floor(Date.now() / 1000),
        permanent: true,
        isOverdue: false,
        daysOverdue: 0,
      });
      showSuccess(movieId, 'buy');
    } finally {
      setPendingAction(null);
    }
  }

  async function returnMovie2(movieId: number) {
    if (!address) return;
    setPendingAction('return');
    try {
      await fakeWait();
      // Free return — NFT goes back to the shelf, no $ZERO charged
      setRental(movieId, {
        renter: ZERO_ADDR,
        rentedAt: 0,
        permanent: false,
        isOverdue: false,
        daysOverdue: 0,
      });
      showSuccess(movieId, 'return');
    } finally {
      setPendingAction(null);
    }
  }

  async function upgradeRent2ToBuy(movieId: number) {
    if (!address) return;
    setPendingAction('upgrade');
    try {
      await fakeWait();
      setRental(movieId, {
        renter: address,
        rentedAt: Math.floor(Date.now() / 1000),
        permanent: true,
        isOverdue: false,
        daysOverdue: 0,
      });
      showSuccess(movieId, 'upgrade');
    } finally {
      setPendingAction(null);
    }
  }

  /**
   * Mock the random Golden Mint by picking up to `count` movies that are
   * currently on-shelf and assigning them permanently to `address`.
   */
  async function claimGoldenMint(count: number) {
    if (!address || count <= 0) return;
    setPendingAction('claimGolden');
    try {
      await fakeWait(2000);

      // Pick `count` candidates that are on-shelf (mirrors _pickRandomAvailable).
      const onShelfIds: number[] = [];
      for (const [id, r] of rentalMap.entries()) {
        if (!r.permanent && r.renter === ZERO_ADDR) onShelfIds.push(id);
      }
      const picked: number[] = [];
      const available = [...onShelfIds];
      for (let i = 0; i < count && available.length > 0; i++) {
        const idx = Math.floor(Math.random() * available.length);
        picked.push(available[idx]);
        available.splice(idx, 1);
      }

      const now = Math.floor(Date.now() / 1000);
      for (const movieId of picked) {
        setRental(movieId, {
          renter: address,
          rentedAt: now,
          permanent: true,
          isOverdue: false,
          daysOverdue: 0,
        });
      }
      markGoldenClaimed(picked);
    } finally {
      setPendingAction(null);
    }
  }

  return {
    rent2,
    buy2,
    returnMovie2,
    upgradeRent2ToBuy,
    claimGoldenMint,
    isPending,
    pendingAction,
    isMock: true as const,
  };
}
