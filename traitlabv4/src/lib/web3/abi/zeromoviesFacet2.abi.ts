/**
 * ZEROmoviesFacet2 ABI — reads + writes for the S2 ("Return of the Pixel")
 * videoclub on the $ZERO Diamond. Mirrors `src/facets/ZEROmoviesFacet2.sol`.
 */
export const ZERO_MOVIES_FACET_2_ABI = [
    // ─── Reads ───
    {
        inputs: [],
        name: 'getAllMovie2Ids',
        outputs: [{name: '', type: 'uint256[]'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'movieId', type: 'uint256'}],
        name: 'getMovie2',
        outputs: [
            {name: 'id', type: 'uint256'},
            {name: 'name', type: 'string'},
            {name: 'isMystery', type: 'bool'},
            {name: 'revealed', type: 'bool'},
            {name: 'active', type: 'bool'},
            {name: 'minted', type: 'bool'},
            {name: 'permanent', type: 'bool'},
            {name: 'renter', type: 'address'},
            {name: 'tokenId', type: 'uint256'},
            {name: 'rentedAt', type: 'uint256'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getMovies2Config',
        outputs: [
            {name: 'delegator', type: 'address'},
            {name: 'nftContract', type: 'address'},
            {name: 'fiftyFiftyRecipient', type: 'address'},
            {name: 'paused', type: 'bool'},
            {name: 'unpauseAt', type: 'uint256'},
            {name: 'rentPrice', type: 'uint256'},
            {name: 'buyPrice', type: 'uint256'},
            {name: 'gracePeriod', type: 'uint256'},
            {name: 'lateFeePerDay', type: 'uint256'},
            {name: 'burnBps', type: 'uint256'},
            {name: 's1HolderBps', type: 'uint256'},
            {name: 'fiftyFiftyBps', type: 'uint256'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'tokenId', type: 'uint256'}],
        name: 'getMovie2RentalInfo',
        outputs: [
            {name: 'movieId', type: 'uint256'},
            {name: 'rentedAt', type: 'uint256'},
            {name: 'renter', type: 'address'},
            {name: 'permanent', type: 'bool'},
            {name: 'isOverdue', type: 'bool'},
            {name: 'daysOverdue', type: 'uint256'},
            {name: 'lateFeeOwed', type: 'uint256'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getMovies2Snapshot',
        outputs: [
            {name: 'merkleRoot', type: 'bytes32'},
            {name: 'totalGoldenTickets', type: 'uint256'},
            {name: 'totalCrossSeasonWeight', type: 'uint256'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
    // ─── Writes (subset used by the UI) ───
    {
        inputs: [{name: 'movieId', type: 'uint256'}],
        name: 'rentMovie2',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{name: 'movieId', type: 'uint256'}],
        name: 'buyMovie2',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{name: 'tokenId', type: 'uint256'}],
        name: 'returnMovie2',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{name: 'tokenId', type: 'uint256'}],
        name: 'upgradeRent2ToBuy',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{name: 'user', type: 'address'}],
        name: 'getWalletActiveRentals2',
        outputs: [
            {name: 's1Active', type: 'uint256'},
            {name: 's2Active', type: 'uint256'},
            {name: 'cap', type: 'uint256'},
            {name: 'canRent', type: 'bool'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getMaxCrossRentals2',
        outputs: [{name: '', type: 'uint256'}],
        stateMutability: 'view',
        type: 'function',
    },
    // ─── Errors (decoded by wagmi on revert) ───
    {
        inputs: [{name: 'cap', type: 'uint256'}],
        name: 'RentalCapReached',
        type: 'error',
    },
    {
        inputs: [],
        name: 'HasOverdueRental',
        type: 'error',
    },
    {
        inputs: [],
        name: 'Paused',
        type: 'error',
    },
    {
        inputs: [{name: 'movieId', type: 'uint256'}],
        name: 'MovieCurrentlyRented',
        type: 'error',
    },
    {
        inputs: [{name: 'movieId', type: 'uint256'}],
        name: 'MoviePermanentlyOwned',
        type: 'error',
    },
] as const;
