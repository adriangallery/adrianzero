import { useState } from 'react';
import { Season1Tab } from './Season1Tab';
import { Season2Tab } from './Season2Tab';

type SeasonTab = 's1' | 's2';

export function ZEROmoviesModule() {
  const [active, setActive] = useState<SeasonTab>('s1');

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-6xl px-4 pt-20 pb-8 sm:px-6 sm:pt-24">
        {/* Tab strip */}
        <div className="mb-6 flex justify-center gap-1 border-b border-zinc-800">
          <TabButton active={active === 's1'} onClick={() => setActive('s1')} label="Season 1" sub="Trilogy Part One" accent="red" />
          <TabButton
            active={active === 's2'}
            onClick={() => setActive('s2')}
            label="Season 2"
            sub="The Return of the Pixel"
            accent="yellow"
          />
        </div>

        {active === 's1' ? <Season1Tab /> : <Season2Tab />}
      </div>

      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
  accent: 'red' | 'yellow';
}

function TabButton({ active, onClick, label, sub, accent }: TabButtonProps) {
  const accentBorder = accent === 'red' ? 'border-red-600' : 'border-yellow-500';
  const accentText = accent === 'red' ? 'text-red-500' : 'text-yellow-400';
  return (
    <button
      onClick={onClick}
      className={`relative px-5 pb-2 pt-1 transition-colors ${active ? accentText : 'text-zinc-600 hover:text-zinc-400'}`}
    >
      <div className="text-sm font-bold tracking-wider">{label}</div>
      <div className="text-[8px] uppercase tracking-[0.25em] opacity-80">{sub}</div>
      {active && <div className={`absolute -bottom-px left-0 right-0 h-[2px] ${accentBorder} bg-current`} />}
    </button>
  );
}
