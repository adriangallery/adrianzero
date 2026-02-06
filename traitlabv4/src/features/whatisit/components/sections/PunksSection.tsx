/**
 * PunksSection - AdrianPunks Information
 */

import { Section } from '../Section';

export function PunksSection() {
  return (
    <Section id="section-punks" title="AdrianPunks" emoji="👾">
      <div className="grid gap-8 md:grid-cols-3">
        {/* Supply Info */}
        <div className="text-center">
          <div className="mb-4 text-6xl">👾</div>
          <div className="text-4xl font-bold text-cyan-400">1,000</div>
          <p className="text-muted-foreground">Pixel PFPs</p>
        </div>

        {/* Key Perks */}
        <div className="space-y-3 md:col-span-2">
          <h3 className="text-xl font-bold text-cyan-400">OG Benefits</h3>
          <div className="space-y-2">
            <div className="rounded-lg bg-green-500/10 p-4">
              <span className="text-lg">🎁</span>
              <span className="ml-2 text-foreground">Free trait claims</span>
            </div>
            <div className="rounded-lg bg-cyan-500/10 p-4">
              <span className="text-lg">🃏</span>
              <span className="ml-2 text-foreground">TraitCARDs (Punk as trait)</span>
            </div>
            <div className="rounded-lg bg-pink-500/10 p-4">
              <span className="text-lg">🔄</span>
              <span className="ml-2 text-foreground">PunkSwap access</span>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <a
              href="https://adrianpunks.com/swap/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-center font-bold text-primary-foreground hover:bg-primary/90"
            >
              Buy Punks →
            </a>
            <a
              href="https://opensea.io/collection/adrianpunks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg border border-border bg-card px-4 py-2 text-center font-bold hover:border-primary"
            >
              OpenSea →
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
