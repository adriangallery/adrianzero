/**
 * Vercel Image Service
 * Generates combined NFT + traits preview images
 *
 * F9 (13-sep-2026): las URLs se construyen con el cliente único de AdrianLAB
 * (`@/lib/adrianlab`) en vez del dominio de AdrianLAB escrito a mano — mismo
 * comportamiento en producción, base configurable por `VITE_VERCEL_API_URL`.
 */

import { renderCustomExternalUrl, renderWithParamsUrl, renderLamboUrl, type ToggleParam } from '@/lib/adrianlab';

interface GenerateImageParams {
  tokenId: string;
  traitIds: string[];
}

/** Legacy numeric toggle IDs used by this service's callers. */
const TOGGLE_ID_TO_PARAM: Record<number, ToggleParam> = {
  1: 'closeup',
  2: 'shadow',
  3: 'glow',
  4: 'bn',
  11: 'blackout',
  12: 'banana',
};

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

    const url = renderCustomExternalUrl(tokenId, traitIds);

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
    // Convert to array if single value
    const ids = Array.isArray(toggleIds) ? toggleIds : [toggleIds];

    // Filter out 0 (None)
    const activeIds = ids.filter(id => id !== 0);

    const params: Partial<Record<ToggleParam, boolean>> = Object.fromEntries(
      activeIds
        .map(id => TOGGLE_ID_TO_PARAM[id])
        .filter((param): param is ToggleParam => param !== undefined)
        .map(param => [param, true] as const)
    );

    return renderWithParamsUrl(tokenId, params);
  }

  /**
   * Generate LAMBO variant image URL
   * @param tokenId - The NFT token ID
   * @param color - Lambo color (blue, red, yellow, green, etc.)
   * @returns URL for LAMBO variant
   */
  generateLamboImageUrl(tokenId: string, color: string): string {
    return renderLamboUrl(tokenId, color);
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
