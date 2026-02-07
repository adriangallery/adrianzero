/**
 * Alchemy API Client
 * Handles NFT data fetching with rate limiting and retry logic
 */

import { ALCHEMY_BASE_URL } from '@/config/contracts';

const PLACEHOLDER_ALCHEMY_KEY = 'your_alchemy_api_key_here';

const isValidApiKey = (apiKey?: string): apiKey is string => {
  return Boolean(apiKey && apiKey.trim() && apiKey !== PLACEHOLDER_ALCHEMY_KEY);
};

const getAlchemyApiKeys = (): string[] => {
  const listKeys = (import.meta.env.VITE_ALCHEMY_API_KEYS || '')
    .split(',')
    .map((key: string) => key.trim())
    .filter((key: string) => key.length > 0);

  const rawKeys = [
    import.meta.env.VITE_ALCHEMY_API_KEY,
    import.meta.env.VITE_ALCHEMY_API_KEY_FALLBACK,
    ...listKeys,
  ];

  return Array.from(new Set(rawKeys.filter(isValidApiKey)));
};

interface AlchemyNFT {
  contract: {
    address: string;
  };
  tokenId: string;
  tokenType: 'ERC721' | 'ERC1155';
  name?: string;
  description?: string;
  image?: {
    cachedUrl?: string;
    thumbnailUrl?: string;
    pngUrl?: string;
    originalUrl?: string;
  };
  raw?: {
    metadata?: any;
    tokenUri?: string;
  };
  tokenUri?: string;
  balance?: string;
}

interface AlchemyNFTsResponse {
  ownedNfts: AlchemyNFT[];
  pageKey?: string;
  totalCount: number;
}

interface AlchemyNFTPageResponse extends AlchemyNFTsResponse {
  hasMore: boolean;
}

interface GetNFTsOptions {
  owner: string;
  contractAddresses?: string[];
  pageKey?: string;
  pageSize?: number;
  withMetadata?: boolean;
  tokenType?: 'ERC721' | 'ERC1155';
}

class AlchemyClient {
  private baseUrls: string[];
  private activeBaseIndex = 0;

  constructor(apiKeys: string[]) {
    this.baseUrls = apiKeys.map((apiKey) => `${ALCHEMY_BASE_URL}/${apiKey}`);

    if (this.baseUrls.length === 0) {
      console.error(
        '[Alchemy] No API keys configured. Set VITE_ALCHEMY_API_KEY (and optional VITE_ALCHEMY_API_KEY_FALLBACK).'
      );
    }
  }

  private shouldFallbackApiKey(status: number, responseBody: string): boolean {
    if (status === 429) {
      return true;
    }

    if (status === 403) {
      return /rate\s*limit|quota|compute\s*units|daily\s*limit/i.test(responseBody);
    }

    return false;
  }

  private async requestWithApiKeyFallback<T>(
    endpoint: string,
    params: URLSearchParams
  ): Promise<T> {
    if (this.baseUrls.length === 0) {
      throw new Error('Alchemy API key is not configured');
    }

    let lastError: unknown;

    for (let attempt = 0; attempt < this.baseUrls.length; attempt++) {
      const index = (this.activeBaseIndex + attempt) % this.baseUrls.length;
      const baseUrl = this.baseUrls[index];
      const url = `${baseUrl}/${endpoint}?${params.toString()}`;

      try {
        const response = await fetch(url);

        if (response.ok) {
          if (index !== this.activeBaseIndex) {
            console.warn(
              `[Alchemy] Switched to fallback API key ${index + 1}/${this.baseUrls.length}`
            );
            this.activeBaseIndex = index;
          }

          return (await response.json()) as T;
        }

        const responseBody = await response.text();

        if (
          this.shouldFallbackApiKey(response.status, responseBody) &&
          attempt < this.baseUrls.length - 1
        ) {
          console.warn(
            `[Alchemy] API key ${index + 1}/${this.baseUrls.length} hit limit (${response.status}), trying fallback key`
          );
          continue;
        }

        throw new Error(`Alchemy API error (${response.status}): ${response.statusText}`);
      } catch (error) {
        lastError = error;

        if (attempt < this.baseUrls.length - 1) {
          console.warn(
            `[Alchemy] Request failed with API key ${index + 1}/${this.baseUrls.length}, trying fallback key`
          );
          continue;
        }
      }
    }

    throw lastError || new Error('Alchemy request failed');
  }

  private getAdaptivePageSize(pageSize?: number): number {
    if (pageSize) {
      return pageSize;
    }

    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return 50;
    }

