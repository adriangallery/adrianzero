// Backend server for Shooter Game rewards signing
import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY; // Set this in environment
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS; // Set this in environment
const ADMIN_WALLET = '0x4943407105999e3E97EFA2035F5cbC64D72581C6';

// In-memory storage for nonces (in production, use Redis or database)
const usedNonces = new Set();
const playerScores = new Map();

// Initialize wallet
if (!PRIVATE_KEY) {
    console.error('BACKEND_PRIVATE_KEY environment variable is required');
    process.exit(1);
}

const wallet = new ethers.Wallet(PRIVATE_KEY);
console.log('Backend signer address:', wallet.address);

// Middleware to validate admin wallet
const validateAdmin = (req, res, next) => {
    const { adminWallet } = req.body;
    if (!adminWallet || adminWallet.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
        return res.status(403).json({ error: 'Unauthorized admin wallet' });
    }
    next();
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', signer: wallet.address });
});

// Submit game score
app.post('/api/submit-score', async (req, res) => {
    try {
        const { playerAddress, score, keyId, adminWallet } = req.body;

        // Validate admin wallet
        if (!adminWallet || adminWallet.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
            return res.status(403).json({ error: 'Unauthorized admin wallet' });
        }

        // Validate input
        if (!playerAddress || !score || !keyId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Store score temporarily
        const scoreId = crypto.randomUUID();
        playerScores.set(scoreId, {
            playerAddress,
            score: parseInt(score),
            keyId: parseInt(keyId),
            timestamp: Date.now()
        });

        res.json({ 
            success: true, 
            scoreId,
            message: 'Score submitted successfully' 
        });
    } catch (error) {
        console.error('Error submitting score:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get signed reward claim
app.post('/api/claim-reward', async (req, res) => {
    try {
        const { playerAddress, scoreId, adminWallet } = req.body;

        // Validate admin wallet
        if (!adminWallet || adminWallet.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
            return res.status(403).json({ error: 'Unauthorized admin wallet' });
        }

        // Get stored score
        const scoreData = playerScores.get(scoreId);
        if (!scoreData) {
            return res.status(404).json({ error: 'Score not found' });
        }

        // Verify player address matches
        if (scoreData.playerAddress.toLowerCase() !== playerAddress.toLowerCase()) {
            return res.status(403).json({ error: 'Player address mismatch' });
        }

        // Generate nonce (in production, get from contract)
        const nonce = Date.now();
        
        // Set expiry (10 minutes from now)
        const expiry = Math.floor(Date.now() / 1000) + 600;

        // For now, use default reward values (in production, get from contract)
        const rewardTokenId = 1; // Default reward token ID
        const rewardAmount = Math.floor(scoreData.score / 100); // 1 token per 100 points

        // Create message hash
        const message = ethers.utils.solidityKeccak256(
            ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
            [playerAddress, scoreData.keyId, scoreData.score, rewardTokenId, rewardAmount, nonce, expiry]
        );

        // Sign the message
        const signature = await wallet.signMessage(ethers.utils.arrayify(message));

        // Clean up used score
        playerScores.delete(scoreId);

        res.json({
            success: true,
            keyId: scoreData.keyId,
            score: scoreData.score,
            rewardTokenId,
            rewardAmount,
            nonce,
            expiry,
            signature
        });
    } catch (error) {
        console.error('Error generating claim signature:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get player's current nonce
app.get('/api/nonce/:playerAddress', (req, res) => {
    try {
        const { playerAddress } = req.params;
        
        // In production, get from contract
        const nonce = Date.now();
        
        res.json({ nonce });
    } catch (error) {
        console.error('Error getting nonce:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin endpoints for configuration
app.post('/api/admin/update-config', validateAdmin, async (req, res) => {
    try {
        const { burnTokenId, playCost } = req.body;
        
        // In production, call contract function
        console.log('Admin updating config:', { burnTokenId, playCost });
        
        res.json({ success: true, message: 'Configuration updated' });
    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/update-rewards', validateAdmin, async (req, res) => {
    try {
        const { rewards } = req.body;
        
        // In production, call contract function
        console.log('Admin updating rewards:', rewards);
        
        res.json({ success: true, message: 'Rewards updated' });
    } catch (error) {
        console.error('Error updating rewards:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get game statistics
app.get('/api/stats', (req, res) => {
    try {
        const stats = {
            totalScores: playerScores.size,
            activeScores: Array.from(playerScores.values()).length,
            serverUptime: process.uptime()
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Shooter Game Backend running on port ${PORT}`);
    console.log(`📝 Backend signer: ${wallet.address}`);
    console.log(`🔐 Admin wallet: ${ADMIN_WALLET}`);
});

export default app;
