const express = require('express');
const { AbiCoder, keccak256, Wallet, getBytes, ethers } = require('ethers');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x90546848474fb3c9fda3fdad887969bb244e7e58';
const PROXY_ADDRESS = process.env.PROXY_ADDRESS || '0x...'; // ShooterGameProxy address
const ADMIN_WALLET = process.env.ADMIN_WALLET || '0x4943407105999e3E97EFA2035F5cbC64D72581C6';
const RPC_URL = process.env.RPC_URL || 'https://mainnet.base.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Initialize provider and signer
let provider, signer;
if (PRIVATE_KEY) {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    signer = new Wallet(PRIVATE_KEY, provider);
    console.log('✅ Backend signer initialized:', signer.address);
} else {
    console.log('⚠️  No private key provided. Backend signing disabled.');
}

// Nonce tracking per user
const userNonces = new Map();

// Generate unique nonce for user
function generateUserNonce(userAddress) {
    const currentNonce = userNonces.get(userAddress.toLowerCase()) || 0;
    const newNonce = currentNonce + 1;
    userNonces.set(userAddress.toLowerCase(), newNonce);
    return newNonce;
}

// Get current nonce for user
function getCurrentNonce(userAddress) {
    return userNonces.get(userAddress.toLowerCase()) || 0;
}

/**
 * Create a signature for ShooterGameProxy.executePlay(...)
 * Matches contract: keccak256(abi.encode(...)).toEthSignedMessageHash()
 */
async function signPlayAuthorization(params) {
    const coder = new AbiCoder();

    // IMPORTANT: abi.encode (not packed) to match contract hashing
    const encoded = coder.encode(
        [
            "address",    // proxyAddress
            "address",    // user
            "uint256[]",  // burnIds
            "uint256[]",  // burnAmts
            "uint256[]",  // mintIds
            "uint256[]",  // mintAmts
            "uint256",    // nonce
            "uint256"     // expiry
        ],
        [
            params.proxyAddress,
            params.user,
            params.burnIds,
            params.burnAmts,
            params.mintIds,
            params.mintAmts,
            params.nonce,
            params.expiry
        ]
    );

    // Contract does keccak256(abi.encode(...)).toEthSignedMessageHash()
    const encodedHash = keccak256(encoded);

    // signMessage() adds the Ethereum Signed Message prefix
    const signature = await signer.signMessage(getBytes(encodedHash));

    return {
        signature,
        payload: {
            burnIds: params.burnIds.map(Number),
            burnAmts: params.burnAmts.map(Number),
            mintIds: params.mintIds.map(Number),
            mintAmts: params.mintAmts.map(Number),
            nonce: Number(params.nonce),
            expiry: Number(params.expiry)
        }
    };
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        contract: CONTRACT_ADDRESS,
        proxy: PROXY_ADDRESS,
        admin: ADMIN_WALLET,
        signer: signer ? signer.address : 'not configured'
    });
});

