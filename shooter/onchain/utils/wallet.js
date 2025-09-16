// Wallet connection utilities for Shooter Game
import { ethers } from 'https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js';

export class WalletManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.contract = null;
        this.contractAddress = null;
        this.chainId = 8453; // Base mainnet
        this.isConnected = false;
    }

    // Initialize wallet connection
    async init(contractAddress, contractABI) {
        this.contractAddress = contractAddress;
        
        // Check if MetaMask is installed
        if (typeof window.ethereum !== 'undefined') {
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Check if already connected
            const accounts = await this.provider.listAccounts();
            if (accounts.length > 0) {
                await this.connect();
            }
        } else {
            throw new Error('MetaMask not installed');
        }
    }

    // Connect wallet
    async connect() {
        try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Get provider and signer
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.account = await this.signer.getAddress();
            
            // Check if we're on the correct network
            const network = await this.provider.getNetwork();
            if (network.chainId !== this.chainId) {
                await this.switchNetwork();
            }
            
            // Initialize contract
            this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.signer);
            
            this.isConnected = true;
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
            window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
            
            return this.account;
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            throw error;
        }
    }

    // Switch to Base network
    async switchNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x2105' }], // Base mainnet
            });
        } catch (switchError) {
            // If network doesn't exist, add it
            if (switchError.code === 4902) {
                await this.addBaseNetwork();
            } else {
                throw switchError;
            }
        }
    }

    // Add Base network to MetaMask
    async addBaseNetwork() {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: '0x2105',
                chainName: 'Base',
                rpcUrls: ['https://mainnet.base.org'],
                nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18,
                },
                blockExplorerUrls: ['https://basescan.org'],
            }],
        });
    }

    // Handle account changes
    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            this.disconnect();
        } else {
            this.account = accounts[0];
            this.signer = this.provider.getSigner();
            this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.signer);
        }
    }

    // Handle chain changes
    handleChainChanged(chainId) {
        if (parseInt(chainId, 16) !== this.chainId) {
            this.disconnect();
        }
    }

    // Disconnect wallet
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.contract = null;
        this.isConnected = false;
    }

    // Check if player has a key
    async hasKey() {
        if (!this.contract) return false;
        try {
            return await this.contract.hasKey(this.account);
        } catch (error) {
            console.error('Error checking key ownership:', error);
            return false;
        }
    }

    // Get player's key ID
    async getPlayerKeyId() {
        if (!this.contract) return null;
        try {
            const keyId = await this.contract.getPlayerKeyId(this.account);
            return keyId.toString();
        } catch (error) {
            console.error('Error getting player key ID:', error);
            return null;
        }
    }

    // Mint a key
    async mintKey(cost) {
        if (!this.contract) throw new Error('Wallet not connected');
        try {
            const tx = await this.contract.mintKey({ value: ethers.utils.parseEther(cost.toString()) });
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error minting key:', error);
            throw error;
        }
    }

    // Claim reward
    async claimReward(keyId, score, nonce, expiry, signature) {
        if (!this.contract) throw new Error('Wallet not connected');
        try {
            const tx = await this.contract.claimReward(keyId, score, nonce, expiry, signature);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error claiming reward:', error);
            throw error;
        }
    }

    // Get game configuration
    async getGameConfig() {
        if (!this.contract) return null;
        try {
            const config = await this.contract.getGameConfig();
            return {
                burnTokenId: config.burnTokenId.toString(),
                playCost: ethers.utils.formatEther(config.playCost)
            };
        } catch (error) {
            console.error('Error getting game config:', error);
            return null;
        }
    }

    // Get score reward info
    async getScoreReward(score) {
        if (!this.contract) return null;
        try {
            const reward = await this.contract.getScoreReward(score);
            return {
                tokenId: reward[0].toString(),
                amount: reward[1].toString()
            };
        } catch (error) {
            console.error('Error getting score reward:', error);
            return null;
        }
    }

    // Get player info
    async getPlayerInfo() {
        if (!this.contract) return null;
        try {
            const info = await this.contract.getPlayerInfo(this.account);
            return {
                hasKey: info.hasKey,
                keyId: info.keyId.toString(),
                nonce: info.nonce.toString()
            };
        } catch (error) {
            console.error('Error getting player info:', error);
            return null;
        }
    }
}

// Contract ABI (minimal for wallet operations)
export const SHOOTER_CONTRACT_ABI = [
    "function hasKey(address player) view returns (bool)",
    "function getPlayerKeyId(address player) view returns (uint256)",
    "function mintKey() payable returns (uint256)",
    "function claimReward(uint256 keyId, uint256 score, uint256 nonce, uint256 expiry, bytes signature)",
    "function getGameConfig() view returns (uint256, uint256)",
    "function getScoreReward(uint256 score) view returns (uint256, uint256)",
    "function getPlayerInfo(address player) view returns (bool, uint256, uint256)",
    "event KeyMinted(address indexed user, uint256 keyId)",
    "event RewardClaimed(address indexed user, uint256 keyId, uint256 score, uint256 rewardTokenId, uint256 amount)"
];
