/**
 * EligibilityChecker Component
 * Manual token ID checker for eligibility
 */

import { useState } from 'react';
import { Search, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { OGCLAIM_ABI } from '@/lib/web3/abi';

export function EligibilityChecker() {
  const [tokenId, setTokenId] = useState('');
  const [searchId, setSearchId] = useState<number | null>(null);
  const publicClient = usePublicClient();

  const { data: isClaimed, isLoading } = useQuery({
    queryKey: ['eligibility-check', searchId],
    queryFn: async () => {
      if (!publicClient || searchId === null) return null;

      const claimed = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.OGCLAIM_CONTRACT as `0x${string}`,
        abi: OGCLAIM_ABI,
        functionName: 'isClaimed',
        args: [BigInt(searchId)],
      });

      return claimed as boolean;
    },
    enabled: !!publicClient && searchId !== null,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(tokenId);
    if (!isNaN(id) && id >= 1 && id <= 1000) {
      setSearchId(id);
    }
  };

  const getTraitId = (punkId: number) => 100000 + punkId;

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Search className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Check Eligibility</h2>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="number"
          min="1"
          max="1000"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="Enter Punk ID (1-1000)"
          className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Check
        </button>
      </form>

      {searchId !== null && !isLoading && (
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">AdrianPunk</p>
              <p className="text-lg font-bold text-foreground">#{searchId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Maps to Trait</p>
              <p className="text-lg font-bold text-foreground">#{getTraitId(searchId)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-border">
            {isClaimed ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-500">Already Claimed</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-500">Available to Claim</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
