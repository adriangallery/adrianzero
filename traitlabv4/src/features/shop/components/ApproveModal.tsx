/**
 * ApproveModal Component
 * Continuous checkout surface: approve $ZERO/$ADRIAN spending, then
 * auto-continues to the purchase. Stays open through the whole flow so the
 * user always has feedback (approve → purchase → done).
 */

import { Loader2, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BLOCK_EXPLORER_URL } from '@/config/contracts';

interface ApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onPurchase: () => void;
  isApproving: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  error: Error | null;
  txHash?: string;
  purchasePending: boolean;
  purchaseConfirming: boolean;
  purchaseConfirmed: boolean;
  purchaseError: Error | null;
  purchaseTxHash?: string;
  amount: string;
  tokenSymbol?: string;
}

export function ApproveModal({
  isOpen,
  onClose,
  onApprove,
  onPurchase,
  isApproving,
  isConfirming,
  isConfirmed,
  error,
  txHash,
  purchasePending,
  purchaseConfirming,
  purchaseConfirmed,
  purchaseError,
  purchaseTxHash,
  amount,
  tokenSymbol = '$ADRIAN',
}: ApproveModalProps) {
  const approvalInFlight = isApproving || isConfirming;
  const purchaseInFlight = purchasePending || purchaseConfirming;
  const isProcessing = approvalInFlight || purchaseInFlight;

  // Which step of the checkout we're on
  const step: 'approve' | 'purchase' | 'done' = purchaseConfirmed
    ? 'done'
    : isConfirmed
    ? 'purchase'
    : 'approve';

  const title =
    step === 'done'
      ? 'Purchase complete'
      : step === 'purchase'
      ? 'Complete purchase'
      : `Approve ${tokenSymbol} Spending`;

  const description =
    step === 'done'
      ? 'Your items are on the way to your wallet.'
      : step === 'purchase'
      ? 'Approval confirmed. Confirm the purchase in your wallet to receive your items.'
      : `To purchase items, you need to approve the shop contract to spend your ${tokenSymbol} tokens.`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isProcessing ? onClose : undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl z-[80]"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>

            <p className="text-muted-foreground mb-6">{description}</p>

            {/* Amount (only relevant before the purchase completes) */}
            {step !== 'done' && (
              <div className="p-4 rounded-lg bg-muted mb-6">
                <p className="text-sm text-muted-foreground mb-1">
                  {step === 'purchase' ? 'Total' : 'Amount to approve'}
                </p>
                <p className="text-2xl font-bold text-accent">
                  {amount} {tokenSymbol}
                </p>
              </div>
            )}

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6 text-xs">
              <span
                className={`flex items-center gap-1.5 ${
                  step === 'approve' ? 'text-foreground font-semibold' : 'text-success'
                }`}
              >
                {isConfirmed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="h-4 w-4 rounded-full border-2 border-current flex items-center justify-center">1</span>
                )}
                Approve
              </span>
              <span className="flex-1 h-px bg-border" />
              <span
                className={`flex items-center gap-1.5 ${
                  step === 'done'
                    ? 'text-success'
                    : step === 'purchase'
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground'
                }`}
              >
                {purchaseConfirmed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="h-4 w-4 rounded-full border-2 border-current flex items-center justify-center">2</span>
                )}
                Buy
              </span>
            </div>

            {/* Status */}
            {isApproving && (
              <StatusRow tone="primary" spinner>
                Confirm approval in your wallet...
              </StatusRow>
            )}
            {isConfirming && (
              <StatusRow tone="primary" spinner>
                Confirming approval on-chain...
              </StatusRow>
            )}
            {isConfirmed && !purchaseConfirmed && !purchaseInFlight && !purchaseError && (
              <StatusRow tone="success" icon={<Check className="h-5 w-5 text-success" />}>
                Approval confirmed — continuing to purchase…
              </StatusRow>
            )}
            {purchasePending && (
              <StatusRow tone="primary" spinner>
                Confirm purchase in your wallet...
              </StatusRow>
            )}
            {purchaseConfirming && (
              <StatusRow tone="primary" spinner>
                Processing purchase…
              </StatusRow>
            )}
            {purchaseConfirmed && (
              <StatusRow tone="success" icon={<Check className="h-5 w-5 text-success" />}>
                Purchase complete!
              </StatusRow>
            )}

            {error && (
              <StatusRow tone="destructive" icon={<AlertCircle className="h-5 w-5 text-destructive" />}>
                {error.message || 'Approval failed'}
              </StatusRow>
            )}
            {purchaseError && (
              <StatusRow tone="destructive" icon={<AlertCircle className="h-5 w-5 text-destructive" />}>
                {purchaseError.message || 'Purchase failed'}
              </StatusRow>
            )}

            {/* Transaction links */}
            {txHash && (
              <TxLink href={`${BLOCK_EXPLORER_URL}/tx/${txHash}`} label="View approval on BaseScan" />
            )}
            {purchaseTxHash && (
              <TxLink href={`${BLOCK_EXPLORER_URL}/tx/${purchaseTxHash}`} label="View purchase on BaseScan" />
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              {step !== 'done' && (
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={
                  step === 'done'
                    ? onClose
                    : step === 'purchase'
                    ? onPurchase
                    : onApprove
                }
                disabled={isProcessing}
                className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {step === 'done'
                  ? 'Done'
                  : isProcessing
                  ? 'Processing...'
                  : step === 'purchase'
                  ? purchaseError
                    ? 'Retry purchase'
                    : 'Buy now'
                  : 'Approve'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatusRow({
  tone,
  spinner,
  icon,
  children,
}: {
  tone: 'primary' | 'success' | 'destructive';
  spinner?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const bg =
    tone === 'success'
      ? 'bg-success/10'
      : tone === 'destructive'
      ? 'bg-destructive/10'
      : 'bg-primary/10';
  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg ${bg} mb-4`}>
      {spinner ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : icon}
      <span className="text-foreground text-sm">{children}</span>
    </div>
  );
}

function TxLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 text-sm text-primary hover:underline mb-2"
    >
      {label}
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}
