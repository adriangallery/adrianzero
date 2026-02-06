import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useHasAdrianZero } from '@/features/onboarding/hooks/useHasAdrianZero';
import { useHasAdrianPunks } from '@/features/shared/hooks/useHasAdrianPunks';
import { NAV_ITEMS } from './navigation';

export function useVisibleNavItems() {
  const { isConnected } = useAccount();
  const { hasAdrianZero } = useHasAdrianZero();
  const { hasPunks } = useHasAdrianPunks();

  return useMemo(
    () =>
      NAV_ITEMS.filter((item) => {
        if (item.requiresConnection && !isConnected) return false;
        if (item.requiresAdrianZero && (!isConnected || !hasAdrianZero)) return false;
        if (item.requiresAdrianPunks && (!isConnected || !hasPunks)) return false;
        return true;
      }),
    [hasAdrianZero, hasPunks, isConnected]
  );
}