    return 100;
  }

  private dedupeNFTs(nfts: AlchemyNFT[]): AlchemyNFT[] {
    const seen = new Set<string>();

    return nfts.filter((nft) => {
      const key = `${nft.contract.address.toLowerCase()}:${nft.tokenId}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Get NFTs owned by an address
   */
  async getNFTs(options: GetNFTsOptions): Promise<AlchemyNFTsResponse> {
    const params = new URLSearchParams({
      owner: options.owner,
      withMetadata: String(options.withMetadata ?? true),
    });

    if (options.contractAddresses && options.contractAddresses.length > 0) {
      options.contractAddresses.forEach((address) => {
        params.append('contractAddresses[]', address);
      });
    }

    if (options.pageKey) {
      params.append('pageKey', options.pageKey);
    }

    if (options.pageSize) {
      params.append('pageSize', String(options.pageSize));
    }

    if (options.tokenType) {
      params.append('tokenType', options.tokenType);
    }

    try {
      const data = await this.requestWithApiKeyFallback<AlchemyNFTsResponse>(
        'getNFTsForOwner',
        params
      );
      return data;
    } catch (error) {
      console.error('Error fetching NFTs from Alchemy:', error);
      throw error;
    }
  }

  /**
   * Get metadata for a specific NFT
   */
  async getNFTMetadata(
    contractAddress: string,
    tokenId: string
  ): Promise<AlchemyNFT> {
    const params = new URLSearchParams({
      contractAddress,
      tokenId,
      refreshCache: 'false',
    });

    try {
      const data = await this.requestWithApiKeyFallback<AlchemyNFT>(
        'getNFTMetadata',
        params
      );
      return data;
    } catch (error) {
      console.error('Error fetching NFT metadata from Alchemy:', error);
      throw error;
    }
  }

  /**
   * Get ERC721 tokens for owner
   */
  async getERC721Tokens(
    owner: string,
    contractAddresses?: string[]
  ): Promise<AlchemyNFTsResponse> {
    const allNfts: AlchemyNFT[] = [];
    const seenPageKeys = new Set<string>();
    let pageKey: string | undefined;
    let totalCount = 0;
    let hasMore = true;

    while (hasMore) {
      const page = await this.getERC721TokensPage(owner, contractAddresses, pageKey);
      allNfts.push(...page.ownedNfts);
      totalCount = page.totalCount;

      if (!page.pageKey) {
        hasMore = false;
        break;
      }

      if (seenPageKeys.has(page.pageKey)) {
        console.warn('[Alchemy] Detected ERC721 pageKey loop, stopping pagination');
        hasMore = false;
        break;
      }

      seenPageKeys.add(page.pageKey);
      pageKey = page.pageKey;
    }

    return {
      ownedNfts: this.dedupeNFTs(allNfts),
      totalCount,
    };
  }

  /**
   * Get a single ERC721 page for owner
   */
  async getERC721TokensPage(
    owner: string,
    contractAddresses?: string[],
    pageKey?: string,
    pageSize?: number
  ): Promise<AlchemyNFTPageResponse> {
    const response = await this.getNFTs({
      owner,
      contractAddresses,
      tokenType: 'ERC721',
      withMetadata: true,
      pageKey,
      pageSize: this.getAdaptivePageSize(pageSize),
    });

    return {
      ...response,
      hasMore: Boolean(response.pageKey),
    };
  }

  /**
   * Get ERC1155 tokens for owner (with pagination to get ALL tokens)
   */
  async getERC1155Tokens(
    owner: string,
    contractAddresses?: string[]
  ): Promise<AlchemyNFTsResponse> {
    let allNfts: AlchemyNFT[] = [];
    const seenPageKeys = new Set<string>();
    let pageKey: string | undefined;
    let totalCount = 0;
    let pageCount = 0;

    console.log('[Alchemy] Fetching ERC1155 tokens for:', owner);
    console.log('[Alchemy] Contract filters:', contractAddresses);

    // Fetch all pages
    do {
      pageCount++;
      console.log(`[Alchemy] Fetching page ${pageCount}, pageKey:`, pageKey);

      const response = await this.getERC1155TokensPage(owner, contractAddresses, pageKey);

      console.log(`[Alchemy] Page ${pageCount} returned ${response.ownedNfts.length} tokens`);
      allNfts = allNfts.concat(response.ownedNfts);
      pageKey = response.pageKey;
      totalCount = response.totalCount;

      if (pageKey) {
        if (seenPageKeys.has(pageKey)) {
          console.warn('[Alchemy] Detected ERC1155 pageKey loop, stopping pagination');
          break;
        }
        seenPageKeys.add(pageKey);
      }

      // Safety: prevent infinite loop
      if (pageCount > 50) {
        console.error('[Alchemy] Too many pages, breaking loop');
        break;
      }
    } while (pageKey);

    console.log(`[Alchemy] Total fetched: ${allNfts.length} tokens across ${pageCount} pages`);

    return {
      ownedNfts: this.dedupeNFTs(allNfts),
      totalCount,
    };
  }

  /**
   * Get a single ERC1155 page for owner
   */
  async getERC1155TokensPage(
    owner: string,
    contractAddresses?: string[],
    pageKey?: string,
    pageSize?: number
  ): Promise<AlchemyNFTPageResponse> {
    const response = await this.getNFTs({
      owner,
      contractAddresses,
      tokenType: 'ERC1155',
      withMetadata: true,
      pageKey,
      pageSize: this.getAdaptivePageSize(pageSize),
    });

    return {
      ...response,
      hasMore: Boolean(response.pageKey),
    };
  }

  /**
   * Refresh metadata for a token (triggers re-fetch from contract)
   */
  async refreshMetadata(
    contractAddress: string,
    tokenId: string
  ): Promise<void> {
    const params = new URLSearchParams({
      contractAddress,
      tokenId,
      refreshCache: 'true',
    });

    try {
      await this.requestWithApiKeyFallback<AlchemyNFT>('getNFTMetadata', params);
    } catch (error) {
      console.error('Error refreshing NFT metadata:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const alchemyClient = new AlchemyClient(getAlchemyApiKeys());

// Export types
export type { AlchemyNFT, AlchemyNFTsResponse, AlchemyNFTPageResponse, GetNFTsOptions };
