/**
 * /drop/:assetId — landing de un drop del ShopFacet (primer uso: «Beta Tester
 * Cap», test de lanzamiento del 14-sep-2026). Pensada para mandar un enlace:
 * se ve el trait, cuántos quedan y un botón. Reclamar gratis si la wallet tiene
 * cupo (`freeRemaining`), si no, comprar en la Shop.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Gift } from 'lucide-react';
import { Badge, Button, Card, Skeleton, WalletSheet } from '@/ui';
import { BLOCK_EXPLORER_URL, CHAIN_ID, CONTRACT_ADDRESSES } from '@/config/contracts';
import { SHOP_FACET_ABI } from '@/lib/web3/abi';
import { humanError, isUserRejection } from '@/lib/web3/humanError';
import { useNotifications } from '@/hooks/useNotifications';
import { useShopPurchase } from '@/features/shop/hooks/useShopPurchase';
import { adrianlabUrl } from '@/lib/adrianlab';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

interface ItemView {
  assetId: bigint;
  quantityAvailable: bigint;
  sold: bigint;
  active: boolean;
  hasAllowlist: boolean;
  freeRemaining: bigint;
  isAllowlisted: boolean;
  userPurchases: bigint;
}

interface LabMetadata {
  name?: string;
  description?: string;
  image?: string;
}

type DropView = 'loading' | 'missing' | 'owned' | 'soldout' | 'closed' | 'disconnected' | 'invite-only' | 'free' | 'buy';

export function DropModule() {
  const params = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const { address, isConnected } = useAccount();
  const [walletOpen, setWalletOpen] = useState(false);
  const assetId = Number(params.assetId);
  const valid = Number.isInteger(assetId) && assetId > 0;

  const item = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: SHOP_FACET_ABI,
    functionName: 'getShopItemView',
    args: [BigInt(valid ? assetId : 0), (address ?? ZERO_ADDRESS) as `0x${string}`],
    chainId: CHAIN_ID,
    query: { enabled: valid },
  });

  const meta = useQuery({
    queryKey: ['lab-metadata', assetId],
    enabled: valid,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const res = await fetch(adrianlabUrl(`/api/metadata/floppy/${assetId}.json`));
      if (!res.ok) throw new Error(`metadata ${res.status}`);
      return (await res.json()) as LabMetadata;
    },
  });

  const purchase = useShopPurchase();

  useEffect(() => {
    if (!purchase.isConfirmed) return;
    item.refetch();
    notifications.success('Claimed', meta.data?.name ?? `Trait #${assetId}`, true, purchase.txHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchase.isConfirmed]);

  const data = item.data as ItemView | undefined;
  const qty = data ? Number(data.quantityAvailable) : 0;
  const remaining = data ? Math.max(0, qty - Number(data.sold)) : 0;

  let view: DropView = 'loading';
  if (!valid) view = 'missing';
  else if (item.isLoading) view = 'loading';
  else if (!data || data.assetId === 0n) view = 'missing';
  else if (isConnected && data.userPurchases > 0n) view = 'owned';
  else if (remaining === 0) view = 'soldout';
  else if (!data.active) view = 'closed';
  else if (!isConnected) view = 'disconnected';
  else if (data.hasAllowlist && !data.isAllowlisted) view = 'invite-only';
  else if (data.freeRemaining > 0n) view = 'free';
  else view = 'buy';

  const name = meta.data?.name && !/^(TRAIT|FLOPPY) #/.test(meta.data.name) ? meta.data.name : `Trait #${assetId}`;
  const image = adrianlabUrl(`/api/render/floppy/${assetId}.png`);
  const busy = purchase.isPending || (!!purchase.txHash && !purchase.isConfirmed && !purchase.error);
  const error = purchase.error && !isUserRejection(purchase.error) ? humanError(purchase.error) : null;

  const claimFree = () => purchase.batchPurchase([{ assetId, quantity: 1, useFree: true }], 'ZERO');

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-4 pb-8 pt-4" data-testid="drop-page">
      <header className="flex flex-col gap-2">
        <Badge tone="acc" className="self-start">
          <Gift className="h-3.5 w-3.5" /> Drop
        </Badge>
        {meta.isLoading ? <Skeleton className="h-7 w-2/3" /> : <h1 className="font-ui text-[24px] font-bold leading-tight text-fg">{name}</h1>}
        {meta.data?.description && <p className="text-[14px] leading-relaxed text-mute">{meta.data.description}</p>}
      </header>

      <Card className="overflow-hidden">
        <div className="aspect-square w-full bg-line">
          {valid && <img src={image} alt={name} className="h-full w-full object-contain [image-rendering:pixelated]" />}
        </div>
        <div className="flex items-center justify-between gap-3 border-t-2 border-line px-4 py-3">
          <span className="text-[13px] text-mute">{data && data.assetId !== 0n ? `${remaining} of ${qty} left` : ' '}</span>
          {view === 'owned' && <Badge tone="ok">In your wallet</Badge>}
          {view === 'soldout' && <Badge tone="mute">All claimed</Badge>}
          {view === 'free' && <Badge tone="ok">1 free for you</Badge>}
        </div>
      </Card>

      {view === 'loading' && <Skeleton className="h-12 w-full" />}

      {view === 'missing' && (
        <Card className="p-5 text-[14px] text-mute">This drop isn&apos;t live yet. Check back soon.</Card>
      )}

      {view === 'closed' && (
        <Card className="p-5 text-[14px] text-mute">This drop is closed.</Card>
      )}

      {view === 'disconnected' && (
        <Button size="lg" full onClick={() => setWalletOpen(true)}>Connect wallet to claim</Button>
      )}

      {view === 'invite-only' && (
        <Card className="flex flex-col gap-2 p-5">
          <p className="font-ui text-[15px] font-bold text-fg">Invite only</p>
          <p className="text-[14px] text-mute">This wallet isn&apos;t on the list for this drop.</p>
          <Button variant="secondary" full onClick={() => setWalletOpen(true)}>Switch wallet</Button>
        </Card>
      )}

      {view === 'free' && (
        <>
          <Button size="lg" full loading={busy} onClick={claimFree} data-testid="drop-claim">
            {purchase.isPending ? 'Confirm in your wallet…' : busy ? 'Claiming…' : 'Claim for free'}
          </Button>
          <p className="text-center text-[13px] text-mute">1 signature · Base · you only pay gas</p>
        </>
      )}

      {view === 'buy' && (
        <Button size="lg" full onClick={() => navigate('/shop?tab=traits')}>Get it in the Shop</Button>
      )}

      {view === 'owned' && (
        <Button size="lg" full onClick={() => navigate('/traitlab')}>Equip it in TraitLab</Button>
      )}

      {error && (
        <p className="rounded-[var(--r-md)] border-2 border-bad bg-bad/10 p-3 text-[14px] text-bad" role="alert">{error}</p>
      )}
      {purchase.txHash && (
        <a
          href={`${BLOCK_EXPLORER_URL}/tx/${purchase.txHash}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 self-center text-[13px] text-mute underline"
        >
          View transaction <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      <Link to="/shop" className="self-center text-[13px] text-mute underline">Browse the Shop</Link>
      <WalletSheet open={walletOpen} onOpenChange={setWalletOpen} />
    </div>
  );
}
