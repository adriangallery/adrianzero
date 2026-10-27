/**
 * AZombie — /zombie (27-oct-2026, concept by HalfxTiger).
 *
 * Arcade intro → builder: erase green skin to show the bloody skeleton, add
 * zombie traits (max one per slot) and mint a free AdrianZERO (gas only,
 * 3 per wallet, 1000 total). ~1 in 10 rolls Zombie0 (skeleton only) on-chain.
 * Builder works even when the facet isn't live; the button then says
 * "Mint opens soon".
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Dices, Eraser, Paintbrush, RotateCcw, Trash2, Undo2, ExternalLink, Play } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { isUserRejection } from '@/lib/web3/humanError';
import { useWalletDataStore } from '@/stores/walletDataStore';
import { SLOTS, SLOT_HEAD, VARIANT_ZOMBIE0, optionFor } from '../lib/zombieSpec';
import {
  type Traits,
  NO_TRAITS,
  bytesToHex,
  countErased,
  emptyMask,
  encodeTraits,
  isHooded,
  normalizeTraits,
  paintMask,
  randomMask,
  randomTraits,
} from '../lib/encoding';
import { loadLayers, type LayerSet } from '../lib/render';
import {
  useZombieConfig,
  useZombieIsTaken,
  useZombieMint,
  useZombieMintedBy,
  useZombieRareOneIn,
  zombieError,
  type MintResult,
} from '../hooks/useZombieMint';
import { ZombieCanvas, TraitThumb } from './ZombieCanvas';
import { ZombieIntro } from './ZombieIntro';
import { stopIntroAudio } from '../lib/introAudio';
import { ZombieFloppyOffer } from './ZombieFloppyOffer';
import './zombie.css';

const INTRO_KEY = 'azombie:intro-seen';
const OPENSEA_BASE = `https://opensea.io/assets/base/${CONTRACT_ADDRESSES.ADRIAN_ZERO}`;
const OG_IMAGE = 'https://adrianzero.com/zombie/og.png';

function introSeen(): boolean {
  try {
    return sessionStorage.getItem(INTRO_KEY) === '1';
  } catch {
    return false;
  }
}

function markIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_KEY, '1');
  } catch {
    /* private mode etc. */
  }
}

/** Client-side OG/description for /zombie (crawlers only see index.html — see server.mjs note). */
function usePageMeta() {
  useEffect(() => {
    const set: Array<[string, string, string]> = [
      ['meta[name="description"]', 'content', 'Build your AZombie: bite off the skin, add zombie traits, mint free on Base.'],
      ['meta[property="og:title"]', 'content', 'AZombie — build & mint your AdrianZERO zombie'],
      ['meta[property="og:description"]', 'content', 'Bite off the skin, add traits, mint free. 1 in 10 rises as Zombie0.'],
      ['meta[property="og:url"]', 'content', 'https://adrianzero.com/zombie'],
      ['meta[property="og:image"]', 'content', OG_IMAGE],
      ['meta[name="twitter:image"]', 'content', OG_IMAGE],
    ];
    const prev = set.map(([sel, attr]) => document.querySelector(sel)?.getAttribute(attr) ?? null);
    set.forEach(([sel, attr, v]) => document.querySelector(sel)?.setAttribute(attr, v));
    return () => {
      set.forEach(([sel, attr], i) => {
        const p = prev[i];
        if (p !== null) document.querySelector(sel)?.setAttribute(attr, p);
      });
    };
  }, []);
}

