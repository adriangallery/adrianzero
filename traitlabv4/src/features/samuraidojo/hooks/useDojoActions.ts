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
