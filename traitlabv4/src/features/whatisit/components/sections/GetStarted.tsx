/**
 * GetStarted Section
 */

import { Section } from '../Section';

export function GetStarted() {
  return (
    <Section id="section-start" title="Get Started" emoji="🚀">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Step 1 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 text-center text-4xl">1️⃣</div>
          <h3 className="mb-3 text-center font-bold text-cyan-400">Get $ADRIAN</h3>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Buy $ADRIAN tokens
          </p>
          <a
            href="https://adrianpunks.com/swap/"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg bg-primary px-4 py-2 text-center text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            Buy $ADRIAN →
          </a>
        </div>

        {/* Step 2 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 text-center text-4xl">2️⃣</div>
          <h3 className="mb-3 text-center font-bold text-cyan-400">Mint ZERO</h3>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Get your avatar (free or premium)
          </p>
          <a
            href="/onboarding"
            className="block rounded-lg bg-primary px-4 py-2 text-center text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            Mint →
          </a>
        </div>

        {/* Step 3 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 text-center text-4xl">3️⃣</div>
          <h3 className="mb-3 text-center font-bold text-cyan-400">Use TraitLAB</h3>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Open packs & apply traits
          </p>
          <a
            href="/mynfts"
            className="block rounded-lg bg-primary px-4 py-2 text-center text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            LAB →
          </a>
        </div>

        {/* Step 4 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 text-center text-4xl">4️⃣</div>
          <h3 className="mb-3 text-center font-bold text-cyan-400">Join Community</h3>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Discord & Twitter/X
          </p>
          <a
            href="https://discord.gg/adrianzero"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg bg-primary px-4 py-2 text-center text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            Discord →
          </a>
        </div>
      </div>

      <div className="mt-8 rounded-lg border-2 border-[#00ff00]/30 bg-[#00ff00]/5 p-6 text-center">
        <p className="text-xl font-bold text-[#00ff00]">
          Welcome to the machine 🤖
        </p>
      </div>
    </Section>
  );
}
