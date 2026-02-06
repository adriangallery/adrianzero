import { motion } from 'framer-motion';
import type { UtilityCardData } from '../types/zero.types';

interface UtilityCardProps {
  card: UtilityCardData;
  index: number;
}

export const UtilityCard: React.FC<UtilityCardProps> = ({ card, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative group"
    >
      <div className="h-full backdrop-blur-md bg-card/50 border border-border rounded-xl p-6 transition-all duration-300 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/20">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-5xl mb-4"
        >
          {card.icon}
        </motion.div>
        <h3 className="text-xl font-bold mb-2 text-foreground">{card.title}</h3>
        <p className="text-muted-foreground">{card.description}</p>
      </div>
    </motion.div>
  );
};
