/**
 * AnimationsModule — link-only /animations
 * Showcase of $ZERO ecosystem animations by @HalfxTiger.
 */

import { useState } from 'react';

type Animation = {
  file: string;
  title: string;
  tag?: string;
};

const ANIMATIONS: Animation[] = [
  { file: 'Trait_Annimation.gif', title: 'Trait Showcase', tag: 'featured' },
  { file: 'Referee.webp', title: 'Referee' },
  { file: 'Samurai_Apple.webp', title: 'Samurai Apple' },
  { file: 'Adrian-McOrder-Dash.gif', title: 'McOrder Dash' },
  { file: 'NEO_Zero.gif', title: 'NEO Zero' },
  { file: 'VIBE.gif', title: 'VIBE' },
  { file: 'VESUVIO.gif', title: 'Vesuvio' },
  { file: 'Golden-Champagne.gif', title: 'Golden Champagne' },
  { file: 'Bare_Adrians_PFP.gif', title: 'Bare Adrians PFP' },
  { file: 'Boller_Adrian.gif', title: 'Boller Adrian' },
  { file: 'MCD-Managers.gif', title: 'MCD Managers' },
  { file: 'ET.gif', title: 'ET' },
  { file: '302l.gif', title: '302L' },
  { file: 'Fester2.gif', title: 'Fester' },
  { file: 'I_Love.gif', title: 'I Love' },
  { file: 'Adrian-Love_It.gif', title: 'Adrian Loves It' },
  { file: 'LFG.gif', title: 'LFG' },
  { file: 'LFG_2.gif', title: 'LFG II' },
  { file: 'LFG_3.gif', title: 'LFG III' },
  { file: 'GM.gif', title: 'GM' },
  { file: 'GN.gif', title: 'GN' },
  { file: 'BN_2.gif', title: 'BN' },
  { file: 'BJ.gif', title: 'BJ' },
];

function Card({ anim, onOpen }: { anim: Animation; onOpen: (a: Animation) => void }) {
  return (
    <button
      onClick={() => onOpen(anim)}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 transition-all hover:-translate-y-1 hover:border-[#ff66cc]/60 hover:shadow-[0_0_30px_rgba(255,102,204,0.25)]"
    >
      {anim.tag && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-[#ff66cc] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-black">
          {anim.tag}
        </span>
      )}
      <div className="aspect-square w-full overflow-hidden bg-black">
        <img
          src={`/animations/${anim.file}`}
          alt={anim.title}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      <div className="border-t border-white/5 p-3 text-left">
        <div className="truncate text-sm font-bold text-foreground">{anim.title}</div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          by @HalfxTiger
        </div>
      </div>
    </button>
  );
}

function Lightbox({ anim, onClose }: { anim: Animation; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/60 px-4 py-2 font-mono text-xs text-white hover:border-[#ff66cc] hover:text-[#ff66cc]"
      >
        close ✕
      </button>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-full max-w-4xl flex-col items-center">
        <img
          src={`/animations/${anim.file}`}
          alt={anim.title}
          className="max-h-[80vh] max-w-full rounded-xl border border-white/10"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="mt-4 text-center">
          <div className="text-xl font-bold">{anim.title}</div>
          <div className="mt-1 font-mono text-xs uppercase tracking-widest text-[#ff66cc]">
            by @HalfxTiger
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnimationsModule() {
  const [open, setOpen] = useState<Animation | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      {/* HERO */}
      <div className="mb-12 text-center">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-[#ff66cc]">
          a collection by @HalfxTiger
        </p>
        <h1 className="mb-4 text-5xl font-black leading-none md:text-7xl">
          ZERO
          <br />
          <span className="bg-gradient-to-r from-[#ff66cc] via-[#00ff00] to-cyan-400 bg-clip-text text-transparent">
            animations.
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-base text-foreground/70 md:text-lg">
          Every frame, hand-crafted. A living archive of $ZERO ecosystem moments —
          drops, memes, milestones, vibes.
        </p>
      </div>

      {/* GRID */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {ANIMATIONS.map((anim) => (
          <Card key={anim.file} anim={anim} onOpen={setOpen} />
        ))}
      </div>

      {/* FOOTER */}
      <div className="mt-16 border-t border-white/10 pt-8 text-center">
        <p className="font-mono text-sm text-muted-foreground">
          {ANIMATIONS.length} animations · more coming
        </p>
        <a
          href="https://x.com/HalfxTiger"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block font-mono text-sm text-[#ff66cc] hover:underline"
        >
          @HalfxTiger →
        </a>
      </div>

      {open && <Lightbox anim={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
