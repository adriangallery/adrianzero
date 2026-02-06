/**
 * Batch Read Utilities
 * Utilities for efficient batch contract reads with rate limiting prevention
 */

import type { PublicClient } from 'viem';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface BatchCallConfig {
  address: `0x${string}`;
  abi: any;
  functionName: string;
  args?: any[];
}

export interface BatchResult<T = any> {
  success: boolean;
  result?: T;
  error?: Error;
}

/**
 * Execute batch contract reads with throttling to prevent rate limiting
 * @param publicClient - Viem public client
 * @param calls - Array of contract call configurations
 * @param options - Batch size and throttle delay
 * @returns Array of batch results
 */
export async function batchContractReads<T = any>(
  publicClient: PublicClient,
  calls: BatchCallConfig[],
  options: {
    batchSize?: number;
    throttleMs?: number;
  } = {}
): Promise<BatchResult<T>[]> {
  const { batchSize = 100, throttleMs = 150 } = options;
  const allResults: BatchResult<T>[] = [];

  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (call) => {
        try {
          const result = await publicClient.readContract({
            address: call.address,
            abi: call.abi,
            functionName: call.functionName,
            args: call.args,
          });
          return { success: true, result: result as T };
        } catch (error) {
          return { success: false, error: error as Error };
        }
      })
    );

    allResults.push(...batchResults);

    // Throttle between batches
    if (i + batchSize < calls.length) {
      await sleep(throttleMs);
    }
  }

  return allResults;
}

/**
 * Parse common claim errors into user-friendly messages
 */
export function parseClaimError(error: Error): string {
  const msg = error.message.toLowerCase();

  if (msg.includes('user rejected') || msg.includes('user denied')) {
    return 'Transaction cancelled';
  }
  if (msg.includes('already claimed')) {
    return 'Already claimed for this punk';
  }
  if (msg.includes('not token owner') || msg.includes('not owner')) {
    return 'You must own this punk';
  }
  if (msg.includes('campaign not active') || msg.includes('not active')) {
    return 'Campaign expired or not started';
  }
  if (msg.includes('429') || msg.includes('rate limit')) {
    return 'Too many requests, please wait';
  }
  if (msg.includes('insufficient funds') || msg.includes('insufficient balance')) {
    return 'Insufficient funds for gas';
  }

  return 'Transaction failed. Please try again.';
}

/**
 * Cache utilities for storing contract read results
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function getCachedData<T>(
  key: string,
  maxAgeMs: number = 300000 // 5 minutes default
): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    if (Date.now() - entry.timestamp > maxAgeMs) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}
