/**
 * HowItConnects Section
 */

import { Section } from '../Section';

export function HowItConnects() {
  return (
    <Section id="section-connects" title="The Loop" emoji="🔗">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border-2 border-[#00ff00]/30 bg-[#00ff00]/5 p-6 text-center">
          <div className="mb-2 text-4xl">💰</div>
          <p className="font-bold text-[#00ff00]">$ADRIAN</p>
          <p className="mt-2 text-xs text-mute">Powers everything</p>
        </div>

        <div className="rounded-lg border-2 border-acc/30 bg-acc/5 p-6 text-center">
          <div className="mb-2 text-4xl">👾</div>
          <p className="font-bold text-acc">Punks</p>
          <p className="mt-2 text-xs text-mute">OG backbone</p>
        </div>

        <div className="rounded-lg border-2 border-purple-500/30 bg-purple-500/5 p-6 text-center">
          <div className="mb-2 text-4xl">🧑</div>
          <p className="font-bold text-purple-400">ZERO</p>
          <p className="mt-2 text-xs text-mute">Dynamic avatars</p>
        </div>

        <div className="rounded-lg border-2 border-pink-500/30 bg-pink-500/5 p-6 text-center">
          <div className="mb-2 text-4xl">🧪</div>
          <p className="font-bold text-pink-400">LAB</p>
          <p className="mt-2 text-xs text-mute">Trait engine</p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-line bg-panel p-6 text-center">
        <p className="text-lg text-mute">
          Closed-loop ecosystem: tokens burn, NFTs evolve, traits circulate 🔄
        </p>
      </div>
    </Section>
  );
}
