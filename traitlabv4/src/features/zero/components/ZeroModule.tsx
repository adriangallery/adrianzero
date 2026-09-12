import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { DollarSign, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { DashboardPanel } from '@/features/dashboard/components/DashboardPanel';
import { getGitHubImageUrl } from '@/config/images';
import { Button, Card } from '@/ui';
import { useAdrianZeroTokens } from '@/features/adrianzero/hooks/useAdrianZeroTokens';
import { editRouteFor } from '@/lib/editRoute';
import {
  SHOWCASE_GITHUB_PATH,
  SHOWCASE_GITHUB_RAW_BASE,
  SHOWCASE_GITHUB_REF,
  SHOWCASE_GITHUB_REPO,
  SHOWCASE_NFTS,
} from '../data/showcase-nfts';
import { STATS_DATA, UTILITY_CARDS } from '../data/sample-traits';
import { TraitLabPreviewSection } from './TraitLabPreviewSection';
import type { ShowcaseNFT } from '../types/zero.types';

interface GitHubFile {
  name: string;
  type: string;
}

const LIME = '#00ff00';

export const ZeroModule: React.FC = () => {
  const { isConnected } = useAccount();
  const navigate = useNavigate();
  const [useFallbackFrame, setUseFallbackFrame] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [showcaseNfts, setShowcaseNfts] = useState<ShowcaseNFT[]>(SHOWCASE_NFTS);

  // F3.5: hero muestra el ZERO real de la wallet conectada, o #146 (mock de
  // useAdrianZeroTokens) si no hay wallet — nunca los frames falsos de antes.
  const { data: heroTokens } = useAdrianZeroTokens();
  const heroToken = heroTokens[0];
  const heroImageUrl = useFallbackFrame
    ? getGitHubImageUrl('zeronaked.png')
    : heroToken?.image?.cachedUrl || heroToken?.image?.originalUrl || heroToken?.metadata?.image || getGitHubImageUrl('zeronaked.png');

  const primaryCta = isConnected
    ? { label: 'Open TraitLab', to: editRouteFor(heroToken?.tokenId) }
    : { label: 'Mint your ZERO', to: '/mint' };

  useEffect(() => {
    window.scrollTo(0, 0);
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

      {/* F3.5 (13-sep): antes eran DOS secciones h-screen/min-h-screen
          apiladas (vídeo de fondo primero, contenido real una pantalla más
          abajo) — en móvil, si el vídeo no arrancaba a tiempo, el primer
          píxel era una pantalla vacía. Ahora es UNA sección: el contenido
          (título + CTA + render real del token) pinta siempre, de entrada;
          el vídeo es una capa de fondo que hace fade-in solo cuando puede
          reproducirse (onCanPlay) y nunca reserva su propia altura. */}
      <section className="relative z-[5] min-h-[92vh] lg:min-h-screen overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[#06080d]">
          <video
            src="/zero-firefly.mp4"
            className={`h-full w-full object-cover object-center scale-[1.14] sm:scale-100 transition-opacity duration-700 ${
              videoReady ? 'opacity-100' : 'opacity-0'
            }`}
            autoPlay
            muted
            playsInline
            onCanPlay={() => setVideoReady(true)}
          />
          <div className="pointer-events-none absolute inset-0 bg-black/50" />
        </div>

        <div className="pointer-events-none absolute inset-0 z-[1]">
          <div className="absolute -left-28 top-16 h-72 w-72 rounded-full bg-[#00d2ff]/25 blur-3xl" />
          <div className="absolute right-[-140px] top-48 h-[24rem] w-[24rem] rounded-full bg-[#ff8a3d]/20 blur-3xl" />
          <div className="absolute bottom-[-140px] left-1/3 h-[30rem] w-[30rem] rounded-full bg-[#22c55e]/20 blur-3xl" />
        </div>

        <div className="relative z-[5] mx-auto flex min-h-[92vh] lg:min-h-screen w-full max-w-7xl items-center px-4 pb-12 pt-8 sm:px-6 lg:px-8">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#c6fff2] backdrop-blur"
              >
                <Sparkles className="h-4 w-4" />
                Live on Base
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="font-display text-balance text-3xl leading-[1.15] sm:text-4xl md:text-6xl lg:text-7xl"
              >
                YOUR NFT
                <br />
                <span className="bg-gradient-to-r from-[#00d2ff] via-[#55f7b7] to-[#ffb258] bg-clip-text text-transparent">
                  YOUR RULES
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-5 max-w-2xl text-pretty text-base text-[#d8e2ff]/90 sm:text-lg"
              >
                Mint, customize, and evolve your AdrianZERO. Collect traits, open packs, and build a one-of-a-kind identity on Base.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <Button variant="primary" size="lg" onClick={() => navigate(primaryCta.to)}>
                  {primaryCta.label}
                </Button>
                <Button variant="secondary" size="lg" onClick={() => navigate('/buy')}>
                  <DollarSign className="h-4 w-4" />
                  Buy $ZERO
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 80, damping: 14, delay: 0.2 }}
              className="relative mx-auto w-full max-w-[420px]"
            >
              <Card className="p-4 bg-[#0a1020]/90 backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between text-[11px] font-ui uppercase tracking-[0.1em] text-mute">
                  <span>{isConnected ? 'Your ZERO' : 'Preview'}</span>
                  <span className="text-acc">#{heroToken?.tokenId ?? '146'}</span>
                </div>
                <img
                  src={heroImageUrl}
                  alt={`AdrianZERO #${heroToken?.tokenId ?? '146'}`}
                  className="aspect-square w-full rounded-[var(--r-lg)] object-cover bg-bg"
                  onError={() => setUseFallbackFrame(true)}
                />
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative z-[5] py-12">
        <div className="mx-auto mb-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black uppercase tracking-[0.08em] sm:text-4xl md:text-5xl">
            The Collection
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-[#d6dfff]/90 sm:text-base">
            Every ZERO is unique. Browse the community's custom identities.
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

      {/* Dashboard Panel — visible when wallet connected */}
      {isConnected && (
        <section className="relative z-[5]">
          <DashboardPanel />
        </section>
      )}

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
              Live on Base
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
              to="/mynfts"
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
