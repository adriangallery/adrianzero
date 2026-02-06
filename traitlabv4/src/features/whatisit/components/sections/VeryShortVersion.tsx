/**
 * VeryShortVersion Section
 */

import { Section } from '../Section';

export function VeryShortVersion() {
  return (
    <Section id="section-short" title="TL;DR" emoji="⚡">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 text-lg">
          <p>
            <strong className="text-[#00ff00]">$ADRIAN</strong> powers everything
          </p>
          <p>
            <strong className="text-cyan-400">AdrianPunks</strong> = OG collection
          </p>
          <p>
            <strong className="text-purple-400">AdrianZERO</strong> = dynamic avatars
          </p>
          <p>
            <strong className="text-pink-400">AdrianLAB</strong> = trait system
          </p>
        </div>

        <div className="flex items-center justify-center rounded-lg border-2 border-[#00ff00]/30 bg-[#00ff00]/5 p-8">
          <p className="text-center text-lg text-muted-foreground">
            Mint NFTs, collect traits, customize avatars, build your story 🌱
          </p>
        </div>
      </div>
    </Section>
  );
}
