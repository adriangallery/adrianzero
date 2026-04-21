/**
 * SamuraiMintFacet ABI
 *
 * Facet on the $ZERO Diamond that handles SamuraiZERO + AdrianZERO mints
 * paid in $ZERO. Replaces the legacy SubZEROdeployerV3 (BatchDeployer) at
 * 0xA988F323023F12812c0BaD74d6C55CE07325d218 for these two batches.
 *
 * Contract address: CONTRACT_ADDRESSES.ZERO_DIAMOND
 * Token approve target: CONTRACT_ADDRESSES.ZERO_DIAMOND (same address — $ZERO ERC20 lives in the Diamond)
 *
 * Batch IDs:
 *   1 = SamuraiZERO
 *   2 = AdrianZERO
 */

export const SAMURAI_MINT_FACET_ABI = [
  // ─── User entrypoints ───
  {
    type: 'function',
    name: 'mintSamuraiZERO',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'quantity', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'mintAdrianZERO',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'quantity', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'mintFromBatch',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'batchId', type: 'uint256' },
      { name: 'quantity', type: 'uint256' },
    ],
    outputs: [],
  },

  // ─── Views ───
  {
    type: 'function',
    name: 'getSamuraiBatchInfo',
    stateMutability: 'view',
    inputs: [{ name: 'batchId', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'name', type: 'string' },
      { name: 'tag', type: 'string' },
      { name: 'price', type: 'uint256' },
      { name: 'minted', type: 'uint256' },
      { name: 'maxSupply', type: 'uint256' },
      { name: 'maxPerWallet', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'getSamuraiUserMints',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'batchId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getSamuraiMintConfig',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'delegator', type: 'address' },
      { name: 'revenueRecipient', type: 'address' },
      { name: 'burnBps', type: 'uint256' },
      { name: 'revenueBps', type: 'uint256' },
      { name: 'paused', type: 'bool' },
      { name: 'totalMinted', type: 'uint256' },
      { name: 'totalBurned', type: 'uint256' },
      { name: 'totalToRevenue', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'getAllSamuraiBatches',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'wasMintedHere',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getTokenTag',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'getTokensByTag',
    stateMutability: 'view',
    inputs: [{ name: 'tag', type: 'string' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },

  // ─── Events ───
  {
    type: 'event',
    name: 'SamuraiMinted',
    inputs: [
      { indexed: true,  name: 'minter',    type: 'address' },
      { indexed: true,  name: 'batchId',   type: 'uint256' },
      { indexed: true,  name: 'tokenId',   type: 'uint256' },
      { indexed: false, name: 'tag',       type: 'string'  },
      { indexed: false, name: 'pricePaid', type: 'uint256' },
      { indexed: false, name: 'burned',    type: 'uint256' },
      { indexed: false, name: 'toRevenue', type: 'uint256' },
    ],
  },
] as const;
