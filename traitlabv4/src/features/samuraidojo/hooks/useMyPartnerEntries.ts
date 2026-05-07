import {useMemo} from 'react';
import {useReadContracts} from 'wagmi';
import {base} from 'wagmi/chains';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI} from '@/lib/web3/abi';
import type {PartnerSkin} from '../lib/budokaiApi';

export interface MyPartnerEntry {
    /** On-chain synthetic civilian id (≥ 1_000_001) — the persistent fighter id. */
    syntheticId: number;
    /** Source NFT (Doodle/Pudgy/etc). */
    skin: PartnerSkin;
}

export interface MyPartnerFighter extends MyPartnerEntry {
    isKnockedOut: boolean;
    senryoku: number;
}

/**
 * v11: For each partner NFT the wallet owns, ask the contract whether
 * it's the active fighter for the given Budokai. Returns only NFTs that
 * (a) have a minted synthetic id, AND (b) the connected wallet owns the
 * per-Budokai entry slot.
 *
 * Used by the "Partner Fighters" section in the MINE tab so a holder
 * sees their Doodle/Pudgy/CTS fighter alongside their AdrianZERO roster
 * — the persistent identity makes them feel like real owned fighters.
 */
export function useMyPartnerEntries(
    currentBudokaiId: number | null,
    skins: PartnerSkin[],
    wallet: string | undefined,
): MyPartnerEntry[] {
    const enabled = currentBudokaiId !== null && skins.length > 0 && !!wallet;

    // Step 1: resolve synthetic id for every owned partner NFT.
    const syntheticReads = useReadContracts({
        allowFailure: true,
        contracts: enabled
            ? skins.map((s) => ({
                  address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                  abi: SAMURAI_DOJO_ABI,
                  functionName: 'getSyntheticForPartner',
                  args: [s.contract as `0x${string}`, BigInt(s.tokenId)],
                  chainId: base.id,
              }))
            : [],
        query: {enabled, refetchInterval: 30_000, refetchOnWindowFocus: true},
    });

    const synthetics = useMemo(() => {
        const out: {skin: PartnerSkin; syntheticId: bigint}[] = [];
        if (!syntheticReads.data) return out;
        for (let i = 0; i < skins.length; i++) {
            const r = syntheticReads.data[i];
            if (r?.status === 'success' && r.result && (r.result as bigint) > 0n) {
                out.push({skin: skins[i], syntheticId: r.result as bigint});
            }
        }
        return out;
    }, [syntheticReads.data, skins]);

    // Step 2: for each minted synthetic, check if wallet is the entry owner this Budokai.
    const entryOwnerReads = useReadContracts({
        allowFailure: true,
        contracts:
            enabled && synthetics.length > 0
                ? synthetics.map((s) => ({
                      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                      abi: SAMURAI_DOJO_ABI,
                      functionName: 'getEntryOwner',
                      args: [BigInt(currentBudokaiId as number), s.syntheticId],
                      chainId: base.id,
                  }))
                : [],
        query: {enabled: enabled && synthetics.length > 0, refetchInterval: 30_000},
    });

    return useMemo<MyPartnerEntry[]>(() => {
        if (!entryOwnerReads.data || !wallet) return [];
        const wLower = wallet.toLowerCase();
        const out: MyPartnerEntry[] = [];
        for (let i = 0; i < synthetics.length; i++) {
            const r = entryOwnerReads.data[i];
            if (r?.status !== 'success') continue;
            const owner = (r.result as unknown as `0x${string}`).toLowerCase();
            if (owner === wLower) {
                out.push({
                    syntheticId: Number(synthetics[i].syntheticId),
                    skin: synthetics[i].skin,
                });
            }
        }
        return out;
    }, [entryOwnerReads.data, synthetics, wallet]);
}

/**
 * v11: For every partner NFT the wallet owns, resolve its persistent
 * synthetic id and read on-chain KO state + senryoku. Returns one entry
 * per registered partner NFT that has ever been entered in any Budokai
 * (synthetic id > 0). KO state is global to the synthetic — it carries
 * across Budokais until someone Senzu-revives the fighter.
 *
 * Used by KoSections to surface "Your Partner Fighters · KO'd" so the
 * holder can revive their NFT identity for the next tournament.
 */
export function useMyPartnerFighters(
    skins: PartnerSkin[],
    wallet: string | undefined,
): MyPartnerFighter[] {
    const enabled = skins.length > 0 && !!wallet;

    const syntheticReads = useReadContracts({
        allowFailure: true,
        contracts: enabled
            ? skins.map((s) => ({
                  address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                  abi: SAMURAI_DOJO_ABI,
                  functionName: 'getSyntheticForPartner',
                  args: [s.contract as `0x${string}`, BigInt(s.tokenId)],
                  chainId: base.id,
              }))
            : [],
        query: {enabled, refetchInterval: 30_000, refetchOnWindowFocus: true},
    });

    const synthetics = useMemo(() => {
        const out: {skin: PartnerSkin; syntheticId: bigint}[] = [];
        if (!syntheticReads.data) return out;
        for (let i = 0; i < skins.length; i++) {
            const r = syntheticReads.data[i];
            if (r?.status === 'success' && r.result && (r.result as bigint) > 0n) {
                out.push({skin: skins[i], syntheticId: r.result as bigint});
            }
        }
        return out;
    }, [syntheticReads.data, skins]);

    // Batch isKnockedOut + getSenryoku for every minted synthetic.
    const stateReads = useReadContracts({
        allowFailure: true,
        contracts:
            enabled && synthetics.length > 0
                ? synthetics.flatMap((s) => [
                      {
                          address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                          abi: SAMURAI_DOJO_ABI,
                          functionName: 'isKnockedOut',
                          args: [s.syntheticId],
                          chainId: base.id,
                      } as const,
                      {
                          address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                          abi: SAMURAI_DOJO_ABI,
                          functionName: 'getSenryoku',
                          args: [s.syntheticId],
                          chainId: base.id,
                      } as const,
                  ])
                : [],
        query: {enabled: enabled && synthetics.length > 0, refetchInterval: 30_000},
    });

    return useMemo<MyPartnerFighter[]>(() => {
        if (!stateReads.data) return [];
        const out: MyPartnerFighter[] = [];
        for (let i = 0; i < synthetics.length; i++) {
            const koRes = stateReads.data[i * 2];
            const srRes = stateReads.data[i * 2 + 1];
            const isKnockedOut = koRes?.status === 'success' ? Boolean(koRes.result) : false;
            const senryoku =
                srRes?.status === 'success' ? Number(srRes.result as number | bigint) : 0;
            out.push({
                syntheticId: Number(synthetics[i].syntheticId),
                skin: synthetics[i].skin,
                isKnockedOut,
                senryoku,
            });
        }
        return out;
    }, [stateReads.data, synthetics]);
}
