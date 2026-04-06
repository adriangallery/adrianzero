import { useState, useEffect, useMemo } from 'react';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { buildEthMainnetRpcUrl } from '@/config/alchemy';

const ENS_CACHE_KEY = 'ens-cache';
const ENS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface EnsCacheEntry {
  name: string | null;
  ts: number;
}

function readCache(): Record<string, EnsCacheEntry> {
  try {
    return JSON.parse(localStorage.getItem(ENS_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function getCached(address: string): string | null | undefined {
  const entry = readCache()[address.toLowerCase()];
  if (!entry || Date.now() - entry.ts > ENS_CACHE_TTL) return undefined;
  return entry.name;
}

function setCached(address: string, name: string | null) {
  const cache = readCache();
  cache[address.toLowerCase()] = { name, ts: Date.now() };
  localStorage.setItem(ENS_CACHE_KEY, JSON.stringify(cache));
}

export function useEnsName(address: string | undefined) {
  const [ensName, setEnsName] = useState<string | null>(() => {
    if (!address) return null;
    return getCached(address) ?? null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const client = useMemo(
    () =>
      createPublicClient({
        chain: mainnet,
        transport: http(buildEthMainnetRpcUrl(), { retryCount: 2, retryDelay: 500 }),
      }),
    []
  );

  useEffect(() => {
    if (!address) {
      setEnsName(null);
      return;
    }

    const cached = getCached(address);
    if (cached !== undefined) {
      setEnsName(cached);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    client
      .getEnsName({ address: address as `0x${string}` })
      .then((name) => {
        if (cancelled) return;
        setEnsName(name);
        setCached(address, name);
      })
      .catch(() => {
        if (cancelled) return;
        setEnsName(null);
        setCached(address, null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [address, client]);

  return { ensName, isLoading };
}
