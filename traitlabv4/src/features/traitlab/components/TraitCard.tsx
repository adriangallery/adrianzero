/**
 * Tarjeta de trait del grid de 3 columnas del editor TraitLab.
 * Estados: probando (borde acento + check), equipado, ×N, bloqueado
 * (opacidad + motivo) — ver `lib/traitCardState.ts` para la lógica pura.
 * Recon §6.6/§6.7: nombre YA NO se trunca a 50px — 2 líneas con `line-clamp-2`,
 * y la tarjeta entera es el área táctil (≥44px, recon §6.7 sobre los botones
 * de 10-11px de antes).
 */

import { Link } from 'react-router-dom';
import { cn, CheckIcon, LockIcon } from '@/ui';
import type { Trait } from '@/types/nft.types';
import type { TraitCardState } from '../lib/traitCardState';

export interface TraitCardProps {
  trait: Trait;
  state: TraitCardState;
  onSelect: (trait: Trait) => void;
}

function traitImageUrl(trait: Trait): string | undefined {
  return trait.image?.cachedUrl || trait.image?.thumbnailUrl || trait.image?.originalUrl || trait.metadata?.image;
}

export function TraitCard({ trait, state, onSelect }: TraitCardProps) {
  const imageUrl = traitImageUrl(trait);
  const locked = state.kind === 'locked';

  return (
    <button
      type="button"
      data-testid="traitlab-trait-card"
      data-state={state.kind}
      onClick={() => !locked && onSelect(trait)}
      disabled={locked}
      className={cn(
        'relative flex min-h-[44px] flex-col gap-1.5 rounded-[var(--r-lg)] border-2 bg-panel p-2 text-left transition-colors',
        state.kind === 'testing' ? 'border-acc' : 'border-line',
        locked && 'cursor-not-allowed opacity-45'
      )}
    >
      {state.kind === 'testing' ? (
        <span className="absolute right-1.5 top-1.5 grid h-[18px] w-[18px] place-items-center rounded-full bg-acc">
          <CheckIcon size={12} className="text-acc-fg" />
        </span>
      ) : null}

      <div className="aspect-square w-full overflow-hidden rounded-[var(--r-md)] bg-bg">
        {imageUrl ? (
          <img src={imageUrl} alt={trait.name} loading="lazy" className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="text-[12px] font-medium leading-tight line-clamp-2 min-h-[28px]">{trait.name}</div>

      {state.kind === 'testing' ? <span className="text-[11px] text-acc">Testing</span> : null}
      {state.kind === 'equipped' ? <span className="text-[11px] text-mute">Equipped</span> : null}
      {state.kind === 'owned' && state.count > 1 ? <span className="text-[11px] text-mute">×{state.count}</span> : null}
      {state.kind === 'locked' ? (
        <span className="flex items-center gap-1 text-[11px] text-mute">
          <LockIcon size={11} />
          {state.reason}
        </span>
      ) : null}
    </button>
  );
}

/** Última celda del grid: enlace al Shop cuando una categoría no tiene más traits que ofrecer. */
export function GetMoreInShopCard() {
  return (
    <Link
      to="/shop"
      data-testid="traitlab-get-more-card"
      className="flex min-h-[44px] flex-col items-center justify-center gap-1.5 rounded-[var(--r-lg)] border-2 border-dashed border-line p-2 text-center text-[12px] text-mute hover:border-mute"
    >
      <span className="grid h-5 w-5 place-items-center">+</span>
      Get more in Shop
    </Link>
  );
}

