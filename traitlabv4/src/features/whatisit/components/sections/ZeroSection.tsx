/**
 * ZeroSection - AdrianZERO Information
 */

import { Section } from '../Section';

export function ZeroSection() {
  return (
    <Section id="section-zero" title="AdrianZERO" emoji="🧬">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Left: Main Info */}
        <div className="space-y-6">
          <div className="rounded-lg border-2 border-purple-500/30 bg-purple-500/5 p-6 text-center">
            <div className="mb-2 text-5xl">🧑</div>
            <p className="text-xl font-bold text-purple-400">Dynamic Avatars</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Evolve & customize your NFT
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/onboarding"
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-center font-bold text-primary-foreground hover:bg-primary/90"
            >
              Mint →
            </a>
            <a
              href="https://opensea.io/collection/adrianzero"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-center font-bold hover:border-primary"
            >
              OpenSea →
            </a>
          </div>
        </div>

        {/* Right: Features */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-cyan-400">Customize</h3>
          <div className="space-y-2">
            <div className="rounded-lg bg-muted/30 p-3">
              <span className="text-lg">👕</span>
              <span className="ml-2 text-sm">Change outfits & accessories</span>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <span className="text-lg">💖</span>
              <span className="ml-2 text-sm">Transform to AdrianGF</span>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <span className="text-lg">✨</span>
              <span className="ml-2 text-sm">Gold skins & effects</span>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <span className="text-lg">🔍</span>
              <span className="ml-2 text-sm">Zoom-in mode</span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
