import { motion } from 'framer-motion';
import { NFTTransformer } from '../NFTTransformer';
import { getGitHubImageUrl } from '@/config/images';

export const TraitTransformSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center py-20 px-4 bg-gradient-to-b from-background to-background/50">
      <div className="max-w-7xl mx-auto w-full">
        {/* Section Title */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
            <div className="text-foreground">CUSTOMIZE.</div>
            <div className="text-cyan-500">TRANSFORM.</div>
            <div className="bg-gradient-to-r from-cyan-500 via-green-500 to-cyan-500 bg-clip-text text-transparent">
              OWN IT.
            </div>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mt-8">
            Watch ZERO Evolve
          </p>
        </motion.div>

        {/* Transformer Component */}
        <NFTTransformer
          baseImageUrl={getGitHubImageUrl('zeronaked.png')}
          transformedImageUrl="https://adrianlab.vercel.app/api/render/1.png"
          traitNames={['Laser Eyes', 'Gold Grill', 'Crown']}
        />
      </div>
    </section>
  );
};
