import { useReadContract, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZERO_MOVIES_FACET_ABI } from '@/lib/web3/abi';
import { formatEther } from 'viem';

const ERC20_BALANCE_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

export function useZeroBalance() {
  const { address } = useAccount();

  const { data: balanceRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: ERC20_BALANCE_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 15_000,
    },
  });

  const balance = balanceRaw ? Number(formatEther(balanceRaw as bigint)) : 0;
  const balanceRawBigInt = (balanceRaw as bigint) ?? 0n;

  return { balance, balanceRaw: balanceRawBigInt };
}

export function useMoviesConfig() {
  const { data } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: ZERO_MOVIES_FACET_ABI,
    functionName: 'getZEROmoviesConfig',
  });

  if (!data) return { price: 0n, priceFormatted: 0, paused: true, totalMinted: 0, movieCount: 0 };

  const [, defaultPrice, , paused, , totalMinted, , movieCount] = data as [
    string, bigint, boolean, boolean, bigint, bigint, bigint, bigint
  ];

  return {
    price: defaultPrice,
    priceFormatted: Number(formatEther(defaultPrice)),
    paused,
    totalMinted: Number(totalMinted),
    movieCount: Number(movieCount),
  };
}
