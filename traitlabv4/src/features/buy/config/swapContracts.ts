/**
 * Swap Contract Configuration
 * Addresses and ABIs for the Buy/Sell $ZERO swap interface
 * Ported from ZEROtoken frontend
 */

import type { Address } from 'viem';

// Contract addresses from env vars (VITE_ prefix for Vite)
export const DIAMOND_ADDRESS = (import.meta.env.VITE_SWAP_DIAMOND_ADDRESS || '0x062EF009be3Fb978E6b8cD540Dc20f6960Db21aD') as Address;
export const SWAP_ROUTER_ADDRESS = (import.meta.env.VITE_SWAP_ROUTER_ADDRESS || '') as Address;
export const V4_QUOTER_ADDRESS = (import.meta.env.VITE_V4_QUOTER_ADDRESS || '') as Address;
export const HOOK_ADDRESS = (import.meta.env.VITE_HOOK_ADDRESS || '') as Address;
export const WETH_ADDRESS = (import.meta.env.VITE_WETH_ADDRESS || '0x4200000000000000000000000000000000000006') as Address;
export const POOL_ADDRESS = import.meta.env.VITE_POOL_ADDRESS || '';

// Pool config
export const POOL_FEE = 3000;
export const TICK_SPACING = 60;
export const SLIPPAGE_BPS = 300; // 3% default

export function buildPoolKey(zeroAddr: string, wethAddr: string, hookAddr: string) {
  const zeroLower = zeroAddr.toLowerCase();
  const wethLower = wethAddr.toLowerCase();
  const zeroIsCurrency0 = zeroLower < wethLower;
  return {
    currency0: (zeroIsCurrency0 ? zeroAddr : wethAddr) as Address,
    currency1: (zeroIsCurrency0 ? wethAddr : zeroAddr) as Address,
    fee: POOL_FEE,
    tickSpacing: TICK_SPACING,
    hooks: hookAddr as Address,
  };
}

// ABIs
export const erc20Abi = [
  { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'allowance', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'approve', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
] as const;

export const effectiveTaxAbi = [
  { type: 'function', name: 'effectiveTaxBps', inputs: [], outputs: [{ type: 'uint16' }], stateMutability: 'view' },
] as const;

export const swapRouterAbi = [
  { type: 'function', name: 'buyZero', inputs: [{ name: 'amountOutMinimum', type: 'uint128' }], outputs: [], stateMutability: 'payable' },
  { type: 'function', name: 'sellZero', inputs: [{ name: 'amountIn', type: 'uint128' }, { name: 'amountOutMinimum', type: 'uint128' }], outputs: [], stateMutability: 'nonpayable' },
] as const;

export const v4QuoterAbi = [
  {
    type: 'function',
    name: 'quoteExactInputSingle',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        {
          name: 'poolKey',
          type: 'tuple',
          components: [
            { name: 'currency0', type: 'address' },
            { name: 'currency1', type: 'address' },
            { name: 'fee', type: 'uint24' },
            { name: 'tickSpacing', type: 'int24' },
            { name: 'hooks', type: 'address' },
          ],
        },
        { name: 'zeroForOne', type: 'bool' },
        { name: 'exactAmount', type: 'uint128' },
        { name: 'hookData', type: 'bytes' },
      ],
    }],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const;
