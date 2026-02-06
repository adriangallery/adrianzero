/**
 * WhatIsItHero Component
 * Hero section with banner, title, and days counter
 */

import { DaysBuilding } from './DaysBuilding';

export function WhatIsItHero() {
  return (
    <div className="mb-12 text-center">
      {/* Banner Image */}
      <div className="mb-8 -mx-4">
        <img
          src="https://adrianzero.com/components/images/ADRIAN_ZERO_Banner.gif"
          alt="ADRIAN ZERO Banner"
          className="w-full rounded-lg"
        />
      </div>

      {/* Title with gradient glow */}
      <h1 className="mb-4 text-6xl font-bold">
        <span className="bg-gradient-to-r from-cyan-500 via-green-500 to-cyan-500 bg-clip-text text-transparent animate-pulse">
          What is $ADRIAN?
        </span>
      </h1>

      {/* Subtitle */}
      <p className="mb-4 text-xl text-muted-foreground">
        A living, evolving NFT ecosystem built on Base
      </p>

      {/* Days Counter */}
      <DaysBuilding />

      {/* Artist Credit */}
      <p className="mt-6 text-sm text-muted-foreground italic">
        Art by HalfXTiger
      </p>
    </div>
  );
}
