/**
 * ApproveModal Component
 * Modal for approving $ADRIAN spending
 */

import { Loader2, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BLOCK_EXPLORER_URL } from '@/config/contracts';

interface ApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  isApproving: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  error: Error | null;
  txHash?: string;
  amount: string;
  tokenSymbol?: string;
}

export function ApproveModal({
  isOpen,
  onClose,
  onApprove,
  isApproving,
  isConfirming,
  isConfirmed,
  error,
  txHash,
  amount,
  tokenSymbol = '$ADRIAN',
}: ApproveModalProps) {
  const isProcessing = isApproving || isConfirming;

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
            <h2 className="text-xl font-bold text-foreground mb-4">
              Approve {tokenSymbol} Spending
            </h2>

            <p className="text-muted-foreground mb-6">
              To purchase items, you need to approve the shop contract to spend
              your {tokenSymbol} tokens.
            </p>

            {/* Amount */}
            <div className="p-4 rounded-lg bg-muted mb-6">
              <p className="text-sm text-muted-foreground mb-1">Amount to approve</p>
              <p className="text-2xl font-bold text-accent">{amount} {tokenSymbol}</p>
            </div>

            {/* Status */}
            {isApproving && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 mb-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-foreground">Confirm in your wallet...</span>
              </div>
            )}

            {isConfirming && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 mb-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-foreground">Waiting for confirmation...</span>
              </div>
            )}

            {isConfirmed && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 mb-6">
                <Check className="h-5 w-5 text-success" />
                <span className="text-foreground">Approval confirmed!</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 mb-6">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-foreground text-sm">
                  {error.message || 'Transaction failed'}
                </span>
              </div>
            )}

            {/* Transaction link */}
            {txHash && (
              <a
                href={`${BLOCK_EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-primary hover:underline mb-6"
              >
                View on BaseScan
                <ExternalLink className="h-4 w-4" />
              </a>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={isConfirmed ? onClose : onApprove}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isConfirmed ? 'Done' : isProcessing ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
