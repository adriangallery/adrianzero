/**
 * Alchemy API Client
 * Handles NFT data fetching with rate limiting and retry logic
 */

import { getAlchemyApiKeys, ALCHEMY_NFT_BASE_URL } from '@/config/alchemy';

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
    this.baseUrls = apiKeys.map((apiKey) => `${ALCHEMY_NFT_BASE_URL}/${apiKey}`);

    if (this.baseUrls.length === 0 && import.meta.env.DEV) {
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
            if (import.meta.env.DEV) console.warn(
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
          if (import.meta.env.DEV) console.warn(
            `[Alchemy] API key ${index + 1}/${this.baseUrls.length} hit limit (${response.status}), trying fallback key`
          );
          continue;
        }

        throw new Error(`Alchemy API error (${response.status}): ${response.statusText}`);
      } catch (error) {
        lastError = error;

        if (attempt < this.baseUrls.length - 1) {
          if (import.meta.env.DEV) console.warn(
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

    return this.requestWithApiKeyFallback<AlchemyNFTsResponse>(
      'getNFTsForOwner',
      params
    );
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

    // Fetch all pages
    do {
      pageCount++;

      const response = await this.getERC1155TokensPage(owner, contractAddresses, pageKey);
      allNfts = allNfts.concat(response.ownedNfts);
      pageKey = response.pageKey;
      totalCount = response.totalCount;

      if (pageKey) {
        if (seenPageKeys.has(pageKey)) {
          break;
        }
        seenPageKeys.add(pageKey);
      }

      // Safety: prevent infinite loop
      if (pageCount > 50) {
        break;
      }
    } while (pageKey);

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

}

// Export singleton instance
export const alchemyClient = new AlchemyClient(getAlchemyApiKeys());

// Export types
export type { AlchemyNFT, AlchemyNFTsResponse, AlchemyNFTPageResponse, GetNFTsOptions };
