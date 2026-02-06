/**
 * TraitLAB V4 - Contract Configuration
 * Centralized configuration for all smart contract addresses on Base Mainnet
 */

export const CHAIN_ID = 8453; // Base Mainnet

export const CONTRACT_ADDRESSES = {
  // Core Contracts
  ADRIAN_ZERO: '0x6e369bf0e4e0c106192d606fb6d85836d684da75', // ERC721
  ADRIAN_LAB: '0x90546848474fb3c9fda3fdad887969bb244e7e58', // ERC1155

  // Extensions & Modules
  TRAITS_EXTENSIONS: '0x0995c0dA1ca071b792E852b6Ec531b7cD7d1F8D6',
  ADRIAN_CRAFTING: '0x9ab651F50ac78A13a1612CCDDF5a074B2e570829',
  ADRIAN_NAME_REGISTRY: '0xaeC5ED33c88c1943BB7452aC4B571ad0b4c4068C',
  SERUM_MODULE: '0xEb84a51F8d59d1C55cACFd15074AeB104D82B2ec',
  ZOOM_TOGGLE: '0x568933634be4027339c80F126C91742d41A515A0',

  // Pack Contracts
  ACTION_PACKS: '0xa7e2ae50e7f15d220cd3f61728e52d0e6e1b2e36',
  NEW_FLOPPY_PACK: '0x03f501158103dd54A23898bADf8E77Cb8305EB38',
  ADRIAN_FLOPPY_DISCS: '0x56B3fCc1417f269138CB7eBA1272e8Ccfee8fFc8',
  PACK_TOKEN_MINTER: '0x673bE1968A12470F93BE374AAB529a89d5D607d5',
  ACTION_PACK_10007: '0xA7e2Ae50E7f15D220CD3f61728E52D0E6e1b2E36',
  OPENPACK_V4: '0x238083148F4FBF4232efe16261e7aa87CE787022',

  // Tokens
  ADRIAN_TOKEN: '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea', // ERC20

  // Kit Sale
  KIT_SALE: '0x20700BE61f2b94E08B16ebD82eE0BA46189B7305',

  // Shop
  ADRIAN_SHOP: '0x4B265927b1521995Ce416BBa3BEd98231d2E946b',

  // Additional Mints
  SAMURAI_BATCH_DEPLOYER: '0xA988F323023F12812c0BaD74d6C55CE07325d218',
  ADRIAN_ZERO_MINT_WITH_ADRIAN: '0xF278a1060900005aD5b9077602b09A513541f5d2',

  // AdrianPunks Ecosystem
  ADRIAN_PUNKS: '0x79BE8AcdD339C7b92918fcC3fd3875b5Aaad7566', // ERC721
  REWARDS_CONTRACT: '0x5b8c47176432f0b587ca31c4ccc61d0513814be1',
  OGCLAIM_CONTRACT: '0x31D66caBC1D6E65a4947D19ed22FB63ee2C8D84b',
} as const;

export const RPC_URLS = [
  'https://mainnet.base.org',
  'https://base.llamarpc.com',
  'https://base-rpc.publicnode.com',
] as const;

export const ALCHEMY_BASE_URL = 'https://base-mainnet.g.alchemy.com/nft/v3';

export const BLOCK_EXPLORER_URL = 'https://basescan.org';

export const NETWORK_CONFIG = {
  name: 'Base Mainnet',
  chainId: CHAIN_ID,
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [RPC_URLS[0]] },
    public: { http: [RPC_URLS[0]] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: BLOCK_EXPLORER_URL },
  },
} as const;

// Contract type helpers
export type ContractName = keyof typeof CONTRACT_ADDRESSES;

export const getContractAddress = (name: ContractName): string => {
  return CONTRACT_ADDRESSES[name];
};

export const getBlockExplorerUrl = (address: string): string => {
  return `${BLOCK_EXPLORER_URL}/address/${address}`;
};

export const getTxExplorerUrl = (txHash: string): string => {
  return `${BLOCK_EXPLORER_URL}/tx/${txHash}`;
};
