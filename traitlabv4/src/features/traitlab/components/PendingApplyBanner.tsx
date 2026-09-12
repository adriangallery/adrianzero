/**
 * Banner "Applying… view" — se monta en `MainLayout` (fuera de /traitlab)
 * para que la tx pendiente se vea desde cualquier pestaña (deliverable F4
 * #6, recon §0.3: hoy el spinner se pierde al cambiar de tab porque
 * `MyNFTsModule` desmonta el componente que lo mostraba).
 */

import { Link } from 'react-router-dom';
import { SpinnerIcon } from '@/ui';
import { usePendingTxStore } from '../store/pendingTxStore';

export function PendingApplyBanner() {
  const pending = usePendingTxStore((s) => s.pending);
  if (!pending) return null;

  return (
    <Link
      to={`/traitlab?token=${pending.tokenId}`}
      data-testid="traitlab-pending-banner"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-acc px-4 py-2 text-[13px] font-bold text-acc-fg"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <SpinnerIcon size={14} />
      Applying trait changes to #{pending.tokenId} ({pending.step}/{pending.totalSteps}) — view
    </Link>
  );
}
