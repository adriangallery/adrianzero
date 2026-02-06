/**
 * Alchemy API Client
 * Handles NFT data fetching with rate limiting and retry logic
 */

import { ALCHEMY_BASE_URL } from '@/config/contracts';

const API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;

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
  private baseUrl: string;

  constructor(apiKey: string) {
    this.baseUrl = `${ALCHEMY_BASE_URL}/${apiKey}`;
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

    const url = `${this.baseUrl}/getNFTsForOwner?${params.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Alchemy API error: ${response.statusText}`);
      }

      const data = await response.json();
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
    const url = `${this.baseUrl}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}&refreshCache=false`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Alchemy API error: ${response.statusText}`);
      }

      const data = await response.json();
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
    const url = `${this.baseUrl}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}&refreshCache=true`;

    try {
      await fetch(url);
    } catch (error) {
      console.error('Error refreshing NFT metadata:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const alchemyClient = new AlchemyClient(API_KEY || '');

// Export types
export type { AlchemyNFT, AlchemyNFTsResponse, AlchemyNFTPageResponse, GetNFTsOptions };
