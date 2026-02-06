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
            <p className="mt-2 text-sm text-muted-foreground">
              Trait system powering evolution
            </p>
          </div>

          <div className="space-y-2">
            <div className="rounded-lg bg-muted/30 p-4 text-center">
              <div className="text-3xl font-bold text-cyan-400">1,000+</div>
              <p className="text-sm text-muted-foreground">Traits Created</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-4 text-center">
              <div className="text-3xl font-bold text-pink-400">10+</div>
              <p className="text-sm text-muted-foreground">Product Lines</p>
            </div>
          </div>
        </div>

        {/* Right: Features */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-cyan-400">What's Inside</h3>

          <div className="space-y-2">
            <div className="rounded-lg bg-muted/30 p-3">
              <span className="text-lg">📦</span>
              <span className="ml-2 text-sm font-bold">Floppys & Packs</span>
              <p className="ml-8 text-xs text-muted-foreground">Open to get traits</p>
            </div>

            <div className="rounded-lg bg-muted/30 p-3">
              <span className="text-lg">🎨</span>
              <span className="ml-2 text-sm font-bold">TraitLAB</span>
              <p className="ml-8 text-xs text-muted-foreground">Apply & burn traits</p>
            </div>

            <div className="rounded-lg bg-muted/30 p-3">
              <span className="text-lg">💩</span>
              <span className="ml-2 text-sm font-bold">ShitDROPs</span>
              <p className="ml-8 text-xs text-muted-foreground">24h free mints</p>
            </div>

            <div className="rounded-lg bg-muted/30 p-3">
              <span className="text-lg">🎮</span>
              <span className="ml-2 text-sm font-bold">Games & Bounties</span>
              <p className="ml-8 text-xs text-muted-foreground">BuilderBattles & more</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <a
              href="/"
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-center text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Try LAB →
            </a>
            <a
              href="https://opensea.io/collection/adrianlab"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg border border-border bg-card px-4 py-2 text-center text-sm font-bold hover:border-primary"
            >
              OpenSea →
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
