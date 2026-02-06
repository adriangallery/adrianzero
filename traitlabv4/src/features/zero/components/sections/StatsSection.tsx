import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { StatCounter } from '../StatCounter';
import { STATS_DATA } from '../../data/sample-traits';

export const StatsSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isTouchDevice = 'ontouchstart' in window;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, isTouchDevice ? 0 : -100]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center py-20 px-4 bg-background overflow-hidden"
    >
      {/* Animated Grid Background */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{ y: isTouchDevice ? 0 : y }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0,255,0,0.3) 2px, transparent 2px),
                             linear-gradient(to bottom, rgba(0,255,0,0.3) 2px, transparent 2px)`,
            backgroundSize: '100px 100px',
          }}
        />
      </motion.div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Title */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 font-mono bg-gradient-to-r from-cyan-500 via-green-500 to-cyan-500 bg-clip-text text-transparent">
            THE NUMBERS SPEAK
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Living Ecosystem
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {STATS_DATA.map((stat) => (
            <StatCounter key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
      </div>
    </section>
  );
};
