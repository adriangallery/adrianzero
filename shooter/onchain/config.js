// Centralized configuration for Shooter Game Onchain Integration
const SHOOTER_CONFIG = {
    // Contract Address
    CONTRACT_ADDRESS: '0x90546848474fb3c9fda3fdad887969bb244e7e58',
    
    // Network Configuration
    CHAIN_ID: 8453, // Base mainnet
    CHAIN_NAME: 'Base',
    RPC_URL: 'https://mainnet.base.org',
    BLOCK_EXPLORER_URL: 'https://basescan.org',
    
    // Admin Configuration
    ADMIN_WALLET: '0x4943407105999e3E97EFA2035F5cbC64D72581C6',
    
    // Backend Configuration
    BACKEND_URL: 'http://localhost:3001', // Change to production URL when deployed
    
    // Game Configuration
    GAME_CONFIG: {
        // Default burn tokens (can be overridden by admin)
        DEFAULT_BURN_TOKENS: [
            {
                id: 1,
                name: 'Basic Token',
                amount: 1,
                active: true
            }
        ],
        
        // Default rewards (can be overridden by admin)
        DEFAULT_REWARDS: [
            {
                score: 100,
                tokenId: 2,
                amount: 1,
                name: 'Bronze Reward'
            },
            {
                score: 500,
                tokenId: 3,
                amount: 5,
                name: 'Silver Reward'
            },
            {
                score: 1000,
                tokenId: 4,
                amount: 10,
                name: 'Gold Reward'
            }
        ]
    },
    
    // Contract ABI (minimal for wallet operations)
    CONTRACT_ABI: [
        "function hasKey(address player) view returns (bool)",
        "function getPlayerKeyId(address player) view returns (uint256)",
        "function mintKey() payable returns (uint256)",
        "function claimReward(uint256 keyId, uint256 score, uint256 nonce, uint256 expiry, bytes signature)",
        "function getGameConfig() view returns (uint256, uint256)",
        "function getScoreReward(uint256 score) view returns (uint256, uint256)",
        "function getPlayerInfo(address player) view returns (bool, uint256, uint256)",
        "event KeyMinted(address indexed user, uint256 keyId)",
        "event RewardClaimed(address indexed user, uint256 keyId, uint256 score, uint256 rewardTokenId, uint256 amount)"
    ]
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SHOOTER_CONFIG;
} else if (typeof window !== 'undefined') {
    window.SHOOTER_CONFIG = SHOOTER_CONFIG;
}
