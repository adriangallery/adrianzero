/**
 * ShopCart Component
 * Shopping cart sidebar/panel with dual-token support ($ZERO / $ADRIAN)
 */

import { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Loader2, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShopStore, type CartItem, type PaymentToken } from '../store/shopStore';
import { getFallbackImageUrl } from '../hooks/useShopItems';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { useTokenApproval } from '../hooks/useTokenApproval';
import { useShopPurchase } from '../hooks/useShopPurchase';
import { ApproveModal } from './ApproveModal';
import { BLOCK_EXPLORER_URL } from '@/config/contracts';

// Helper to format price
function formatPrice(price: bigint): string {
  const formatted = Number(price) / 1e18;
  if (formatted >= 1000000) {
    return `${(formatted / 1000000).toFixed(1)}M`;
  }
  if (formatted >= 1000) {
    return `${(formatted / 1000).toFixed(1)}K`;
  }
  if (formatted < 1 && formatted > 0) {
    return formatted.toFixed(2);
  }
  return formatted.toLocaleString();
}

export function ShopCart() {
  const { cart, removeFromCart, clearCart, getCartTotal, getCartItemCount, paymentToken, setPaymentToken } = useShopStore();
  const { zeroBalance, adrianBalance, zeroFormatted, adrianFormatted } = useTokenBalance();
  const {
    needsApproval,
    approve,
    isApproving,
    isConfirming: isApprovalConfirming,
    isConfirmed: isApprovalConfirmed,
    approveError,
    txHash: approveTxHash,
    refetchAllowance,
    tokenSymbol,
  } = useTokenApproval(paymentToken);
  const {
    batchPurchase,
    isPending: isPurchasing,
    isConfirming: isPurchaseConfirming,
    isConfirmed: isPurchaseConfirmed,
    error: purchaseError,
    txHash: purchaseTxHash,
    reset: resetPurchase,
  } = useShopPurchase();

  const [isOpen, setIsOpen] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);

  const cartTotal = getCartTotal();
  const cartCount = getCartItemCount();
  const totalFormatted = formatPrice(cartTotal);

  const activeBalance = paymentToken === 'ZERO' ? zeroBalance : adrianBalance;
  const activeBalanceFormatted = paymentToken === 'ZERO' ? zeroFormatted : adrianFormatted;
  const hasInsufficientBalance = activeBalance ? cartTotal > activeBalance : false;
  const requiresApproval = cartTotal > BigInt(0) && needsApproval(cartTotal);

  // Refetch allowance after approval confirmed
  useEffect(() => {
    if (isApprovalConfirmed) {
      refetchAllowance();
      setShowApproveModal(false);
    }
  }, [isApprovalConfirmed, refetchAllowance]);

  // Clear cart after successful purchase
  useEffect(() => {
    if (isPurchaseConfirmed) {
      clearCart();
    }
  }, [isPurchaseConfirmed, clearCart]);

  const handleCheckout = () => {
    if (requiresApproval) {
      setShowApproveModal(true);
      return;
    }
    batchPurchase(cart, paymentToken);
  };

  const handleApprove = () => {
    approve(cartTotal);
  };

  const isProcessing = isPurchasing || isPurchaseConfirming;

  return (
    <>
      {/* Cart Button (Mobile FAB) — large, high contrast */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 lg:hidden flex items-center gap-2 px-5 py-4 rounded-2xl bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(0,0,0,0.5)] border-2 border-primary-foreground/20 text-base font-bold"
      >
        <ShoppingCart className="h-6 w-6" />
        {cartCount > 0 && (
          <span className="bg-white text-black rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">{cartCount}</span>
        )}
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 border-l border-border bg-card/50 p-4 overflow-y-auto">
        <CartContent
          cart={cart}
          cartCount={cartCount}
          totalFormatted={totalFormatted}
          activeBalanceFormatted={activeBalanceFormatted}
          hasInsufficientBalance={hasInsufficientBalance}
          requiresApproval={requiresApproval}
          isProcessing={isProcessing}
          isPurchaseConfirmed={isPurchaseConfirmed}
          purchaseError={purchaseError}
          purchaseTxHash={purchaseTxHash}
          paymentToken={paymentToken}
          onPaymentTokenChange={setPaymentToken}
          onRemove={removeFromCart}
          onClear={clearCart}
          onCheckout={handleCheckout}
          onReset={resetPurchase}
        />
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed inset-0 bg-background z-[70] p-4 overflow-y-auto lg:hidden"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <CartContent
                cart={cart}
                cartCount={cartCount}
                totalFormatted={totalFormatted}
                activeBalanceFormatted={activeBalanceFormatted}
                hasInsufficientBalance={hasInsufficientBalance}
                requiresApproval={requiresApproval}
                isProcessing={isProcessing}
                isPurchaseConfirmed={isPurchaseConfirmed}
                purchaseError={purchaseError}
                purchaseTxHash={purchaseTxHash}
                paymentToken={paymentToken}
                onPaymentTokenChange={setPaymentToken}
                onRemove={removeFromCart}
                onClear={clearCart}
                onCheckout={handleCheckout}
                onReset={resetPurchase}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Approve Modal */}
      <ApproveModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onApprove={handleApprove}
        isApproving={isApproving}
        isConfirming={isApprovalConfirming}
        isConfirmed={isApprovalConfirmed}
        error={approveError}
        txHash={approveTxHash}
        amount={totalFormatted}
        tokenSymbol={tokenSymbol}
      />
    </>
  );
}

