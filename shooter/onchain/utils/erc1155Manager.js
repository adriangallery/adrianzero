// ERC1155 Asset Verification Manager
class ERC1155Manager {
    constructor(contractAddress, provider, signer) {
        this.contractAddress = contractAddress;
        this.provider = provider;
        this.signer = signer;
        this.contract = null;
        this.init();
    }

    init() {
        console.log(`🔧 [ERC1155] Initializing ERC1155Manager...`);
        console.log(`📋 [ERC1155] Contract Address: ${this.contractAddress}`);
        console.log(`🌐 [ERC1155] Provider:`, this.provider);
        console.log(`👤 [ERC1155] Signer:`, this.signer);
        console.log(`📜 [ERC1155] ABI Length: ${SHOOTER_CONFIG.ERC1155_ABI.length} functions`);
        
        if (this.provider && this.contractAddress) {
            try {
                this.contract = new ethers.Contract(
                    this.contractAddress, 
                    SHOOTER_CONFIG.ERC1155_ABI, 
                    this.signer || this.provider
                );
                console.log(`✅ [ERC1155] Contract instance created successfully`);
                if (this.contract && this.contract.functions) {
                    console.log(`📋 [ERC1155] Contract methods:`, Object.keys(this.contract.functions));
                }
            } catch (error) {
                console.error(`❌ [ERC1155] Error creating contract instance:`, error);
            }
        } else {
            console.log(`❌ [ERC1155] Missing provider or contract address`);
            console.log(`   Provider exists: ${!!this.provider}`);
            console.log(`   Contract address exists: ${!!this.contractAddress}`);
        }
    }

    // Check if player has specific token
    async hasToken(tokenId) {
        console.log(`🔍 [ERC1155] hasToken called for tokenId: ${tokenId}`);
        console.log(`📋 [ERC1155] Contract: ${this.contractAddress}`);
        console.log(`👤 [ERC1155] Signer: ${this.signer ? 'Present' : 'Missing'}`);
        
        if (!this.contract || !this.signer) {
            console.log(`❌ [ERC1155] Missing contract or signer`);
            return false;
        }
        
        try {
            const account = await this.signer.getAddress();
            console.log(`👤 [ERC1155] Account: ${account}`);
            
            console.log(`📞 [ERC1155] Calling balanceOf(${account}, ${tokenId})`);
            const balance = await this.contract.balanceOf(account, tokenId);
            console.log(`💰 [ERC1155] Balance result: ${balance.toString()}`);
            
            const hasToken = balance > 0;
            console.log(`✅ [ERC1155] Has token: ${hasToken}`);
            
            return hasToken;
        } catch (error) {
            console.error(`❌ [ERC1155] Error checking token balance:`, error);
            console.error(`📋 [ERC1155] Error details:`, {
                message: error.message,
                code: error.code,
                reason: error.reason,
                data: error.data
            });
            return false;
        }
    }

    // Check if player has any of the required tokens
    async hasAnyToken(tokenIds) {
        console.log(`🔍 [ERC1155] hasAnyToken called for tokenIds:`, tokenIds);
        console.log(`📋 [ERC1155] Contract: ${this.contractAddress}`);
        console.log(`👤 [ERC1155] Signer: ${this.signer ? 'Present' : 'Missing'}`);
        
        if (!this.contract || !this.signer) {
            console.log(`❌ [ERC1155] Missing contract or signer`);
            return false;
        }
        
        try {
            const account = await this.signer.getAddress();
            console.log(`👤 [ERC1155] Account: ${account}`);
            
            const accounts = new Array(tokenIds.length).fill(account);
            console.log(`📞 [ERC1155] Calling balanceOfBatch with:`);
            console.log(`   Accounts: [${accounts.join(', ')}]`);
            console.log(`   TokenIds: [${tokenIds.join(', ')}]`);
            
            const balances = await this.contract.balanceOfBatch(accounts, tokenIds);
            console.log(`💰 [ERC1155] Balance results:`, balances.map(b => b.toString()));
            
            const hasAny = balances.some(balance => balance > 0);
            console.log(`✅ [ERC1155] Has any token: ${hasAny}`);
            
            return hasAny;
        } catch (error) {
            console.error(`❌ [ERC1155] Error checking token balances:`, error);
            console.error(`📋 [ERC1155] Error details:`, {
                message: error.message,
                code: error.code,
                reason: error.reason,
                data: error.data
            });
            return false;
        }
    }

