import {parseEther} from 'viem';
import {useWaitForTransactionReceipt, useWriteContract} from 'wagmi';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI} from '@/lib/web3/abi';
import {ENTRY_FEE_ZERO, SENZU_FEE_ZERO} from '../types';

// No ZERO allowance needed: facet uses LibERC20._transfer (internal, tax-free) — same pattern as ShopFacet.
// Users just need ZERO balance to call enterBudokai / reviveSamurai.

export const ENTRY_FEE_WEI = parseEther(String(ENTRY_FEE_ZERO));
export const SENZU_FEE_WEI = parseEther(String(SENZU_FEE_ZERO));

/**
 * Enter a samurai into the currently-open Budokai.
 */
export function useEnterBudokai() {
    const {writeContract, data: hash, isPending, error, reset} = useWriteContract();
    const {isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({hash});

    const enter = (tokenId: number) => {
        writeContract({
            address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
            abi: SAMURAI_DOJO_ABI,
            functionName: 'enterBudokai',
            args: [BigInt(tokenId)],
        });
    };

    return {enter, isPending, isConfirming, isConfirmed, error, txHash: hash, reset};
}

/**
 * v10: Enter the active Budokai as an anonymous civilian — no NFT required.
 * Pays the same entry fee in $ZERO. The contract assigns a synthetic
 * tokenId (≥1_000_001) recorded in `anonymousOwner[tokenId] = msg.sender`.
 * Cannot revive after KO (that's the AdrianZERO civilian's upgrade).
 */
export function useEnterAsAnonymousCivilian() {
    const {writeContract, data: hash, isPending, error, reset} = useWriteContract();
    const {isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({hash});

    const enterAnon = () => {
        writeContract({
            address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
            abi: SAMURAI_DOJO_ABI,
            functionName: 'enterAsAnonymousCivilian',
            args: [],
        });
    };

    return {enterAnon, isPending, isConfirming, isConfirmed, error, txHash: hash, reset};
}

/**
 * Enter multiple samurai in a single transaction (one signature).
 */
export function useEnterBudokaiBatch() {
    const {writeContract, data: hash, isPending, error, reset} = useWriteContract();
    const {isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({hash});

    const enterBatch = (tokenIds: number[]) => {
        if (tokenIds.length === 0) return;
        writeContract({
            address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
            abi: SAMURAI_DOJO_ABI,
            functionName: 'enterBudokaiBatch',
            args: [tokenIds.map((id) => BigInt(id))],
        });
    };

    return {enterBatch, isPending, isConfirming, isConfirmed, error, txHash: hash, reset};
}

/**
 * Revive a KO'd samurai by paying the Senzu Bean fee.
 */
export function useReviveSamurai() {
    const {writeContract, data: hash, isPending, error, reset} = useWriteContract();
    const {isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({hash});

    const revive = (tokenId: number) => {
        writeContract({
            address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
            abi: SAMURAI_DOJO_ABI,
            functionName: 'reviveSamurai',
            args: [BigInt(tokenId)],
        });
    };

    return {revive, isPending, isConfirming, isConfirmed, error, txHash: hash, reset};
}

/**
 * Revive multiple KO'd tokens in a single transaction. All must be owned by msg.sender and KO'd
 * in the currently-open Budokai. Per-token cost = senryoku × 10 ZERO; reverts atomically.
 */
export function useReviveSamuraiBatch() {
    const {writeContract, data: hash, isPending, error, reset} = useWriteContract();
    const {isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({hash});

    const reviveBatch = (tokenIds: number[]) => {
        if (tokenIds.length === 0) return;
        writeContract({
            address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
            abi: SAMURAI_DOJO_ABI,
            functionName: 'reviveSamuraiBatch',
            args: [tokenIds.map((id) => BigInt(id))],
        });
    };

    return {reviveBatch, isPending, isConfirming, isConfirmed, error, txHash: hash, reset};
}
