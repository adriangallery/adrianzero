/**
 * KitCard Component
 * Displays kit information with mint button
 */

import { Check, X, Eye, Sparkles, Disc, Coins, Loader2 } from 'lucide-react';
import { QuantitySelector } from './QuantitySelector';
import type { KitInfo } from '../hooks/useKitInfo';
import { formatUsdPrice } from '../hooks/useEthPrice';

interface KitCardProps {
  type: 'free' | 'paid';
  kitInfo: KitInfo | undefined;
  isLoading: boolean;
  isPaused: boolean;
  ethPrice: number | undefined;
  quantity: number;
  maxQuantity: number;
  onQuantityIncrement: () => void;
  onQuantityDecrement: () => void;
  onMint: () => void;
  isMinting: boolean;
  isConnected: boolean;
  canBuy: boolean;
  canBuyMessage: string | undefined;
  onConnectWallet?: () => void;
}

const FREE_KIT_FEATURES = [
  { icon: Eye, text: 'Unique eye spacing', positive: true },
  { icon: X, text: 'No glasses/eye traits', positive: false },
  { icon: Check, text: 'Try TraitLAB free', positive: true },
  { icon: Coins, text: '100 $ADRIAN included', positive: true },
];

const PAID_KIT_FEATURES = [
  { icon: Eye, text: 'Standard eye spacing', positive: true },
  { icon: Sparkles, text: 'All traits compatible', positive: true },
  { icon: Disc, text: 'STARTER Floppy included', positive: true },
  { icon: Coins, text: 'More $ADRIAN tokens', positive: true },
];

const FREE_KIT_CONTENTS = [
  { image: '/subzero/images/subzero.png', label: '1 SubZERO NFT' },
  { image: '/subzero/images/bluecheck.png', label: '1 Blue-Check Trait' },
  { image: '/subzero/images/adriancoin.gif', label: '100 $ADRIAN' },
];

const PAID_KIT_CONTENTS = [
  { image: '/zeronaked.png', label: '1 AdrianZERO NFT' },
  { image: 'https://adrianlab-kt4ehqbtn-adrianlab.vercel.app/labimages/10002.gif', label: '1 STARTER Floppy' },
];

