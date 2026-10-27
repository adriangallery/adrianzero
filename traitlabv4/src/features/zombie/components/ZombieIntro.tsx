/**
 * Arcade attract screen: intro.mp4 looping muted; INSERT COIN (tap / Enter /
 * Space / "5") plays a coin blip + the intro's own audio and enters the builder.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { playIntroAudio } from '../lib/introAudio';

function coinBlip() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ac = new Ctx();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(988, ac.currentTime);
    o.frequency.setValueAtTime(1319, ac.currentTime + 0.08);
    g.gain.setValueAtTime(0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
    o.connect(g).connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + 0.36);
    o.onended = () => void ac.close();
  } catch {
    /* no audio, no problem */
  }
}

export function ZombieIntro({ onStart }: { onStart: () => void }) {
  const [credit, setCredit] = useState(false);
  const started = useRef(false);

  const insertCoin = useCallback(() => {
    if (started.current) return;
    started.current = true;
    coinBlip();
    playIntroAudio();
    setCredit(true);
    window.setTimeout(onStart, 650);
  }, [onStart]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === '5') {
        e.preventDefault();
        insertCoin();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [insertCoin]);

  return (
    <section className="az-scan relative flex min-h-[calc(100dvh-8.5rem)] flex-col items-center justify-center gap-6 overflow-hidden bg-black px-0 py-8 md:min-h-[calc(100dvh-7rem)]">
      <video
        className="az-pixel aspect-video w-full max-w-5xl object-contain"
        src="/zombie/intro.mp4"
        poster="/zombie/cabinet.gif"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={insertCoin}
          className="az-display az-glow min-h-[56px] border-2 border-[var(--az-g)] bg-black px-6 py-4 text-[14px] tracking-widest text-[var(--az-g)] hover:bg-[var(--az-g)] hover:text-black md:text-[16px]"
        >
          {credit ? 'CREDIT 01' : <span className="az-blink">INSERT COIN</span>}
        </button>
        <p className="az-ui text-[12px] text-[var(--az-dim)]">Free mint · gas only · tap or press Enter</p>
      </div>
    </section>
  );
}
