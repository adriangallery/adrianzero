/**
 * TShitMintFacet ABI — the minimal subset the frontend needs.
 * The facet lives inside the $ZERO Diamond at CONTRACT_ADDRESSES.ZERO_DIAMOND.
 */
export const TSHIT_FACET_ABI = [
  {
    type: 'function',
    name: 'mintTShit',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'svgUrl', type: 'string' }],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'tshitMintPrice',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'tshitNextTokenId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'tshitStats',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'totalMinted', type: 'uint256' },
      { name: 'totalZeroBurned', type: 'uint256' },
      { name: 'nextId', type: 'uint256' },
      { name: 'idsRemaining', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'tshitIsActive',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'tshitRegisteredRemaining',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'tshitGetDesignURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'event',
    name: 'TShitMinted',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: false, name: 'svgUrl', type: 'string' },
      { indexed: false, name: 'priceBurned', type: 'uint256' },
      { indexed: false, name: 'mintedAt', type: 'uint256' },
    ],
  },
] as const;
