/**
 * GumballMintFacet ABI
 *
 * Facet on the $ZERO Diamond that dispenses a random pre-seeded AdrianZERO
 * ("GumballZERO" — closed series of 100) for a fixed $ZERO price per pull.
 *
 * Contract address: CONTRACT_ADDRESSES.ZERO_DIAMOND
 * Token approve target: CONTRACT_ADDRESSES.ZERO_DIAMOND (same address — $ZERO ERC20 lives in the Diamond)
 *
 * NOTE: until the facet is cut into the Diamond on mainnet, `gumballGetConfig`
 * reverts (selector not registered). The UI treats a read error as "not live yet".
 */

export const GUMBALL_MINT_FACET_ABI = [
  // ─── User entrypoint ───
  {
    type: 'function',
    name: 'pullGumball',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'qty', type: 'uint256' }],
    outputs: [],
  },

  // ─── Views ───
  {
    type: 'function',
    name: 'gumballPoolRemaining',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'gumballGetConfig',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'delegator', type: 'address' },
      { name: 'core', type: 'address' },
      { name: 'revenueRecipient', type: 'address' },
      { name: 'treasury', type: 'address' },
      { name: 'pricePerPull', type: 'uint256' },
      { name: 'burnBps', type: 'uint256' },
      { name: 'revenueBps', type: 'uint256' },
      { name: 'treasuryBps', type: 'uint256' },
      { name: 'maxPerTx', type: 'uint256' },
      { name: 'paused', type: 'bool' },
      { name: 'poolRemaining', type: 'uint256' },
      { name: 'totalPulled', type: 'uint256' },
      { name: 'totalSeeded', type: 'uint256' },
    ],
  },

  // ─── Event (best-effort; UI does not depend on parsing it) ───
  {
    type: 'event',
    name: 'GumballPulled',
    inputs: [
      { indexed: true, name: 'puller', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'pricePaid', type: 'uint256' },
    ],
  },
] as const;
