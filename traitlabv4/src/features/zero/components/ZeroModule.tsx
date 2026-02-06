import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { ArrowRight, Menu, ShieldCheck, Sparkles, Wallet, X, Zap } from 'lucide-react';
import { getGitHubImageUrl } from '@/config/images';
import {
  SHOWCASE_GITHUB_PATH,
  SHOWCASE_GITHUB_RAW_BASE,
  SHOWCASE_GITHUB_REF,
  SHOWCASE_GITHUB_REPO,
  SHOWCASE_NFTS,
} from '../data/showcase-nfts';
import { STATS_DATA, UTILITY_CARDS } from '../data/sample-traits';
import type { ShowcaseNFT } from '../types/zero.types';

interface GitHubFile {
  name: string;
  type: string;
}

const traitEvolutionFrames = [
  '/zero310-0.png',
  '/zero310-1.png',
  '/zero310-2.png',
  '/zero310-3.png',
  '/zero310-4.png',
];

const zeroNavLinks = [
  { to: '/zero', label: 'ZERO Home' },
  { to: '/mint', label: 'Mint' },
  { to: '/adrianzero', label: 'My NFTs' },
  { to: '/traits', label: 'Traits' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/whatisit', label: 'About' },
];

function FloatingWalletButton() {
  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                type="button"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 bg-[#0d1b35]/85 px-4 text-sm font-bold uppercase tracking-[0.12em] text-[#dcf7ff] shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur"
              >
                <Wallet className="h-4 w-4" />
                Connect
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                type="button"
                className="inline-flex h-12 items-center rounded-xl border border-red-300/60 bg-red-500/20 px-4 text-sm font-bold uppercase tracking-[0.12em] text-red-100"
              >
                Wrong Network
              </button>
            ) : (
              <button
                onClick={openAccountModal}
                type="button"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 bg-[#0d1b35]/85 px-4 text-sm font-bold uppercase tracking-[0.1em] text-[#dcf7ff] shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur"
              >
                {chain.hasIcon && chain.iconUrl ? (
                  <img
                    src={chain.iconUrl}
                    alt={chain.name ?? 'Network'}
                    className="h-5 w-5 rounded-full"
                  />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                <span className="max-w-[120px] truncate sm:max-w-[170px]">{account.displayName}</span>
              </button>
            )}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}

export const ZeroModule: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFrame, setActiveFrame] = useState(0);
  const [useFallbackFrame, setUseFallbackFrame] = useState(false);
  const [isFrameAutoPlaying, setIsFrameAutoPlaying] = useState(true);
  const [showcaseNfts, setShowcaseNfts] = useState<ShowcaseNFT[]>(SHOWCASE_NFTS);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!isFrameAutoPlaying) return;
    if (activeFrame >= traitEvolutionFrames.length - 1) {
      setIsFrameAutoPlaying(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setActiveFrame((prev) => Math.min(prev + 1, traitEvolutionFrames.length - 1));
    }, 1300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [activeFrame, isFrameAutoPlaying]);

  useEffect(() => {
    const controller = new AbortController();

    const loadGitHubShowcase = async () => {
      try {
        const apiUrl = `https://api.github.com/repos/${SHOWCASE_GITHUB_REPO}/contents/${SHOWCASE_GITHUB_PATH}?ref=${SHOWCASE_GITHUB_REF}`;
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: { Accept: 'application/vnd.github.v3+json' },
        });

        if (!response.ok) return;

        const files: GitHubFile[] = await response.json();
        const pngFiles = files.filter((file) => file.type === 'file' && file.name.endsWith('.png'));

        if (pngFiles.length === 0) return;

        const shuffled = [...pngFiles];
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const selected = shuffled.slice(0, 30).map((file, index) => {
          const tokenCandidate = file.name.split('_')[0];
          const tokenId = /^\d+$/.test(tokenCandidate) ? tokenCandidate : `${index + 1}`;
          return {
            tokenId,
            imageUrl: `${SHOWCASE_GITHUB_RAW_BASE}/${file.name}`,
          };
        });

        if (selected.length > 0) {
          setShowcaseNfts(selected);
        }
      } catch {
        // Keep fallback list when GitHub API is unavailable
      }
    };

    void loadGitHubShowcase();

    return () => controller.abort();
  }, []);

  const marqueeRows = useMemo(() => {
    const source = showcaseNfts.length > 0 ? showcaseNfts : SHOWCASE_NFTS;
    const expanded = [...source, ...source, ...source];
    return [expanded.slice(0, 12), expanded.slice(12, 24), expanded.slice(24, 36)];
  }, [showcaseNfts]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06080d] text-white">
      <div className="fixed left-4 right-4 top-4 z-[60] flex items-center justify-between sm:left-6 sm:right-6 lg:left-8 lg:right-8">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 bg-[#0d1b35]/85 px-4 text-sm font-bold uppercase tracking-[0.12em] text-[#dcf7ff] shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur transition-colors hover:bg-[#14264a]"
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          Menu
        </button>

        <FloatingWalletButton />
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-50 bg-black/55"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation menu"
            />

            <motion.nav
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="fixed left-4 right-4 top-20 z-[70] overflow-hidden rounded-2xl border border-white/20 bg-[#0a1124]/95 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur sm:left-6 sm:right-auto sm:w-[340px]"
            >
              <div className="mb-2 px-2 pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#95b8ff]">
                Navigation
              </div>
              <div className="grid grid-cols-1 gap-2">
                {zeroNavLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-[#def4ff] transition-colors hover:bg-white/10"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-16 h-72 w-72 rounded-full bg-[#00d2ff]/25 blur-3xl" />
        <div className="absolute right-[-140px] top-48 h-[24rem] w-[24rem] rounded-full bg-[#ff8a3d]/20 blur-3xl" />
        <div className="absolute bottom-[-140px] left-1/3 h-[30rem] w-[30rem] rounded-full bg-[#22c55e]/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)',
            backgroundSize: '26px 26px',
          }}
        />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#c6fff2] backdrop-blur"
            >
              <Sparkles className="h-4 w-4" />
              Future Landing Experience
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-balance text-5xl font-black leading-[0.92] sm:text-6xl md:text-7xl lg:text-8xl"
            >
              ZERO IS
              <br />
              <span className="bg-gradient-to-r from-[#00d2ff] via-[#55f7b7] to-[#ffb258] bg-clip-text text-transparent">
                PURE VISUAL ENERGY
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-6 max-w-2xl text-pretty text-base text-[#d8e2ff]/90 sm:text-lg md:text-xl"
            >
              A next-gen showcase page for AdrianZERO: bold identity, dynamic composition, and a collector-first experience designed to feel premium on every screen.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link
                to="/mint"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00d2ff] via-[#55f7b7] to-[#ffb258] px-6 py-3 text-sm font-extrabold uppercase tracking-[0.14em] text-[#03101d] transition-transform hover:scale-[1.03]"
              >
                Mint Your ZERO
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/gallery"
                className="inline-flex items-center rounded-xl border border-white/30 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                Explore Gallery
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="mt-10 grid max-w-2xl grid-cols-1 gap-3 text-sm text-[#d8e2ff]/85 sm:grid-cols-3"
            >
              <div className="rounded-lg border border-white/15 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[#9dc8ff]">Identity</p>
                <p className="mt-1 font-semibold">Distinct collectible expression</p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[#9dc8ff]">Utility</p>
                <p className="mt-1 font-semibold">Connected to TraitLAB ecosystem</p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[#9dc8ff]">Culture</p>
                <p className="mt-1 font-semibold">Built for community participation</p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.88, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 14, delay: 0.2 }}
            className="relative mx-auto w-full max-w-[430px]"
          >
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-[#00d2ff]/45 via-[#55f7b7]/35 to-[#ff8a3d]/40 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/30 bg-[#0a1020]/85 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-[#9dc8ff]">
                <span>Trait Evolution</span>
                <span>ZERO #310</span>
              </div>
              <div className="relative">
                <img
                  src={useFallbackFrame ? getGitHubImageUrl('zeronaked.png') : traitEvolutionFrames[activeFrame]}
                  alt="ZERO #310 trait progression"
                  className="aspect-square w-full rounded-2xl object-cover"
                  onError={() => setUseFallbackFrame(true)}
                />

                <div className="absolute inset-x-3 bottom-3 flex gap-1 rounded-lg bg-black/35 p-2 backdrop-blur">
                  {traitEvolutionFrames.map((_, idx) => (
                    <button
                      key={`frame-step-${idx}`}
                      type="button"
                      aria-label={`Go to transformation ${idx + 1}`}
                      onClick={() => {
                        setActiveFrame(idx);
                        setIsFrameAutoPlaying(false);
                      }}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        idx <= activeFrame ? 'bg-[#7ef7c7]' : 'bg-white/25 hover:bg-white/45'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-20">
        <div className="mx-auto mb-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black uppercase tracking-[0.08em] sm:text-4xl md:text-5xl">
            Living Visual Gallery
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-[#d6dfff]/90 sm:text-base">
            A cinematic stream of collector identities. Each ZERO carries a different composition, mood, and rarity profile.
          </p>
        </div>

        <div className="space-y-4 overflow-hidden">
          {marqueeRows.map((row, rowIndex) => {
            const direction = rowIndex % 2 === 0 ? ['0%', '-50%'] : ['-50%', '0%'];

            return (
              <motion.div
                key={`row-${rowIndex}`}
                className="flex gap-4"
                animate={{ x: direction }}
                transition={{
                  duration: 34 - rowIndex * 4,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                {[...row, ...row].map((nft, index) => (
                  <div
                    key={`${nft.tokenId}-${index}`}
                    className="group relative w-[140px] shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-[#0e1730]/80 p-2 sm:w-[170px] md:w-[190px]"
                  >
                    <img
                      src={nft.imageUrl}
                      alt={`ZERO #${nft.tokenId}`}
                      loading="lazy"
                      className="aspect-square w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-[#c8d8ff] sm:text-xs">
                      <span>ZERO</span>
                      <span>#{nft.tokenId}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between gap-6">
          <h2 className="text-3xl font-black uppercase tracking-[0.08em] sm:text-4xl md:text-5xl">
            More Than A PFP
          </h2>
          <span className="hidden rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#c6fff2] md:inline-block">
            Ecosystem Utility
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {UTILITY_CARDS.map((card, index) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/[0.03] p-5 backdrop-blur"
            >
              <p className="mb-4 text-2xl">{card.icon}</p>
              <h3 className="text-lg font-extrabold text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#d8e2ff]/85">{card.description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {STATS_DATA.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.07 }}
              className="rounded-xl border border-white/20 bg-[#0d1a33]/65 p-4 text-center"
            >
              <p className="text-2xl font-black text-[#7ef7c7] sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#bdd0ff] sm:text-sm">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative border-t border-white/10 bg-gradient-to-r from-[#071227] via-[#0f1633] to-[#1f1a2f]">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-7 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#bfffe5]">
              <ShieldCheck className="h-4 w-4" />
              Built For The Next Era
            </p>
            <h3 className="text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
              Step Into The ZERO Timeline.
            </h3>
            <p className="mt-3 text-sm text-[#d8e2ff]/85 sm:text-base">
              Start minting, customize your identity, and make your signature visible across the AdrianZERO ecosystem.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              to="/mint"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7ef7c7] px-6 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#03101d]"
            >
              <Zap className="h-4 w-4" />
              Start Minting
            </Link>
            <Link
              to="/traits"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white"
            >
              Open TraitLAB
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