// Token selector toggle
function TokenSelector({
  value,
  onChange,
}: {
  value: PaymentToken;
  onChange: (token: PaymentToken) => void;
}) {
  return (
    <div className="flex rounded-lg bg-muted p-1 gap-1">
      <button
        onClick={() => onChange('ZERO')}
        className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
          value === 'ZERO'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        $ZERO
      </button>
      <button
        onClick={() => onChange('ADRIAN')}
        className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
          value === 'ADRIAN'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        $ADRIAN
      </button>
    </div>
  );
}

// Cart content component (shared between desktop and mobile)
interface CartContentProps {
  cart: CartItem[];
  cartCount: number;
  totalFormatted: string;
  activeBalanceFormatted: number;
  hasInsufficientBalance: boolean;
  requiresApproval: boolean;
  isProcessing: boolean;
  isPurchaseConfirmed: boolean;
  purchaseError: Error | null;
  purchaseTxHash?: string;
  paymentToken: PaymentToken;
  onPaymentTokenChange: (token: PaymentToken) => void;
  onRemove: (assetId: number) => void;
  onClear: () => void;
  onCheckout: () => void;
  onReset: () => void;
}

function CartContent({
  cart,
  cartCount,
  totalFormatted,
  activeBalanceFormatted,
  hasInsufficientBalance,
  requiresApproval,
  isProcessing,
  isPurchaseConfirmed,
  purchaseError,
  purchaseTxHash,
  paymentToken,
  onPaymentTokenChange,
  onRemove,
  onClear,
  onCheckout,
  onReset,
}: CartContentProps) {
  const tokenSymbol = paymentToken === 'ZERO' ? '$ZERO' : '$ADRIAN';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Cart ({cartCount})
        </h2>
        {cart.length > 0 && (
          <button
            onClick={onClear}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Token Selector */}
      <div className="mb-3">
        <p className="text-xs text-muted-foreground mb-1">Pay with</p>
        <TokenSelector value={paymentToken} onChange={onPaymentTokenChange} />
      </div>

      {/* Balance */}
      <div className="p-3 rounded-lg bg-muted mb-4">
        <p className="text-sm text-muted-foreground">Your Balance</p>
        <p className="text-lg font-bold text-foreground">
          {activeBalanceFormatted.toLocaleString()} {tokenSymbol}
        </p>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {cart.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Your cart is empty
          </p>
        ) : (
          cart.map((item) => {
            const price = paymentToken === 'ZERO' ? item.priceZero : item.priceAdrian;
            return (
              <div
                key={item.assetId}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-contain"
                  onError={(e) => {
                    const fallback = getFallbackImageUrl(item.assetId);
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {item.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.useFree ? 'FREE' : `${formatPrice(price)} ${tokenSymbol}`}
                    {item.quantity > 1 && ` x${item.quantity}`}
                  </p>
                </div>
                <button
                  onClick={() => onRemove(item.assetId)}
                  className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer — sticky on mobile for easy tapping */}
      {cart.length > 0 && (
        <div className="border-t border-border pt-4 space-y-4 sticky bottom-0 bg-background pb-4 -mx-4 px-4">
          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="text-xl font-bold text-accent">
              {totalFormatted} {tokenSymbol}
            </span>
          </div>

          {/* Errors */}
          {hasInsufficientBalance && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Insufficient {tokenSymbol} balance
            </div>
          )}

          {purchaseError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {purchaseError.message || 'Purchase failed'}
            </div>
          )}

          {/* Success */}
          {isPurchaseConfirmed && (
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-success/10">
              <div className="flex items-center gap-2 text-success">
                <Check className="h-4 w-4" />
                Purchase successful!
              </div>
              {purchaseTxHash && (
                <a
                  href={`${BLOCK_EXPLORER_URL}/tx/${purchaseTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View transaction
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={isPurchaseConfirmed ? onReset : onCheckout}
            disabled={isProcessing || hasInsufficientBalance}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
            {isPurchaseConfirmed
              ? 'Continue Shopping'
              : isProcessing
              ? 'Processing...'
              : requiresApproval
              ? `Approve & Buy`
              : 'Buy Now'}
          </button>
        </div>
      )}
    </div>
  );
}
