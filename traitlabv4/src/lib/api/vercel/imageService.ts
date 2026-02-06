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
   * Generate NFT image URL with toggle effect(s)
   * @param tokenId - The NFT token ID
   * @param toggleIds - Toggle mode ID(s) (1=Closeup, 2=Shadow, 3=Glow, 4=B&W, 11=Blackout, 12=Banana)
   * @returns URL for NFT with toggle(s) applied
   */
  generateToggleImageUrl(tokenId: string, toggleIds: number | number[]): string {
    const baseUrl = 'https://adrianlab.vercel.app/api/render';

    // Map toggle IDs to URL parameter names
    const toggleMap: Record<number, string> = {
      1: 'closeup',   // Closeup/Zoom
      2: 'shadow',    // Shadow Mode
      3: 'glow',      // Glow Mode
      4: 'bn',        // Black & White
      11: 'blackout', // Blackout
      12: 'banana',   // Banana Mode
    };

    // Convert to array if single value
    const ids = Array.isArray(toggleIds) ? toggleIds : [toggleIds];

    // Filter out 0 (None)
    const activeIds = ids.filter(id => id !== 0);

    if (activeIds.length === 0) {
      // No toggle - just the base image
      return `${baseUrl}/${tokenId}.png`;
    }

    // Build URL with multiple toggle parameters
    const params = activeIds
      .map(id => toggleMap[id])
      .filter((param): param is string => param !== undefined)
      .map(param => `${param}=true`)
      .join('&');

    return `${baseUrl}/${tokenId}.png${params ? '?' + params : ''}`;
  }

  /**
   * Generate LAMBO variant image URL
   * @param tokenId - The NFT token ID
   * @param color - Lambo color (blue, red, yellow, green, etc.)
   * @returns URL for LAMBO variant
   */
  generateLamboImageUrl(tokenId: string, color: string): string {
    const baseUrl = 'https://adrianlab.vercel.app/api/render/lambo';
    return `${baseUrl}/${tokenId}?lambo=${color}`;
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
