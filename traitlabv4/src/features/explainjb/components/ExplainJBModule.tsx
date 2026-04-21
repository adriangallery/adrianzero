/**
 * ExplainJBModule — link-only /explain-to-jb
 * Image-heavy, dev-to-dev walkthrough of the $ZERO ecosystem.
 */

import { IMAGES, getGitHubImageUrl } from '@/config/images';

// Live AdrianLAB render — shows real ZEROs on-demand
const LAB = (id: number) => `https://adrianlab.vercel.app/api/render/${id}`;

// Small tech-callout for deeper notes
function Geek({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 border-l-2 border-[#00ff00]/40 bg-[#00ff00]/5 p-3 font-mono text-xs text-foreground/70">
      <span className="font-bold text-[#00ff00]">note →</span> {children}
    </p>
  );
}

// Big round number highlight
function Big({ n, label }: { n: string; label: string }) {
  return (
    <div className="text-center">
      <div
        className="text-5xl font-black text-[#00ff00] md:text-6xl"
        style={{ fontFamily: 'JetBrains Mono, monospace', textShadow: '0 0 20px rgba(0,255,0,0.5)' }}
      >
        {n}
      </div>
      <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

// Chapter card — image one side, text the other
function Chapter({
  kicker,
  title,
  children,
  image,
  reverse = false,
  bg = 'from-[#00ff00]/10 to-transparent',
}: {
  kicker: string;
  title: string;
  image: React.ReactNode;
  children: React.ReactNode;
  reverse?: boolean;
  bg?: string;
}) {
  return (
    <section className={`mb-14 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${bg} p-6 md:p-10`}>
      <div className={`flex flex-col items-center gap-8 md:gap-12 ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
        <div className="w-full md:w-1/2">{image}</div>
        <div className="w-full md:w-1/2">
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-[#00ff00]">{kicker}</div>
          <h2 className="mb-4 text-3xl font-bold leading-tight md:text-4xl">{title}</h2>
          <div className="space-y-3 text-base leading-relaxed text-foreground/90 md:text-lg">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Gallery({ srcs }: { srcs: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:gap-3">
      {srcs.map((s, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
          <img src={s} alt="" className="h-full w-full object-cover transition-transform hover:scale-105" style={{ imageRendering: 'pixelated' }} />
        </div>
      ))}
    </div>
  );
}

export function ExplainJBModule() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      {/* HERO */}
      <div className="mb-14 text-center">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-[#00ff00]">for jb · the short version</p>
        <h1 className="mb-6 text-5xl font-black leading-none md:text-8xl">
          $ZERO,
          <br />
          <span className="bg-gradient-to-r from-[#00ff00] via-cyan-400 to-[#ff66cc] bg-clip-text text-transparent">in 6 minutes.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-foreground/80 md:text-xl">
          Deflationary NFT-native token on Base. Has its own floor engine, its own marketplace logic, its own keeper swarm. Shipped solo.
          Live on mainnet. Numbers below are read from the Diamond.
        </p>
        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
          <img src={IMAGES.BANNER} alt="ADRIAN ZERO" className="w-full" />
        </div>
      </div>

      {/* 1 — Collections */}
      <Chapter
        kicker="01 · the surface"
        title="Five NFT collections, one avatar engine."
        bg="from-cyan-500/10 to-transparent"
        image={
          <div className="grid grid-cols-2 gap-3">
            <img src={LAB(310)} alt="zero" className="w-full rounded-xl bg-black" style={{ imageRendering: 'pixelated' }} />
            <img src={IMAGES.SUBZERO} alt="subzero" className="w-full rounded-xl bg-black" />
            <img src={LAB(42)} alt="zero" className="w-full rounded-xl bg-black" style={{ imageRendering: 'pixelated' }} />
            <img src="/images/golden-shuriken.png" alt="samurai" className="w-full rounded-xl bg-black" style={{ imageRendering: 'pixelated' }} />
          </div>
        }
      >
        <p>
          <strong className="text-cyan-300">ZERO · SubZERO · GF · Samurais · Movies</strong>. All ERC-721, all share a live SVG renderer, all respond to trait changes without a re-mint.
        </p>
        <p>Composable identity at the NFT level — change the wardrobe, the NFT metadata updates next render.</p>
      </Chapter>

      {/* 2 — Lab */}
      <Chapter
        kicker="02 · the inventory"
        title="AdrianLAB is the trait engine."
        reverse
        bg="from-pink-500/10 to-transparent"
        image={
          <div className="space-y-3">
            <img src="/1174.gif" alt="floppy" className="mx-auto w-full max-w-sm rounded-2xl border-2 border-pink-400/40 bg-black" />
            <p className="text-center text-xs italic text-muted-foreground">a floppy — on-chain pack item, renders live</p>
          </div>
        }
      >
        <p>
          <strong className="text-pink-300">ERC-1155.</strong> Packs contain floppies, floppies contain traits. Apply to any compatible ZERO — the renderer stitches it on the fly (SVG composited to PNG on Vercel edge).
        </p>
        <p>1,100+ trait pieces in catalog. Serums, crafting, lambos, movies all share the same pipeline.</p>
      </Chapter>

      {/* 3 — The coin */}
      <Chapter
        kicker="03 · the token"
        title="$ZERO is an EIP-2535 Diamond."
        bg="from-[#00ff00]/10 to-transparent"
        image={
          <img
            src={IMAGES.ADRIAN_COIN}
            alt="$ZERO"
            className="mx-auto w-full max-w-xs rounded-full"
            style={{ filter: 'drop-shadow(0 0 30px rgba(0,255,0,0.4))' }}
          />
        }
      >
        <p>
          <strong className="text-[#00ff00]">100M hard cap. Zero team allocation. 10% bidirectional swap tax.</strong> 19 facets, 18 isolated storage slots, 271/271 tests green.
        </p>
        <p>The interesting part isn't the tax. It's where the tax goes.</p>
      </Chapter>

      {/* 4 — Tax split */}
      <section className="mb-14 overflow-hidden rounded-2xl border border-[#00ff00]/30 bg-gradient-to-br from-[#00ff00]/15 via-transparent to-yellow-500/10 p-6 md:p-10">
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-[#00ff00]">04 · the split</div>
        <h2 className="mb-3 text-3xl font-bold leading-tight md:text-4xl">Every swap, five destinations, no humans.</h2>
        <p className="mb-8 max-w-2xl text-foreground/80">10% of every buy or sell, routed automatically on-chain:</p>
        <div className="grid gap-4 md:grid-cols-5">
          {[
            { pct: '80%', what: 'FloorEngine', color: '#00ff00', emoji: '🤖' },
            { pct: '10%', what: 'burn', color: '#ff3355', emoji: '🔥' },
            { pct: '5%', what: 'staking', color: '#ffaa00', emoji: '⏳' },
            { pct: '3%', what: 'LP', color: '#00aaff', emoji: '💧' },
            { pct: '2%', what: 'treasury', color: '#aa88ff', emoji: '🏛️' },
          ].map((s) => (
            <div key={s.pct} className="rounded-xl border border-white/10 bg-black/40 p-5 text-center">
              <div className="mb-2 text-3xl">{s.emoji}</div>
              <div className="text-3xl font-black" style={{ color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>
                {s.pct}
              </div>
              <div className="mt-2 text-xs uppercase tracking-wider text-foreground/80">{s.what}</div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm italic text-muted-foreground">80% into an NFT buyer. That 80% is the whole thesis.</p>
      </section>

      {/* 5 — OFFER MODE (centerpiece) */}
      <section className="mb-14 overflow-hidden rounded-2xl border-2 border-[#00ff00]/50 bg-gradient-to-br from-black via-[#00ff00]/5 to-cyan-500/10 p-6 md:p-12">
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-[#00ff00]">05 · the centerpiece</div>
        <h2 className="mb-4 text-4xl font-black leading-tight md:text-5xl">Offer Mode.</h2>
        <p className="mb-8 max-w-3xl text-lg text-foreground/90">
          The naive floor engine buys at listing price and locks capital per collection. We don't do that. The keeper posts <strong>collection-wide WETH offers via Seaport</strong>,
          1 wei above current best bid — always below floor.
        </p>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
            <div className="mb-2 font-mono text-xs uppercase tracking-widest text-red-400">naive</div>
            <h3 className="mb-3 text-xl font-bold">Buy at floor, lock funds per collection.</h3>
            <p className="text-sm text-foreground/80">Capital dies in the pool. Floor drops? You overpaid. Want to bid on 7 collections? Multiply your inventory by 7.</p>
          </div>
          <div className="rounded-xl border border-[#00ff00]/40 bg-[#00ff00]/5 p-6">
            <div className="mb-2 font-mono text-xs uppercase tracking-widest text-[#00ff00]">ours</div>
            <h3 className="mb-3 text-xl font-bold">Shared WETH pool. One offer per collection, concurrent.</h3>
            <p className="text-sm text-foreground/80">
              Seaport doesn't escrow until fill. Same 0.0166 WETH sits as an open offer on <strong>all 7 collections at once</strong>. Whichever fills first wins; the rest are phantom offers that expire free in 10 days.
            </p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
          <Big n="111" label="NFTs acquired" />
          <Big n="27" label="live offers right now" />
          <Big n="7" label="collections, one pool" />
        </div>

        <Geek>
          OfferPoolFacet V2 (2026-04-15). <code>allocatedBalance</code> removed in favor of per-collection counters. Governance toggle <code>TOGGLE_OFFER_MODE</code> flips
          to direct floor sweep; Death Mode overrides to sweep always. Keeper signs EIP-712 off-chain, recordOfferFill updates stats on-chain.
        </Geek>
      </section>

      {/* 6 — Dual-list */}
      <Chapter
        kicker="06 · the flip"
        title="Every acquired NFT gets dual-listed."
        bg="from-orange-500/10 to-transparent"
        image={<Gallery srcs={[LAB(1), LAB(99), LAB(200), LAB(333)]} />}
      >
        <p>
          Once the keeper owns the NFT, it signs two listings simultaneously: <strong className="text-orange-300">OpenSea +10%</strong> and{' '}
          <strong className="text-orange-300">Diamond −20%</strong> (inverted discount, voter-only window).
        </p>
        <p>
          100% of the ETH from either sale routes to <strong>BuybackBurn</strong>. Not to sweepBalance, not to treasury. Straight to buyback and burn. The engine prints deflation.
        </p>
        <Geek>
          Keeper retains custody so it can sign Seaport orders. Diamond-side buyer pays via <code>buyFromEngineDual</code>; keeper then cancels OS listing and transfers. OS fee is 1% (not 2.5% anymore).
        </Geek>
      </Chapter>

      {/* 7 — Games */}
      <section className="mb-14 overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-transparent to-red-500/10 p-6 md:p-10">
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-yellow-400">07 · the content</div>
        <h2 className="mb-4 text-3xl font-bold md:text-4xl">Four games. Each burns $ZERO differently.</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
            <img src="/images/budokai-hero.gif" alt="" className="h-48 w-full object-cover" />
            <div className="p-4">
              <div className="font-bold text-yellow-400">Budokai</div>
              <p className="mt-1 text-sm text-foreground/80">PvP Samurai tournament. Budokai 1 live, 300k ZERO pool.</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
            <img src="/zero310-2.png" alt="" className="h-48 w-full object-contain bg-black" style={{ imageRendering: 'pixelated' }} />
            <div className="p-4">
              <div className="font-bold text-yellow-400">ZEROadventure</div>
              <p className="mt-1 text-sm text-foreground/80">Phaser 3 point-and-click, NFT-gated content.</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
            <img src="/zero310-4.png" alt="" className="h-48 w-full object-contain bg-black" style={{ imageRendering: 'pixelated' }} />
            <div className="p-4">
              <div className="font-bold text-yellow-400">Zombie Shooter</div>
              <p className="mt-1 text-sm text-foreground/80">Arcade shooter. Entry in $ZERO, prize in $ZERO.</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
            <img src="/images/zeromovies/1.png" alt="" className="h-48 w-full object-contain bg-black" style={{ imageRendering: 'pixelated' }} />
            <div className="p-4">
              <div className="font-bold text-yellow-400">ZEROmovies</div>
              <p className="mt-1 text-sm text-foreground/80">Animated shorts, $ZERO-gated mint via Diamond facet.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8 — Bots */}
      <Chapter
        kicker="08 · the crew"
        title="Eight keeper bots, all on Railway."
        reverse
        bg="from-yellow-500/10 to-transparent"
        image={
          <div className="rounded-2xl border border-yellow-400/30 bg-black/60 p-6">
            <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-yellow-300">{`$ bots.status()
────────────────────────────
  zero-keeper    orchestrator
  zero-hub       event indexer
  sweepbot       floor sweeps
  offerbot       trait offers
  dipladder      USDC/WETH V3
  nftbot         cross-market
  arbitrage-bot  $ADRIAN pools
  volumearmy     dev/testnet
────────────────────────────
  all healthy
`}</pre>
          </div>
        }
      >
        <p>
          <strong className="text-yellow-300">zero-keeper</strong> is the main orchestrator — sweeps, offers, dual-listings, rotation, death-mode overrides.
        </p>
        <p>
          <strong className="text-yellow-300">zero-hub</strong> indexes 150+ Diamond events in real time, exposes REST + WebSocket. Everything else is a single-purpose worker.
        </p>
      </Chapter>

      {/* 9 — Loop */}
      <section className="mb-14 rounded-2xl border border-[#00ff00]/30 bg-gradient-to-br from-black to-[#00ff00]/10 p-6 md:p-10">
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-[#00ff00]">09 · the loop</div>
        <h2 className="mb-8 text-3xl font-bold md:text-4xl">It all cycles.</h2>
        <div className="grid gap-4 md:grid-cols-5">
          {[
            { t: 'swap volume', e: '💱' },
            { t: 'tax → FloorEngine', e: '🏦' },
            { t: 'keeper bids', e: '🤖' },
            { t: 'NFTs dual-listed', e: '🔄' },
            { t: 'ETH → burn', e: '🔥' },
          ].map((x, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-black/40 p-5 text-center">
              <div className="mb-2 text-4xl">{x.e}</div>
              <div className="mb-1 font-mono text-xs text-[#00ff00]">step {i + 1}</div>
              <div className="text-sm font-bold">{x.t}</div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center italic text-foreground/80">
          Every pass through the loop burns. Supply is hard-capped, so the only direction is down.
        </p>
      </section>

      {/* 10 — Numbers */}
      <section className="mb-14 rounded-2xl border border-white/10 bg-black/50 p-6 md:p-10">
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">10 · current state</div>
        <h2 className="mb-6 text-3xl font-bold md:text-4xl">Read from the Diamond.</h2>
        <div className="grid gap-6 md:grid-cols-4">
          <Big n="94.94M" label="supply (of 100M)" />
          <Big n="820K" label="ZERO burned" />
          <Big n="111" label="NFTs swept" />
          <Big n="18mo" label="since day one" />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">Snapshot 2026-04-21 · Diamond 0x542b2B96…0A0 · Base mainnet.</p>
      </section>

      {/* 11 — Legacy */}
      <Chapter
        kicker="before this"
        title="AdrianPunks was v1."
        bg="from-gray-500/10 to-transparent"
        image={
          <img
            src="/images/adrianpunk-661.png"
            alt="AdrianPunks #661"
            className="mx-auto w-full max-w-sm rounded-2xl border-2 border-white/20 bg-[#2b2b2b]"
            style={{ imageRendering: 'pixelated' }}
          />
        }
      >
        <p>
          1,000-piece OG collection, own token ($ADRIAN), own marketplace, own auctions. Pre-Diamond era but still a supported collection in FloorEngine.
        </p>
        <p>
          $ZERO inherited the art language and community. $ADRIAN holders can bridge 1:~0.0774 via WrapperFacet.
        </p>
      </Chapter>

      {/* 12 — Team */}
      <section className="mb-14 rounded-2xl border border-[#00ff00]/30 bg-gradient-to-br from-[#ff66cc]/10 via-transparent to-[#00ff00]/10 p-6 md:p-12 text-center">
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-[#00ff00]">the team</div>
        <h2 className="mb-8 text-3xl font-bold md:text-4xl">Two people. That's it.</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-[#00ff00]/40 bg-black">
              <img src={LAB(0)} alt="adrian" className="h-full w-full object-cover" style={{ imageRendering: 'pixelated' }} />
            </div>
            <div className="text-xl font-bold text-[#00ff00]">@adriancerda</div>
            <p className="mt-1 text-sm text-foreground/80">Contracts, bots, frontends. Solo.</p>
          </div>
          <div>
            <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-[#ff66cc]/40 bg-black">
              <img src="/images/golden-shuriken.png" alt="tiger" className="h-full w-full object-contain" style={{ imageRendering: 'pixelated' }} />
            </div>
            <div className="text-xl font-bold text-[#ff66cc]">@HalfxTiger</div>
            <p className="mt-1 text-sm text-foreground/80">Every pixel. Every animation. Every drop.</p>
          </div>
        </div>
      </section>

      {/* Links */}
      <section className="mb-10">
        <div className="grid gap-3 md:grid-cols-3">
          <a
            href="https://adrianzero.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-[#00ff00]/30 bg-black/40 p-5 text-center transition-all hover:-translate-y-1 hover:border-[#00ff00] hover:bg-[#00ff00]/5"
          >
            <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">dapp</div>
            <div className="font-mono text-[#00ff00]">adrianzero.com</div>
          </a>
          <a
            href="https://zerothetoken.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-[#00ff00]/30 bg-black/40 p-5 text-center transition-all hover:-translate-y-1 hover:border-[#00ff00] hover:bg-[#00ff00]/5"
          >
            <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">token</div>
            <div className="font-mono text-[#00ff00]">zerothetoken.com</div>
          </a>
          <a
            href="https://adrianpunks.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-[#00ff00]/30 bg-black/40 p-5 text-center transition-all hover:-translate-y-1 hover:border-[#00ff00] hover:bg-[#00ff00]/5"
          >
            <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">v1</div>
            <div className="font-mono text-[#00ff00]">adrianpunks.com</div>
          </a>
        </div>
      </section>

      <div className="border-t border-[#00ff00]/20 pt-6 text-center">
        <p className="font-mono text-sm text-[#00ff00]">gm jb 🟢</p>
      </div>
    </div>
  );
}

// avoid unused warning
void getGitHubImageUrl;