export function ZombieModule() {
  const [phase, setPhase] = useState<'intro' | 'build'>(() => (introSeen() ? 'build' : 'intro'));
  usePageMeta();
  useEffect(() => () => stopIntroAudio(), []);

  const start = useCallback(() => {
    markIntroSeen();
    setPhase('build');
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="az-root -mx-4 -my-6 sm:mx-0 sm:my-0">
      {phase === 'intro' ? <ZombieIntro onStart={start} /> : <ZombieBuilder onReplay={() => setPhase('intro')} />}
    </div>
  );
}

interface Snapshot {
  mask: Uint8Array;
  traits: Traits;
}

function ZombieBuilder({ onReplay }: { onReplay: () => void }) {
  const [layers, setLayers] = useState<LayerSet | null>(null);
  const [layerError, setLayerError] = useState(false);
  const [mask, setMask] = useState<Uint8Array>(() => emptyMask());
  const [traits, setTraits] = useState<Traits>(NO_TRAITS);
  const [erase, setErase] = useState(true);
  const [brush, setBrush] = useState(2);
  const [slot, setSlot] = useState(0);
  const history = useRef<Snapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    let alive = true;
    loadLayers()
      .then((l) => alive && setLayers(l))
      .catch(() => alive && setLayerError(true));
    return () => {
      alive = false;
    };
  }, []);

  const snapshot = useCallback(() => {
    history.current.push({ mask, traits });
    if (history.current.length > 60) history.current.shift();
    setCanUndo(true);
  }, [mask, traits]);

  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    setMask(prev.mask);
    setTraits(prev.traits);
    setCanUndo(history.current.length > 0);
  };

  const onPaint = useCallback(
    (points: Array<[number, number]>) => {
      setMask((m) => points.reduce((acc, [x, y]) => paintMask(acc, x, y, brush, erase), m));
    },
    [brush, erase]
  );

  const pickTrait = (s: number, value: number) => {
    if (traits[s] === value) return;
    snapshot();
    const next = [...traits] as Traits;
    next[s] = value;
    setTraits(normalizeTraits(next));
  };

  const clearSkin = () => {
    if (countErased(mask) === 0) return;
    snapshot();
    setMask(emptyMask());
  };

  const randomize = () => {
    snapshot();
    setMask(randomMask());
    setTraits(randomTraits());
  };

  const maskHex = useMemo(() => bytesToHex(mask), [mask]);
  const traitsNum = useMemo(() => encodeTraits(traits), [traits]);
  const hooded = isHooded(traits);
  const erased = countErased(mask);

  return (
    <div className="az-scan relative min-h-[calc(100dvh-8.5rem)] px-4 pb-10 pt-5 md:px-6">
      <header className="mx-auto mb-4 flex max-w-6xl items-end justify-between gap-3">
        <div>
          <h1 className="az-display az-glow text-[18px] leading-tight text-[var(--az-g)] md:text-[24px]">AZOMBIE</h1>
          <p className="az-ui mt-1 text-[13px] text-[var(--az-dim)]">Bite off the skin. Dress the dead. Mint free.</p>
        </div>
        <button type="button" onClick={onReplay} className="az-ui flex items-center gap-1 text-[12px] text-[var(--az-dim)] hover:text-[var(--az-g)]">
          <Play className="h-3.5 w-3.5" /> Intro
        </button>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
        {/* ─── Canvas + tools ─── */}
        <section className="flex flex-col items-center gap-3">
          <div className="az-frame relative">
            {layers ? (
              <ZombieCanvas
                layers={layers}
                mask={mask}
                traits={traits}
                className="h-[296px] w-[296px] md:h-[444px] md:w-[444px] lg:h-[481px] lg:w-[481px]"
                onStrokeStart={snapshot}
                onPaint={onPaint}
                label="AZombie editor. Drag to erase or restore skin."
              />
            ) : (
              <div className="az-ui grid h-[296px] w-[296px] place-items-center text-[13px] text-[var(--az-dim)] md:h-[444px] md:w-[444px] lg:h-[481px] lg:w-[481px]">
                {layerError ? 'Layers failed to load. Refresh.' : 'Digging up…'}
              </div>
            )}
          </div>

          {/* Tools */}
          <div className="flex w-full max-w-[481px] flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" aria-pressed={erase} onClick={() => setErase(true)} className={`az-btn ${erase ? 'az-btn-on' : ''}`}>
                <Eraser className="h-4 w-4" /> Erase skin
              </button>
              <button type="button" aria-pressed={!erase} onClick={() => setErase(false)} className={`az-btn ${!erase ? 'az-btn-on' : ''}`}>
                <Paintbrush className="h-4 w-4" /> Restore skin
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="az-ui w-12 flex-none text-[12px] text-[var(--az-dim)]">Brush</span>
              {[1, 2, 3].map((b) => (
                <button key={b} type="button" aria-pressed={brush === b} onClick={() => setBrush(b)} className={`az-btn az-btn-sq ${brush === b ? 'az-btn-on' : ''}`} aria-label={`Brush ${b}px`}>
                  <span className="bg-current" style={{ width: b * 4, height: b * 4 }} />
                </button>
              ))}
              <span className="az-ui ml-auto text-[12px] text-[var(--az-dim)]">{erased} px bitten</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={undo} disabled={!canUndo} className="az-btn">
                <Undo2 className="h-4 w-4" /> Undo
              </button>
              <button type="button" onClick={clearSkin} disabled={erased === 0} className="az-btn">
                <Trash2 className="h-4 w-4" /> Clear
              </button>
              <button type="button" onClick={randomize} className="az-btn">
                <Dices className="h-4 w-4" /> Random
              </button>
            </div>
          </div>
        </section>

        {/* ─── Traits + mint ─── */}
        <section className="flex min-w-0 flex-col gap-4">
          <TraitPicker layers={layers} traits={traits} slot={slot} setSlot={setSlot} hooded={hooded} onPick={pickTrait} />
          <MintPanel layers={layers} mask={mask} traits={traits} maskHex={maskHex} traitsNum={traitsNum} onReset={() => {
            history.current = [];
            setCanUndo(false);
            setMask(emptyMask());
            setTraits(NO_TRAITS);
          }} />
          <ZombieFloppyOffer compact />
        </section>
      </div>
    </div>
  );
}

