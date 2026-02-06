import { motion } from 'framer-motion';
import type { ShowcaseNFT } from '../types/zero.types';
import { useState } from 'react';

interface ParallaxNFTRowProps {
  nfts: ShowcaseNFT[];
  direction?: 'left' | 'right';
  speed?: number;
  className?: string;
}

export const ParallaxNFTRow: React.FC<ParallaxNFTRowProps> = ({
  nfts,
  direction = 'right',
  speed = 30,
  className = '',
}) => {
  const [isPaused, setIsPaused] = useState(false);

  const duplicatedNfts = [...nfts, ...nfts];
  const animationDirection = direction === 'right' ? ['0%', '-50%'] : ['-50%', '0%'];

  return (
    <div
      className={`overflow-hidden ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div
        className="flex gap-4"
        animate={{
          x: animationDirection,
        }}
        transition={{
          x: {
            duration: speed,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
        style={{ willChange: 'transform' }}
      >
        {duplicatedNfts.map((nft, index) => (
          <motion.div
            key={`${nft.tokenId}-${index}`}
            className="flex-shrink-0 w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 relative rounded-lg overflow-hidden border-2 border-border"
            whileHover={{ scale: 1.05, borderColor: '#00ff00' }}
            transition={{ duration: 0.2 }}
            animate={isPaused ? { scale: 1.05 } : {}}
          >
            <img
              src={nft.imageUrl}
              alt={`ZERO #${nft.tokenId}`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className="text-xs text-white font-mono">#{nft.tokenId}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
