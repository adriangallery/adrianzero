import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { GalleryNFT } from '../types/gallery.types';
import { useMouseParallax } from '../hooks/useMouseParallax';

interface GalleryCardProps {
  nft: GalleryNFT;
  index: number;
  onClick: (nft: GalleryNFT, index: number) => void;
  observeElement?: (element: HTMLElement | null) => void;
}

export function GalleryCard({ nft, index, onClick, observeElement }: GalleryCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const parallaxHandlers = useMouseParallax(cardRef);

  const handleClick = () => {
    onClick(nft, index);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Combine refs for intersection observer
  const setRefs = (element: HTMLImageElement | null) => {
    imgRef.current = element;
    if (observeElement) {
      observeElement(element);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className="gallery-card group relative cursor-pointer"
      onClick={handleClick}
      onMouseMove={parallaxHandlers.handleMouseMove}
      onMouseLeave={parallaxHandlers.handleMouseLeave}
      whileHover={{ scale: 1.15 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      style={{
        willChange: 'transform',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Card container with hover effects */}
      <div className="relative h-[200px] w-[200px] overflow-hidden rounded-lg bg-gray-800/50 backdrop-blur-sm transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(0,255,0,0.5)]">
        {/* Loading shimmer */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
        )}

        {/* Image */}
        <img
          ref={setRefs}
          data-src={nft.imageUrl}
          alt={`AdrianZERO #${nft.tokenId}`}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />

        {/* Error state */}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
            <div className="text-center">
              <div className="text-4xl">❌</div>
              <div className="mt-2 text-xs text-gray-400">Failed to load</div>
            </div>
          </div>
        )}

        {/* Token ID overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="font-mono text-sm font-semibold text-green-400">
            #{nft.tokenId}
          </div>
        </div>

        {/* Hover glow effect */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 via-transparent to-blue-400/20" />
        </div>
      </div>
    </motion.div>
  );
}
