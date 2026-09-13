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
 * @deprecated usar `humanError` de `@/lib/web3/humanError` (F4, 13-sep-2026) — se
 * mantiene este re-export para no romper los imports existentes de `parseClaimError`.
 */
export { humanError as parseClaimError } from '../humanError';

