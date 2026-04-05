/**
 * Buy $ZERO Module
 * Swap interface for buying/selling $ZERO tokens via custom SwapRouter + V4 Quoter
 * Ported from ZEROtoken frontend, restyled for TraitLabV4
 */

import { useState, useEffect, useRef } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, usePublicClient, useConfig } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { TxButton } from './TxButton';
import {
  DIAMOND_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  V4_QUOTER_ADDRESS,
  HOOK_ADDRESS,
  WETH_ADDRESS,
  POOL_ADDRESS,
  SLIPPAGE_BPS,
  buildPoolKey,
  erc20Abi,
  effectiveTaxAbi,
  swapRouterAbi,
  v4QuoterAbi,
} from '../config/swapContracts';

export function BuyModule() {
  const { address } = useAccount();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const routerReady = !!SWAP_ROUTER_ADDRESS && SWAP_ROUTER_ADDRESS.length === 42;

  const publicClient = usePublicClient();
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
  const [quote, setQuote] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Balances
  const { data: ethBalance } = useBalance({ address });
  const { data: zeroBalance } = useReadContract({
    address: DIAMOND_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Tax rate
  const { data: hookTaxBps } = useReadContract({
    address: DIAMOND_ADDRESS,
    abi: effectiveTaxAbi,
    functionName: 'effectiveTaxBps',
  });

  // ZERO allowance on SwapRouter (for sells)
  const { data: zeroAllowance, refetch: refetchAllowance } = useReadContract({
    address: DIAMOND_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, SWAP_ROUTER_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  // Pool key
  const poolKey = buildPoolKey(DIAMOND_ADDRESS, WETH_ADDRESS, HOOK_ADDRESS);
  const zeroIsCurrency0 = DIAMOND_ADDRESS.toLowerCase() < WETH_ADDRESS.toLowerCase();

  // Quoting with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!amount || Number(amount) <= 0 || !publicClient) {
      setQuote(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const parsedAmt = parseEther(amount);
        const zeroForOne = direction === 'buy' ? !zeroIsCurrency0 : zeroIsCurrency0;

        const result = await publicClient.readContract({
          address: V4_QUOTER_ADDRESS,
          abi: v4QuoterAbi,
          functionName: 'quoteExactInputSingle',
          args: [
            {
              poolKey: {
                currency0: poolKey.currency0,
                currency1: poolKey.currency1,
                fee: poolKey.fee,
                tickSpacing: poolKey.tickSpacing,
                hooks: poolKey.hooks,
              },
              zeroForOne,
              exactAmount: parsedAmt,
              hookData: '0x' as `0x${string}`,
            },
          ],
        });

        const amountOut = result[0] as bigint;
        if (amountOut > 0n) {
          setQuote(formatEther(amountOut));
        }
      } catch {
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [amount, direction, publicClient]);

  const fmt = (v: bigint | undefined) =>
    v !== undefined ? Number(formatEther(v)).toLocaleString(undefined, { maximumFractionDigits: 4 }) : '...';

  const fmtEth = (v: { value: bigint } | undefined) =>
    v ? Number(formatEther(v.value)).toLocaleString(undefined, { maximumFractionDigits: 4 }) : '...';

  const taxPct = hookTaxBps !== undefined ? (Number(hookTaxBps) / 100).toFixed(1) : '...';

  const parsedAmount = amount ? parseEther(amount) : 0n;
  const needsApproval =
    direction === 'sell' &&
    parsedAmount > 0n &&
    zeroAllowance !== undefined &&
    parsedAmount > zeroAllowance;

  const getMinOut = (): bigint => {
    if (!quote) return 0n;
    const quoteWei = parseEther(quote);
    return (quoteWei * BigInt(10000 - SLIPPAGE_BPS)) / 10000n;
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Buy <span className="text-[#00ff00]">$ZERO</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Trade $ZERO on Uniswap V4. Tax-free transfers, swap tax fuels the deflationary loop.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="ETH Balance" value={fmtEth(ethBalance)} unit="ETH" />
        <StatCard label="ZERO Balance" value={fmt(zeroBalance)} unit="$ZERO" />
        <StatCard label="Tax Rate" value={`${taxPct}%`} unit="on swaps" />
        <StatCard label="Slippage" value={`${SLIPPAGE_BPS / 100}%`} unit="tolerance" />
      </div>

      {/* Tax breakdown */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground px-1">
        <span className="font-medium text-foreground">Tax Split:</span>
        {[
          ['80%', 'Floor Engine'],
          ['10%', 'Burn'],
          ['5%', 'Staking'],
          ['3%', 'LP'],
          ['2%', 'Treasury'],
        ].map(([pct, label]) => (
          <span key={label}>
            <span className="text-foreground">{pct}</span> {label}
          </span>
        ))}
      </div>

      {/* Chart + Swap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GeckoTerminal Chart */}
        <div className="bg-card border border-border rounded-xl overflow-hidden min-h-[400px]">
          {POOL_ADDRESS ? (
            <iframe
              title="GeckoTerminal Chart"
              src={`https://www.geckoterminal.com/base/pools/${POOL_ADDRESS}?embed=1&info=0&swaps=0&light_chart=0&chart_type=price&resolution=1m`}
              allow="clipboard-write"
              allowFullScreen
              className="w-full h-full min-h-[400px] border-none"
            />
          ) : (
            <div className="flex items-center justify-center h-full p-8">
              <p className="text-muted-foreground text-center">Chart available after pool launch</p>
            </div>
          )}
        </div>

        {/* Swap Panel */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          {!routerReady ? (
            <div className="text-center py-8">
              <p className="text-lg font-bold text-foreground mb-2">SWAP NOT AVAILABLE</p>
              <p className="text-sm text-muted-foreground">
                The SwapRouter contract has not been deployed yet. Configure VITE_SWAP_ROUTER_ADDRESS to enable swaps.
              </p>
            </div>
          ) : address ? (
            <>
              {/* Direction Toggle */}
              <div className="flex rounded-xl overflow-hidden border border-border">
                <button
                  onClick={() => { setDirection('buy'); setAmount(''); setQuote(null); }}
                  className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                    direction === 'buy'
                      ? 'bg-[#00ff00] text-black'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  BUY $ZERO
                </button>
                <button
                  onClick={() => { setDirection('sell'); setAmount(''); setQuote(null); }}
                  className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                    direction === 'sell'
                      ? 'bg-[#00ff00] text-black'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  SELL $ZERO
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  {direction === 'buy' ? 'ETH Amount' : '$ZERO Amount'}
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full mt-2 px-4 py-3 bg-muted rounded-xl text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#00ff00]/50"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {quoteLoading
                    ? 'Fetching quote...'
                    : quote
                    ? `You receive: ~${Number(quote).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${direction === 'buy' ? '$ZERO' : 'ETH'} (after ${taxPct}% tax)`
                    : amount && Number(amount) > 0
                    ? 'Exact quote unavailable'
                    : 'Enter amount to see estimate'}
                </p>
              </div>

              {/* Swap Button */}
              {direction === 'buy' ? (
                <TxButton
                  label={!amount || parsedAmount === 0n ? 'ENTER AMOUNT' : 'BUY $ZERO'}
                  pendingLabel="BUYING..."
                  disabled={!amount || parsedAmount === 0n}
                  onClick={async () => {
                    if (!amount) return;
                    const ethAmount = parseEther(amount);
                    const minOut = quote ? getMinOut() : 0n;
                    return writeContractAsync({
                      address: SWAP_ROUTER_ADDRESS,
                      abi: swapRouterAbi,
                      functionName: 'buyZero',
                      args: [minOut],
                      value: ethAmount,
                      gas: 350_000n,
                    });
                  }}
                />
              ) : (
                <TxButton
                  label={!amount || parsedAmount === 0n ? 'ENTER AMOUNT' : needsApproval ? 'APPROVE + SELL $ZERO' : 'SELL $ZERO'}
                  pendingLabel={needsApproval ? 'APPROVING + SELLING...' : 'SELLING...'}
                  disabled={!amount || parsedAmount === 0n}
                  onClick={async () => {
                    if (!amount) return;
                    const sellAmount = parseEther(amount);

                    if (needsApproval) {
                      const approveTx = await writeContractAsync({
                        address: DIAMOND_ADDRESS,
                        abi: erc20Abi,
                        functionName: 'approve',
                        args: [SWAP_ROUTER_ADDRESS, sellAmount],
                      });
                      await waitForTransactionReceipt(config, { hash: approveTx });
                      await refetchAllowance();
                    }

                    const minOut = getMinOut();
                    return writeContractAsync({
                      address: SWAP_ROUTER_ADDRESS,
                      abi: swapRouterAbi,
                      functionName: 'sellZero',
                      args: [sellAmount, minOut],
                      gas: 500_000n,
                    });
                  }}
                />
              )}

              {/* Info */}
              <div className="border-t border-border pt-3 space-y-1">
                <p className="text-xs text-muted-foreground">
                  {direction === 'buy'
                    ? 'No approval needed -- send ETH directly.'
                    : 'Requires ZERO approval before first sell.'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tax is deducted by the V4 hook automatically. Slippage: {SLIPPAGE_BPS / 100}%.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg font-bold text-foreground mb-2">CONNECT WALLET</p>
              <p className="text-sm text-muted-foreground">Connect your wallet to swap</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{unit}</p>
    </div>
  );
}
