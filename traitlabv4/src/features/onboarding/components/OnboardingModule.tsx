/**
 * OnboardingModule Component
 * Main route component for /onboarding and /mint
 * Allows users to select and mint SubZERO (FREE) or AdrianZERO (PAID) kits
 */

import { useChainId, useSwitchChain } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { KitComparisonGrid } from './KitComparisonGrid';
import { MintSuccessModal } from './MintSuccessModal';
import { AdvancedMintsSection } from './AdvancedMintsSection';
import {
  useBothKitsInfo,
  FREE_KIT_ID,
  PAID_KIT_ID,
  type KitInfo,
} from '../hooks/useKitInfo';
import { useCanBuyKit } from '../hooks/useCanBuyKit';
import { useBuyKit } from '../hooks/useBuyKit';
import { useEthPrice } from '../hooks/useEthPrice';
import { useOnboardingStore } from '../store/onboardingStore';
import { useWalletPrompt } from '@/hooks/useWalletPrompt';
import { CHAIN_ID } from '@/config/contracts';

export function OnboardingModule() {
  const { isConnected } = useWalletPrompt();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();

  // Store
  const {
    paidQuantity,
    incrementPaidQuantity,
    decrementPaidQuantity,
    showSuccessModal,
    lastMintedKit,
    lastMintedQuantity,
    openSuccessModal,
    closeSuccessModal,
  } = useOnboardingStore();

  // Fetch kit info
  const { data: kitsData, isLoading: isLoadingKits } = useBothKitsInfo();

  // Parse kit data
  const freeKitInfo = kitsData?.[0]?.result as KitInfo | undefined;
  const paidKitInfo = kitsData?.[1]?.result as KitInfo | undefined;
  const isPaused = (kitsData?.[2]?.result as boolean) ?? true;
  const maxKitsPerTx = Number(kitsData?.[3]?.result ?? 10);

  // Fetch ETH price
  const { data: ethPrice } = useEthPrice();

  // Can buy checks
  const { data: canBuyFreeData } = useCanBuyKit(FREE_KIT_ID, 1);
  const { data: canBuyPaidData } = useCanBuyKit(PAID_KIT_ID, paidQuantity);

  const canBuyFree = canBuyFreeData?.[0] ?? false;
  const canBuyFreeMessage = canBuyFreeData?.[1];
  const canBuyPaid = canBuyPaidData?.[0] ?? false;
  const canBuyPaidMessage = canBuyPaidData?.[1];

  // Buy mutations
  const buyKit = useBuyKit();

  // Check if on correct network
  const isCorrectNetwork = chainId === CHAIN_ID;

  // Handle network switch
  const handleSwitchNetwork = () => {
    switchChain?.({ chainId: CHAIN_ID });
  };

  // Handle mint
  const handleMintFree = async () => {
    if (!freeKitInfo) return;

    try {
      await buyKit.mutateAsync({
        kitId: FREE_KIT_ID,
        quantity: 1,
        pricePerKit: freeKitInfo.priceInETH,
      });
      openSuccessModal('free', 1);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleMintPaid = async () => {
    if (!paidKitInfo) return;

    try {
      await buyKit.mutateAsync({
        kitId: PAID_KIT_ID,
        quantity: paidQuantity,
        pricePerKit: paidKitInfo.priceInETH,
      });
      openSuccessModal('paid', paidQuantity);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Determine which kit is being minted
  const isMintingFree =
    buyKit.isPending && buyKit.variables?.kitId === FREE_KIT_ID;
  const isMintingPaid =
    buyKit.isPending && buyKit.variables?.kitId === PAID_KIT_ID;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
          Choose Your <span className="text-[#00ff00]">ZERO</span>
        </h1>
        <p className="mb-2 text-xl text-muted-foreground">
          Free vs Premium
        </p>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          Start with SubZERO for free or get the full AdrianZERO experience with complete trait compatibility.
        </p>
      </div>

      {/* Network Warning */}
      {isConnected && !isCorrectNetwork && (
        <div className="mx-auto max-w-2xl rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-500" />
              <span className="text-yellow-500">
                Please switch to Base Network to mint
              </span>
            </div>
            <button
              onClick={handleSwitchNetwork}
              className="rounded-lg border border-yellow-500/50 bg-yellow-500/20 px-4 py-2 text-sm font-medium text-yellow-500 transition-colors hover:bg-yellow-500/30"
            >
              Switch Network
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingKits ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading kit information...</p>
        </div>
      ) : (
        /* Kit Comparison Grid */
        <KitComparisonGrid
          freeKitInfo={freeKitInfo}
          paidKitInfo={paidKitInfo}
          isLoading={isLoadingKits}
          isPaused={isPaused}
          ethPrice={ethPrice}
          paidQuantity={paidQuantity}
          maxQuantity={maxKitsPerTx}
          onPaidQuantityIncrement={() => incrementPaidQuantity(maxKitsPerTx)}
          onPaidQuantityDecrement={decrementPaidQuantity}
          onMintFree={handleMintFree}
          onMintPaid={handleMintPaid}
          isMintingFree={isMintingFree}
          isMintingPaid={isMintingPaid}
          isConnected={isConnected && isCorrectNetwork}
          canBuyFree={canBuyFree}
          canBuyFreeMessage={canBuyFreeMessage}
          canBuyPaid={canBuyPaid}
          canBuyPaidMessage={canBuyPaidMessage}
          onConnectWallet={openConnectModal}
        />
      )}

      {/* Advanced Mints Section (only for AdrianZERO holders) */}
      {isConnected && isCorrectNetwork && (
        <AdvancedMintsSection />
      )}

      {/* Success Modal */}
      <MintSuccessModal
        open={showSuccessModal}
        onClose={closeSuccessModal}
        kitType={lastMintedKit}
        quantity={lastMintedQuantity}
      />
    </div>
  );
}
