/**
 * AdvancedMintsSection Component
 * Shows SamuraiZERO and AdrianZERO mints — now paid in $ZERO via the Diamond.
 * Supply counter aggregates legacy BatchDeployer (pre-migration) + Diamond
 * SamuraiMintFacet (post-migration) so the UI still shows the 196/600 progression.
 * Only visible to users who already own an AdrianZERO NFT.
 */

import { Sparkles } from 'lucide-react';
import { AdvancedMintCard } from './AdvancedMintCard';
import { useHasAdrianZero } from '../hooks/useHasAdrianZero';
import {
  useSamuraiBatchInfo,
  useSamuraiSupplyCombined,
  useSamuraiApproval,
  useSamuraiMint,
} from '../hooks/useSamuraiMint';
import {
  useAdrianMintBatchInfo,
  useAdrianSupplyCombined,
  useAdrianMintApproval,
  useAdrianMint,
} from '../hooks/useAdrianMint';
import { getGitHubImageUrl, IMAGE_PATHS } from '@/config/images';

export function AdvancedMintsSection() {
  const { hasAdrianZero, isLoading: isCheckingOwnership } = useHasAdrianZero();

  // SamuraiZERO hooks
  const { batchInfo: samuraiBatch, isLoading: samuraiLoading } = useSamuraiBatchInfo();
  const samuraiSupply = useSamuraiSupplyCombined();
  const samuraiApproval = useSamuraiApproval();
  const samuraiMint = useSamuraiMint();

  // AdrianZERO hooks
  const { batchInfo: adrianBatch, isLoading: adrianLoading } = useAdrianMintBatchInfo();
  const adrianSupply = useAdrianSupplyCombined();
  const adrianApproval = useAdrianMintApproval();
  const adrianMintHook = useAdrianMint();

  // Don't show if user doesn't have an AdrianZERO
  if (isCheckingOwnership) {
    return null;
  }

  if (!hasAdrianZero) {
    return null;
  }

  return (
    <div className="mt-12 space-y-6">
      {/* Section Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-accent">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Exclusive for AdrianZERO Holders</span>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-foreground md:text-3xl">
          Expand Your <span className="text-[#00ff00]">Collection</span>
        </h2>
        <p className="mt-2 text-muted-foreground">
          Mint more NFTs using your $ZERO tokens
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* SamuraiZERO */}
        <AdvancedMintCard
          type="samurai"
          title="SamuraiZERO"
          subtitle="Warrior of the Collection"
          imageUrl={getGitHubImageUrl(IMAGE_PATHS.getComponentImage(595, 'png'))}
          price={samuraiBatch?.price}
          minted={Number(samuraiSupply.totalMinted)}
          maxSupply={Number(samuraiSupply.totalSupply)}
          active={samuraiBatch?.active ?? false}
          isLoading={samuraiLoading || samuraiSupply.isLoading}
          allowance={samuraiApproval.allowance}
          onApprove={samuraiApproval.approveTokens}
          onMint={samuraiMint.mint}
          isApproving={samuraiApproval.isApproving || samuraiApproval.isApprovalConfirming}
          isApprovalConfirmed={samuraiApproval.isApprovalConfirmed}
          isMinting={samuraiMint.isPending || samuraiMint.isConfirming}
          isConfirmed={samuraiMint.isConfirmed}
          onReset={samuraiMint.reset}
          refetchAllowance={samuraiApproval.refetchAllowance}
        />

        {/* AdrianZERO with $ZERO */}
        <AdvancedMintCard
          type="adrianWithAdrian"
          title="AdrianZERO"
          subtitle="Mint with $ZERO"
          imageUrl="https://adrianlab.vercel.app/api/render/1"
          price={adrianBatch?.price}
          minted={Number(adrianSupply.totalMinted)}
          maxSupply={Number(adrianSupply.totalSupply)}
          active={adrianBatch?.active ?? false}
          isLoading={adrianLoading || adrianSupply.isLoading}
          allowance={adrianApproval.allowance}
          onApprove={adrianApproval.approveTokens}
          onMint={adrianMintHook.mint}
          isApproving={adrianApproval.isApproving || adrianApproval.isApprovalConfirming}
          isApprovalConfirmed={adrianApproval.isApprovalConfirmed}
          isMinting={adrianMintHook.isPending || adrianMintHook.isConfirming}
          isConfirmed={adrianMintHook.isConfirmed}
          onReset={adrianMintHook.reset}
          refetchAllowance={adrianApproval.refetchAllowance}
        />
      </div>
    </div>
  );
}
