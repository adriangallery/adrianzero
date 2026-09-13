import { useState } from 'react';
import { ShoppingBag, Lock } from 'lucide-react';
import { MarketplaceSection } from './MarketplaceSection';
import { MarketplaceSeason2 } from './MarketplaceSeason2';

type SeasonId = 1 | 2 | 3 | 4;

interface SeasonMeta {
  id: SeasonId;
  label: string;
  sub: string;
  accent: 'red' | 'yellow' | 'emerald' | 'fuchsia';
  status: 'live' | 'soon' | 'unannounced';
  hint: string;
}

const SEASONS: SeasonMeta[] = [
  { id: 1, label: 'Season 1', sub: 'Trilogy Part One', accent: 'red',     status: 'live',        hint: '5% fee · 3% burn + 2% holders' },
  { id: 2, label: 'Season 2', sub: 'Return of the Pixel', accent: 'yellow', status: 'soon',     hint: 'Preview — listings + offers route here when the S2 marketplace facet ships' },
  { id: 3, label: 'Season 3', sub: 'Coming later',  accent: 'emerald',  status: 'unannounced',  hint: 'Catalog and mechanics will be announced before mint' },
  { id: 4, label: 'Season 4', sub: 'The finale',    accent: 'fuchsia',  status: 'unannounced',  hint: 'A four-piece trilogy ends with Season 4' },
];

const ACCENTS: Record<SeasonMeta['accent'], { active: string; bar: string; tag: string }> = {
  red:     { active: 'text-red-400',     bar: 'bg-red-500',     tag: 'border-red-500/40 text-red-400' },
  yellow:  { active: 'text-yellow-400',  bar: 'bg-yellow-500',  tag: 'border-yellow-500/40 text-yellow-400' },
  emerald: { active: 'text-ok', bar: 'bg-ok', tag: 'border-ok/40 text-ok' },
  fuchsia: { active: 'text-fuchsia-400', bar: 'bg-fuchsia-500', tag: 'border-fuchsia-500/40 text-fuchsia-400' },
};

/**
 * Top-level marketplace for the whole ZEROmovies trilogy. Lives outside any
 * single season's tab so it stays visible while the user toggles between
 * Season 1 and Season 2 above. Sub-tabs route to per-season marketplace views;
 * for now only S1 has live data, S2/S3/S4 show structured placeholders so it's
 * obvious where future supply will appear.
 */
export function MultiSeasonMarketplace() {
  const [active, setActive] = useState<SeasonId>(1);

  return (
    <section className="mx-auto mt-10 max-w-6xl px-4 pb-12 sm:px-6">
      <div className="mb-3 flex items-center gap-2">
        <ShoppingBag className="h-4 w-4 text-mute" />
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-mute sm:text-xs">
          Trilogy Marketplace
        </h2>
        <span className="text-[11px] uppercase tracking-widest text-mute">
          One trading floor for all four seasons
        </span>
      </div>

      {/* Season sub-tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line scrollbar-hide">
        {SEASONS.map((s) => (
          <SeasonSubTab
            key={s.id}
            meta={s}
            active={active === s.id}
            onClick={() => setActive(s.id)}
          />
        ))}
      </div>

      {/* Per-season content */}
      {active === 1 && <MarketplaceSection />}
      {active === 2 && <MarketplaceSeason2 />}
      {active !== 1 && active !== 2 && <PlaceholderPanel meta={SEASONS.find((s) => s.id === active)!} />}
    </section>
  );
}

interface SeasonSubTabProps {
  meta: SeasonMeta;
  active: boolean;
  onClick: () => void;
}

function SeasonSubTab({ meta, active, onClick }: SeasonSubTabProps) {
  const accent = ACCENTS[meta.accent];
  const isLocked = meta.status !== 'live';
  return (
    <button
      onClick={onClick}
      className={`relative flex shrink-0 items-center gap-2 px-4 pb-2 pt-1 transition-colors ${
        active ? accent.active : 'text-mute hover:text-mute'
      }`}
    >
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider">
          {meta.label}
          {isLocked && <Lock className="h-2.5 w-2.5 opacity-60" />}
        </div>
        <div className="text-[11px] uppercase tracking-wider opacity-80">{meta.sub}</div>
      </div>
      {active && <div className={`absolute -bottom-px left-0 right-0 h-[2px] ${accent.bar}`} />}
    </button>
  );
}

function PlaceholderPanel({ meta }: { meta: SeasonMeta }) {
  const accent = ACCENTS[meta.accent];
  return (
    <div className="rounded-lg border border-dashed border-line bg-panel950 p-8 text-center">
      <div className={`mx-auto mb-3 inline-flex items-center gap-2 rounded-full border ${accent.tag} px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest`}>
        <Lock className="h-3 w-3" />
        {meta.status === 'soon' ? 'Coming soon' : 'Unannounced'}
      </div>
      <h3 className={`text-base font-bold ${accent.active}`}>{meta.label}</h3>
      <p className="mt-1 text-[13px] uppercase tracking-wider text-mute">{meta.sub}</p>
      <p className="mx-auto mt-4 max-w-md text-[13px] leading-relaxed text-mute">{meta.hint}</p>
      <p className="mt-3 text-[12px] text-mute">
        When this season ships, listings + offers route here automatically — no separate page.
      </p>
    </div>
  );
}
