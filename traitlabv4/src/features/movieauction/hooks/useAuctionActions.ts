import {useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount} from 'wagmi';
import {base} from 'wagmi/chains';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {MOVIE_AUCTION_FACET_ABI, ERC20_ABI} from '@/lib/web3/abi';

/**
 * Allowance check for the auction facet (the Diamond pulls $ZERO at bid time
 * via `LibERC20._spendAllowance(bidder, address(this), amount)`).
 */
export function useZeroAllowanceForAuction(): {
    allowance: bigint;
    refetch: () => void;
} {
    const {address} = useAccount();
    const {data, refetch} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: address ? [address, CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`] : undefined,
        chainId: base.id,
        // staleTime: 0 + window-focus refetch so the panel reflects fresh state
        // immediately after an approve lands (Base RPC can lag a beat).
        query: {
            enabled: !!address,
            staleTime: 0,
            refetchInterval: 8_000,
            refetchOnWindowFocus: true,
        },
    });
    return {allowance: (data as bigint | undefined) ?? 0n, refetch};
}

/**
 * Approve $ZERO spend by the Diamond. Caller usually approves a generous
 * amount (3-5x the next bid) so subsequent bids don't need re-approval.
 */
export function useApproveZeroForAuction() {
    const {writeContract, data: hash, isPending, error, reset} = useWriteContract();
    const {isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({hash});

    const approve = (amount: bigint) => {
        writeContract({
            address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`, amount],
        });
    };

    return {approve, hash, isPending, isConfirming, isConfirmed, error, reset};
}

/**
 * Place a bid. Caller must have approved at least `amount` of $ZERO to the
 * Diamond before calling. Explicit gas per Launch Rule #13 (L2 RPC race after
 * a fresh approve can mis-estimate when the next call pulls via transferFrom).
 */
export function usePlaceBid() {
    const {writeContract, data: hash, isPending, error: writeError, reset} = useWriteContract();
    const {isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({hash});

    const placeBid = (auctionId: bigint, amount: bigint) => {
        writeContract({
            address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
            abi: MOVIE_AUCTION_FACET_ABI,
            functionName: 'placeBid',
            args: [auctionId, amount],
            gas: 300_000n,
        });
    };

    return {placeBid, hash, isPending, isConfirming, isConfirmed, error: writeError, reset};
}

export function useSettleAuction() {
    const {writeContract, data: hash, isPending, error: writeError, reset} = useWriteContract();
    const {isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({hash});

    const settle = (auctionId: bigint) => {
        writeContract({
            address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
            abi: MOVIE_AUCTION_FACET_ABI,
            functionName: 'settleAuction',
            args: [auctionId],
            // settleAuction does ZERO split (burn + transfer) + self-call into
            // adminMintMovie2 → delegator → AdrianLabCore.safeMint → ERC721
            // hooks (recordEvent, onERC721Received) + S2 bookkeeping. Real cost
            // is ~810k (verified via cast run on a failed 600k attempt that
            // OOGed at the post-mint SSTOREs). 1.5M leaves headroom.
            gas: 1_500_000n,
        });
    };

    return {settle, hash, isPending, isConfirming, isConfirmed, error: writeError, reset};
}

export function useWithdrawOutbid() {
    const {writeContract, data: hash, isPending, error: writeError, reset} = useWriteContract();
    const {isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({hash});

    const withdraw = () => {
        writeContract({
            address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
            abi: MOVIE_AUCTION_FACET_ABI,
            functionName: 'withdrawOutbid',
            args: [],
            gas: 200_000n,
        });
    };

    return {withdraw, hash, isPending, isConfirming, isConfirmed, error: writeError, reset};
}
