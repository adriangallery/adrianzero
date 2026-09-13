/**
 * Sección Packs (F5, maqueta Packs.dc.html) — «antes teníamos una sección
 * para los packs para abrirlos, es una sección muy importante» (Adrián,
 * 13-sep). Tus packs sin abrir (balance ERC-1155 real), «Open» por fila,
 * hoja de apertura con reveal y «Equip on #X now». Comprar → Shop (Packs).
 * Sirve como página `/packs` y embebida en Mis NFTs (`embedded`).
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ChevronRight, Package } from 'lucide-react';
import { Button, Skeleton, WalletSheet } from '@/ui';
import { useWalletDataStore } from '@/stores/walletDataStore';
import { useAdrianZeroTokens } from '@/features/adrianzero/hooks/useAdrianZeroTokens';
import { getLastUsedTokenId } from '@/features/traitlab/lib/tokenHistory';
import { useMyPacks } from '../data/useMyPacks';
import { usePackCatalog } from '../data/usePackCatalog';
import type { OwnedPack } from '../data/types';
import { packDisplay, PACK_IMAGE_FALLBACK, type PackDisplay } from '../lib/packDisplay';
import { PackOpenSheet } from './PackOpenSheet';

export function PacksSection({ embedded = false }: { embedded?: boolean }) {
  const { address, isConnected } = useAccount();
  const { data: owned, isLoading, error, refetch } = useMyPacks(address);
  const catalog = usePackCatalog();
  const traitsMetadata = useWalletDataStore((s) => s.traitsMetadata);
  const { data: zeros } = useAdrianZeroTokens();
  const [selected, setSelected] = useState<OwnedPack | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  const rows = useMemo(
    () =>
      owned
        .map((p) => ({ pack: p, display: packDisplay(p.packId, catalog.data, traitsMetadata) }))
        .sort((a, b) => (a.pack.openContract ? 0 : 1) - (b.pack.openContract ? 0 : 1) || a.display.name.localeCompare(b.display.name)),
    [owned, catalog.data, traitsMetadata]
  );

  const equipTokenId = useMemo(() => {
    if (!isConnected) return null;
    const last = getLastUsedTokenId();
    return zeros.find((z) => z.tokenId === last)?.tokenId ?? zeros[0]?.tokenId ?? null;
  }, [isConnected, zeros]);

  const selectedDisplay: PackDisplay | null = selected ? packDisplay(selected.packId, catalog.data, traitsMetadata) : null;
  const totalPacks = owned.reduce((n, p) => n + Number(p.balance), 0);

  return (
    <div className={`flex flex-col gap-3 ${embedded ? '' : 'px-4 pb-6 pt-4'}`} data-testid="packs-section">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-ui text-[15px] font-bold text-fg">Packs</h1>
          <p className="text-[13px] text-mute">
            {!isConnected ? 'Open packs, get traits, equip them.' : isLoading ? 'Checking your packs…' : totalPacks === 0 ? 'No unopened packs' : `${totalPacks} unopened`}
          </p>
        </div>
        <Link to="/shop?tab=floppies" className="font-ui inline-flex flex-none items-center gap-1 whitespace-nowrap rounded-full border-2 border-line px-3.5 py-2 text-[13px] text-fg hover:border-mute">
          Get packs <ChevronRight className="h-4 w-4 text-acc" />
        </Link>
      </div>

      {!isConnected ? (
        <div className="flex flex-col items-center gap-3 rounded-[var(--r-lg)] border-2 border-line bg-panel p-6 text-center">
          <Package className="h-10 w-10 text-acc" />
          <p className="font-ui text-[15px] text-fg">Your packs live in your wallet</p>
          <p className="text-[13px] text-mute">Connect to see what you can open. Each pack drops traits you can equip on your ZERO.</p>
          <Button size="lg" full onClick={() => setWalletOpen(true)}>Connect wallet</Button>
        </div>
      ) : error ? (
        <div className="rounded-[var(--r-md)] border-2 border-bad bg-bad/10 p-3 text-[14px] text-bad">
          Could not read your packs. <button type="button" className="underline" onClick={() => refetch()}>Retry</button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-[12px] border-2 border-line bg-panel p-3">
              <Skeleton className="h-14 w-14 rounded-[8px]" />
              <div className="flex flex-1 flex-col gap-2"><Skeleton className="h-3.5 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
              <Skeleton className="h-10 w-16" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[var(--r-lg)] border-2 border-dashed border-line p-6 text-center">
          <Package className="h-10 w-10 text-mute" />
          <p className="font-ui text-[15px] text-fg">No packs to open</p>
          <p className="text-[13px] text-mute">Packs drop traits for your ZERO. Grab one in the Shop.</p>
          <Link to="/shop?tab=floppies" className="w-full"><Button size="lg" full>Get packs</Button></Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="packs-list">
          {rows.map(({ pack, display }) => (
            <li key={pack.packId.toString()} className="flex items-center gap-3 rounded-[12px] border-2 border-line bg-panel p-3">
              <div className="h-14 w-14 flex-none overflow-hidden rounded-[8px] bg-line">
                <img
                  src={display.image}
                  alt=""
                  className="h-full w-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    const fb = PACK_IMAGE_FALLBACK(pack.packId);
                    if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-ui text-[14px] font-bold text-fg truncate">{display.name}</p>
                <p className="text-[12px] text-mute">
                  ×{pack.balance.toString()}
                  {pack.openContract ? '' : ' · not openable yet'}
                </p>
              </div>
              <Button
                size="md"
                variant={pack.openContract ? 'primary' : 'secondary'}
                disabled={!pack.openContract}
                onClick={() => { setSelected(pack); setSheetOpen(true); }}
              >
                Open
              </Button>
            </li>
          ))}
        </ul>
      )}

      <PackOpenSheet pack={selected} display={selectedDisplay} open={sheetOpen} onOpenChange={setSheetOpen} equipTokenId={equipTokenId} />
      <WalletSheet open={walletOpen} onOpenChange={setWalletOpen} />
    </div>
  );
}