export function KitCard({
  type,
  kitInfo,
  isLoading,
  isPaused,
  ethPrice,
  quantity,
  maxQuantity,
  onQuantityIncrement,
  onQuantityDecrement,
  onMint,
  isMinting,
  isConnected,
  canBuy,
  canBuyMessage,
  onConnectWallet,
}: KitCardProps) {
  const isFree = type === 'free';
  const features = isFree ? FREE_KIT_FEATURES : PAID_KIT_FEATURES;
  const contents = isFree ? FREE_KIT_CONTENTS : PAID_KIT_CONTENTS;

  const borderColor = isFree ? 'border-success' : 'border-accent';
  const badgeBg = isFree ? 'bg-success' : 'bg-accent';
  const titleColor = isFree ? 'text-success' : 'text-accent';
  const priceColor = isFree ? 'text-success' : 'text-accent';
  const buttonBg = isFree
    ? 'bg-success hover:bg-success/90'
    : 'bg-accent hover:bg-accent/90';

  // Calculate price
  const pricePerKit = kitInfo?.priceInETH ?? BigInt(0);
  const totalPrice = pricePerKit * BigInt(quantity);
  const priceEth = Number(totalPrice) / 1e18;

  // Get $ADRIAN amount from kit info
  const adrianAmount = kitInfo?.adrianTokenAmount
    ? Number(kitInfo.adrianTokenAmount) / 1e18
    : 0;

  // Update contents for paid kit with dynamic $ADRIAN amount
  const dynamicContents = isFree
    ? contents
    : [
        ...contents,
        {
          image: '/components/images/ADRIAN_Coin_Back.gif',
          label: `${adrianAmount.toLocaleString()} $ADRIAN`,
        },
      ];

  const isDisabled =
    isLoading ||
    isPaused ||
    !kitInfo?.active ||
    isMinting ||
    !isConnected ||
    !canBuy;

  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet';
    if (isLoading) return 'Loading...';
    if (isPaused) return 'Sale Paused';
    if (!kitInfo?.active) return 'Not Available';
    if (!canBuy && canBuyMessage) return canBuyMessage;
    if (isMinting) return 'Minting...';
    if (isFree) return 'Mint FREE Kit';
    return `Buy ${quantity} Kit${quantity > 1 ? 's' : ''}`;
  };

  // Helper to render content label with lime accent on quantity
  const renderContentLabel = (label: string) => {
    const match = label.match(/^(\d+)\s(.+)$/);
    if (match) {
      return (
        <>
          <span className="text-[#00ff00]">{match[1]}</span> {match[2]}
        </>
      );
    }
    return label;
  };

  return (
    <div
      className={`relative flex flex-col h-full overflow-hidden rounded-2xl border-2 ${borderColor} bg-background/80 transition-all hover:shadow-lg`}
    >
      {/* Header: Badge + Title + Subtitle */}
      <div className="p-6 pb-0">
        {/* Badge */}
        <div
          className={`absolute right-4 top-4 rounded-full ${badgeBg} px-4 py-1 text-xs font-bold text-white`}
        >
          {isFree ? '100% FREE' : 'PREMIUM'}
        </div>

        {/* Title */}
        <h2 className={`mb-2 text-center text-3xl font-bold ${titleColor}`}>
          {isFree ? (
            <>Sub<span className="text-[#00ff00]">ZERO</span></>
          ) : (
            <>Adrian<span className="text-[#00ff00]">ZERO</span></>
          )}
        </h2>
        <p className="mb-6 text-center text-sm text-muted-foreground italic">
          {isFree ? 'Free & Quirky' : 'Full Experience'}
        </p>
      </div>

      {/* Flexible Content: Features + Contents */}
      <div className="flex-1 p-6 pt-0 space-y-6">
        {/* Features */}
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <feature.icon
                className={`h-5 w-5 flex-shrink-0 ${
                  feature.positive ? 'text-[#00ff00]' : 'text-muted-foreground'
                }`}
              />
              <span className="text-sm text-foreground">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Kit Contents Grid */}
        <div className="grid grid-cols-3 gap-3">
          {dynamicContents.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-muted/50 p-3 text-center transition-all hover:border-primary"
            >
              <img
                src={item.image}
                alt={item.label}
                className={`mx-auto mb-2 h-16 w-16 rounded-lg border-2 object-cover ${borderColor}`}
              />
              <p className="text-xs text-muted-foreground">{renderContentLabel(item.label)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: Quantity + Price + Button */}
      <div className="p-6 pt-0 mt-auto space-y-4">
        {/* Quantity Controls (Paid Only) */}
        {!isFree && (
          <QuantitySelector
            quantity={quantity}
            max={maxQuantity}
            onIncrement={onQuantityIncrement}
            onDecrement={onQuantityDecrement}
            disabled={!isConnected || isMinting}
          />
        )}

        {/* Price */}
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-muted-foreground">Loading price...</span>
            </div>
          ) : (
            <>
              <div className={`text-3xl font-bold ${priceColor}`}>
                {isFree ? 'FREE' : `${priceEth.toFixed(4)} ETH`}
              </div>
              {!isFree && ethPrice && totalPrice > 0 && (
                <div className="mt-1 text-sm text-muted-foreground">
                  ({formatUsdPrice(totalPrice, ethPrice)})
                </div>
              )}
              {isFree && (
                <div className="mt-1 text-sm text-muted-foreground">
                  Limit: 1 per wallet
                </div>
              )}
            </>
          )}
        </div>

        {/* Mint Button */}
        <button
          onClick={!isConnected && onConnectWallet ? onConnectWallet : onMint}
          disabled={isConnected && isDisabled}
          className={`relative w-full rounded-lg ${buttonBg} px-6 py-4 text-lg font-bold text-[#00ff00] transition-all disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isMinting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Minting...
            </span>
          ) : (
            getButtonText()
          )}
        </button>

        {/* Status Message */}
        {!canBuy && canBuyMessage && isConnected && (
          <p className="text-center text-sm text-yellow-500">{canBuyMessage}</p>
        )}
      </div>
    </div>
  );
}
