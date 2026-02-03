/**
 * GitHub Image Service
 * Handles loading AdrianZERO images from GitHub repository
 * Fallback to Alchemy if GitHub image is unavailable
 */

const GITHUB_BASE_URL =
  'https://raw.githubusercontent.com/adriangallery/AdrianLAB/main/public/rendered-toggles';

interface ImageUrls {
  primaryUrl: string;
  fallbackUrl?: string;
}

/**
 * Generate GitHub image URL for an AdrianZERO token
 * Uses pattern: {tokenId}_latest.png
 * @param tokenId - The NFT token ID
 * @param fallbackUrl - Optional fallback URL (e.g., from Alchemy)
 */
export function getAdrianZeroImageUrls(
  tokenId: string,
  fallbackUrl?: string
): ImageUrls {
  // Try GitHub first with _latest convention
  const githubUrl = `${GITHUB_BASE_URL}/${tokenId}_latest.png`;

  return {
    primaryUrl: githubUrl,
    fallbackUrl,
  };
}

/**
 * Check if GitHub image exists
 * @param url - The GitHub image URL to check
 */
export async function checkImageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

export const githubImageService = {
  getAdrianZeroImageUrls,
  checkImageExists,
};
