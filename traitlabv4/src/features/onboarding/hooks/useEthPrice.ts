/**
 * useEthPrice Hook
 * Fetches ETH/USD price from CoinGecko
 */

import { useQuery } from '@tanstack/react-query';

interface CoinGeckoResponse {
  ethereum: {
    usd: number;
  };
}

async function fetchEthPrice(): Promise<number> {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
  );

  if (!response.ok) {
    throw new Error('Failed to fetch ETH price');
  }

  const data: CoinGeckoResponse = await response.json();
  return data.ethereum.usd;
}

export function useEthPrice() {
  return useQuery({
    queryKey: ['ethPrice'],
    queryFn: fetchEthPrice,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    retry: 2,
  });
}

export function formatUsdPrice(ethAmount: bigint, ethPrice: number): string {
  const ethValue = Number(ethAmount) / 1e18;
  const usdValue = ethValue * ethPrice;
  return usdValue.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
