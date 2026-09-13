/**
 * Fila de categorías como chips horizontales con contador (maqueta:
 * "Pelo · 12"). Recon §8.10: con 15-20 categorías la fila plana no
 * funciona — a partir de 8 se muestran las primeras 7 + un chip "More"
 * que abre una hoja con buscador para el resto.
 */

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Chip, Sheet, SearchIcon } from '@/ui';

const VISIBLE_LIMIT = 7;

export interface CategoryChipsProps {
  categories: { name: string; count: number }[];
  active: string;
  onSelect: (category: string) => void;
  /**
   * Elemento fijo antes de las chips, dentro de la misma fila con scroll
   * (patrón app estándar: mini-preview a la izquierda de las categorías,
   * ver `TraitLabModule.tsx`). Comparte el `px-4` de la fila para no
   * duplicar padding.
   */
  leading?: ReactNode;
}

export function CategoryChips({ categories, active, onSelect, leading }: CategoryChipsProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [query, setQuery] = useState('');

  const grouped = categories.length > VISIBLE_LIMIT + 1;
  const visible = grouped ? categories.slice(0, VISIBLE_LIMIT) : categories;
  const rest = grouped ? categories.slice(VISIBLE_LIMIT) : [];
  const activeInRest = rest.some((c) => c.name === active);

  const filteredRest = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rest;
    return rest.filter((c) => c.name.toLowerCase().includes(q));
  }, [rest, query]);

  return (
    <>
      <div className="scroll flex items-center gap-2 overflow-x-auto px-4 pb-2.5 pt-3.5" style={{ scrollbarWidth: 'none' }}>
        {leading}
        {visible.map((cat) => (
          <Chip key={cat.name} selected={active === cat.name} count={cat.count} onClick={() => onSelect(cat.name)}>
            {cat.name}
          </Chip>
        ))}
        {grouped ? (
          <Chip selected={activeInRest} onClick={() => setMoreOpen(true)} data-testid="traitlab-more-categories">
            {activeInRest ? active : 'More'}
          </Chip>
        ) : null}
      </div>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen} title="Categories">
        <div className="flex items-center gap-2 rounded-[var(--r-md)] border-2 border-line px-3 py-2.5">
          <SearchIcon size={18} className="text-mute" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories"
            className="w-full bg-transparent text-[14px] text-fg placeholder:text-mute focus:outline-none"
          />
        </div>
        <div className="mt-3 flex flex-col gap-1 pb-2">
          {filteredRest.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => {
                onSelect(cat.name);
                setMoreOpen(false);
              }}
              className="flex items-center justify-between rounded-[var(--r-md)] px-3 py-3 text-left text-[15px] text-fg hover:bg-line/40"
            >
              {cat.name}
              <span className="text-mute">{cat.count}</span>
            </button>
          ))}
          {filteredRest.length === 0 ? <p className="px-3 py-2 text-sm text-mute">No categories found.</p> : null}
        </div>
      </Sheet>
    </>
  );
}
