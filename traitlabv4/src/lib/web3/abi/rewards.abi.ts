/**
 * REWARDS Contract ABI
 * Contract: 0x5b8c47176432f0b587ca31c4ccc61d0513814be1
 */

export const REWARDS_ABI = [
  {
    inputs: [{ name: 'campaignId', type: 'uint256' }],
    name: 'getCampaign',
    outputs: [
      { name: 'assetId', type: 'uint256' },
      { name: 'amountPerToken', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'active', type: 'bool' },
      { name: 'totalClaimed', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'campaignId', type: 'uint256' },
      { name: 'punkId', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    name: 'canClaim',
    outputs: [
      { name: '', type: 'bool' },
      { name: '', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'campaignId', type: 'uint256' },
      { name: 'punkId', type: 'uint256' },
    ],
    name: 'hasClaimed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'campaignId', type: 'uint256' },
      { name: 'punkId', type: 'uint256' },
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'campaignId', type: 'uint256' },
      { name: 'punkIds', type: 'uint256[]' },
    ],
    name: 'batchClaim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'currentCampaignId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
