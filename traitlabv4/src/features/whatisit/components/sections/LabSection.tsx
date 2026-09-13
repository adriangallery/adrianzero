/**
 * LabSection - AdrianLAB Information
 */

import { Section } from '../Section';

export function LabSection() {
  return (
    <Section id="section-lab" title="AdrianLAB" emoji="🧪">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Left: What it is */}
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-pink-500/30 bg-pink-500/5 p-6 text-center">
            <div className="mb-2 text-5xl">🧪</div>
            <p className="text-xl font-bold text-pink-400">The Engine</p>
            <p className="mt-2 text-sm text-mute">
              Trait system powering evolution
            </p>
          </div>

          <div className="space-y-2">
            <div className="rounded-lg bg-line/30 p-4 text-center">
              <div className="text-3xl font-bold text-acc">1,100+</div>
              <p className="text-sm text-mute">Traits Created</p>
            </div>
            <div className="rounded-lg bg-line/30 p-4 text-center">
              <div className="text-3xl font-bold text-pink-400">7</div>
              <p className="text-sm text-mute">Product Lines</p>
            </div>
          </div>
        </div>

        {/* Right: Features */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-acc">What's Inside</h3>

          <div className="space-y-2">
            <div className="rounded-lg bg-line/30 p-3">
              <span className="text-lg">📦</span>
              <span className="ml-2 text-sm font-bold">Floppys & Packs</span>
              <p className="ml-8 text-xs text-mute">Open to get traits</p>
            </div>

            <div className="rounded-lg bg-line/30 p-3">
              <span className="text-lg">🎨</span>
              <span className="ml-2 text-sm font-bold">TraitLAB</span>
              <p className="ml-8 text-xs text-mute">Apply & burn traits</p>
            </div>

            <div className="rounded-lg bg-line/30 p-3">
              <span className="text-lg">💩</span>
              <span className="ml-2 text-sm font-bold">ShitDROPs</span>
              <p className="ml-8 text-xs text-mute">24h free mints</p>
            </div>

            <div className="rounded-lg bg-line/30 p-3">
              <span className="text-lg">🎮</span>
              <span className="ml-2 text-sm font-bold">Games & Bounties</span>
              <p className="ml-8 text-xs text-mute">BuilderBattles & more</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <a
              href="/mynfts"
              className="flex-1 rounded-lg bg-acc px-4 py-2 text-center text-sm font-bold text-acc-fg hover:opacity-90"
            >
              Try LAB →
            </a>
            <a
              href="https://opensea.io/collection/adrianlab"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg border border-line bg-panel px-4 py-2 text-center text-sm font-bold hover:border-acc"
            >
              OpenSea →
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
