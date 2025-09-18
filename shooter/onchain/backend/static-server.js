const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
    origin: ['https://adrianzero.com', 'http://localhost:3000', 'http://localhost:8080'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Shooter Game Backend'
    });
});

// Generate nonce
function generateNonce() {
    return Math.floor(Math.random() * 1000000000).toString();
}

// Sign reward endpoint
app.post('/sign-reward', async (req, res) => {
    try {
        const { playerAddress, score, rewardTokenId, rewardAmount } = req.body;
        
        console.log('🎮 Sign reward request:', {
            playerAddress,
            score,
            rewardTokenId,
            rewardAmount
        });
        
        if (!playerAddress || !score || !rewardTokenId || !rewardAmount) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        // Generate nonce and expiry
        const nonce = generateNonce();
        const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        
        // Create a simple signature using a demo private key
        // In production, this should use the actual backend signer key
        const demoPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const wallet = new ethers.Wallet(demoPrivateKey);
        
        // Create EIP-712 signature
        const domain = {
            name: 'ShooterGame',
            version: '1',
            chainId: 8453, // Base mainnet
            verifyingContract: '0xea1d57fa135b661dd77fb7187e6b366c25fd085f' // Shooter contract address
        };
        
        const types = {
            Play: [
                { name: 'user', type: 'address' },
                { name: 'burnIds', type: 'bytes32' },
                { name: 'burnAmts', type: 'bytes32' },
                { name: 'mintIds', type: 'bytes32' },
                { name: 'mintAmts', type: 'bytes32' },
                { name: 'nonce', type: 'uint256' },
                { name: 'expiry', type: 'uint256' }
            ]
        };
        
        const abiCoder = new ethers.AbiCoder();
        const value = {
            user: playerAddress,
            burnIds: ethers.keccak256(abiCoder.encode(['uint256[]'], [[rewardTokenId]])),
            burnAmts: ethers.keccak256(abiCoder.encode(['uint256[]'], [[rewardAmount]])),
            mintIds: ethers.keccak256(abiCoder.encode(['uint256[]'], [[rewardTokenId]])),
            mintAmts: ethers.keccak256(abiCoder.encode(['uint256[]'], [[rewardAmount]])),
            nonce: nonce,
            expiry: expiry
        };
        
        // Sign the typed data
        const signature = await wallet.signTypedData(domain, types, value);
        
        console.log('✅ Reward signed:', {
            keyId: 1,
            score,
            nonce,
            expiry,
            signature: signature.substring(0, 10) + '...'
        });
        
        res.json({
            score,
            nonce,
            expiry,
            signature,
            burnIds: [rewardTokenId],
            burnAmts: [rewardAmount],
            mintIds: [rewardTokenId],
            mintAmts: [rewardAmount]
        });
        
    } catch (error) {
        console.error('❌ Error signing reward:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Validate nonce endpoint
app.post('/validate-nonce', (req, res) => {
    const { nonce } = req.body;
    
    if (!nonce) {
        return res.status(400).json({ error: 'Nonce is required' });
    }
    
    // For demo purposes, always return valid
    res.json({ valid: true, nonce });
});

// Leaderboard endpoint (placeholder)
app.get('/leaderboard', (req, res) => {
    res.json({
        leaderboard: [
            { address: '0x123...', score: 1000, rank: 1 },
            { address: '0x456...', score: 800, rank: 2 },
            { address: '0x789...', score: 600, rank: 3 }
        ]
    });
});

app.listen(PORT, () => {
    console.log('🚀 Shooter Game Backend running on port', PORT);
    console.log('📋 Contract: 0x90546848474fb3c9fda3fdad887969bb244e7e58');
    console.log('👤 Admin: 0x4943407105999e3E97EFA2035F5cbC64D72581C6');
    console.log('🌐 RPC: https://mainnet.base.org');
    console.log('🔑 Signer: Demo mode (not production ready)');
});
