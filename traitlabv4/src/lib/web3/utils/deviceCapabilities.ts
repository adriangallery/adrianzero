/**
 * Device Capabilities Detection
 * Detects device RAM, CPU, connection speed and calculates optimal performance thresholds
 * Used to prevent crashes on low-end mobile devices with large NFT collections
 */

import { isMobileDevice } from './walletDetection';

export type ConnectionSpeed = 'slow' | 'medium' | 'fast';

export interface DeviceCapabilities {
  // Hardware specs
  ram: number;              // GB estimated
  cpuCores: number;
  isMobile: boolean;
  isLowEnd: boolean;

  // Calculated thresholds
  maxVirtualItems: number;   // When to enable virtualization
  maxTotalItems: number;     // Hard cap before pagination
  batchSize: number;         // Items per batch load

  // Network
  connectionSpeed: ConnectionSpeed;
}

export interface PerformanceThresholds {
  maxVirtualItems: number;
  maxTotalItems: number;
  batchSize: number;
  initialLoad: number;
  enableReducedAnimations: boolean;
}

/**
 * Detect device RAM in GB
 * Uses navigator.deviceMemory if available, otherwise estimates from userAgent
 */
function detectRAM(): number {
  if (typeof window === 'undefined') return 4; // SSR fallback

  // Modern browsers expose deviceMemory (in GB)
  const nav = navigator as any;
  if (nav.deviceMemory) {
    return nav.deviceMemory;
  }

  // Fallback: estimate from userAgent
  const ua = navigator.userAgent;

  // Low-end devices (1-2GB)
  if (
    /iPhone [5-8]/i.test(ua) ||
    /iPad (4|5|Air|Mini [1-3])/i.test(ua) ||
    /Android.*(?:2GB|1GB)/i.test(ua)
  ) {
    return 2;
  }

  // Mid-range devices (4GB)
  if (
    /iPhone (9|10|11|X|XR|XS|SE)/i.test(ua) ||
    /iPad (6|7|8|Pro)/i.test(ua) ||
    /Android.*4GB/i.test(ua)
  ) {
    return 4;
  }

  // High-end devices (6GB+)
  if (
    /iPhone (12|13|14|15|16)/i.test(ua) ||
    /iPad.*M[1-3]/i.test(ua) ||
    /Android.*(6GB|8GB|12GB)/i.test(ua)
  ) {
    return 6;
  }

  // Default assumptions
  return isMobileDevice() ? 3 : 8; // Mobile: 3GB, Desktop: 8GB
}

/**
 * Detect CPU cores
 * Uses navigator.hardwareConcurrency
 */
function detectCPUCores(): number {
  if (typeof window === 'undefined') return 4; // SSR fallback

  const cores = navigator.hardwareConcurrency || 4;
  return cores;
}

/**
 * Detect connection speed
 * Uses Network Information API if available
 */
function detectConnectionSpeed(): ConnectionSpeed {
  if (typeof window === 'undefined') return 'medium'; // SSR fallback

  const nav = navigator as any;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (connection) {
    const effectiveType = connection.effectiveType;

    if (effectiveType === '4g') return 'fast';
    if (effectiveType === '3g') return 'medium';
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';

    // Check downlink speed (Mbps)
    if (connection.downlink) {
      if (connection.downlink >= 5) return 'fast';
      if (connection.downlink >= 1.5) return 'medium';
      return 'slow';
    }
  }

  // Default based on device type
  return isMobileDevice() ? 'medium' : 'fast';
}

/**
 * Determine if device is low-end based on specs
 */
function isLowEndDevice(ram: number, cpuCores: number): boolean {
  return ram <= 2 || cpuCores <= 2;
}

/**
 * Calculate optimal performance thresholds based on device capabilities
 */
