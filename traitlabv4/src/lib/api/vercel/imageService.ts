/**
 * Vercel Image Service
 * Generates combined NFT + traits preview images
 */

interface GenerateImageParams {
  tokenId: string;
  traitIds: string[];
}

export class VercelImageService {
  private cache: Map<string, string>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate combined image URL for NFT + traits
   * Uses v3 pattern: /api/render/custom-external/{tokenId}?trait={id1}&trait={id2}
   */
  generateCombinedImageUrl({ tokenId, traitIds }: GenerateImageParams): string {
    const cacheKey = `${tokenId}-${traitIds.sort().join('-')}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // v3 pattern: /api/render/custom-external/{tokenId}?trait={id1}&trait={id2}
    const baseUrl = 'https://adrianlab.vercel.app/api/render/custom-external';
    const traitParams = traitIds.map(id => `trait=${id}`).join('&');
    const url = `${baseUrl}/${tokenId}${traitParams ? '?' + traitParams : ''}`;

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
