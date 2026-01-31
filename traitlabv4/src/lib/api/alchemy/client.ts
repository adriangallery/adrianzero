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
    return this.getNFTs({
      owner,
      contractAddresses,
      tokenType: 'ERC721',
      withMetadata: true,
    });
  }

  /**
   * Get ERC1155 tokens for owner (with pagination to get ALL tokens)
   */
  async getERC1155Tokens(
    owner: string,
    contractAddresses?: string[]
  ): Promise<AlchemyNFTsResponse> {
    let allNfts: AlchemyNFT[] = [];
    let pageKey: string | undefined = undefined;
    let totalCount = 0;

    // Fetch all pages
    do {
      const response = await this.getNFTs({
        owner,
        contractAddresses,
        tokenType: 'ERC1155',
        withMetadata: true,
        pageKey,
        pageSize: 100, // Max per page
      });

      allNfts = allNfts.concat(response.ownedNfts);
      pageKey = response.pageKey;
      totalCount = response.totalCount;
    } while (pageKey);

    return {
      ownedNfts: allNfts,
      totalCount,
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
export type { AlchemyNFT, AlchemyNFTsResponse, GetNFTsOptions };
