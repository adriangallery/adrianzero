import { useRef } from 'react';
import type { GalleryNFT } from '../types/gallery.types';
import { GalleryCard } from './GalleryCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useGalleryStore } from '../store/galleryStore';

interface GalleryGridProps {
  nfts: GalleryNFT[];
}

export function GalleryGrid({ nfts }: GalleryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { extendedItems, observeElement } = useInfiniteScroll(nfts);
  const openModal = useGalleryStore((state) => state.openModal);

  const handleCardClick = (nft: GalleryNFT, index: number) => {
    openModal(nft, index, nfts);
  };

  if (nfts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-6xl">🎨</div>
          <div className="mt-4 text-xl font-semibold text-gray-300">No NFTs found</div>
          <div className="mt-2 text-sm text-gray-500">
            The gallery is currently empty
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="gallery-grid h-full w-full overflow-y-auto overflow-x-hidden px-8 py-8"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '50px',
        alignContent: 'start',
      }}
    >
      {extendedItems.map((nft, index) => (
        <GalleryCard
          key={`${nft.tokenId}-${index}`}
          nft={nft}
          index={index % nfts.length} // Use modulo to get original index for modal navigation
          onClick={handleCardClick}
          observeElement={observeElement}
        />
      ))}
    </div>
  );
}
