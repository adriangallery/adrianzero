import { motion } from 'framer-motion';
import { UtilityCard } from '../UtilityCard';
import { UTILITY_CARDS } from '../../data/sample-traits';

export const UtilitySection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center py-20 px-4 bg-gradient-to-b from-background to-background/50">
      <div className="max-w-7xl mx-auto w-full">
        {/* Title */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-cyan-500 via-green-500 to-cyan-500 bg-clip-text text-transparent">
            UTILITY UNLOCKED
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground">
            More Than Art
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {UTILITY_CARDS.map((card, index) => (
            <UtilityCard key={card.title} card={card} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
