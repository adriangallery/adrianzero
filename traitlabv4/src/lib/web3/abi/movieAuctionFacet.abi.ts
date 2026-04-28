/**
 * MovieAuctionFacet ABI — minimal read+write surface for the /auction page.
 * Mirrors `src/facets/MovieAuctionFacet.sol` on the $ZERO Diamond.
 */
export const MOVIE_AUCTION_FACET_ABI = [
    // ─── Reads ───
    {
        inputs: [],
        name: 'getCurrentAuctionId',
        outputs: [{name: '', type: 'uint256'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'auctionId', type: 'uint256'}],
        name: 'getAuction',
        outputs: [
            {name: 'movieId', type: 'uint256'},
            {name: 'startTime', type: 'uint64'},
            {name: 'endTime', type: 'uint64'},
            {name: 'antiSnipeWindow', type: 'uint64'},
            {name: 'antiSnipeExtension', type: 'uint64'},
            {name: 'startPrice', type: 'uint256'},
            {name: 'minIncrementBps', type: 'uint256'},
            {name: 'topBidder', type: 'address'},
            {name: 'topBid', type: 'uint256'},
            {name: 'status', type: 'uint8'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'auctionId', type: 'uint256'}],
        name: 'getMinNextBid',
        outputs: [{name: '', type: 'uint256'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'auctionId', type: 'uint256'}],
        name: 'isActive',
        outputs: [{name: '', type: 'bool'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'bidder', type: 'address'}],
        name: 'getOutbidBalance',
        outputs: [{name: '', type: 'uint256'}],
        stateMutability: 'view',
        type: 'function',
    },
    // ─── Writes ───
    {
        inputs: [
            {name: 'auctionId', type: 'uint256'},
            {name: 'amount', type: 'uint256'},
        ],
        name: 'placeBid',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{name: 'auctionId', type: 'uint256'}],
        name: 'settleAuction',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'withdrawOutbid',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    // ─── Events (for bid history) ───
    {
        anonymous: false,
        inputs: [
            {indexed: true, name: 'auctionId', type: 'uint256'},
            {indexed: true, name: 'bidder', type: 'address'},
            {indexed: false, name: 'amount', type: 'uint256'},
            {indexed: false, name: 'newEndTime', type: 'uint64'},
        ],
        name: 'BidPlaced',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {indexed: true, name: 'auctionId', type: 'uint256'},
            {indexed: false, name: 'newEndTime', type: 'uint64'},
        ],
        name: 'BidExtended',
        type: 'event',
    },
] as const;

export const AUCTION_STATUS = {
    None: 0,
    Active: 1,
    Settled: 2,
    Cancelled: 3,
} as const;
