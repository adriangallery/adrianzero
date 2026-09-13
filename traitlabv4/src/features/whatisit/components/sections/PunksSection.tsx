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
          <div className="text-4xl font-bold text-acc">1,000</div>
          <p className="text-mute">Pixel PFPs</p>
        </div>

        {/* Key Perks */}
        <div className="space-y-3 md:col-span-2">
          <h3 className="text-xl font-bold text-acc">OG Benefits</h3>
          <div className="space-y-2">
            <div className="rounded-lg bg-ok/10 p-4">
              <span className="text-lg">🎁</span>
              <span className="ml-2 text-fg">Free trait claims</span>
            </div>
            <div className="rounded-lg bg-acc/10 p-4">
              <span className="text-lg">🃏</span>
              <span className="ml-2 text-fg">TraitCARDs (Punk as trait)</span>
            </div>
            <div className="rounded-lg bg-pink-500/10 p-4">
              <span className="text-lg">🔄</span>
              <span className="ml-2 text-fg">PunkSwap access</span>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <a
              href="https://adrianpunks.com/swap/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg bg-acc px-4 py-2 text-center font-bold text-acc-fg hover:opacity-90"
            >
              Buy Punks →
            </a>
            <a
              href="https://opensea.io/collection/adrianpunks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg border border-line bg-panel px-4 py-2 text-center font-bold hover:border-acc"
            >
              OpenSea →
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
