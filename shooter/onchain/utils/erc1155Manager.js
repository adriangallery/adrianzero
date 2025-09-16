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
        if (this.provider && this.contractAddress) {
            this.contract = new ethers.Contract(
                this.contractAddress, 
                SHOOTER_CONFIG.ERC1155_ABI, 
                this.signer || this.provider
            );
        }
    }

    // Check if player has specific token
    async hasToken(tokenId) {
        if (!this.contract || !this.signer) return false;
        try {
            const account = await this.signer.getAddress();
            const balance = await this.contract.balanceOf(account, tokenId);
            return balance.gt(0);
        } catch (error) {
            console.error('Error checking token balance:', error);
            return false;
        }
    }

    // Check if player has any of the required tokens
    async hasAnyToken(tokenIds) {
        if (!this.contract || !this.signer) return false;
        try {
            const account = await this.signer.getAddress();
            const balances = await this.contract.balanceOfBatch(
                new Array(tokenIds.length).fill(account),
                tokenIds
            );
            return balances.some(balance => balance.gt(0));
        } catch (error) {
            console.error('Error checking token balances:', error);
            return false;
        }
    }

    // Get balance of specific token
    async getTokenBalance(tokenId) {
        if (!this.contract || !this.signer) return 0;
        try {
            const account = await this.signer.getAddress();
            const balance = await this.contract.balanceOf(account, tokenId);
            return balance.toNumber();
        } catch (error) {
            console.error('Error getting token balance:', error);
            return 0;
        }
    }

    // Get balances of multiple tokens
    async getTokenBalances(tokenIds) {
        if (!this.contract || !this.signer) return [];
        try {
            const account = await this.signer.getAddress();
            const balances = await this.contract.balanceOfBatch(
                new Array(tokenIds.length).fill(account),
                tokenIds
            );
            return balances.map(balance => balance.toNumber());
        } catch (error) {
            console.error('Error getting token balances:', error);
            return [];
        }
    }

    // Check if player has enough tokens to play (burn requirement)
    async canPlay(burnTokens) {
        if (!this.contract || !this.signer) return false;
        try {
            const account = await this.signer.getAddress();
            const tokenIds = burnTokens.map(token => token.id);
            const amounts = burnTokens.map(token => token.amount);
            
            const balances = await this.contract.balanceOfBatch(
                new Array(tokenIds.length).fill(account),
                tokenIds
            );
            
            // Check if player has enough of each required token
            return balances.every((balance, index) => 
                balance.gte(amounts[index])
            );
        } catch (error) {
            console.error('Error checking play eligibility:', error);
            return false;
        }
    }

    // Get which tokens player can use to play
    async getPlayableTokens(burnTokens) {
        if (!this.contract || !this.signer) return [];
        try {
            const account = await this.signer.getAddress();
            const tokenIds = burnTokens.map(token => token.id);
            const amounts = burnTokens.map(token => token.amount);
            
            const balances = await this.contract.balanceOfBatch(
                new Array(tokenIds.length).fill(account),
                tokenIds
            );
            
            const playableTokens = [];
            burnTokens.forEach((token, index) => {
                if (balances[index].gte(amounts[index])) {
                    playableTokens.push({
                        ...token,
                        availableBalance: balances[index].toNumber()
                    });
                }
            });
            
            return playableTokens;
        } catch (error) {
            console.error('Error getting playable tokens:', error);
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
        this.signer = newSigner;
        this.init();
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ERC1155Manager;
} else if (typeof window !== 'undefined') {
    window.ERC1155Manager = ERC1155Manager;
}
