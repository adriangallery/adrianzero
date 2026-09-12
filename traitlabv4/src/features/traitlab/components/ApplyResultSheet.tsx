/**
 * Hoja de éxito tras aplicar cambios: render final, enlace a BaseScan y
 * compartir. `navigator.share` con fallback a intent de X — no hay un
 * componente OG reutilizable en este repo (v3/v4 no lo tienen), así que
 * se monta directo sobre el render público de AdrianLAB.
 */

import { Sheet, Button, ShareIcon, ExternalLinkIcon } from '@/ui';
import { getTxExplorerUrl } from '@/config/contracts';
import { useNotifications } from '@/hooks/useNotifications';

export interface ApplyResultSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenId: string;
  txHash: string;
}

export function ApplyResultSheet({ open, onOpenChange, tokenId, txHash }: ApplyResultSheetProps) {
  const notifications = useNotifications();
  const renderUrl = `https://adrianlab.vercel.app/api/render/${tokenId}.png`;
  const pageUrl = `https://adrianzero.com/traitlab?token=${tokenId}`;
  const shareText = `I just customized my AdrianZERO #${tokenId} in TraitLab`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: pageUrl });
        return;
      } catch {
        // El usuario canceló el share nativo — cae al intent de X.
      }
    }
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`;
    window.open(intent, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      notifications.success('Link copied', 'Share it anywhere', true);
    } catch {
      notifications.error('Could not copy link', 'Copy it manually from the address bar', true);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Changes applied">
      <div className="flex flex-col items-center gap-4 py-2">
        <img
          src={renderUrl}
          alt={`ZERO #${tokenId} updated`}
          className="aspect-square w-48 rounded-[var(--r-lg)] border-2 border-line bg-bg object-cover"
        />
        <p className="text-center text-sm text-mute">
          AdrianZERO #{tokenId} is now on-chain with its new look.
        </p>

        <div className="flex w-full flex-col gap-2.5">
          <Button full onClick={handleShare} trailing={<ShareIcon size={16} />}>
            Share
          </Button>
          <Button full variant="secondary" onClick={handleCopyLink}>
            Copy link
          </Button>
          <a
            href={getTxExplorerUrl(txHash)}
            target="_blank"
            rel="noreferrer noopener"
            className="flex h-11 w-full items-center justify-center gap-1.5 text-[13px] font-medium text-acc hover:underline"
          >
            View on BaseScan
            <ExternalLinkIcon size={14} />
          </a>
        </div>
      </div>
    </Sheet>
  );
}
