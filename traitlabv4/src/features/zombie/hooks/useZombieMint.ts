/**
 * AZombie hooks — reads/writes against ZombieMintFacet on the $ZERO Diamond.
 *
 * Until the facet is cut, `zombieGetConfig` reverts → `notLive: true` and the
 * builder keeps working with a "Mint opens soon" button (same idea as gumball).
 */

import { useEffect, useMemo, useState } from 'react';
import { parseEventLogs } from 'viem';
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZOMBIE_MINT_FACET_ABI } from '@/lib/web3/abi';
import { humanError } from '@/lib/web3/humanError';

const DIAMOND = CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`;

export const FALLBACK_MAX_SUPPLY = 1000n;
export const FALLBACK_MAX_PER_WALLET = 3n;

export interface ZombieConfig {
  paused: boolean;
  totalMinted: bigint;
  maxSupply: bigint;
  maxPerWallet: bigint;
}

export function useZombieConfig() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: DIAMOND,
    abi: ZOMBIE_MINT_FACET_ABI,
    functionName: 'zombieGetConfig',
    query: { refetchInterval: 20_000, retry: false, staleTime: 0 },
  });

  const notLive = !!error;
  const config: ZombieConfig = data
    ? {
        paused: data[1],
        totalMinted: data[2],
        maxSupply: data[3] || FALLBACK_MAX_SUPPLY,
        maxPerWallet: data[4] || FALLBACK_MAX_PER_WALLET,
      }
    : {
        paused: true,
        totalMinted: 0n,
        maxSupply: FALLBACK_MAX_SUPPLY,
        maxPerWallet: FALLBACK_MAX_PER_WALLET,
      };

  // ready = the facet answered; until then nothing else is queried
  return { config, notLive, ready: !!data, isLoading: isLoading && !data, refetch };
}

/** «1 in N» odds of Zombie0 (falls back to 10). */
export function useZombieRareOneIn(enabled: boolean) {
  const { data } = useReadContract({
    address: DIAMOND,
    abi: ZOMBIE_MINT_FACET_ABI,
    functionName: 'zombieRareOneIn',
    query: { enabled, retry: false, staleTime: 300_000 },
  });
  return data && data > 0 ? data : 10;
}

export function useZombieMintedBy(enabled: boolean) {
  const { address } = useAccount();
  const { data, refetch } = useReadContract({
    address: DIAMOND,
    abi: ZOMBIE_MINT_FACET_ABI,
    functionName: 'zombieMintedBy',
    args: address ? [address] : undefined,
    query: { enabled: enabled && !!address, retry: false, staleTime: 0 },
  });
  return { mintedBy: data ?? 0n, refetch };
}

/** Debounced value — used so the uniqueness check doesn't fire on every brush pixel. */
export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useZombieIsTaken(maskHex: `0x${string}`, traits: number, enabled: boolean) {
  const key = useMemo(() => ({ maskHex, traits }), [maskHex, traits]);
  const debounced = useDebounced(key, 450);
  const settled = debounced.maskHex === maskHex && debounced.traits === traits;
  const { data, isFetching, refetch } = useReadContract({
    address: DIAMOND,
    abi: ZOMBIE_MINT_FACET_ABI,
    functionName: 'zombieIsTaken',
    args: [debounced.maskHex, debounced.traits],
    query: { enabled, retry: false, staleTime: 10_000 },
  });
  return {
    isTaken: settled && data === true,
    isChecking: enabled && (!settled || isFetching),
    refetch,
  };
}

export interface MintResult {
  tokenId: bigint;
  variant: number;
  index: bigint;
}

export function useZombieMint() {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } =
    useWaitForTransactionReceipt({ hash });

  // tokenId/variant from the ZombieMinted event (only logs emitted by the Diamond).
  const fromEvent = useMemo(() => {
    if (!receipt) return null;
    const own = receipt.logs.filter((l) => l.address.toLowerCase() === DIAMOND.toLowerCase());
    const events = parseEventLogs({ abi: ZOMBIE_MINT_FACET_ABI, eventName: 'ZombieMinted', logs: own });
    const ev = events[0];
    if (!ev) return null;
    return { tokenId: ev.args.tokenId, variant: ev.args.variant, index: ev.args.index };
  }, [receipt]);

  // Source of truth for the reveal: zombieGetData(tokenId).variant.
  const { data: onchain } = useReadContract({
    address: DIAMOND,
    abi: ZOMBIE_MINT_FACET_ABI,
    functionName: 'zombieGetData',
    args: fromEvent ? [fromEvent.tokenId] : undefined,
    query: { enabled: !!fromEvent, retry: 3 },
  });

  const result: MintResult | null = fromEvent
    ? {
        tokenId: fromEvent.tokenId,
        variant: onchain ? onchain[2] : fromEvent.variant,
        index: onchain ? onchain[3] : fromEvent.index,
      }
    : null;

  const mint = (maskHex: `0x${string}`, traits: number) => {
    writeContract({
      address: DIAMOND,
      abi: ZOMBIE_MINT_FACET_ABI,
      functionName: 'zombieMint',
      args: [maskHex, traits],
    });
  };

  return {
    mint,
    isPending,
    isConfirming,
    isConfirmed,
    result,
    error: error ?? receiptError ?? null,
    txHash: hash,
    reset,
  };
}

const ZOMBIE_ERRORS: Array<[string, string]> = [
  ['zombiepaused', 'Minting is paused. Back soon.'],
  ['zombienotinitialized', 'Mint opens soon.'],
  ['zombiesoldout', 'Sold out. All zombies have risen.'],
  ['zombiewalletlimit', 'This wallet already minted its 3 zombies.'],
  ['zombiebadmask', 'Bad bite mask. Hit Clear and try again.'],
  ['zombiebadtraits', "That trait combo isn't valid."],
  ['zombietaken', 'Someone just minted this exact zombie. Change a bite.'],
  ['zombiemintfailed', 'Mint failed on-chain. Try again.'],
];

function flatten(error: unknown): string {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let cur: unknown = error;
  while (cur && typeof cur === 'object' && !seen.has(cur)) {
    seen.add(cur);
    const o = cur as Record<string, unknown>;
    for (const k of ['shortMessage', 'message', 'details'] as const) {
      if (typeof o[k] === 'string') parts.push(o[k] as string);
    }
    const d = o.data as { errorName?: unknown } | undefined;
    if (d && typeof d.errorName === 'string') parts.push(d.errorName);
    cur = o.cause;
  }
  return parts.join(' ').toLowerCase();
}

export function zombieError(error: unknown): string {
  const msg = flatten(error);
  for (const [needle, text] of ZOMBIE_ERRORS) if (msg.includes(needle)) return text;
  return humanError(error);
}
