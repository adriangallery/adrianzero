/**
 * useWhaleMode Hook
 * Automatic detection and optimization for large NFT collections (100+ items)
 * Enables performance optimizations like virtualization and progressive loading
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { detectDeviceCapabilities, shouldUseWhaleMode as shouldUseWhaleModeUtil } from '@/lib/web3/utils/deviceCapabilities';

const WHALE_MODE_STORAGE_KEY = 'traitlab-whale-mode-enabled';

export interface WhaleModeOptimizations {
  virtualization: boolean;
  progressiveLoad: boolean;
  pagination: boolean;
  reducedAnimations: boolean;
}

export interface WhaleModeState {
  isWhale: boolean;          // Wallet large enough to qualify
  itemCount: number;
  threshold: number;         // Whale threshold (default: 100)

  whaleModeEnabled: boolean;
  whaleModeAvailable: boolean;

  optimizations: WhaleModeOptimizations;

  enableWhaleMode: () => void;
  disableWhaleMode: () => void;
  toggleWhaleMode: () => void;
}

export interface WhaleModeConfig {
  threshold?: number;        // Custom whale threshold (default: 100)
  autoEnable?: boolean;      // Auto-enable on low-end devices
  persistPreference?: boolean; // Save preference to localStorage
}

export function useWhaleMode(
  itemCount: number,
  config: WhaleModeConfig = {}
): WhaleModeState {
  const {
    threshold = 100,
    autoEnable = true,
    persistPreference = true,
  } = config;

  const capabilities = useMemo(() => detectDeviceCapabilities(), []);
  const isWhale = shouldUseWhaleModeUtil(itemCount, capabilities, threshold);

  // Load saved preference from localStorage
  const [whaleModeEnabled, setWhaleModeEnabled] = useState(() => {
    if (!persistPreference) return false;

    try {
      const saved = localStorage.getItem(WHALE_MODE_STORAGE_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Auto-enable whale mode on low-end devices if collection is large
  useEffect(() => {
    if (autoEnable && isWhale && capabilities.isLowEnd && !whaleModeEnabled) {
      setWhaleModeEnabled(true);
      if (persistPreference) {
        try {
          localStorage.setItem(WHALE_MODE_STORAGE_KEY, 'true');
        } catch {
          // Ignore localStorage errors
        }
      }
    }
  }, [autoEnable, isWhale, capabilities.isLowEnd, whaleModeEnabled, persistPreference]);

  const enableWhaleMode = useCallback(() => {
    setWhaleModeEnabled(true);
    if (persistPreference) {
      try {
        localStorage.setItem(WHALE_MODE_STORAGE_KEY, 'true');
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [persistPreference]);

  const disableWhaleMode = useCallback(() => {
    setWhaleModeEnabled(false);
    if (persistPreference) {
      try {
        localStorage.setItem(WHALE_MODE_STORAGE_KEY, 'false');
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [persistPreference]);

  const toggleWhaleMode = useCallback(() => {
    if (whaleModeEnabled) {
      disableWhaleMode();
    } else {
      enableWhaleMode();
    }
  }, [whaleModeEnabled, enableWhaleMode, disableWhaleMode]);

  // Calculate active optimizations
  const optimizations: WhaleModeOptimizations = useMemo(() => {
    const baseOptimizations = {
      virtualization: false,
      progressiveLoad: false,
      pagination: false,
      reducedAnimations: false,
    };

    if (!whaleModeEnabled) {
      return baseOptimizations;
    }

    return {
      virtualization: true,  // Always virtualize in whale mode
      progressiveLoad: true, // Always use progressive loading
      pagination: !capabilities.isMobile, // Pagination on desktop only
      reducedAnimations: capabilities.isLowEnd, // Reduce animations on low-end
    };
  }, [whaleModeEnabled, capabilities]);

  return {
    isWhale,
    itemCount,
    threshold,
    whaleModeEnabled,
    whaleModeAvailable: isWhale,
    optimizations,
    enableWhaleMode,
    disableWhaleMode,
    toggleWhaleMode,
  };
}
