import { useEffect } from 'react';
import { HeroSection } from './sections/HeroSection';
import { TraitTransformSection } from './sections/TraitTransformSection';
import { ParallaxGallerySection } from './sections/ParallaxGallerySection';
import { InteractiveTraitSection } from './sections/InteractiveTraitSection';
import { UtilitySection } from './sections/UtilitySection';
import { StatsSection } from './sections/StatsSection';
import { CTASection } from './sections/CTASection';

export const ZeroModule: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <TraitTransformSection />
      <ParallaxGallerySection />
      <InteractiveTraitSection />
      <UtilitySection />
      <StatsSection />
      <CTASection />
    </div>
  );
};