function TraitPicker({
  layers,
  traits,
  slot,
  setSlot,
  hooded,
  onPick,
}: {
  layers: LayerSet | null;
  traits: Traits;
  slot: number;
  setSlot: (s: number) => void;
  hooded: boolean;
  onPick: (slot: number, value: number) => void;
}) {
  const current = SLOTS[slot];
  const headLocked = slot === SLOT_HEAD && hooded;
  return (
    <div className="az-panel">
      <div className="grid grid-cols-5 border-b-2 border-[var(--az-line)]" role="tablist">
        {SLOTS.map((s) => {
          const set = traits[s.slot] > 0;
          return (
            <button
              key={s.name}
              type="button"
              role="tab"
              aria-selected={slot === s.slot}
              onClick={() => setSlot(s.slot)}
              className={`az-ui relative min-h-[44px] px-1 text-[11px] tracking-wider md:text-[12px] ${
                slot === s.slot ? 'bg-[var(--az-g)] font-bold text-black' : 'text-[var(--az-fg)] hover:text-[var(--az-g)]'
              } ${s.slot === SLOT_HEAD && hooded ? 'opacity-40' : ''}`}
            >
              {s.name}
              {set ? <span className="absolute right-1 top-1 h-1.5 w-1.5 bg-current" aria-label="set" /> : null}
            </button>
          );
        })}
      </div>
      {headLocked ? (
        <p className="az-ui px-3 pt-3 text-[13px] text-[var(--az-warn)]">Hood's up. No headwear with this body.</p>
      ) : null}
      <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4">
        <TraitTile label="None" active={traits[slot] === 0} disabled={headLocked} onClick={() => onPick(slot, 0)}>
          <span className="az-ui text-[20px] text-[var(--az-dim)]">∅</span>
        </TraitTile>
        {current.options.map((o) => (
          <TraitTile key={o.value} label={o.name} active={traits[slot] === o.value} disabled={headLocked} onClick={() => onPick(slot, o.value)}>
            <TraitThumb layers={layers} file={o.file} className="h-12 w-12" />
          </TraitTile>
        ))}
      </div>
    </div>
  );
}

