// Score-based mint tiers.
// Prices are in $ZERO (18 decimals). Match ZombieMinter.sol exactly.

export const ZERO_DECIMALS = 18n;

export const TIERS = [
    {
        id: 0,
        name: 'Locked',
        minScore: 0,
        priceZero: '25000',
        priceWei: 0n,
        mintable: false,
        label: 'Keep shooting to unlock mint'
    },
    {
        id: 1,
        name: 'Shambler',
        minScore: 150,
        priceZero: '25000',
        priceWei: 25_000n * 10n ** ZERO_DECIMALS,
        mintable: true,
        label: 'Mint unlocked · full price'
    },
    {
        id: 2,
        name: 'Runner',
        minScore: 600,
        priceZero: '18750',
        priceWei: 18_750n * 10n ** ZERO_DECIMALS,
        mintable: true,
        label: '25% discount'
    },
    {
        id: 3,
        name: 'Brute',
        minScore: 1500,
        priceZero: '12500',
        priceWei: 12_500n * 10n ** ZERO_DECIMALS,
        mintable: true,
        label: '50% discount'
    },
    {
        id: 4,
        name: 'Boss',
        minScore: 3000,
        priceZero: '0',
        priceWei: 0n,
        mintable: true,
        label: 'FREE mint — legendary score'
    }
];

export function tierForScore(score) {
    let current = TIERS[0];
    for (const t of TIERS) {
        if (score >= t.minScore) current = t;
    }
    return current;
}

export function nextTier(score) {
    for (const t of TIERS) {
        if (score < t.minScore) return t;
    }
    return null;
}

export function formatZero(amount) {
    // 25000 → "25,000"
    return Number(amount).toLocaleString('en-US');
}
