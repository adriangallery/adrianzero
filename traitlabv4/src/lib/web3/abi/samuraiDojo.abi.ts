/**
 * SamuraiDojoFacet ABI
 * Deployed on the ZERO Diamond — runs the Tenkaichi Budokai saga for SAMURAIzero NFTs.
 */
export const SAMURAI_DOJO_ABI = [
    // ─── User-facing ───
    {
        inputs: [{name: 'tokenId', type: 'uint256'}],
        name: 'enterBudokai',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{name: 'tokenIds', type: 'uint256[]'}],
        name: 'enterBudokaiBatch',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{name: 'tokenId', type: 'uint256'}],
        name: 'reviveSamurai',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{name: 'tokenIds', type: 'uint256[]'}],
        name: 'reviveSamuraiBatch',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },

    // ─── Views ───
    {
        inputs: [],
        name: 'getCurrentBudokaiId',
        outputs: [{name: '', type: 'uint256'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'budokaiId', type: 'uint256'}],
        name: 'getBudokaiInfo',
        outputs: [
            {name: 'seed', type: 'uint256'},
            {name: 'pool', type: 'uint256'},
            {name: 'entryStart', type: 'uint64'},
            {name: 'entryEnd', type: 'uint64'},
            {name: 'resolveBlock', type: 'uint64'},
            {name: 'minEntries', type: 'uint32'},
            {name: 'status', type: 'uint8'},
            {name: 'entryCount', type: 'uint256'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'budokaiId', type: 'uint256'}],
        name: 'getEntries',
        outputs: [{name: '', type: 'uint256[]'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'budokaiId', type: 'uint256'}],
        name: 'getChampions',
        outputs: [
            {name: 'champion', type: 'uint256'},
            {name: 'runnerUp', type: 'uint256'},
            {name: 'semifinalists', type: 'uint256[2]'},
            {name: 'quarterfinalists', type: 'uint256[4]'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'tokenId', type: 'uint256'}],
        name: 'isKnockedOut',
        outputs: [{name: '', type: 'bool'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'tokenId', type: 'uint256'}],
        name: 'getSenryoku',
        outputs: [{name: '', type: 'uint8'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'tokenId', type: 'uint256'}],
        name: 'isEligible',
        outputs: [{name: '', type: 'bool'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getTotalBurned',
        outputs: [{name: '', type: 'uint256'}],
        stateMutability: 'view',
        type: 'function',
    },

    // ─── v6 views (graceful on v4 — call reverts and wagmi returns failure) ───
    {
        inputs: [{name: 'tokenId', type: 'uint256'}],
        name: 'getHonor',
        outputs: [{name: '', type: 'uint32'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'tokenId', type: 'uint256'}],
        name: 'getEffectiveSR',
        outputs: [{name: '', type: 'uint256'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'tokenId', type: 'uint256'}],
        name: 'previewCivilianSenryoku',
        outputs: [{name: '', type: 'uint8'}],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getLastCreatedBudokaiId',
        outputs: [{name: '', type: 'uint256'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'budokaiId', type: 'uint256'}],
        name: 'getBudokaiCounters',
        outputs: [
            {name: 'samuraiCount', type: 'uint32'},
            {name: 'civilianCount', type: 'uint32'},
            {name: 'maxPerWallet', type: 'uint32'},
            {name: 'entryFee', type: 'uint128'},
            {name: 'freeEntry', type: 'bool'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'budokaiId', type: 'uint256'}],
        name: 'getBudokaiTrophy',
        outputs: [
            {name: 'trophyType', type: 'uint8'},
            {name: 'trophyTraitId', type: 'uint256'},
            {name: 'trophyWinners', type: 'uint8'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {name: 'budokaiId', type: 'uint256'},
            {name: 'wallet', type: 'address'},
        ],
        name: 'getEntriesByWallet',
        outputs: [{name: '', type: 'uint32'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getDefaultMaxPerWallet',
        outputs: [{name: '', type: 'uint32'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{name: 'budokaiId', type: 'uint256'}],
        name: 'getBudokaiTheme',
        outputs: [
            {name: 'tagline', type: 'string'},
            {name: 'themeColor', type: 'uint8'},
            {name: 'iconVariant', type: 'uint8'},
            {name: 'isSpecialEvent', type: 'bool'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        anonymous: false,
        inputs: [
            {indexed: true, name: 'budokaiId', type: 'uint256'},
            {indexed: true, name: 'tokenId', type: 'uint256'},
            {indexed: false, name: 'amount', type: 'uint32'},
            {indexed: false, name: 'reason', type: 'uint8'},
            {indexed: false, name: 'trophyType', type: 'uint8'},
        ],
        name: 'HonorAwarded',
        type: 'event',
    },

    // ─── Events ───
    {
        anonymous: false,
        inputs: [
            {indexed: true, name: 'budokaiId', type: 'uint256'},
            {indexed: true, name: 'tokenId', type: 'uint256'},
            {indexed: true, name: 'owner', type: 'address'},
        ],
        name: 'BudokaiEntry',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {indexed: true, name: 'budokaiId', type: 'uint256'},
            {indexed: false, name: 'round', type: 'uint8'},
            {indexed: false, name: 'tokenA', type: 'uint256'},
            {indexed: false, name: 'tokenB', type: 'uint256'},
            {indexed: false, name: 'winner', type: 'uint256'},
            {indexed: false, name: 'kaioken', type: 'bool'},
        ],
        name: 'MatchResolved',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {indexed: true, name: 'budokaiId', type: 'uint256'},
            {indexed: false, name: 'champion', type: 'uint256'},
            {indexed: false, name: 'runnerUp', type: 'uint256'},
            {indexed: false, name: 'semifinalists', type: 'uint256[2]'},
            {indexed: false, name: 'quarterfinalists', type: 'uint256[4]'},
            {indexed: false, name: 'poolPaid', type: 'uint256'},
        ],
        name: 'BudokaiResolved',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {indexed: true, name: 'tokenId', type: 'uint256'},
            {indexed: true, name: 'owner', type: 'address'},
        ],
        name: 'SamuraiRevived',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {indexed: true, name: 'tokenId', type: 'uint256'},
            {indexed: true, name: 'budokaiId', type: 'uint256'},
        ],
        name: 'SamuraiKnockedOut',
        type: 'event',
    },
] as const;

export const BUDOKAI_STATUS = {
    Unconfigured: 0,
    Open: 1,
    Closed: 2,
    Resolving: 3,
    Resolved: 4,
} as const;

export type BudokaiStatus = typeof BUDOKAI_STATUS[keyof typeof BUDOKAI_STATUS];
