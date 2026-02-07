import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ArrowRight, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { getGitHubImageUrl } from '@/config/images';
import { useHasAdrianZero } from '@/features/onboarding/hooks/useHasAdrianZero';
import { vercelImageService } from '@/lib/api/vercel/imageService';
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

const LIME = '#00ff00';
const DEMO_TOKEN_ID = '146';
const DEMO_TRAIT_IDS = ['444', '700', '83', '7', '1007', '754', '852', '33', '420', '456', '460', '550'];

interface DemoTrait {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
}

interface DemoTraitCategory {
  name: string;
  traits: DemoTrait[];
}

function TraitLabPreviewSection() {
  const { isConnected } = useAccount();
  const { hasAdrianZero } = useHasAdrianZero();
  const [categories, setCategories] = useState<DemoTraitCategory[]>([]);
  const [activeCategoryName, setActiveCategoryName] = useState('');
  const [activeTraitByCategory, setActiveTraitByCategory] = useState<Record<string, number>>({});
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const shouldShowPreview = !isConnected || !hasAdrianZero;

  useEffect(() => {
    const loadDemoTraits = async () => {
      try {
        const response = await fetch('/data/traits.json');
        const payload = await response.json();
        const traits = Array.isArray(payload?.traits) ? payload.traits : [];

        const selectedTraits = DEMO_TRAIT_IDS.map((id) => {
          const trait = traits.find((item: { tokenId: number | string }) => item.tokenId.toString() === id);
          if (!trait) return null;

          return {
            id,
            name: trait.name,
            category: String(trait.category || 'other'),
            imageUrl: `https://raw.githubusercontent.com/adriangallery/adrianzero/main/traitlabv3/assets/traits/${id}.svg`,
          } as DemoTrait;
        }).filter((trait): trait is DemoTrait => trait !== null);

        const grouped = selectedTraits.reduce((acc, trait) => {
          const key = trait.category.toUpperCase();
          const existing = acc.find((entry) => entry.name === key);
          if (existing) {
            existing.traits.push(trait);
          } else {
            acc.push({ name: key, traits: [trait] });
          }
          return acc;
        }, [] as DemoTraitCategory[]);

        setCategories(grouped);
        if (grouped.length > 0) {
          setActiveCategoryName(grouped[0].name);
        }
      } catch {
        setCategories([]);
      }
    };

    void loadDemoTraits();
  }, []);

  const currentCategory = categories.find((item) => item.name === activeCategoryName) || categories[0] || null;
  const selectedTraitIndex = currentCategory ? (activeTraitByCategory[currentCategory.name] ?? 0) : 0;
  const selectedTrait = currentCategory?.traits[selectedTraitIndex] ?? currentCategory?.traits[0] ?? null;

  useEffect(() => {
    if (!currentCategory) return;
    if (activeTraitByCategory[currentCategory.name] !== undefined) return;

    setActiveTraitByCategory((prev) => ({
      ...prev,
      [currentCategory.name]: 0,
    }));
  }, [activeTraitByCategory, currentCategory]);

  const selectedTraitIds = useMemo(
    () =>
      categories
        .map((category) => {
        const traitIndex = activeTraitByCategory[category.name];
        if (traitIndex === undefined) return null;
        return category.traits[traitIndex]?.id ?? null;
        })
        .filter((id): id is string => id !== null),
    [activeTraitByCategory, categories]
  );

  const previewImageUrl = useMemo(() => {
    if (selectedTraitIds.length === 0) {
      return `https://adrianlab.vercel.app/api/render/${DEMO_TOKEN_ID}`;
    }

    return vercelImageService.generateCombinedImageUrl({
      tokenId: DEMO_TOKEN_ID,
      traitIds: selectedTraitIds,
    });
  }, [selectedTraitIds]);

  useEffect(() => {
    if (!shouldShowPreview) return;
    if (!previewImageUrl) return;

    setIsPreviewLoading(true);
    vercelImageService.preloadImage(previewImageUrl).finally(() => {
      setIsPreviewLoading(false);
    });
  }, [previewImageUrl, shouldShowPreview]);

  if (!shouldShowPreview || !currentCategory || !selectedTrait) return null;

  return (
    <section className="relative z-[5] mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[#00ff00]/35 bg-[#0b110f] p-5 sm:p-7">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00ff00]/35 bg-[#00ff00]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#b8ffba]">
          Demo Mode
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h3 className="text-2xl font-black sm:text-3xl">
              Build your <span style={{ color: LIME }}>ZERO</span>
            </h3>
            <p className="mt-2 text-sm text-[#c9d6ce] sm:text-base">
              Preview how TraitLAB customization feels before minting. Select trait groups and style your identity.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => setActiveCategoryName(category.name)}
                  className="rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-colors sm:text-sm"
                  style={{
                    borderColor:
                      currentCategory.name === category.name ? 'rgba(0,255,0,0.55)' : 'rgba(255,255,255,0.18)',
                    background:
                      currentCategory.name === category.name ? 'rgba(0,255,0,0.16)' : 'rgba(255,255,255,0.04)',
                    color: currentCategory.name === category.name ? '#d9ffda' : '#d0ddd1',
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {currentCategory.traits.map((trait, traitIndex) => {
                const isActive = selectedTraitIndex === traitIndex;
                return (
                  <button
                    key={trait.id}
                    type="button"
                    onClick={() => {
                      setActiveTraitByCategory((prev) => ({
                        ...prev,
                        [currentCategory.name]: traitIndex,
                      }));
                    }}
                    className="rounded-lg border p-2 text-left text-xs font-semibold transition-colors sm:text-sm"
                    style={{
                      borderColor: isActive ? 'rgba(0,255,0,0.55)' : 'rgba(255,255,255,0.15)',
                      background: isActive ? 'rgba(0,255,0,0.14)' : 'rgba(255,255,255,0.03)',
                      color: isActive ? '#e4ffe5' : '#c7d4c8',
                    }}
                  >
                    <img
                      src={trait.imageUrl}
                      alt={trait.name}
                      className="mb-2 h-14 w-14 rounded-md bg-white/5 p-1"
                      loading="lazy"
                    />
                    <span className="line-clamp-2 block">{trait.name}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-5 text-xs text-[#9fb0a0] sm:text-sm">
              This preview uses the same demo trait IDs as MyNFTs demo mode and applies them live over ZERO #{DEMO_TOKEN_ID}.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-[#0a1210] p-4">
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-[#a7b9aa]">
              <span>TraitLAB Preview</span>
              <span>{selectedTrait.name}</span>
            </div>
            <div className="relative">
              {isPreviewLoading && (
                <div className="absolute inset-0 z-[2] animate-pulse rounded-xl bg-[#0d1a0f]" />
              )}
              <img
                src={previewImageUrl}
                alt="TraitLAB preview"
                className="aspect-square w-full rounded-xl object-cover"
                onError={(event) => {
                  event.currentTarget.src = getGitHubImageUrl('zeronaked.png');
                }}
              />
            </div>
            <p className="mt-3 text-xs text-[#b9c8ba] sm:text-sm">
              Demo NFT #{DEMO_TOKEN_ID} - Selected: <span style={{ color: LIME }}>{currentCategory.name}</span> - {selectedTrait.name}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export const ZeroModule: React.FC = () => {
  const [activeFrame, setActiveFrame] = useState(0);
  const [useFallbackFrame, setUseFallbackFrame] = useState(false);
  const [showcaseNfts, setShowcaseNfts] = useState<ShowcaseNFT[]>(SHOWCASE_NFTS);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveFrame((prev) => (prev + 1) % traitEvolutionFrames.length);
    }, 1400);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

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

        if (selected.length > 0) setShowcaseNfts(selected);
      } catch {
        // keep fallback list
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
      <style>
        {`
          @keyframes zero-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .zero-marquee-track {
            width: max-content;
            display: flex;
          }
        `}
      </style>

      <section className="relative z-[5] h-screen">
        <div className="h-full overflow-hidden">
          <video
            src="/zero-firefly.mp4"
            className="h-full w-full object-cover object-center scale-[1.14] sm:scale-100"
            autoPlay
            muted
            playsInline
          />
          <div className="pointer-events-none absolute inset-0 bg-black/40" />
          <div className="absolute bottom-8 left-4 right-4 sm:bottom-10 sm:left-6 sm:right-6 lg:left-8 lg:right-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: LIME }}>BE REAL | BE $ADRIAN</p>
            <h2 className="mt-2 text-4xl font-black leading-[0.92] sm:text-5xl md:text-6xl lg:text-7xl">
              FIRE MEETS
              <br />
              BLOCKCHAIN
            </h2>
          </div>
        </div>
      </section>

      <div className="pointer-events-none absolute inset-0 z-[1]">
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

      <section className="relative z-[5] mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 pb-12 pt-24 sm:px-6 lg:px-8">
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
                className="group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold uppercase tracking-[0.14em] text-[#041106] transition-transform hover:scale-[1.03]"
                style={{ background: LIME }}
              >
                Mint Your ZERO
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/gallery"
                className="inline-flex items-center rounded-xl border bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white backdrop-blur transition-colors hover:bg-white/10"
                style={{ borderColor: 'rgba(0,255,0,0.45)' }}
              >
                Explore Gallery
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.88, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 14, delay: 0.2 }}
            className="relative mx-auto w-full max-w-[520px]"
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
                    <div
                      key={`frame-step-${idx}`}
                    className={`h-1.5 flex-1 rounded-full ${idx <= activeFrame ? 'bg-[#00ff00]' : 'bg-white/25'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-[5] py-12">
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
            const duration = 34 - rowIndex * 4;
            const track = [...row, ...row];

            return (
              <div key={`row-${rowIndex}`} className="overflow-hidden">
                <div
                  className="zero-marquee-track gap-4"
                  style={{
                    animation: `zero-marquee ${duration}s linear infinite`,
                    animationDirection: rowIndex % 2 === 0 ? 'normal' : 'reverse',
                  }}
                >
                  {track.map((nft, index) => (
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
                        <span style={{ color: LIME }}>ZERO</span>
                        <span>#{nft.tokenId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <TraitLabPreviewSection />

      <section className="relative z-[5] mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between gap-6">
          <h2 className="text-3xl font-black uppercase tracking-[0.08em] sm:text-4xl md:text-5xl">
            More Than A PFP
          </h2>
          <span className="hidden rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#c6fff2] md:inline-block" style={{ borderColor: 'rgba(0,255,0,0.45)', color: LIME }}>
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

      <section className="relative z-[5] mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
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
              <p className="text-2xl font-black text-[#00ff00] sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#bdd0ff] sm:text-sm">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-[5] border-t border-white/10 bg-gradient-to-r from-[#071227] via-[#0f1633] to-[#1f1a2f]">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-7 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: LIME, borderColor: 'rgba(0,255,0,0.45)' }}>
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00ff00] px-6 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#041106]"
            >
              <Zap className="h-4 w-4" />
              Start Minting
            </Link>
            <Link
              to="/traits"
              className="inline-flex items-center justify-center rounded-xl border px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white"
              style={{ borderColor: 'rgba(0,255,0,0.45)' }}
            >
              Open TraitLAB
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
