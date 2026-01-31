/**
 * Vercel Image Service
 * Generates combined NFT + traits preview images
 */

const VERCEL_API_URL = import.meta.env.VITE_VERCEL_API_URL || 'https://adrianlab.vercel.app/api';

interface GenerateImageParams {
  tokenId: string;
  traitIds: string[];
}

export class VercelImageService {
  private baseUrl: string;
  private cache: Map<string, string>;

  constructor(baseUrl: string = VERCEL_API_URL) {
    this.baseUrl = baseUrl;
    this.cache = new Map();
  }

  /**
   * Generate combined image URL for NFT + traits
   */
  generateCombinedImageUrl({ tokenId, traitIds }: GenerateImageParams): string {
    const cacheKey = `${tokenId}-${traitIds.sort().join('-')}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Build URL with query parameters
    const params = new URLSearchParams({
      tokenId,
    });

    traitIds.forEach((traitId) => {
      params.append('traits', traitId);
    });

    const url = `${this.baseUrl}/render?${params.toString()}`;

    this.cache.set(cacheKey, url);

    return url;
  }

  /**
   * Preload image to check if it's valid
   */
  async preloadImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const vercelImageService = new VercelImageService();
