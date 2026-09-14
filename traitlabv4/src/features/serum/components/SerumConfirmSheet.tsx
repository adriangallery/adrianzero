/**
 * Hoja de confirmación de serum (F6, patrón elegir → ver → confirmar).
 *
 * Lo que dice el contrato (`adrianserummodule.sol` L116–136): hay que ser
 * dueño del ZERO, que sea elegible para mutación, tener el serum y no
 * haberlo usado ya en ese token; el éxito es probabilístico según la
 * potencia y **el serum se quema aunque la mutación falle**. Esa última
 * frase tiene que verse antes de firmar.
 */

import { useReadContract } from 'wagmi';
import { Button, Sheet } from '@/ui';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { SERUM_ABI } from '@/lib/web3/abi';
import type { AdrianZeroToken, Serum } from '@/types/nft.types';

export interface SerumConfirmSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: AdrianZeroToken | null;
  serum: Serum | null;
  pending: boolean;
  onConfirm: () => void;
}

const SERUM = CONTRACT_ADDRESSES.SERUM_MODULE as `0x${string}`;

export function SerumConfirmSheet({ open, onOpenChange, token, serum, pending, onConfirm }: SerumConfirmSheetProps) {
  const serumId = serum ? BigInt(serum.tokenId) : undefined;
  const tokenId = token ? BigInt(token.tokenId) : undefined;

  const { data: info } = useReadContract({
    address: SERUM,
    abi: SERUM_ABI,
    functionName: 'getSerumInfo',
    args: serumId !== undefined ? [serumId] : undefined,
    query: { enabled: open && serumId !== undefined, staleTime: 5 * 60_000 },
  });
  const { data: alreadyUsed } = useReadContract({
    address: SERUM,
    abi: SERUM_ABI,
    functionName: 'serumUsedOnToken',
    args: serumId !== undefined && tokenId !== undefined ? [serumId, tokenId] : undefined,
    query: { enabled: open && serumId !== undefined && tokenId !== undefined },
  });

  const [targetMutation, potency] = (info as readonly [string, bigint] | undefined) ?? ['', 0n];
  const chance = Math.min(100, Number(potency));
  const tokenImage = token?.image?.cachedUrl || token?.image?.originalUrl || token?.metadata?.image || '';
  const serumImage = serum?.image?.cachedUrl || serum?.image?.thumbnailUrl || serum?.image?.originalUrl || '';
  const used = alreadyUsed === true;

  return (
    <Sheet open={open} onOpenChange={(o) => (pending ? null : onOpenChange(o))} title="Use serum">
      {token && serum ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-3">
            <Thumb src={tokenImage} label={`ZERO #${token.tokenId}`} />
            <span className="font-ui text-[18px] text-mute" aria-hidden>+</span>
            <Thumb src={serumImage} label={serum.name} />
          </div>

          <dl className="flex flex-col gap-2 rounded-[var(--r-md)] border-2 border-line p-3 text-[14px]">
            <Row label="Mutation">{targetMutation || '…'}</Row>
            <Row label="Success chance">{potency > 0n ? `${chance}%` : '…'}</Row>
            <Row label="Cost">1 × {serum.name} (you have {serum.balance})</Row>
            <Row label="Signatures">1 · Base</Row>
          </dl>

          <p className="rounded-[var(--r-md)] border-2 border-warn/60 bg-warn/10 p-3 text-[14px] text-fg">
            The serum is burned even if the mutation doesn&apos;t take. This can&apos;t be undone.
          </p>

          {used ? (
            <p className="text-[14px] text-bad">This serum was already used on ZERO #{token.tokenId}. Pick another ZERO or serum.</p>
          ) : null}

          <Button size="lg" full loading={pending} disabled={pending || used} onClick={onConfirm}>
            {pending ? 'Confirm in your wallet…' : `Use ${serum.name} on #${token.tokenId}`}
          </Button>
        </div>
      ) : null}
    </Sheet>
  );
}

function Thumb({ src, label }: { src: string; label: string }) {
  return (
    <div className="flex w-28 flex-col items-center gap-1.5">
      <div className="h-24 w-24 overflow-hidden rounded-[var(--r-md)] border-2 border-line bg-line">
        {src ? <img src={src} alt="" className="h-full w-full object-contain" /> : null}
      </div>
      <span className="font-ui w-full truncate text-center text-[12px] text-fg">{label}</span>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-mute">{label}</dt>
      <dd className="text-right text-fg">{children}</dd>
    </div>
  );
}
