/**
 * Hoja de apertura + reveal (F5, maqueta Packs.dc.html): «FLOPPY SUMMER ·
 * Te han tocado 3 traits», rejilla con lo obtenido (nombre, Rare · Top),
 * y tres salidas: «Equipar en #146 ahora» → TraitLab, «Guardar en
 * inventario» (cerrar) y «Ver en BaseScan». La pantalla que hoy no existe.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Badge, Button, Sheet } from '@/ui';
import { BLOCK_EXPLORER_URL } from '@/config/contracts';
import { useWalletDataStore } from '@/stores/walletDataStore';
import { isUserRejection } from '@/lib/web3/humanError';
import { useNotifications } from '@/hooks/useNotifications';
import { useOpenPack } from '../data/useOpenPack';
import type { OpenPackResult, OwnedPack } from '../data/types';
import { TRAIT_IMAGE, traitSubtitle, type PackDisplay } from '../lib/packDisplay';

export interface PackOpenSheetProps {
  pack: OwnedPack | null;
  display: PackDisplay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Token en el que ofrecer «Equip on #X now» (último usado o el primero). */
  equipTokenId: string | null;
}

type Phase = 'ready' | 'opening' | 'revealed';

const OPEN_LABEL: Record<NonNullable<OwnedPack['openContract']>, string> = {
  OPENPACK_V4: 'OpenPack v4',
  ACTION_PACKS: 'ActionPacks',
  FLOPPY_DISCS: 'FloppyDiscs',
};

export function PackOpenSheet({ pack, display, open, onOpenChange, equipTokenId }: PackOpenSheetProps) {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const traitsMetadata = useWalletDataStore((s) => s.traitsMetadata);
  const openPack = useOpenPack();
  const [phase, setPhase] = useState<Phase>('ready');
  const [result, setResult] = useState<OpenPackResult | null>(null);

  useEffect(() => {
    if (open) {
      setPhase('ready');
      setResult(null);
      openPack.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pack?.packId]);

  if (!pack || !display) return null;

  const handleOpen = async () => {
    setPhase('opening');
    try {
      const r = await openPack.mutateAsync({ packId: pack.packId });
      setResult(r);
      setPhase('revealed');
      notifications.success('Pack opened', `${r.traitIds.length} item${r.traitIds.length === 1 ? '' : 's'} added to your inventory`, true, r.txHash);
    } catch (e) {
      setPhase('ready');
      if (!isUserRejection(e)) {
        notifications.error('Could not open the pack', openPack.humanErrorMessage ?? 'Please try again', true);
      }
    }
  };

  const busy = phase === 'opening';

  return (
    <Sheet open={open} onOpenChange={(o) => (busy ? null : onOpenChange(o))} title={phase === 'revealed' ? 'You got' : 'Open pack'}>
      {phase !== 'revealed' ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            className="h-28 w-28 overflow-hidden rounded-[var(--r-lg)] border-2 border-line bg-line"
            animate={busy ? { rotate: [0, -6, 6, -4, 4, 0], scale: [1, 1.04, 1] } : { rotate: 0, scale: 1 }}
            transition={busy ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
          >
            <img src={display.image} alt="" className="h-full w-full object-contain" />
          </motion.div>
          <div>
            <p className="font-display text-[12px] leading-relaxed text-acc">{display.name.toUpperCase()}</p>
            <p className="mt-1 text-[13px] text-mute">
              You have ×{pack.balance.toString()}
              {pack.openContract ? ` · opens with ${OPEN_LABEL[pack.openContract]}` : ''}
            </p>
          </div>
          <Button
            size="lg"
            full
            loading={busy}
            disabled={busy || !pack.openContract}
            onClick={handleOpen}
            trailing={!busy ? '1 signature · Base' : undefined}
          >
            {busy ? (openPack.isPending ? 'Confirm in your wallet…' : 'Opening…') : 'Open 1 pack'}
          </Button>
          {!pack.openContract ? (
            <p className="text-[13px] text-warn">This pack has no contract configured to open it yet.</p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <p className="font-display text-[12px] leading-relaxed text-acc">{display.name.toUpperCase()}</p>
            <p className="mt-1 text-[14px] text-mute">
              You got {result?.traitIds.length ?? 0} item{(result?.traitIds.length ?? 0) === 1 ? '' : 's'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5" data-testid="pack-reveal-grid">
            {(result?.traitIds ?? []).map((id, i) => {
              const meta = traitsMetadata?.[id.toString()];
              const rare = meta?.rarity && meta.rarity !== 'common';
              const amount = result?.amounts?.[i];
              return (
                <motion.div
                  key={`${id}-${i}`}
                  initial={{ opacity: 0, y: 12, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.12 * i, type: 'spring', stiffness: 260, damping: 18 }}
                  className={`flex flex-col items-center gap-2 rounded-[12px] border-2 bg-bg p-2.5 text-center ${
                    rare ? 'border-warn shadow-[0_0_18px_rgba(248,232,72,0.25)]' : 'border-line'
                  }`}
                >
                  <div className="h-[72px] w-[72px] overflow-hidden rounded-[8px] bg-line">
                    <img src={TRAIT_IMAGE(id)} alt="" className="h-full w-full object-contain" loading="lazy" />
                  </div>
                  <p className="font-ui text-[12px] font-bold leading-tight text-fg line-clamp-2">
                    {meta?.name ?? `#${id.toString()}`}
                    {amount && amount > 1n ? ` ×${amount.toString()}` : ''}
                  </p>
                  <p className={`text-[11px] ${rare ? 'text-warn' : 'text-mute'}`}>{traitSubtitle(meta) || 'Trait'}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            {equipTokenId ? (
              <Button size="lg" full onClick={() => { onOpenChange(false); navigate(`/traitlab?token=${equipTokenId}`); }}>
                Equip on #{equipTokenId} now
              </Button>
            ) : (
              <Button size="lg" full onClick={() => { onOpenChange(false); navigate('/traitlab'); }}>
                Equip in TraitLab
              </Button>
            )}
            <Button size="md" variant="secondary" full onClick={() => onOpenChange(false)}>
              Keep in inventory
            </Button>
            {result?.txHash ? (
              <a
                href={`${BLOCK_EXPLORER_URL}/tx/${result.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1 py-2 text-[13px] text-mute hover:text-fg"
              >
                View on BaseScan <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
          {pack.balance > 1n ? (
            <Badge tone="mute" className="self-center">{(pack.balance - 1n).toString()} more to open</Badge>
          ) : null}
        </div>
      )}
    </Sheet>
  );
}
