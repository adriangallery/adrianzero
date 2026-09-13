/**
 * Hoja "Cambiar token": grid de los ZEROs del usuario con render de
 * AdrianLAB, búsqueda por número, último usado recordado (localStorage,
 * `lib/tokenHistory.ts`) y estado vacío con CTA a /mint.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, Button, SearchIcon } from '@/ui';
import { useAdrianZeroTokens } from '@/features/adrianzero/hooks/useAdrianZeroTokens';
import { getLastUsedTokenId } from '../lib/tokenHistory';

export interface TokenSelectorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (tokenId: string) => void;
}

export function TokenSelectorSheet({ open, onOpenChange, onSelect }: TokenSelectorSheetProps) {
  const navigate = useNavigate();
  const { data: tokens = [], isLoading } = useAdrianZeroTokens();
  const [query, setQuery] = useState('');

  const sorted = useMemo(() => {
    const lastUsed = getLastUsedTokenId();
    return [...tokens].sort((a, b) => {
      if (a.tokenId === lastUsed) return -1;
      if (b.tokenId === lastUsed) return 1;
      return Number(a.tokenId) - Number(b.tokenId);
    });
  }, [tokens]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return sorted;
    return sorted.filter((t) => t.tokenId.includes(q));
  }, [sorted, query]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Choose a ZERO">
      {tokens.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-mute">You don't own any AdrianZERO yet.</p>
          <Button onClick={() => navigate('/mint')}>Mint your first ZERO</Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-[var(--r-md)] border-2 border-line px-3 py-2.5">
            <SearchIcon size={18} className="text-mute" />
            <input
              type="text"
              inputMode="numeric"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by number"
              className="w-full bg-transparent text-[14px] text-fg placeholder:text-mute focus:outline-none"
              data-testid="traitlab-token-search"
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2.5 pb-2">
            {filtered.map((token) => (
              <button
                key={token.tokenId}
                type="button"
                data-testid="traitlab-token-option"
                onClick={() => onSelect(token.tokenId)}
                className="flex flex-col items-center gap-1.5 rounded-[var(--r-lg)] border-2 border-line bg-panel p-2 hover:border-mute"
              >
                <img
                  src={token.image?.cachedUrl || token.image?.originalUrl || `https://adrianlab.vercel.app/api/render/${token.tokenId}.png`}
                  alt={`ZERO #${token.tokenId}`}
                  loading="lazy"
                  className="aspect-square w-full rounded-[var(--r-md)] bg-bg object-cover"
                />
                <span className="text-[12px] font-medium">#{token.tokenId}</span>
              </button>
            ))}
            {filtered.length === 0 ? (
              <p className="col-span-3 py-6 text-center text-sm text-mute">No ZERO matches "{query}".</p>
            ) : null}
          </div>
        </>
      )}
    </Sheet>
  );
}
