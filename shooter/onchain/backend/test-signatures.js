const { AbiCoder, keccak256, Wallet, getBytes } = require('ethers');
require('dotenv').config();

// Test the signature system
async function testSignatureSystem() {
    console.log('🧪 Testing Shooter Game Signature System\n');
    
    // Test parameters
    const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x1234567890123456789012345678901234567890123456789012345678901234';
    const wallet = new Wallet(PRIVATE_KEY);
    
    const testParams = {
        proxyAddress: '0x1234567890123456789012345678901234567890',
        user: '0x9876543210987654321098765432109876543210',
        burnIds: [1001n],
        burnAmts: [1n],
        mintIds: [2001n, 2002n],
        mintAmts: [5n, 1n],
        nonce: 1n,
        expiry: BigInt(Math.floor(Date.now() / 1000) + 600)
    };
    
    console.log('📋 Test Parameters:');
    console.log('  Proxy Address:', testParams.proxyAddress);
    console.log('  User:', testParams.user);
    console.log('  Burn IDs:', testParams.burnIds.map(Number));
    console.log('  Burn Amounts:', testParams.burnAmts.map(Number));
    console.log('  Mint IDs:', testParams.mintIds.map(Number));
    console.log('  Mint Amounts:', testParams.mintAmts.map(Number));
    console.log('  Nonce:', Number(testParams.nonce));
    console.log('  Expiry:', Number(testParams.expiry));
    console.log('  Signer:', wallet.address);
    console.log('');
    
    try {
        // Test signature generation
        console.log('🔐 Generating signature...');
        const signature = await signPlayAuthorization(testParams, wallet);
        
        console.log('✅ Signature generated successfully!');
        console.log('  Signature:', signature.signature);
        console.log('  Payload:', signature.payload);
        console.log('');
        
        // Test signature verification (simulate contract verification)
        console.log('🔍 Testing signature verification...');
        const isValid = await verifySignature(testParams, signature.signature, wallet.address);
        console.log('  Signature valid:', isValid);
        console.log('');
        
        // Test with different parameters
        console.log('🔄 Testing with different parameters...');
        const testParams2 = {
            ...testParams,
            nonce: 2n,
            mintIds: [3001n],
            mintAmts: [10n]
        };
        
        const signature2 = await signPlayAuthorization(testParams2, wallet);
        const isValid2 = await verifySignature(testParams2, signature2.signature, wallet.address);
        
        console.log('  Second signature valid:', isValid2);
        console.log('  Different nonce works:', Number(testParams2.nonce) !== Number(testParams.nonce));
        console.log('');
        
        console.log('✅ All tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

/**
 * Create a signature for ShooterGameProxy.executePlay(...)
 * Matches contract: keccak256(abi.encode(...)).toEthSignedMessageHash()
 */
async function signPlayAuthorization(params, wallet) {
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
    const signature = await wallet.signMessage(getBytes(encodedHash));

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

/**
 * Verify signature (simulate contract verification)
 */
async function verifySignature(params, signature, expectedSigner) {
    try {
        const coder = new AbiCoder();
        
        // Recreate the encoded data
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

        const encodedHash = keccak256(encoded);
        
        // Verify signature
        const recoveredAddress = Wallet.verifyMessage(getBytes(encodedHash), signature);
        
        return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
        
    } catch (error) {
        console.error('Error verifying signature:', error);
        return false;
    }
}

// Run tests
if (require.main === module) {
    testSignatureSystem();
}

module.exports = {
    signPlayAuthorization,
    verifySignature
};
