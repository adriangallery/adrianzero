import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTraitSelection } from '../../hooks/useTraitSelection';
import { SAMPLE_TRAITS } from '../../data/sample-traits';

export const InteractiveTraitSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('Eyes');
  const { selectedTraits, selectTrait, buildPreviewUrl } = useTraitSelection();
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  const baseTokenId = '1';
  const previewUrl = buildPreviewUrl(baseTokenId);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const currentCategory = SAMPLE_TRAITS.find((cat) => cat.name === selectedCategory);

  return (
    <section
      className="relative min-h-screen flex items-center justify-center py-20 px-4 bg-background overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Radial Gradient Following Mouse */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 transition-all duration-300"
        style={{
          background: `radial-gradient(circle 600px at ${mousePosition.x}% ${mousePosition.y}%, rgba(0,255,0,0.15), transparent)`,
        }}
      />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Title */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-cyan-500 via-green-500 to-cyan-500 bg-clip-text text-transparent">
            INFINITE POSSIBILITIES
          </h2>
          <motion.p
            className="text-xl md:text-2xl text-muted-foreground font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Total Combinations: <span className="text-green-500 font-bold">1,000,000+</span>
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Categories (Left) */}
          <motion.div
            className="space-y-2 order-2 lg:order-1"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-lg font-bold mb-4 text-muted-foreground uppercase tracking-wider">
              Categories
            </h3>
            {SAMPLE_TRAITS.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  selectedCategory === category.name
                    ? 'bg-green-500 text-black font-bold'
                    : 'bg-card/50 hover:bg-card text-foreground'
                }`}
              >
                {category.name}
              </button>
            ))}
          </motion.div>

          {/* Preview (Center) */}
          <motion.div
            className="flex justify-center order-1 lg:order-2"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative w-full max-w-sm aspect-square">
              <motion.div
                key={previewUrl}
                className="w-full h-full rounded-xl overflow-hidden border-2 border-green-500 shadow-lg shadow-green-500/20"
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </motion.div>
              <motion.div
                className="absolute inset-0 border-2 border-green-500 rounded-xl pointer-events-none"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Traits (Right) */}
          <motion.div
            className="order-3"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-lg font-bold mb-4 text-muted-foreground uppercase tracking-wider">
              {selectedCategory} Traits
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 lg:overflow-x-hidden overflow-x-auto">
              <div className="flex lg:flex-col gap-2 lg:gap-2">
                {currentCategory?.traits.map((trait) => (
                  <motion.button
                    key={trait.id}
                    onClick={() => selectTrait(selectedCategory.toLowerCase(), trait.id)}
                    className={`px-4 py-3 rounded-lg text-sm transition-all whitespace-nowrap ${
                      selectedTraits[selectedCategory.toLowerCase()] === trait.id
                        ? 'bg-cyan-500 text-black font-bold'
                        : 'bg-card/50 hover:bg-card text-foreground'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {trait.name}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Build Your ZERO Text */}
        <motion.p
          className="text-center mt-12 text-muted-foreground text-lg"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          Build Your ZERO
        </motion.p>
      </div>
    </section>
  );
};
