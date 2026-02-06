import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface NFTTransformerProps {
  baseImageUrl: string;
  transformedImageUrl: string;
  traitNames?: string[];
}

export const NFTTransformer: React.FC<NFTTransformerProps> = ({
  baseImageUrl,
  transformedImageUrl,
  traitNames = ['Laser Eyes', 'Gold Grill', 'Crown'],
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showBeam, setShowBeam] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < traitNames.length) {
          setShowBeam(true);
          setTimeout(() => setShowBeam(false), 500);
          return prev + 1;
        }
        return 0;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [traitNames.length]);

  return (
    <div className="relative w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
      {/* Base NFT */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="relative w-full max-w-sm mx-auto aspect-square rounded-xl overflow-hidden border-2 border-border shadow-lg">
          <img
            src={baseImageUrl}
            alt="Base ZERO"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-4 text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              Base ZERO
            </p>
          </div>
        </div>
      </motion.div>

      {/* Transformation Beam & Traits */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-4 z-10">
        <AnimatePresence>
          {showBeam && (
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-32 h-1 bg-gradient-to-r from-cyan-500 via-green-500 to-cyan-500 rounded-full"
              style={{ transformOrigin: 'center' }}
            />
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-2">
          {traitNames.slice(0, 3).map((trait, index) => (
            <motion.div
              key={trait}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: currentStep > index ? 1 : 0.3,
                scale: currentStep > index ? 1 : 0.8,
                y: [0, -10, 0],
              }}
              transition={{
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
                y: { duration: 1.5, repeat: Infinity, delay: index * 0.2 },
              }}
              className="backdrop-blur-md bg-card/80 border border-green-500/50 rounded-lg px-4 py-2 text-xs font-mono whitespace-nowrap"
            >
              {trait}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Transformed NFT */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="relative w-full max-w-sm mx-auto aspect-square rounded-xl overflow-hidden border-2 border-green-500 shadow-lg shadow-green-500/20">
          <motion.img
            key={currentStep}
            src={transformedImageUrl}
            alt="Transformed ZERO"
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-4 text-center">
            <p className="text-sm text-green-500 uppercase tracking-wider font-bold">
              Transformed ZERO
            </p>
          </div>
          <motion.div
            className="absolute inset-0 border-2 border-green-500 rounded-xl"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* Mobile Trait Display */}
      <div className="lg:hidden flex justify-center gap-2 mt-4 col-span-full">
        {traitNames.slice(0, 2).map((trait, index) => (
          <motion.div
            key={trait}
            animate={{
              opacity: currentStep > index ? 1 : 0.5,
              scale: currentStep > index ? 1 : 0.9,
            }}
            className="backdrop-blur-md bg-card/80 border border-green-500/50 rounded-lg px-3 py-1 text-xs font-mono"
          >
            {trait}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