    // Get balance of specific token
    async getTokenBalance(tokenId) {
        console.log(`🔍 [ERC1155] getTokenBalance called for tokenId: ${tokenId}`);
        console.log(`📋 [ERC1155] Contract: ${this.contractAddress}`);
        console.log(`👤 [ERC1155] Signer: ${this.signer ? 'Present' : 'Missing'}`);
        
        if (!this.contract || !this.signer) {
            console.log(`❌ [ERC1155] Missing contract or signer`);
            return 0;
        }
        
        try {
            const account = await this.signer.getAddress();
            console.log(`👤 [ERC1155] Account: ${account}`);
            
            console.log(`📞 [ERC1155] Calling balanceOf(${account}, ${tokenId})`);
            const balance = await this.contract.balanceOf(account, tokenId);
            console.log(`💰 [ERC1155] Balance result: ${balance.toString()}`);
            
            const balanceNumber = Number(balance);
            console.log(`✅ [ERC1155] Balance as number: ${balanceNumber}`);
            
            return balanceNumber;
        } catch (error) {
            console.error(`❌ [ERC1155] Error getting token balance:`, error);
            console.error(`📋 [ERC1155] Error details:`, {
                message: error.message,
                code: error.code,
                reason: error.reason,
                data: error.data
            });
            return 0;
        }
    }

    // Get balances of multiple tokens
    async getTokenBalances(tokenIds) {
        console.log(`🔍 [ERC1155] getTokenBalances called for tokenIds:`, tokenIds);
        console.log(`📋 [ERC1155] Contract: ${this.contractAddress}`);
        console.log(`👤 [ERC1155] Signer: ${this.signer ? 'Present' : 'Missing'}`);
        
        if (!this.contract || !this.signer) {
            console.log(`❌ [ERC1155] Missing contract or signer`);
            return [];
        }
        
        try {
            const account = await this.signer.getAddress();
            console.log(`👤 [ERC1155] Account: ${account}`);
            
            const accounts = new Array(tokenIds.length).fill(account);
            console.log(`📞 [ERC1155] Calling balanceOfBatch with:`);
            console.log(`   Accounts: [${accounts.join(', ')}]`);
            console.log(`   TokenIds: [${tokenIds.join(', ')}]`);
            
            const balances = await this.contract.balanceOfBatch(accounts, tokenIds);
            console.log(`💰 [ERC1155] Balance results:`, balances.map(b => b.toString()));
            
            const balanceNumbers = balances.map(balance => Number(balance));
            console.log(`✅ [ERC1155] Balances as numbers:`, balanceNumbers);
            
            return balanceNumbers;
        } catch (error) {
            console.error(`❌ [ERC1155] Error getting token balances:`, error);
            console.error(`📋 [ERC1155] Error details:`, {
                message: error.message,
                code: error.code,
                reason: error.reason,
                data: error.data
            });
            return [];
        }
    }

