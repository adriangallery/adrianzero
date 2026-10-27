/**
 * ZombieMintFacet ABI (AZombie — free mint of AdrianZERO zombies)
 *
 * Facet on the $ZERO Diamond. Mints an AdrianZERO through AdrianLabDelegator
 * (GumballMintFacet pattern). Free (gas only), max 3 per wallet, 1000 total.
 * ~1 in 10 rolls variant 1 = "Zombie0" (skeleton only) on-chain.
 *
 * Contract address: CONTRACT_ADDRESSES.ZERO_DIAMOND
 *
 * Hand-written from ~/build/zombie-spec/SPEC.md (27-oct-2026). Facet cut on 27-oct
 * (0x1A9e5E2bB9E98C680aafD4E75431B2457EDE64e8), launched paused; zombieGetConfig
 * decodes against Base. If a read reverts the UI shows "Mint opens soon".
 * Custom errors are assumed to take no arguments (as listed in SPEC.md).
 */

export const ZOMBIE_MINT_FACET_ABI = [
  // ─── User entrypoint ───
  {
    type: 'function',
    name: 'zombieMint',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'mask', type: 'bytes' },
      { name: 'traits', type: 'uint40' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },

  // ─── Views ───
  {
    type: 'function',
    name: 'zombieGetData',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'mask', type: 'bytes' },
      { name: 'traits', type: 'uint40' },
      { name: 'variant', type: 'uint8' },
      { name: 'index', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'zombieWasMintedHere',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'zombieGetTokenTag',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'zombieGetAllMintedTokens',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'zombieIsTaken',
    stateMutability: 'view',
    inputs: [
      { name: 'mask', type: 'bytes' },
      { name: 'traits', type: 'uint40' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'zombieMintedBy',
    stateMutability: 'view',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'zombieGetConfig',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'delegator', type: 'address' },
      { name: 'paused', type: 'bool' },
      { name: 'totalMinted', type: 'uint256' },
      { name: 'maxSupply', type: 'uint256' },
      { name: 'maxPerWallet', type: 'uint256' },
      { name: 'slotCounts', type: 'uint8[5]' },
    ],
  },

  {
    type: 'function',
    name: 'zombieRareOneIn',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint16' }],
  },

  // ─── Event ───
  {
    type: 'event',
    name: 'ZombieMinted',
    inputs: [
      { indexed: true, name: 'minter', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'index', type: 'uint256' },
      { indexed: false, name: 'traits', type: 'uint40' },
      { indexed: false, name: 'variant', type: 'uint8' },
      { indexed: false, name: 'dna', type: 'bytes32' },
    ],
  },

  // ─── Custom errors (decoded by viem into data.errorName) ───
  { type: 'error', name: 'ZombiePaused', inputs: [] },
  { type: 'error', name: 'ZombieNotInitialized', inputs: [] },
  { type: 'error', name: 'ZombieSoldOut', inputs: [] },
  { type: 'error', name: 'ZombieWalletLimit', inputs: [] },
  { type: 'error', name: 'ZombieBadMask', inputs: [] },
  { type: 'error', name: 'ZombieBadTraits', inputs: [] },
  { type: 'error', name: 'ZombieTaken', inputs: [] },
  { type: 'error', name: 'ZombieMintFailed', inputs: [] },
] as const;