function TraitTile({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-[88px] flex-col items-center justify-center gap-1.5 border-2 p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        active ? 'border-[var(--az-g)] bg-[var(--az-g)]/10' : 'border-[var(--az-line)] hover:border-[var(--az-dim)]'
      }`}
    >
      <span className="grid h-12 place-items-center">{children}</span>
      <span className={`az-ui text-center text-[11px] leading-tight ${active ? 'text-[var(--az-g)]' : 'text-[var(--az-fg)]'}`}>{label}</span>
    </button>
  );
}

function MintPanel({
  layers,
  mask,
  traits,
  maskHex,
  traitsNum,
  onReset,
}: {
  layers: LayerSet | null;
  mask: Uint8Array;
  traits: Traits;
  maskHex: `0x${string}`;
  traitsNum: number;
  onReset: () => void;
}) {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { config, ready, refetch: refetchConfig } = useZombieConfig();
  const live = ready && !config.paused;
  const { mintedBy, refetch: refetchMinted } = useZombieMintedBy(ready);
  const rareOneIn = useZombieRareOneIn(ready);
  const { isTaken, isChecking } = useZombieIsTaken(maskHex, traitsNum, ready);
  const { mint, isPending, isConfirming, isConfirmed, result, error, reset } = useZombieMint();
  const [minted, setMinted] = useState<Snapshot | null>(null);

  const left = config.maxPerWallet > mintedBy ? config.maxPerWallet - mintedBy : 0n;
  const soldOut = config.totalMinted >= config.maxSupply;

  useEffect(() => {
    if (!isConfirmed) return;
    refetchConfig();
    refetchMinted();
    useWalletDataStore.getState().invalidateZeros();
  }, [isConfirmed, refetchConfig, refetchMinted]);

  const busy = isPending || isConfirming;
  const disabled = !live || soldOut || left === 0n || isTaken || busy;

  let label = 'MINT · FREE';
  if (!live) label = 'Mint opens soon';
  else if (soldOut) label = 'Sold out';
  else if (left === 0n) label = 'Wallet limit reached';
  else if (isTaken) label = 'Already taken';
  else if (isPending) label = 'Confirm in wallet…';
  else if (isConfirming) label = 'Rising from the grave…';

  const doMint = () => {
    setMinted({ mask, traits });
    mint(maskHex, traitsNum);
  };

  const closeReveal = () => {
    reset();
    setMinted(null);
    onReset();
  };

  return (
    <div className="az-panel flex flex-col gap-3 p-3">
      <div className="flex items-center gap-3">
        <div className="az-frame flex-none p-1">
          <ZombieCanvas layers={layers} mask={mask} traits={traits} className="h-[74px] w-[74px]" label="Token preview" />
        </div>
        <div className="az-ui min-w-0 flex-1 text-[13px] leading-snug">
          <p className="text-[var(--az-fg)]">
            <span className="az-display text-[11px] text-[var(--az-g)]">{config.totalMinted.toString()}</span>
            <span className="text-[var(--az-dim)]"> / {config.maxSupply.toString()} minted</span>
          </p>
          <p className="text-[var(--az-dim)]">
            {isConnected && ready ? `You have ${left.toString()} of ${config.maxPerWallet.toString()} left` : `${config.maxPerWallet.toString()} per wallet · gas only`}
          </p>
          <p className="text-[var(--az-dim)]">1 in {rareOneIn} rises as <span className="text-[var(--az-blood)]">Zombie0</span></p>
        </div>
      </div>

      {isTaken ? (
        <p role="alert" className="az-ui border-2 border-[var(--az-warn)] px-3 py-2 text-[13px] text-[var(--az-warn)]">
          This zombie already exists. Change a bite or a trait.
        </p>
      ) : null}

      {!isConnected ? (
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => openConnectModal?.()} className="az-btn az-btn-primary min-h-[52px] text-[13px]">
            <span className="az-display">CONNECT TO MINT</span>
          </button>
          {!live ? <p className="az-ui text-center text-[12px] text-[var(--az-dim)]">Mint opens soon. Build yours now.</p> : null}
        </div>
      ) : (
        <button type="button" disabled={disabled} onClick={doMint} className="az-btn az-btn-primary min-h-[52px] text-[13px]">
          <span className="az-display">{label}</span>
        </button>
      )}

      {live && isChecking && !isTaken ? <p className="az-ui -mt-1 text-center text-[11px] text-[var(--az-dim)]">Checking it's one of a kind…</p> : null}

      {error && !isUserRejection(error) ? (
        <p role="alert" className="az-ui text-[13px] text-[var(--az-blood)]">{zombieError(error)}</p>
      ) : null}

      {isConfirmed && minted ? <Reveal layers={layers} snapshot={minted} result={result} onClose={closeReveal} /> : null}
    </div>
  );
}

function Reveal({
  layers,
  snapshot,
  result,
  onClose,
}: {
  layers: LayerSet | null;
  snapshot: Snapshot;
  result: MintResult | null;
  onClose: () => void;
}) {
  // Slot-machine flicker between skin and skeleton, then the real variant.
  const [rolling, setRolling] = useState(true);
  const [flip, setFlip] = useState(0);
  useEffect(() => {
    if (!result) return;
    const iv = window.setInterval(() => setFlip((f) => f + 1), 110);
    const t = window.setTimeout(() => {
      window.clearInterval(iv);
      setRolling(false);
    }, 1500);
    return () => {
      window.clearInterval(iv);
      window.clearTimeout(t);
    };
  }, [result]);

  const rare = !!result && result.variant === VARIANT_ZOMBIE0;
  const showVariant = rolling ? flip % 2 : result?.variant ?? 0;
  const done = !!result && !rolling;
  const tokenId = result?.tokenId.toString();
  const names = SLOTS.map((s) => optionFor(s.slot, snapshot.traits[s.slot])?.name).filter(Boolean);

  return (
    <div className="fixed inset-0 z-[35] flex items-center justify-center overflow-y-auto bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Your AZombie">
      <div className={`az-scan relative my-auto flex w-full max-w-sm flex-col items-center gap-4 border-2 bg-black p-5 text-center ${done && rare ? 'az-rare border-[var(--az-blood)]' : 'border-[var(--az-g)]'}`}>
        {!result ? (
          <p className="az-display az-blink py-10 text-[12px] text-[var(--az-g)]">RISING…</p>
        ) : (
          <>
            <p className={`az-display text-[12px] ${done ? '' : 'az-blink'} ${done && rare ? 'text-[var(--az-blood)]' : 'text-[var(--az-g)]'}`}>
              {!done ? 'ROLLING…' : rare ? 'ZOMBIE0' : `AZOMBIE #${(result.index + 1n).toString()}`}
            </p>
            <div className="az-frame p-1">
              <ZombieCanvas layers={layers} mask={snapshot.mask} traits={snapshot.traits} variant={showVariant} className="h-[222px] w-[222px]" label="Your minted AZombie" />
            </div>
            {done ? (
              <>
                {rare ? (
                  <p className="az-display az-glow-red text-[13px] leading-relaxed text-[var(--az-blood)]">1 of 10 rare!<br />Pure bone.</p>
                ) : (
                  <p className="az-ui text-[14px] text-[var(--az-fg)]">It's alive. Kind of.</p>
                )}
                {names.length ? <p className="az-ui text-[12px] text-[var(--az-dim)]">{names.join(' · ')}</p> : null}
                <div className="grid w-full grid-cols-2 gap-2">
                  <Link to={`/traitlab?token=${tokenId}`} className="az-btn az-btn-primary">
                    TraitLab
                  </Link>
                  <a href={`${OPENSEA_BASE}/${tokenId}`} target="_blank" rel="noreferrer" className="az-btn">
                    OpenSea <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <ZombieFloppyOffer />
                <button type="button" onClick={onClose} className="az-ui flex items-center gap-1 text-[13px] text-[var(--az-dim)] hover:text-[var(--az-g)]">
                  <RotateCcw className="h-3.5 w-3.5" /> Build another
                </button>
              </>
            ) : null}
          </>
        )}
        {!result ? (
          <p className="az-ui text-[12px] text-[var(--az-dim)]">
            Minted. Check <Link to="/mynfts" className="underline">My NFTs</Link> if this hangs.{' '}
            <button type="button" onClick={onClose} className="underline">Close</button>
          </p>
        ) : null}
      </div>
    </div>
  );
}
