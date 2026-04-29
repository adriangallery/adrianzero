/**
 * Centralized Alchemy API Key Management
 * Single source of truth for all Alchemy keys and URLs
 */

const PLACEHOLDER_ALCHEMY_KEY = 'your_alchemy_api_key_here';

const isValidAlchemyKey = (apiKey?: string): apiKey is string => {
  return Boolean(apiKey && apiKey.trim() && apiKey !== PLACEHOLDER_ALCHEMY_KEY);
};

/** Deduplicated, validated Alchemy API keys from env vars */
export const getAlchemyApiKeys = (): string[] => {
  const listKeys = (import.meta.env.VITE_ALCHEMY_API_KEYS || '')
    .split(',')
    .map((key: string) => key.trim())
    .filter((key: string) => key.length > 0);

  // listKeys (CSV rotation) goes FIRST so the cleanest/least-used key is tried before
  // the legacy VITE_ALCHEMY_API_KEY. Otherwise every parallel React Query starts at the
  // same key index and stampedes one quota while fresh keys sit idle.
  const rawKeys = [
    ...listKeys,
    import.meta.env.VITE_ALCHEMY_API_KEY,
    import.meta.env.VITE_ALCHEMY_API_KEY_FALLBACK,
  ];

  return Array.from(new Set(rawKeys.filter(isValidAlchemyKey)));
};

/** Build RPC URLs with Alchemy keys + fallback providers */
export const buildAlchemyRpcUrls = (): string[] => {
  const urls: string[] = [];

  // Priority 1: Alchemy (best rate limits on free tier - 300M compute units/month)
  getAlchemyApiKeys().forEach((alchemyKey) => {
    urls.push(`https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`);
  });

  // Priority 2: Infura (good rate limits)
  const infuraKey = import.meta.env.VITE_INFURA_API_KEY || 'cc0c8013b1e044dcba79d4f7ec3b2ba1';
  urls.push(`https://base-mainnet.infura.io/v3/${infuraKey}`);

  // Priority 3+: Public endpoints (fallbacks, strict rate limits)
  urls.push(
    'https://mainnet.base.org',
    'https://base.llamarpc.com',
    'https://base-rpc.publicnode.com'
  );

  return urls;
};

/** Build Ethereum Mainnet RPC URLs for ENS resolution (rotation + public fallback) */
export const buildEthMainnetRpcUrls = (): string[] => {
  const urls: string[] = [];

  const ensKey = import.meta.env.VITE_ALCHEMY_ENS_KEY;
  if (isValidAlchemyKey(ensKey)) {
    urls.push(`https://eth-mainnet.g.alchemy.com/v2/${ensKey}`);
  }

  // Rotate across all configured Alchemy keys for ENS too — same per-second rate limit
  // applies whether it's Base or Ethereum, so concentrating on one key 429s on wallet
  // connect bursts.
  getAlchemyApiKeys().forEach((key) => {
    const url = `https://eth-mainnet.g.alchemy.com/v2/${key}`;
    if (!urls.includes(url)) urls.push(url);
  });

  // Public fallbacks
  urls.push('https://eth.llamarpc.com', 'https://cloudflare-eth.com');

  return urls;
};

/** @deprecated Use buildEthMainnetRpcUrls() (plural) — keeps compat for any external callers. */
export const buildEthMainnetRpcUrl = (): string => buildEthMainnetRpcUrls()[0];

export const ALCHEMY_NFT_BASE_URL = 'https://base-mainnet.g.alchemy.com/nft/v3';
