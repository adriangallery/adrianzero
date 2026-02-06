/**
 * WhatIsItModule Component
 * Main container for What is $ADRIAN educational page
 */

import { WhatIsItHero } from './WhatIsItHero';
import { PillarsGrid } from './PillarsGrid';
import { NumbersGrid } from './NumbersGrid';
import { CTASection } from './CTASection';
import { VeryShortVersion } from './sections/VeryShortVersion';
import { AdrianSection } from './sections/AdrianSection';
import { PunksSection } from './sections/PunksSection';
import { ZeroSection } from './sections/ZeroSection';
import { LabSection } from './sections/LabSection';
import { HowItConnects } from './sections/HowItConnects';
import { GetStarted } from './sections/GetStarted';

export function WhatIsItModule() {
  return (
    <div className="whatisit-module mx-auto max-w-6xl px-4 py-8">
      <WhatIsItHero />
      <PillarsGrid />

      <VeryShortVersion />
      <AdrianSection />
      <PunksSection />
      <ZeroSection />
      <LabSection />
      <HowItConnects />

      {/* Numbers Section */}
      <div className="mb-12">
        <h2 className="mb-6 text-3xl font-bold text-foreground">
          <span className="mr-2">📊</span>
          Numbers So Far
        </h2>
        <NumbersGrid />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Events → multiple 1/1s, games, ShitDROPs, BuilderBattles
        </p>
      </div>

      <GetStarted />
      <CTASection />

      {/* Footer */}
      <div className="mt-12 border-t border-border pt-8 text-center">
        <p className="text-muted-foreground">
          Built with chaos and pixels
        </p>
        <p className="mt-4 text-lg font-bold text-[#00ff00]">
          gm everyone 🚀
        </p>
      </div>
    </div>
  );
}
