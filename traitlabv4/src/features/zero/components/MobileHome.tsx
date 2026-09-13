/**
 * Home móvil (F8, maqueta Home.dc.html): tu último ZERO con UNA acción,
 * una sola novedad con fecha, y cuatro destinos con una frase cada uno.
 * Nada de vídeo de fondo ni marquesinas: en el móvil el primer píxel es
 * tu token y el botón de editarlo (auditoría visual 13-sep: la Home vieja
 * abría con una pantalla entera vacía).
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ChevronRight, DollarSign, Gamepad2, ShoppingBag, Sword } from 'lucide-react';
import { Button, WalletSheet } from '@/ui';
import { getGitHubImageUrl } from '@/config/images';
import { useAdrianZeroTokens } from '@/features/adrianzero/hooks/useAdrianZeroTokens';
import { useEquippedTraitIds } from '@/features/traitlab/hooks/useEquippedTraits';
import { getLastUsedTokenId } from '@/features/traitlab/lib/tokenHistory';
import { editRouteFor } from '@/lib/editRoute';
import { NOW } from '../data/now';

const EXPLORE: { label: string; blurb: string; to: string; external?: boolean; icon: React.ReactNode }[] = [
  { label: 'Adventure', blurb: 'A point-and-click on Base.', to: '/adventure/', external: true, icon: <Gamepad2 className="h-5 w-5" /> },
  { label: 'Shop', blurb: 'Traits, packs and serums.', to: '/shop', icon: <ShoppingBag className="h-5 w-5" /> },
  { label: 'Budokai', blurb: 'The tournament is open.', to: '/budokai', icon: <Sword className="h-5 w-5" /> },
  { label: 'Buy $ZERO', blurb: 'With ETH, in one step.', to: '/buy', icon: <DollarSign className="h-5 w-5" /> },
];

export function MobileHome() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { data: tokens, isLoading } = useAdrianZeroTokens();
  const [walletOpen, setWalletOpen] = useState(false);

  // Tu ZERO: el último que editaste si sigue siendo tuyo; si no, el primero.
  const last = getLastUsedTokenId();
  const heroToken = isConnected
    ? tokens.find((t) => t.tokenId === last) ?? tokens[0]
    : undefined;
  const heroId = heroToken?.tokenId ?? null;
  const { appliedTraitIds } = useEquippedTraitIds(heroId);
  const equippedCount = appliedTraitIds.filter((id) => id !== '0').length;

  const heroImage =
    heroToken?.image?.cachedUrl || heroToken?.image?.originalUrl || heroToken?.metadata?.image || getGitHubImageUrl('zeronaked.png');

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-4" data-testid="mobile-home">
      {/* Hero: tu último token, una acción */}
      <section className="rounded-[var(--r-lg)] border-2 border-line bg-panel p-4">
        <div className="flex items-center gap-4">
          <div className="h-[88px] w-[88px] flex-none overflow-hidden rounded-[var(--r-md)] border-2 border-line bg-line">
            {isLoading && isConnected ? (
              <div className="h-full w-full shimmer" />
            ) : (
              <img src={heroImage} alt="" className="h-full w-full object-contain" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {isConnected && heroToken ? (
              <>
                <p className="text-[13px] text-mute">Your ZERO</p>
                <p className="font-display text-[18px] leading-tight text-acc">#{heroToken.tokenId}</p>
                <p className="mt-1 text-[13px] text-mute">
                  {equippedCount} trait{equippedCount === 1 ? '' : 's'} equipped
                  {tokens.length > 1 ? ` · ${tokens.length} ZEROs` : ''}
                </p>
              </>
            ) : isConnected ? (
              <>
                <p className="text-[13px] text-mute">No ZERO yet</p>
                <p className="font-display text-[14px] leading-tight text-fg">Mint your first</p>
                <p className="mt-1 text-[13px] text-mute">Your NFT, your rules. Live on Base.</p>
              </>
            ) : (
              <>
                <p className="text-[13px] text-mute">AdrianZERO</p>
                <p className="font-display text-[14px] leading-tight text-fg">Your NFT, your rules</p>
                <p className="mt-1 text-[13px] text-mute">Mint it, dress it, evolve it on Base.</p>
              </>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {isConnected && heroToken ? (
            <Button size="lg" full onClick={() => navigate(editRouteFor(heroToken.tokenId))}>
              Open in TraitLab
            </Button>
          ) : (
            <>
              <Button size="lg" full onClick={() => navigate('/mint')}>
                Mint your ZERO
              </Button>
              {!isConnected ? (
                <Button size="md" variant="secondary" full onClick={() => setWalletOpen(true)}>
                  Connect wallet
                </Button>
              ) : null}
            </>
          )}
        </div>
      </section>

      {/* Novedad: una sola, con fecha */}
      <section className="flex flex-col gap-2">
        <h2 className="font-ui text-[13px] text-mute">{NOW.when}</h2>
        <Link
          to={NOW.to}
          className="flex items-center justify-between gap-3 rounded-[var(--r-lg)] border-2 border-acc/60 bg-panel p-4 shadow-[0_0_24px_rgba(0,255,0,0.12)]"
        >
          <div className="min-w-0">
            <p className="font-ui text-[15px] font-bold text-fg">{NOW.title}</p>
            <p className="mt-0.5 text-[13px] text-mute">{NOW.body}</p>
          </div>
          <ChevronRight className="h-5 w-5 flex-none text-acc" />
        </Link>
      </section>

      {/* Destinos: 2×2, una frase cada uno */}
      <section className="flex flex-col gap-2">
        <h2 className="font-ui text-[13px] text-mute">Explore</h2>
        <div className="grid grid-cols-2 gap-3">
          {EXPLORE.map((d) => {
            const inner = (
              <>
                <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-line text-acc">{d.icon}</span>
                <span className="font-ui mt-3 block text-[14px] font-bold text-fg">{d.label}</span>
                <span className="mt-0.5 block text-[12px] text-mute">{d.blurb}</span>
              </>
            );
            const cls = 'block rounded-[var(--r-lg)] border-2 border-line bg-panel p-3 transition-colors hover:border-mute';
            return d.external ? (
              <a key={d.label} href={d.to} className={cls}>
                {inner}
              </a>
            ) : (
              <Link key={d.label} to={d.to} className={cls}>
                {inner}
              </Link>
            );
          })}
        </div>
      </section>

      <WalletSheet open={walletOpen} onOpenChange={setWalletOpen} />
    </div>
  );
}
