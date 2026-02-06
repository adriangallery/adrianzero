import { useQuery } from '@tanstack/react-query';
import type { GalleryNFT } from '../types/gallery.types';
import { shuffleArray } from '../utils/shuffle';

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
}

const GITHUB_API_URL = 'https://api.github.com/repos/adriangallery/AdrianLAB/contents/public/rendered-toggles';
const COMMIT_REF = 'd05193bc1dbc1c577c051656111a3c07281ba019';

async function fetchGalleryNFTs(): Promise<GalleryNFT[]> {
  const response = await fetch(`${GITHUB_API_URL}?ref=${COMMIT_REF}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch gallery NFTs: ${response.statusText}`);
  }

  const files: GitHubFile[] = await response.json();

  // Filter PNG files and parse tokenId from filename (e.g., "146_latest.png" -> "146")
  const nfts: GalleryNFT[] = files
    .filter((file) => file.name.endsWith('.png') && file.type === 'file')
    .map((file) => {
      const tokenId = file.name.split('_')[0];
      return {
        tokenId,
        fileName: file.name,
        imageUrl: `https://raw.githubusercontent.com/adriangallery/AdrianLAB/main/public/rendered-toggles/${file.name}`,
      };
    });

  // Shuffle array using Fisher-Yates algorithm
  return shuffleArray(nfts);
}

export function useGalleryNFTs() {
  return useQuery({
    queryKey: ['gallery-nfts'],
    queryFn: fetchGalleryNFTs,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}
