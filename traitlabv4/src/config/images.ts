/**
 * Image URLs Configuration
 * Central configuration for static images hosted on GitHub
 */

// GitHub raw content base URL
export const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/adriangallery/adrianzero/main';

// Helper function to get GitHub raw URL
export const getGitHubImageUrl = (path: string): string => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${GITHUB_RAW_BASE}/${cleanPath}`;
};

// Common image paths
export const IMAGE_PATHS = {
  // Core images
  ZERO_NAKED: 'zeronaked.png',
  BANNER: 'components/images/ADRIAN_ZERO_Banner.gif',
  ADRIAN_COIN: 'components/images/ADRIAN_Coin.gif',
  ADRIAN_COIN_BACK: 'components/images/ADRIAN_Coin_Back.gif',

  // SubZERO images
  SUBZERO: 'subzero/images/subzero.png',
  BLUE_CHECK: 'subzero/images/bluecheck.png',
  ADRIAN_COIN_SUBZERO: 'subzero/images/adriancoin.gif',

  // Component images (by ID)
  getComponentImage: (id: number, ext: 'png' | 'gif' = 'png') =>
    `components/images/${id}.${ext}`,

  // ShitDROP images (by ID)
  getShitdropImage: (id: number, ext: 'png' | 'gif' = 'png') =>
    `shitdrop/images/${id}.${ext}`,
} as const;

// Full URLs (pre-computed for common images)
export const IMAGES = {
  ZERO_NAKED: getGitHubImageUrl(IMAGE_PATHS.ZERO_NAKED),
  BANNER: getGitHubImageUrl(IMAGE_PATHS.BANNER),
  ADRIAN_COIN: getGitHubImageUrl(IMAGE_PATHS.ADRIAN_COIN),
  ADRIAN_COIN_BACK: getGitHubImageUrl(IMAGE_PATHS.ADRIAN_COIN_BACK),
  SUBZERO: getGitHubImageUrl(IMAGE_PATHS.SUBZERO),
  BLUE_CHECK: getGitHubImageUrl(IMAGE_PATHS.BLUE_CHECK),
  ADRIAN_COIN_SUBZERO: getGitHubImageUrl(IMAGE_PATHS.ADRIAN_COIN_SUBZERO),
} as const;