// Get game configuration
app.get('/config', (req, res) => {
    res.json({
        contractAddress: CONTRACT_ADDRESS,
        proxyAddress: PROXY_ADDRESS,
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

// Sign play authorization (new endpoint for executePlay)
app.post('/sign-play', async (req, res) => {
    try {
        const { 
            userAddress, 
            score, 
            burnTokenId, 
            burnAmount = 1,
            rewardTokenId,
            rewardAmount 
        } = req.body;
        
        console.log('🎮 Sign play request:', {
            userAddress,
            score,
            burnTokenId,
            burnAmount,
            rewardTokenId,
            rewardAmount
        });
        
        // Validate required fields
        if (!userAddress || !score || !burnTokenId || !rewardTokenId || !rewardAmount) {
            return res.status(400).json({
                error: 'Missing required fields: userAddress, score, burnTokenId, rewardTokenId, rewardAmount'
            });
        }
        
        // Check if signer is available
        if (!signer) {
            return res.status(500).json({
                error: 'Backend signer not configured'
            });
        }
        
        // Generate nonce and expiry
        const nonce = generateUserNonce(userAddress);
        const expiry = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now
        
        // Prepare burn and mint arrays
        const burnIds = [BigInt(burnTokenId)];
        const burnAmts = [BigInt(burnAmount)];
        const mintIds = [BigInt(rewardTokenId)];
        const mintAmts = [BigInt(rewardAmount)];
        
        // Create signature
        const signatureData = await signPlayAuthorization({
            proxyAddress: PROXY_ADDRESS,
            user: userAddress,
            burnIds,
            burnAmts,
            mintIds,
            mintAmts,
            nonce: BigInt(nonce),
            expiry: BigInt(expiry)
        });
        
        console.log('✅ Play authorization signed:', {
            nonce,
            expiry,
            signature: signatureData.signature.substring(0, 10) + '...'
        });
        
        res.json({
            ...signatureData.payload,
            signature: signatureData.signature,
            proxyAddress: PROXY_ADDRESS
        });
        
    } catch (error) {
        console.error('❌ Error signing play authorization:', error);
        res.status(500).json({
            error: 'Failed to sign play authorization: ' + error.message
        });
    }
});

// Legacy sign-reward endpoint (for backward compatibility)
app.post('/sign-reward', async (req, res) => {
    try {
        const { playerAddress, score, rewardTokenId, rewardAmount } = req.body;
        
        console.log('🎮 Sign reward request (legacy):', {
            playerAddress,
            score,
            rewardTokenId,
            rewardAmount
        });
        
        // Convert to new format
        const burnTokenId = 1; // Default burn token
        const burnAmount = 1;
        
        const response = await signPlayAuthorization({
            proxyAddress: PROXY_ADDRESS,
            user: playerAddress,
            burnIds: [BigInt(burnTokenId)],
            burnAmts: [BigInt(burnAmount)],
            mintIds: [BigInt(rewardTokenId)],
            mintAmts: [BigInt(rewardAmount)],
            nonce: BigInt(generateUserNonce(playerAddress)),
            expiry: BigInt(Math.floor(Date.now() / 1000) + 600)
        });
        
        res.json({
            keyId: 1, // Legacy field
            score,
            nonce: response.payload.nonce,
            expiry: response.payload.expiry,
            signature: response.signature,
            // New fields
            burnIds: response.payload.burnIds,
            burnAmts: response.payload.burnAmts,
            mintIds: response.payload.mintIds,
            mintAmts: response.payload.mintAmts,
            proxyAddress: PROXY_ADDRESS
        });
        
    } catch (error) {
        console.error('❌ Error signing reward (legacy):', error);
        res.status(500).json({
            error: 'Failed to sign reward: ' + error.message
        });
    }
});

// Get user nonce
app.get('/nonce/:address', (req, res) => {
    try {
        const { address } = req.params;
        const nonce = getCurrentNonce(address);
        
        res.json({
            address,
            nonce
        });
        
    } catch (error) {
        console.error('❌ Error getting nonce:', error);
        res.status(500).json({
            error: 'Failed to get nonce: ' + error.message
        });
    }
});

// Validate nonce (for contract use)
app.post('/validate-nonce', (req, res) => {
    try {
        const { address, nonce } = req.body;
        
        if (!address || nonce === undefined) {
            return res.status(400).json({
                error: 'Address and nonce are required'
            });
        }
        
        const expectedNonce = getCurrentNonce(address);
        const isValid = Number(nonce) === expectedNonce;
        
        res.json({
            address,
            providedNonce: Number(nonce),
            expectedNonce,
            valid: isValid
        });
        
    } catch (error) {
        console.error('❌ Error validating nonce:', error);
        res.status(500).json({
            error: 'Failed to validate nonce: ' + error.message
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
    console.log(`🚀 Shooter Game Backend (v6) running on port ${PORT}`);
    console.log(`📋 Contract: ${CONTRACT_ADDRESS}`);
    console.log(`🎯 Proxy: ${PROXY_ADDRESS}`);
    console.log(`👤 Admin: ${ADMIN_WALLET}`);
    console.log(`🌐 RPC: ${RPC_URL}`);
    console.log(`🔑 Signer: ${signer ? signer.address : 'Not configured'}`);
});

module.exports = app;
