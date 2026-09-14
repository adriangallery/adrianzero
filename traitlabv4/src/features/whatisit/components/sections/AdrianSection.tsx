/**
 * AdrianSection - $ADRIAN Token Information
 */

import { Section } from '../Section';
import { IMAGES } from '@/config/images';

export function AdrianSection() {
  return (
    <Section id="section-adrian" title="$ADRIAN" emoji="💸">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Left: Image & Key Info */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <img
              src={IMAGES.ADRIAN_COIN}
              alt="$ADRIAN Token"
              className="h-48 w-48"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="rounded-lg border border-acc/30 bg-acc/5 p-6 text-center">
            <p className="mb-2 text-sm text-mute">ERC-20 on Base</p>
            <p className="text-lg font-bold text-[#00ff00]">Powers Everything</p>
          </div>
        </div>

        {/* Right: Use Cases */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-acc">Use Cases</h3>
          <div className="space-y-3">
            <div className="rounded-lg bg-line/30 p-4">
              <span className="text-lg">🎨</span>
              <span className="ml-2 text-fg">Mint NFTs & Traits</span>
            </div>
            <div className="rounded-lg bg-line/30 p-4">
              <span className="text-lg">🛒</span>
              <span className="ml-2 text-fg">Buy from TraitSHOP</span>
            </div>
            <div className="rounded-lg bg-line/30 p-4">
              <span className="text-lg">💰</span>
              <span className="ml-2 text-fg">Marketplace & Auctions</span>
            </div>
            <div className="rounded-lg bg-line/30 p-4">
              <span className="text-lg">🎁</span>
              <span className="ml-2 text-fg">Rewards & Airdrops</span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
