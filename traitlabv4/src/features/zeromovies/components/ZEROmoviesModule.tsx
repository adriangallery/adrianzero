/**
 * ZEROmovies (F8, 13-sep): el videoclub sobre el sistema de diseño. Sin
 * `min-h-screen bg-black pt-20` propios (ya hay header + TabBar), pestañas
 * de temporada como chips del sistema conservando el acento de cada
 * temporada (rojo S1, amarillo S2), y el marketplace común debajo.
 */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Season1Tab } from './Season1Tab';
import { Season2Tab } from './Season2Tab';
import { MultiSeasonMarketplace } from './MultiSeasonMarketplace';

type SeasonTab = 's1' | 's2';

const SEASONS: { id: SeasonTab; label: string; sub: string; active: string }[] = [
  { id: 's1', label: 'Season 1', sub: 'Trilogy Part One', active: 'bg-red-600 text-fg border-red-600' },
  { id: 's2', label: 'Season 2', sub: 'The Return of the Pixel', active: 'bg-yellow-500 text-black border-yellow-500' },
];

export function ZEROmoviesModule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromUrl = searchParams.get('season');
  const [active, setActive] = useState<SeasonTab>(fromUrl === 's2' ? 's2' : 's1');

  const select = (id: SeasonTab) => {
    setActive(id);
    const next = new URLSearchParams(searchParams);
    next.set('season', id);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-w-0 bg-bg">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6 sm:pt-6">
        {/* Temporadas: segmentado con la identidad de cada una */}
        <div className="mb-5 grid grid-cols-2 gap-2" role="tablist" aria-label="Season">
          {SEASONS.map((s) => {
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => select(s.id)}
                className={`flex flex-col items-center rounded-[var(--r-md)] border-2 px-3 py-2.5 transition-colors ${
                  isActive ? s.active : 'border-line bg-panel text-mute hover:border-mute'
                }`}
              >
                <span className="font-ui text-[14px] font-bold">{s.label}</span>
                <span className="text-[11px] uppercase tracking-wider opacity-80">{s.sub}</span>
              </button>
            );
          })}
        </div>

        {active === 's1' ? <Season1Tab /> : <Season2Tab />}
      </div>

      {/* Un marketplace para toda la trilogía, sea cual sea la temporada activa */}
      <MultiSeasonMarketplace />

      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
