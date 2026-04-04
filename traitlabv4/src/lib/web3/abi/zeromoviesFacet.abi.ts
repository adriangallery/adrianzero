export const ZERO_MOVIES_FACET_ABI = [
  // User functions
  { type: 'function', name: 'rentMovie', inputs: [{ name: 'movieId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'buyMovie', inputs: [{ name: 'movieId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'upgradeRentalToBuy', inputs: [{ name: 'movieId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'returnMovie', inputs: [{ name: 'movieId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'keepMovieForever', inputs: [{ name: 'movieId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'claimMovieRewards', inputs: [], outputs: [], stateMutability: 'nonpayable' },

  // Views — catalog
  { type: 'function', name: 'getAllMovies', inputs: [], outputs: [
    { name: 'ids', type: 'uint256[]' }, { name: 'names', type: 'string[]' },
    { name: 'mintedFlags', type: 'bool[]' }, { name: 'activeFlags', type: 'bool[]' },
    { name: 'tokenIds', type: 'uint256[]' }, { name: 'minters', type: 'address[]' },
  ], stateMutability: 'view' },
  { type: 'function', name: 'getAvailableMovies', inputs: [], outputs: [
    { name: 'ids', type: 'uint256[]' }, { name: 'names', type: 'string[]' },
  ], stateMutability: 'view' },
  { type: 'function', name: 'getMovie', inputs: [{ name: 'movieId', type: 'uint256' }], outputs: [
    { name: 'id', type: 'uint256' }, { name: 'name', type: 'string' },
    { name: 'minted', type: 'bool' }, { name: 'active', type: 'bool' },
    { name: 'tokenId', type: 'uint256' }, { name: 'mintedBy', type: 'address' },
  ], stateMutability: 'view' },

  // Views — rental
  { type: 'function', name: 'getAllRentalStatus', inputs: [], outputs: [
    { name: 'ids', type: 'uint256[]' }, { name: 'renters', type: 'address[]' },
    { name: 'deposits', type: 'uint256[]' }, { name: 'rentedAts', type: 'uint256[]' },
    { name: 'permanents', type: 'bool[]' }, { name: 'rentCounts', type: 'uint256[]' },
  ], stateMutability: 'view' },
  { type: 'function', name: 'getRentalInfo', inputs: [{ name: 'movieId', type: 'uint256' }], outputs: [
    { name: 'renter', type: 'address' }, { name: 'tokenId', type: 'uint256' },
    { name: 'rentedAt', type: 'uint256' }, { name: 'deposit', type: 'uint256' },
    { name: 'rentals', type: 'uint256' }, { name: 'permanent', type: 'bool' },
    { name: 'name', type: 'string' },
  ], stateMutability: 'view' },
  { type: 'function', name: 'canReturn', inputs: [{ name: 'movieId', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'canKeep', inputs: [{ name: 'movieId', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'getPendingRewards', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getCollectionBonuses', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: 'bonuses', type: 'string[]' }], stateMutability: 'view' },

  // Views — config
  { type: 'function', name: 'getZEROmoviesConfig', inputs: [], outputs: [
    { name: 'delegator', type: 'address' }, { name: 'defaultPrice', type: 'uint256' },
    { name: 'burnOnMint', type: 'bool' }, { name: 'paused', type: 'bool' },
    { name: 'maxPerWallet', type: 'uint256' }, { name: 'totalMinted', type: 'uint256' },
    { name: 'totalZeroBurned', type: 'uint256' }, { name: 'movieCount', type: 'uint256' },
  ], stateMutability: 'view' },
  { type: 'function', name: 'getRentalConfig', inputs: [], outputs: [
    { name: 'burnBps', type: 'uint256' }, { name: 'holderBps', type: 'uint256' },
    { name: 'revenueBps', type: 'uint256' }, { name: 'depositBps', type: 'uint256' },
    { name: 'keepThreshold', type: 'uint256' }, { name: 'nftContract', type: 'address' },
    { name: 'totalActiveRentals', type: 'uint256' }, { name: 'totalDepositsHeld', type: 'uint256' },
    { name: 'totalReturns', type: 'uint256' }, { name: 'totalRewardsDistributed', type: 'uint256' },
  ], stateMutability: 'view' },
  { type: 'function', name: 'getUserMovieMintCount', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'zeroMoviesTotalMinted', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getBuyPrice', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getMovieStats', inputs: [{ name: 'movieId', type: 'uint256' }], outputs: [
    { name: 'lifetimeRentals', type: 'uint256' }, { name: 'isPermanent', type: 'bool' },
    { name: 'currentOwner', type: 'address' }, { name: 'depositHeld', type: 'uint256' },
  ], stateMutability: 'view' },

  // Events
  { type: 'event', name: 'MovieRented', inputs: [
    { name: 'renter', type: 'address', indexed: true }, { name: 'movieId', type: 'uint256', indexed: true },
    { name: 'tokenId', type: 'uint256', indexed: true }, { name: 'price', type: 'uint256', indexed: false },
    { name: 'burned', type: 'uint256', indexed: false }, { name: 'deposited', type: 'uint256', indexed: false },
  ]},
  { type: 'event', name: 'MovieReturned', inputs: [
    { name: 'returner', type: 'address', indexed: true }, { name: 'movieId', type: 'uint256', indexed: true },
    { name: 'depositRefunded', type: 'uint256', indexed: false },
  ]},
  { type: 'event', name: 'MovieKeptForever', inputs: [
    { name: 'keeper', type: 'address', indexed: true }, { name: 'movieId', type: 'uint256', indexed: true },
    { name: 'depositBurned', type: 'uint256', indexed: false },
  ]},
] as const;
