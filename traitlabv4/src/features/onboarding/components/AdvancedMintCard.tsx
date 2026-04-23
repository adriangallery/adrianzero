/**
 * AdvancedMintCard Component
 * Card for SamuraiZERO and AdrianZERO mints paid in $ZERO (post-migration).
 * Only shown to users who already own an AdrianZERO NFT.
 */

import { useState, useEffect, useRef } from 'react';
import { Loader2, Plus, Minus, Coins } from 'lucide-react';
import { useTokenBalance } from '@/features/shop/hooks/useTokenBalance';

interface AdvancedMintCardProps {
  type: 'samurai' | 'adrianWithAdrian';
  title: string;
  subtitle: string;
  imageUrl: string;
  price: bigint | undefined;
  minted: number;
  maxSupply: number;
  active: boolean;
  isLoading: boolean;
  allowance: bigint;
  onApprove: (amount: bigint) => void;
  onMint: (quantity: number) => void;
  isApproving: boolean;
  isApprovalConfirmed: boolean;
  isMinting: boolean;
  isConfirmed: boolean;
  onReset: () => void;
  refetchAllowance: () => void;
}

function formatToken(amount: bigint): string {
  const formatted = Number(amount) / 1e18;
  if (formatted >= 1000000) {
    return `${(formatted / 1000000).toFixed(1)}M`;
  }
  return formatted.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function AdvancedMintCard({
  type,
  title,
  subtitle,
  imageUrl,
  price,
  minted,
  maxSupply,
  active,
  isLoading,
  allowance,
  onApprove,
  onMint,
  isApproving,
  isApprovalConfirmed,
  isMinting,
  isConfirmed,
  onReset,
  refetchAllowance,
}: AdvancedMintCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [autoMintPending, setAutoMintPending] = useState(false);
  const { zeroBalance, zeroFormatted } = useTokenBalance();
  const balance = zeroBalance;
  const balanceFormatted = zeroFormatted;
  const hasAutoMintedRef = useRef(false);

  const borderColor = type === 'samurai' ? 'border-pink-500' : 'border-cyan-500';
  const accentColor = type === 'samurai' ? 'text-pink-500' : 'text-cyan-500';
  const buttonBg = type === 'samurai'
    ? 'bg-pink-500 hover:bg-pink-600'
    : 'bg-cyan-500 hover:bg-cyan-600';

  const totalCost = price ? price * BigInt(quantity) : BigInt(0);
  const needsApproval = allowance < totalCost;
  const hasInsufficientBalance = balance ? totalCost > balance : true;
  const isSoldOut = minted >= maxSupply;
  const isDisabled = isLoading || !active || isSoldOut || hasInsufficientBalance || isMinting || isApproving || autoMintPending;

  // Auto-mint after approval is confirmed (only once). Keep the button
  // disabled via `autoMintPending` until the mint writeContract actually
  // fires — otherwise there's a race window where `isApproving` already
  // flipped to false but allowance hasn't been refetched yet, so the button
  // re-enables showing "Approve & Mint" and the user re-fires a second approve.
  useEffect(() => {
    if (isApprovalConfirmed && !hasAutoMintedRef.current) {
      hasAutoMintedRef.current = true;
      setAutoMintPending(true);
      refetchAllowance();
      onMint(quantity);
    }
  }, [isApprovalConfirmed]);

  // Clear the auto-mint gate once the mint itself is in flight or errored.
  useEffect(() => {
    if (autoMintPending && (isMinting || isConfirmed)) {
      setAutoMintPending(false);
    }
  }, [autoMintPending, isMinting, isConfirmed]);

  // Reset confirmed state after showing success
  useEffect(() => {
    if (isConfirmed) {
      hasAutoMintedRef.current = false; // Reset for next mint
      refetchAllowance();
      const timer = setTimeout(() => onReset(), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, onReset, refetchAllowance]);

  // Reset auto-mint flag when user starts a new approval
  useEffect(() => {
    if (isApproving) {
      hasAutoMintedRef.current = false;
      setAutoMintPending(false);
    }
  }, [isApproving]);

  const handleMint = () => {
    if (needsApproval) {
      onApprove(totalCost);
    } else {
      onMint(quantity);
    }
  };

  const getButtonText = () => {
    if (isConfirmed) return 'Minted!';
    if (isMinting) return 'Minting...';
    if (autoMintPending) return 'Confirm Mint in Wallet...';
    if (isApproving) return 'Approving...';
    if (isSoldOut) return 'Sold Out';
    if (hasInsufficientBalance) return 'Insufficient $ZERO';
    if (needsApproval) return 'Approve & Mint';
    return `Mint ${quantity}`;
  };

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border-2 ${borderColor} bg-background/80 transition-all hover:shadow-lg`}
    >
      {/* Header */}
      <div className="p-4 pb-0">
        <h3 className={`text-xl font-bold ${accentColor}`}>{title}</h3>
        <p className="text-sm text-muted-foreground italic">{subtitle}</p>
      </div>

      {/* Image */}
      <div className="p-4">
        <div className="aspect-square overflow-hidden rounded-xl bg-muted">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-4 pt-0 space-y-3">
        {/* Supply */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Supply</span>
          <span className="font-medium text-foreground">
            {isLoading ? '...' : `${minted.toLocaleString()} / ${maxSupply.toLocaleString()}`}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Price</span>
          <span className={`font-bold ${accentColor}`}>
            {isLoading || !price ? '...' : `${formatToken(price)} $ZERO`}
          </span>
        </div>

        {/* Your Balance */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Your Balance</span>
          <span className="font-medium text-foreground flex items-center gap-1">
            <Coins className="h-3 w-3" />
            {balanceFormatted.toLocaleString()} $ZERO
          </span>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center justify-center gap-3 py-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1 || isMinting}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-xl font-bold w-12 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(10, quantity + 1))}
            disabled={quantity >= 10 || isMinting}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Total */}
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <div className={`text-2xl font-bold ${accentColor}`}>
            {price ? formatToken(totalCost) : '...'} $ZERO
          </div>
          <div className="text-xs text-muted-foreground">Total Cost</div>
        </div>

        {/* Mint Button */}
        <button
          onClick={handleMint}
          disabled={isDisabled}
          className={`w-full rounded-lg ${buttonBg} px-4 py-3 text-lg font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2`}
        >
          {(isMinting || isApproving || autoMintPending) && <Loader2 className="h-5 w-5 animate-spin" />}
          {getButtonText()}
        </button>

        {/* Success Message */}
        {isConfirmed && (
          <p className="text-center text-sm text-success font-medium">
            Successfully minted {quantity} {title}!
          </p>
        )}
      </div>
    </div>
  );
}
