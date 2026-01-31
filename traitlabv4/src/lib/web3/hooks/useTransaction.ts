/**
 * useTransaction Hook
 * Manages transaction state and execution with notifications
 */

import { useState, useCallback } from 'react';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { type Address, type Abi } from 'viem';

export type TransactionStatus =
  | 'idle'
  | 'preparing'
  | 'pending'
  | 'success'
  | 'error';

interface UseTransactionResult {
  write: (args: any[]) => Promise<void>;
  status: TransactionStatus;
  error: Error | null;
  txHash: string | null;
  reset: () => void;
}

export function useTransaction(
  address: Address,
  abi: Abi,
  functionName: string
): UseTransactionResult {
  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();

  const { isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}` | undefined,
    });

  const write = useCallback(
    async (args: any[]) => {
      try {
        setStatus('preparing');
        setError(null);

        const hash = await writeContractAsync({
          address,
          abi,
          functionName,
          args,
        });

        setTxHash(hash);
        setStatus('pending');

        // Wait for confirmation
        // The useWaitForTransactionReceipt hook will handle this automatically
      } catch (err) {
        setError(err as Error);
        setStatus('error');
        console.error('Transaction error:', err);
      }
    },
    [address, abi, functionName, writeContractAsync]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(null);
  }, []);

  // Update status based on confirmation state
  if (isConfirmed && status === 'pending') {
    setStatus('success');
  }

  return {
    write,
    status,
    error,
    txHash,
    reset,
  };
}
