const express = require('express');
const ethers = require('ethers');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x90546848474fb3c9fda3fdad887969bb244e7e58';
const ADMIN_WALLET = process.env.ADMIN_WALLET || '0x4943407105999e3E97EFA2035F5cbC64D72581C6';
const RPC_URL = process.env.RPC_URL || 'https://mainnet.base.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Initialize provider and signer
let provider, signer;
if (PRIVATE_KEY) {
    provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    signer = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log('✅ Backend signer initialized:', signer.address);
} else {
    console.log('⚠️  No private key provided. Backend signing disabled.');
}

// Nonce tracking
const nonces = new Map();

// Generate unique nonce
function generateNonce() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

// Validate admin wallet
function validateAdminWallet(address) {
    return address.toLowerCase() === ADMIN_WALLET.toLowerCase();
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        contract: CONTRACT_ADDRESS,
        admin: ADMIN_WALLET,
        signer: signer ? signer.address : 'not configured'
    });
});

// Get game configuration
app.get('/config', (req, res) => {
    res.json({
        contractAddress: CONTRACT_ADDRESS,
        chainId: 8453,
        adminWallet: ADMIN_WALLET,
        burnTokens: [
            {
                id: 1,
                name: 'Basic Token',
                amount: 1,
                active: true
            }
        ],
        rewards: [
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
    });
});

// Sign reward message
app.post('/sign-reward', async (req, res) => {
    try {
        const { playerAddress, score, rewardTokenId, rewardAmount } = req.body;
        
        console.log('🎮 Sign reward request:', {
            playerAddress,
            score,
            rewardTokenId,
            rewardAmount
        });
        
        // Validate required fields
        if (!playerAddress || !score || !rewardTokenId || !rewardAmount) {
            return res.status(400).json({
                error: 'Missing required fields: playerAddress, score, rewardTokenId, rewardAmount'
            });
        }
        
        // Check if signer is available
        if (!signer) {
            return res.status(500).json({
                error: 'Backend signer not configured'
            });
        }
        
        // Generate nonce and expiry
        const nonce = generateNonce();
        const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        
        // Store nonce for validation
        nonces.set(nonce, {
            playerAddress: playerAddress.toLowerCase(),
            score,
            rewardTokenId,
            rewardAmount,
            timestamp: Date.now()
        });
        
        // Create message hash
        const messageHash = ethers.utils.solidityKeccak256(
            ['address', 'uint256', 'uint256', 'uint256', 'uint256'],
            [playerAddress, 1, score, nonce, expiry] // keyId = 1 for now
        );
        
        // Sign the message
        const signature = await signer.signMessage(ethers.utils.arrayify(messageHash));
        
        console.log('✅ Reward signed:', {
            keyId: 1,
            score,
            nonce,
            expiry,
            signature: signature.substring(0, 10) + '...'
        });
        
        res.json({
            keyId: 1,
            score,
            nonce,
            expiry,
            signature
        });
        
    } catch (error) {
        console.error('❌ Error signing reward:', error);
        res.status(500).json({
            error: 'Failed to sign reward: ' + error.message
        });
    }
});

// Validate nonce (for contract use)
app.post('/validate-nonce', (req, res) => {
    try {
        const { nonce } = req.body;
        
        if (!nonce) {
            return res.status(400).json({
                error: 'Nonce is required'
            });
        }
        
        const nonceData = nonces.get(nonce);
        
        if (!nonceData) {
            return res.status(404).json({
                error: 'Nonce not found or expired'
            });
        }
        
        // Check if nonce is expired (1 hour)
        if (Date.now() - nonceData.timestamp > 3600000) {
            nonces.delete(nonce);
            return res.status(400).json({
                error: 'Nonce expired'
            });
        }
        
        res.json({
            valid: true,
            data: nonceData
        });
        
    } catch (error) {
        console.error('❌ Error validating nonce:', error);
        res.status(500).json({
            error: 'Failed to validate nonce: ' + error.message
        });
    }
});

// Invalidate nonce (after successful claim)
app.post('/invalidate-nonce', (req, res) => {
    try {
        const { nonce } = req.body;
        
        if (!nonce) {
            return res.status(400).json({
                error: 'Nonce is required'
            });
        }
        
        const deleted = nonces.delete(nonce);
        
        res.json({
            success: deleted,
            message: deleted ? 'Nonce invalidated' : 'Nonce not found'
        });
        
    } catch (error) {
        console.error('❌ Error invalidating nonce:', error);
        res.status(500).json({
            error: 'Failed to invalidate nonce: ' + error.message
        });
    }
});

// Get player stats
app.get('/player/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        // This would typically query a database
        // For now, return mock data
        res.json({
            address,
            totalGames: 0,
            totalScore: 0,
            highScore: 0,
            rewardsClaimed: 0,
            lastPlayed: null
        });
        
    } catch (error) {
        console.error('❌ Error getting player stats:', error);
        res.status(500).json({
            error: 'Failed to get player stats: ' + error.message
        });
    }
});

// Submit score (for leaderboard)
app.post('/submit-score', async (req, res) => {
    try {
        const { playerAddress, score, gameData } = req.body;
        
        console.log('📊 Score submission:', {
            playerAddress,
            score,
            gameData
        });
        
        // This would typically save to a database
        // For now, just log it
        console.log('Score saved:', {
            playerAddress,
            score,
            timestamp: new Date().toISOString(),
            gameData
        });
        
        res.json({
            success: true,
            message: 'Score submitted successfully'
        });
        
    } catch (error) {
        console.error('❌ Error submitting score:', error);
        res.status(500).json({
            error: 'Failed to submit score: ' + error.message
        });
    }
});

// Get leaderboard
app.get('/leaderboard', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        // This would typically query a database
        // For now, return mock data
        const leaderboard = [
            { address: '0x1234...5678', score: 1500, rank: 1 },
            { address: '0x2345...6789', score: 1200, rank: 2 },
            { address: '0x3456...7890', score: 1000, rank: 3 }
        ];
        
        res.json({
            leaderboard: leaderboard.slice(0, parseInt(limit)),
            totalPlayers: leaderboard.length
        });
        
    } catch (error) {
        console.error('❌ Error getting leaderboard:', error);
        res.status(500).json({
            error: 'Failed to get leaderboard: ' + error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Shooter Game Backend running on port ${PORT}`);
    console.log(`📋 Contract: ${CONTRACT_ADDRESS}`);
    console.log(`👤 Admin: ${ADMIN_WALLET}`);
    console.log(`🌐 RPC: ${RPC_URL}`);
    console.log(`🔑 Signer: ${signer ? signer.address : 'Not configured'}`);
});

module.exports = app;