    // Check if player has enough tokens to play (burn requirement)
    async canPlay(burnTokens) {
        console.log(`🔍 [ERC1155] canPlay called with burnTokens:`, burnTokens);
        console.log(`📋 [ERC1155] Contract Address: ${this.contractAddress}`);
        console.log(`📋 [ERC1155] Contract Instance:`, this.contract);
        console.log(`👤 [ERC1155] Signer:`, this.signer);
        
        if (!this.contract || !this.signer) {
            console.log(`❌ [ERC1155] Missing contract or signer`);
            console.log(`   Contract exists: ${!!this.contract}`);
            console.log(`   Signer exists: ${!!this.signer}`);
            return false;
        }
        
        try {
            const account = await this.signer.getAddress();
            console.log(`👤 [ERC1155] Account address: ${account}`);
            
            const tokenIds = burnTokens.map(token => token.id);
            const amounts = burnTokens.map(token => token.amount);
            
            console.log(`🎯 [ERC1155] Token verification details:`);
            console.log(`   Token IDs to check: [${tokenIds.join(', ')}]`);
            console.log(`   Required amounts: [${amounts.join(', ')}]`);
            console.log(`   Burn token names: [${burnTokens.map(t => t.name).join(', ')}]`);
            
            const accounts = new Array(tokenIds.length).fill(account);
            console.log(`📞 [ERC1155] Calling balanceOfBatch:`);
            console.log(`   Method: balanceOfBatch(accounts, tokenIds)`);
            console.log(`   Accounts: [${accounts.join(', ')}]`);
            console.log(`   TokenIds: [${tokenIds.join(', ')}]`);
            
            const balances = await this.contract.balanceOfBatch(accounts, tokenIds);
            console.log(`💰 [ERC1155] Balance results:`, balances.map(b => b.toString()));
            
            // Detailed comparison
            console.log(`🔍 [ERC1155] Detailed token comparison:`);
            for (let i = 0; i < tokenIds.length; i++) {
                const tokenId = tokenIds[i];
                const required = amounts[i];
                const balance = balances[i];
                const hasEnough = balance >= required;
                const tokenName = burnTokens[i].name;
                
                console.log(`   Token ${i + 1}: ${tokenName} (ID: ${tokenId})`);
                console.log(`     Required: ${required}`);
                console.log(`     Balance: ${balance.toString()}`);
                console.log(`     Has enough: ${hasEnough}`);
            }
            
            // FIXED: Check if player has enough of ANY required token (OR logic instead of AND)
            const canPlay = balances.some((balance, index) => 
                balance >= amounts[index]
            );
            
            console.log(`✅ [ERC1155] Final canPlay result: ${canPlay}`);
            console.log(`🔧 [ERC1155] Using OR logic: player needs ANY token, not ALL tokens`);
            
            return canPlay;
        } catch (error) {
            console.error(`❌ [ERC1155] Error checking play eligibility:`, error);
            console.error(`📋 [ERC1155] Error details:`, {
                message: error.message,
                code: error.code,
                reason: error.reason,
                data: error.data,
                stack: error.stack
            });
            
            // Try to decode the error if it's a contract call error
            if (error.data) {
                try {
                    const decodedError = this.contract.interface.parseError(error.data);
                    console.error(`🔍 [ERC1155] Decoded error:`, decodedError);
                } catch (decodeError) {
                    console.error(`❌ [ERC1155] Could not decode error:`, decodeError);
                }
            }
            
            return false;
        }
    }

