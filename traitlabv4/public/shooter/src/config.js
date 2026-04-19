// Runtime configuration. Edit these after deploying.

export const CONFIG = {
    // Base mainnet chainId = 8453, Base Sepolia = 84532
    chainId: 8453,
    chainIdHex: '0x2105',
    chainName: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',

    // $ZERO Diamond on Base (EIP-2535 — it's also the ERC-20 token address)
    zeroTokenAddress: '0x542b2B96E9c944260722a86C2ee76166A8e3D0A0',

    // Set after deploying ZombieMinter.sol
    contractAddress: '0x0000000000000000000000000000000000000000',

    // Backend signer endpoint. Set to your Railway / Vercel URL.
    signerEndpoint: 'http://localhost:3337/sign',

    // Optional: allow public mint without signature (contract owner must enable)
    allowPublicMint: false,

    // Asset host. Empty string = serve from same origin (relative to <base href>).
    // Set to a CDN prefix (e.g. jsDelivr → GitHub) to offload heavy art from Vercel.
    // Example: 'https://cdn.jsdelivr.net/gh/adriangallery/zombie-assets@main/'
    assetBaseUrl: ''
};
