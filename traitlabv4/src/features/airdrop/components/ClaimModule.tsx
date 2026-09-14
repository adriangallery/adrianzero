/**
 * /claim — Cubist Souls → $ZERO (plan A4b-2, sistema de diseño D11).
 * Estados: sin wallet · no elegible · elegible (importe + botón) · ya reclamado ·
 * aún cerrado · lista desalineada con la raíz on-chain.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatUnits } from 'viem';
import { ExternalLink, Sparkles } from 'lucide-react';
import { Badge, Button, Card, Skeleton, WalletSheet } from '@/ui';
import { BLOCK_EXPLORER_URL } from '@/config/contracts';
import { humanError, isUserRejection } from '@/lib/web3/humanError';
import { useNotifications } from '@/hooks/useNotifications';
import { useCubistAirdrop } from '../hooks/useCubistAirdrop';
import { formatZero } from '../lib/eligibility';

export function ClaimModule() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const airdrop = useCubistAirdrop();
  const [walletOpen, setWalletOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { view, entry, list, pending, txHash } = airdrop;
  const amount = entry ? formatZero(entry.amountZero) : null;
  const total = list ? formatZero(formatUnits(BigInt(list.totalAmount), 18)) : null;
  const busy = pending !== 'idle';

  const onClaim = async () => {
    setError(null);
    try {
      const hash = await airdrop.claim();
      notifications.success('ZERO claimed', amount ? `${amount} ZERO` : '', true, hash);
    } catch (e) {
      if (!isUserRejection(e)) setError(humanError(e));
    }
  };

  const ctaLabel =
    pending === 'checking' ? 'Checking…' : pending === 'signing' ? 'Confirm in your wallet…' : pending === 'confirming' ? 'Claiming…' : `Claim ${amount} ZERO`;

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-4 pb-8 pt-4" data-testid="claim-page">
      <header className="flex flex-col gap-2">
        <Badge tone="acc" className="self-start">Cubist Souls × ZERO</Badge>
        <h1 className="font-ui text-[24px] font-bold leading-tight text-fg">Claim your ZERO</h1>
        <p className="text-[14px] leading-relaxed text-mute">
          {list && total ? `${list.totalRecipients} Cubist Souls holders share ${total} ZERO. ` : 'Cubist Souls holders get ZERO on Base. '}
          Use the same wallet that holds your Souls.
        </p>
      </header>

      {view === 'disconnected' && (
        <Card className="flex flex-col items-center gap-3 p-6 text-center">
          <Sparkles className="h-10 w-10 text-acc" />
          <p className="font-ui text-[16px] font-bold text-fg">Is your wallet on the list?</p>
          <p className="text-[14px] text-mute">Connect the wallet that holds your Cubist Souls.</p>
          <Button size="lg" full onClick={() => setWalletOpen(true)}>Connect wallet</Button>
        </Card>
      )}

      {view === 'loading' && (
        <Card className="flex flex-col gap-3 p-6">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-12 w-full" />
        </Card>
      )}

      {view === 'error' && (
        <div className="rounded-[var(--r-md)] border-2 border-bad bg-bad/10 p-4 text-[14px] text-bad">
          Couldn&apos;t read the claim status.{' '}
          <button type="button" className="underline" onClick={airdrop.refetch}>Retry</button>
        </div>
      )}

      {view === 'not-eligible' && (
        <Card className="flex flex-col gap-3 p-6">
          <p className="font-ui text-[16px] font-bold text-fg">This wallet isn&apos;t on the list</p>
          <p className="text-[14px] leading-relaxed text-mute">
            The snapshot was taken on 12 Sep 2026. Souls live on Ethereum; the ZERO is claimed on Base with that same address.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" full onClick={() => setWalletOpen(true)}>Switch wallet</Button>
            <a
              href="https://cubistsouls.com"
              target="_blank"
              rel="noreferrer"
              className="font-ui inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--r-md)] text-[15px] font-bold text-fg hover:bg-panel"
            >
              Cubist Souls <ExternalLink className="h-4 w-4 text-acc" />
            </a>
          </div>
        </Card>
      )}

      {entry && (view === 'ready' || view === 'closed' || view === 'claimed' || view === 'root-mismatch') && (
        <Card className="flex flex-col gap-4 p-6" data-testid="claim-allocation">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] text-mute">Your allocation</p>
              <p className="font-ui text-[40px] font-bold leading-none text-acc">
                {amount} <span className="text-[16px] text-fg">ZERO</span>
              </p>
              <p className="mt-1 text-[13px] text-mute">For {entry.souls} {entry.souls === 1 ? 'Soul' : 'Souls'}</p>
            </div>
            {view === 'claimed' && <Badge tone="ok">Claimed</Badge>}
            {view === 'closed' && <Badge tone="warn">Opens soon</Badge>}
          </div>

          {view === 'ready' && (
            <>
              <Button size="lg" full loading={busy} onClick={onClaim} data-testid="claim-cta">{ctaLabel}</Button>
              <p className="text-center text-[13px] text-mute">1 signature · Base · you only pay gas</p>
            </>
          )}
          {view === 'closed' && (
            <Button size="lg" full disabled>Claim isn&apos;t open yet</Button>
          )}
          {view === 'root-mismatch' && (
            <p className="rounded-[var(--r-md)] border-2 border-warn bg-warn/10 p-3 text-[14px] text-warn">
              The claim list is being updated. Try again in a little while.
            </p>
          )}
          {view === 'claimed' && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="lg" full onClick={() => navigate('/shop')}>Spend it in the Shop</Button>
              <Button size="lg" variant="secondary" full onClick={() => navigate('/mint')}>Get a ZERO</Button>
            </div>
          )}

          {error && (
            <p className="rounded-[var(--r-md)] border-2 border-bad bg-bad/10 p-3 text-[14px] text-bad" role="alert">{error}</p>
          )}
          {txHash && (
            <a
              href={`${BLOCK_EXPLORER_URL}/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 self-center text-[13px] text-mute underline"
            >
              View transaction <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </Card>
      )}

      <WalletSheet open={walletOpen} onOpenChange={setWalletOpen} />
    </div>
  );
}
