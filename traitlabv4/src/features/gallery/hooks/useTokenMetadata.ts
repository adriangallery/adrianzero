/**
 * useTokenMetadata — fetches metadata from AdrianLAB API for visible tokens
 * Caches results in the gallery store to avoid refetching on scroll
 */

import { useCallback, useEffect, useRef } from 'react';
import { useGalleryStore } from '../store/galleryStore';
import type { NFTMetadata, NFTType } from '../types/gallery.types';

const METADATA_API = 'https://adrianlab.vercel.app/api/v2/metadata';
const CONCURRENT_FETCHES = 6;

/** Derive NFT type from metadata attributes */
export function deriveNFTType(metadata: NFTMetadata): NFTType {
  const gen = metadata.attributes?.find((a) => a.trait_type === 'Generation');
  if (!gen) return 'Unknown';
  const v = gen.value;
  if (v === 'Gen0' || v === 'OG') return 'Gen0';
  if (v === 'SamuraiZERO') return 'SamuraiZERO';
  if (v === 'SubZERO') return 'SubZERO';
  if (v === 'ZEROmovies') return 'ZEROmovies';
  if (v === 'GenZERO') return 'GenZERO';
  return 'Unknown';
}

export function useTokenMetadata(visibleTokenIds: number[]) {
  const { metadataCache, setMetadata } = useGalleryStore();
  const inflightRef = useRef(new Set<number>());

  const fetchOne = useCallback(
    async (tokenId: number) => {
      if (metadataCache.has(tokenId) || inflightRef.current.has(tokenId)) return;
      inflightRef.current.add(tokenId);

      try {
        const res = await fetch(`${METADATA_API}/${tokenId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: NFTMetadata = await res.json();
        setMetadata(tokenId, data);
      } catch (err) {
        // Store a minimal fallback so we don't retry endlessly
        setMetadata(tokenId, {
          name: `AdrianZero #${tokenId}`,
          image: `https://adrianlab.vercel.app/api/render/${tokenId}.png`,
          attributes: [],
        });
        if (import.meta.env.DEV) console.warn(`Metadata fetch failed for #${tokenId}:`, err);
      } finally {
        inflightRef.current.delete(tokenId);
      }
    },
    [metadataCache, setMetadata]
  );

  // Fetch metadata for visible tokens that aren't cached yet
  useEffect(() => {
    const missing = visibleTokenIds.filter(
      (id) => !metadataCache.has(id) && !inflightRef.current.has(id)
    );
    if (missing.length === 0) return;

    // Limit concurrency
    const batch = missing.slice(0, CONCURRENT_FETCHES);
    batch.forEach(fetchOne);
  }, [visibleTokenIds, metadataCache, fetchOne]);

  return { metadataCache };
}
