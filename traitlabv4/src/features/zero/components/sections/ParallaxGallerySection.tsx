import { motion } from 'framer-motion';
import { ParallaxNFTRow } from '../ParallaxNFTRow';
import { SHOWCASE_NFTS } from '../../data/showcase-nfts';

export const ParallaxGallerySection: React.FC = () => {
  const isTouchDevice = 'ontouchstart' in window;

  // Split NFTs into three rows
  const row1 = SHOWCASE_NFTS.slice(0, 10);
  const row2 = SHOWCASE_NFTS.slice(10, 20);
  const row3 = SHOWCASE_NFTS.slice(20, 30);

  // Mobile: only 2 rows with fewer NFTs
  const mobileRow1 = SHOWCASE_NFTS.slice(0, 5);
  const mobileRow2 = SHOWCASE_NFTS.slice(5, 10);

  return (
    <section className="relative min-h-screen flex flex-col justify-center py-20 overflow-hidden bg-gradient-to-b from-background/50 to-background">
      {/* Title */}
      <motion.div
        className="text-center mb-16 px-4 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <motion.h2
          className="text-5xl md:text-6xl lg:text-7xl font-black mb-4"
          animate={{
            textShadow: [
              '0 0 20px rgba(0,255,0,0.5)',
              '0 0 40px rgba(0,255,0,0.8)',
              '0 0 20px rgba(0,255,0,0.5)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="bg-gradient-to-r from-cyan-500 via-green-500 to-cyan-500 bg-clip-text text-transparent">
            10,000 UNIQUE ZEROS
          </span>
        </motion.h2>
        <p className="text-xl md:text-2xl text-muted-foreground">
          10,000 Stories
        </p>
      </motion.div>

      {/* Desktop: 3 Rows */}
      {!isTouchDevice && (
        <div className="space-y-8">
          <ParallaxNFTRow nfts={row1} direction="right" speed={40} />
          <ParallaxNFTRow nfts={row2} direction="left" speed={30} />
          <ParallaxNFTRow nfts={row3} direction="right" speed={50} />
        </div>
      )}

      {/* Mobile: 2 Rows */}
      {isTouchDevice && (
        <div className="space-y-6">
          <ParallaxNFTRow nfts={mobileRow1} direction="right" speed={25} />
          <ParallaxNFTRow nfts={mobileRow2} direction="left" speed={20} />
        </div>
      )}

      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0,255,0,0.3) 1px, transparent 1px),
                             linear-gradient(to bottom, rgba(0,255,0,0.3) 1px, transparent 1px)`,
            backgroundSize: '100px 100px',
          }}
        />
      </div>
    </section>
  );
};