export function getOptimalThresholds(capabilities: DeviceCapabilities): PerformanceThresholds {
  const { ram, cpuCores, isMobile, isLowEnd, connectionSpeed } = capabilities;

  // Low-end mobile (iPhone 8, ≤2GB RAM)
  if (isMobile && isLowEnd) {
    return {
      maxVirtualItems: 20,
      maxTotalItems: 150,
      batchSize: connectionSpeed === 'slow' ? 10 : 15,
      initialLoad: 20,
      enableReducedAnimations: true,
    };
  }

  // Mid-range mobile (iPhone 11-13, 4GB RAM)
  if (isMobile && ram <= 4) {
    return {
      maxVirtualItems: 50,
      maxTotalItems: 150,
      batchSize: connectionSpeed === 'slow' ? 15 : 25,
      initialLoad: 30,
      enableReducedAnimations: false,
    };
  }

  // High-end mobile (iPhone 14+, 6GB+ RAM)
  if (isMobile && ram > 4) {
    return {
      maxVirtualItems: 100,
      maxTotalItems: 300,
      batchSize: 30,
      initialLoad: 50,
      enableReducedAnimations: false,
    };
  }

  // Desktop - standard
  if (!isMobile && (ram < 8 || cpuCores < 4)) {
    return {
      maxVirtualItems: 100,
      maxTotalItems: 300,
      batchSize: 40,
      initialLoad: 75,
      enableReducedAnimations: false,
    };
  }

  // Desktop - high-end
  return {
    maxVirtualItems: 150,
    maxTotalItems: 500,
    batchSize: 50,
    initialLoad: 100,
    enableReducedAnimations: false,
  };
}

/**
 * Detect full device capabilities
 * Main entry point for device detection
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  const ram = detectRAM();
  const cpuCores = detectCPUCores();
  const isMobile = isMobileDevice();
  const isLowEnd = isLowEndDevice(ram, cpuCores);
  const connectionSpeed = detectConnectionSpeed();

  const thresholds = getOptimalThresholds({
    ram,
    cpuCores,
    isMobile,
    isLowEnd,
    maxVirtualItems: 0, // Will be set below
    maxTotalItems: 0,   // Will be set below
    batchSize: 0,       // Will be set below
    connectionSpeed,
  });

  return {
    ram,
    cpuCores,
    isMobile,
    isLowEnd,
    maxVirtualItems: thresholds.maxVirtualItems,
    maxTotalItems: thresholds.maxTotalItems,
    batchSize: thresholds.batchSize,
    connectionSpeed,
  };
}

/**
 * Determine if whale mode should be enabled
 * Whale mode = wallet with 100+ items
 */
export function shouldUseWhaleMode(
  itemCount: number,
  capabilities: DeviceCapabilities,
  threshold: number = 100
): boolean {
  // Always suggest whale mode for large collections
  if (itemCount >= threshold) return true;

  // For low-end devices, suggest whale mode at lower thresholds
  if (capabilities.isLowEnd && itemCount >= 50) return true;

  return false;
}

/**
 * Should virtualization be enabled for a given item count
 */
export function shouldVirtualize(
  itemCount: number,
  capabilities: DeviceCapabilities
): boolean {
  return itemCount > capabilities.maxVirtualItems;
}

/**
 * Should pagination be enabled (desktop only, >300 items)
 */
export function shouldPaginate(
  itemCount: number,
  capabilities: DeviceCapabilities
): boolean {
  // Pagination only makes sense on desktop with very large collections
  if (capabilities.isMobile) return false;

  return itemCount > 300;
}

/**
 * Get batch size for progressive loading
 */
export function getBatchSize(
  capabilities: DeviceCapabilities,
  isInitialLoad: boolean = false
): number {
  if (isInitialLoad) {
    const thresholds = getOptimalThresholds(capabilities);
    return thresholds.initialLoad;
  }

  return capabilities.batchSize;
}

/**
 * Utility to get a safe default DeviceCapabilities for SSR or errors
 */
export function getDefaultCapabilities(): DeviceCapabilities {
  return {
    ram: 4,
    cpuCores: 4,
    isMobile: false,
    isLowEnd: false,
    maxVirtualItems: 100,
    maxTotalItems: 300,
    batchSize: 50,
    connectionSpeed: 'medium',
  };
}
