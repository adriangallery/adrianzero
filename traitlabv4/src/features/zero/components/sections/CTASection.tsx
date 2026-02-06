import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { getGitHubImageUrl } from '@/config/images';

export const CTASection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.2, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.5, 0.3]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-black py-20 px-4"
    >
      {/* Background NFT Watermark */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center opacity-10"
        style={{ scale }}
      >
        <img
          src={getGitHubImageUrl('zeronaked.png')}
          alt=""
          className="w-full max-w-2xl object-contain"
        />
      </motion.div>

      {/* Gradient Overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-green-500/20 to-cyan-500/20 blur-3xl"
        style={{ opacity }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <motion.h2
          className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 md:mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="bg-gradient-to-r from-cyan-500 via-green-500 to-cyan-500 bg-clip-text text-transparent">
            BECOME ZERO
          </span>
        </motion.h2>

        <motion.p
          className="text-xl md:text-2xl text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Join the evolution. Customize your identity. Own your story.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link to="/mint">
            <motion.button
              className="group relative px-8 md:px-12 py-4 md:py-6 text-lg md:text-xl font-bold rounded-lg overflow-hidden bg-gradient-to-r from-cyan-500 via-green-500 to-cyan-500 text-black"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-500 via-cyan-500 to-green-500"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{ opacity: 0.5 }}
              />
              <span className="relative z-10">MINT YOUR ZERO</span>
            </motion.button>
          </Link>

          <Link to="/gallery">
            <motion.button
              className="group px-8 md:px-12 py-4 md:py-6 text-lg md:text-xl font-bold rounded-lg border-2 border-green-500 text-green-500 hover:bg-green-500/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              EXPLORE GALLERY
            </motion.button>
          </Link>
        </motion.div>

        {/* Additional Links */}
        <motion.div
          className="mt-12 md:mt-16 flex flex-wrap gap-6 justify-center text-sm md:text-base text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Link
            to="/traitlab"
            className="hover:text-green-500 transition-colors underline-offset-4 hover:underline"
          >
            Customize Traits
          </Link>
          <span>•</span>
          <Link
            to="/rewards"
            className="hover:text-green-500 transition-colors underline-offset-4 hover:underline"
          >
            View Rewards
          </Link>
          <span>•</span>
          <Link
            to="/whatisit"
            className="hover:text-green-500 transition-colors underline-offset-4 hover:underline"
          >
            Learn More
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