    // Get which tokens player can use to play
    async getPlayableTokens(burnTokens) {
        console.log(`🔍 [ERC1155] getPlayableTokens called with burnTokens:`, burnTokens);
        console.log(`📋 [ERC1155] Contract Address: ${this.contractAddress}`);
        console.log(`👤 [ERC1155] Signer: ${this.signer ? 'Present' : 'Missing'}`);
        
        if (!this.contract || !this.signer) {
            console.log(`❌ [ERC1155] Missing contract or signer`);
            return [];
        }
        
        try {
            const account = await this.signer.getAddress();
            console.log(`👤 [ERC1155] Account: ${account}`);
            
            const tokenIds = burnTokens.map(token => token.id);
            const amounts = burnTokens.map(token => token.amount);
            
            console.log(`🎯 [ERC1155] Checking playable tokens:`);
            console.log(`   Token IDs: [${tokenIds.join(', ')}]`);
            console.log(`   Required amounts: [${amounts.join(', ')}]`);
            console.log(`   Token names: [${burnTokens.map(t => t.name).join(', ')}]`);
            
            const accounts = new Array(tokenIds.length).fill(account);
            console.log(`📞 [ERC1155] Calling balanceOfBatch:`);
            console.log(`   Accounts: [${accounts.join(', ')}]`);
            console.log(`   TokenIds: [${tokenIds.join(', ')}]`);
            
            const balances = await this.contract.balanceOfBatch(accounts, tokenIds);
            console.log(`💰 [ERC1155] Balance results:`, balances.map(b => b.toString()));
            
            const playableTokens = [];
            console.log(`🔍 [ERC1155] Checking each token for playability:`);
            
            burnTokens.forEach((token, index) => {
                const balance = balances[index];
                const required = amounts[index];
                const isPlayable = balance >= required;
                
                console.log(`   Token ${index + 1}: ${token.name} (ID: ${token.id})`);
                console.log(`     Required: ${required}`);
                console.log(`     Balance: ${balance.toString()}`);
                console.log(`     Is playable: ${isPlayable}`);
                
                if (isPlayable) {
                    const playableToken = {
                        ...token,
                        availableBalance: Number(balance)
                    };
                    playableTokens.push(playableToken);
                    console.log(`     ✅ Added to playable tokens`);
                } else {
                    console.log(`     ❌ Not enough balance`);
                }
            });
            
            console.log(`✅ [ERC1155] Final playable tokens:`, playableTokens);
            
            return playableTokens;
        } catch (error) {
            console.error(`❌ [ERC1155] Error getting playable tokens:`, error);
            console.error(`📋 [ERC1155] Error details:`, {
                message: error.message,
                code: error.code,
                reason: error.reason,
                data: error.data,
                stack: error.stack
            });
            return [];
        }
    }

    // Set approval for shooter contract to burn tokens
    async setApprovalForShooter(shooterContractAddress) {
        if (!this.contract || !this.signer) return false;
        try {
            const tx = await this.contract.setApprovalForAll(shooterContractAddress, true);
            await tx.wait();
            return true;
        } catch (error) {
            console.error('Error setting approval:', error);
            return false;
        }
    }

    // Check if shooter contract is approved
    async isShooterApproved(shooterContractAddress) {
        if (!this.contract || !this.signer) return false;
        try {
            const account = await this.signer.getAddress();
            return await this.contract.isApprovedForAll(account, shooterContractAddress);
        } catch (error) {
            console.error('Error checking approval:', error);
            return false;
        }
    }

    // Update signer (when wallet changes)
    updateSigner(newSigner) {
        console.log(`🔄 [ERC1155] Updating signer...`);
        console.log(`👤 [ERC1155] Old signer:`, this.signer);
        console.log(`👤 [ERC1155] New signer:`, newSigner);
        
        this.signer = newSigner;
        this.init();
        
        console.log(`✅ [ERC1155] Signer updated and contract reinitialized`);
    }

    // Test contract connection
    async testConnection() {
        console.log(`🧪 [ERC1155] Testing contract connection...`);
        console.log(`📋 [ERC1155] Contract Address: ${this.contractAddress}`);
        console.log(`📋 [ERC1155] Contract Instance:`, this.contract);
        
        if (!this.contract) {
            console.log(`❌ [ERC1155] No contract instance available`);
            return false;
        }
        
        try {
            // Test a simple read call
            console.log(`📞 [ERC1155] Testing contract with a simple call...`);
            
            if (this.signer) {
                const account = await this.signer.getAddress();
                console.log(`👤 [ERC1155] Testing with account: ${account}`);
                
                // Test balanceOf with token ID 1
                const testBalance = await this.contract.balanceOf(account, 1);
                console.log(`💰 [ERC1155] Test balance for token ID 1: ${testBalance.toString()}`);
                
                console.log(`✅ [ERC1155] Contract connection test successful`);
                return true;
            } else {
                console.log(`❌ [ERC1155] No signer available for testing`);
                return false;
            }
        } catch (error) {
            console.error(`❌ [ERC1155] Contract connection test failed:`, error);
            console.error(`📋 [ERC1155] Error details:`, {
                message: error.message,
                code: error.code,
                reason: error.reason,
                data: error.data
            });
            return false;
        }
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ERC1155Manager;
} else if (typeof window !== 'undefined') {
    window.ERC1155Manager = ERC1155Manager;
}