// Adrian Gumball Machine DApp
class GumballMachineApp {
    constructor() {
        this.currentAccount = null;
        this.contract = null;
        this.provider = null;
        this.signer = null;
        this.selectedQuantity = 1;
        this.contractAddress = '0x...'; // TODO: Add actual contract address
        this.contractABI = [
            "function requestPlayETH(uint32 qty) external payable",
            "function availableSupply() external view returns (uint256)",
            "function freeSupply() external view returns (uint256)",
            "function priceETH() external view returns (uint256)",
            "function getClaimHistory() external view returns (uint256[] memory tokenIds, uint64[] memory timestamps)"
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkConnection();
        this.loadGameHistory();
    }
    
    setupEventListeners() {
        // Wallet connection
        document.getElementById('connectBtn').addEventListener('click', () => this.connectWallet());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnectWallet());
        
        // Quantity selection
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectQuantity(parseInt(e.target.dataset.qty));
            });
        });
        
        // Play button
        document.getElementById('playBtn').addEventListener('click', () => this.playGame());
        
        // Modal close
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        
        // Quantity buttons - set first as active by default
        document.querySelector('.qty-btn[data-qty="1"]').classList.add('active');
    }
    
    async connectWallet() {
        try {
            if (!window.ethereum) {
                alert('Please install MetaMask to use this dApp!');
                return;
            }
            
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.currentAccount = accounts[0];
            
            // Check if we're on Base network
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== '0x2105') { // Base Mainnet
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x2105' }],
                    });
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0x2105',
                                chainName: 'Base Mainnet',
                                nativeCurrency: {
                                    name: 'ETH',
                                    symbol: 'ETH',
                                    decimals: 18,
                                },
                                rpcUrls: ['https://mainnet.base.org'],
                                blockExplorerUrls: ['https://basescan.org/'],
                            }],
                        });
                    } else {
                        throw switchError;
                    }
                }
            }
            
            // Setup provider and signer
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.signer);
            
            this.updateUI();
            this.loadContractData();
            
        } catch (error) {
            console.error('Error connecting wallet:', error);
            alert('Failed to connect wallet: ' + error.message);
        }
    }
    
    disconnectWallet() {
        this.currentAccount = null;
        this.contract = null;
        this.provider = null;
        this.signer = null;
        this.updateUI();
    }
    
    selectQuantity(qty) {
        this.selectedQuantity = qty;
        
        // Update UI
        document.querySelectorAll('.qty-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.qty-btn[data-qty="${qty}"]`).classList.add('active');
        
        // Update price display
        this.updatePriceDisplay();
    }
    
    async playGame() {
        if (!this.currentAccount) {
            alert('Please connect your wallet first!');
            return;
        }
        
        if (!this.contract) {
            alert('Contract not initialized. Please reconnect your wallet.');
            return;
        }
        
        try {
            this.showLoading(true);
            this.updateStatus('PROCESSING...');
            
            // Get current price
            const price = await this.contract.priceETH();
            const totalPrice = price.mul(this.selectedQuantity);
            
            // Request play
            const tx = await this.contract.requestPlayETH(this.selectedQuantity, { value: totalPrice });
            
            this.updateStatus('CONFIRMING...');
            
            // Wait for confirmation
            const receipt = await tx.wait();
            
            this.updateStatus('SUCCESS!');
            this.showSuccessModal();
            
            // Trigger animations
            if (window.gumballRenderer) {
                window.gumballRenderer.insertCoin();
                setTimeout(() => {
                    window.gumballRenderer.dispense();
                }, 1000);
            }
            
            // Refresh data
            setTimeout(() => {
                this.loadContractData();
                this.loadGameHistory();
            }, 2000);
            
        } catch (error) {
            console.error('Error playing game:', error);
            this.updateStatus('ERROR!');
            
            if (error.code === 4001) {
                alert('Transaction was rejected by user.');
            } else {
                alert('Error: ' + error.message);
            }
        } finally {
            this.showLoading(false);
            setTimeout(() => {
                this.updateStatus('READY TO PLAY');
            }, 3000);
        }
    }
    
    async loadContractData() {
        if (!this.contract) return;
        
        try {
            const [availableSupply, freeSupply, priceETH] = await Promise.all([
                this.contract.availableSupply(),
                this.contract.freeSupply(),
                this.contract.priceETH()
            ]);
            
            // Update displays
            this.updateStockDisplay(freeSupply.toString());
            this.updatePriceDisplay(ethers.utils.formatEther(priceETH));
            
        } catch (error) {
            console.error('Error loading contract data:', error);
        }
    }
    
    async loadGameHistory() {
        if (!this.contract) return;
        
        try {
            const [tokenIds, timestamps] = await this.contract.getClaimHistory();
            
            // Show last 8 claims
            const recentClaims = [];
            for (let i = Math.max(0, tokenIds.length - 8); i < tokenIds.length; i++) {
                recentClaims.push({
                    tokenId: tokenIds[i].toString(),
                    timestamp: new Date(timestamps[i].toNumber() * 1000)
                });
            }
            
            this.displayGameHistory(recentClaims.reverse());
            
        } catch (error) {
            console.error('Error loading game history:', error);
        }
    }
    
    displayGameHistory(claims) {
        const historyGrid = document.getElementById('historyGrid');
        historyGrid.innerHTML = '';
        
        if (claims.length === 0) {
            historyGrid.innerHTML = '<p style="color: #cccccc; grid-column: 1 / -1;">No drops yet. Be the first!</p>';
            return;
        }
        
        claims.forEach(claim => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            historyItem.innerHTML = `
                <div class="history-token-id">#${claim.tokenId}</div>
                <div class="history-time">${this.formatTime(claim.timestamp)}</div>
            `;
            
            historyGrid.appendChild(historyItem);
        });
    }
    
    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    }
    
    updateUI() {
        const walletSection = document.getElementById('walletSection');
        const walletInfo = document.getElementById('walletInfo');
        const playBtn = document.getElementById('playBtn');
        
        if (this.currentAccount) {
            walletSection.style.display = 'none';
            walletInfo.style.display = 'block';
            playBtn.disabled = false;
            
            document.getElementById('walletAddress').textContent = 
                `${this.currentAccount.slice(0, 6)}...${this.currentAccount.slice(-4)}`;
        } else {
            walletSection.style.display = 'block';
            walletInfo.style.display = 'none';
            playBtn.disabled = true;
        }
    }
    
    updatePriceDisplay(price = null) {
        if (price) {
            document.getElementById('priceDisplay').textContent = `${price} ETH`;
        } else {
            // Calculate based on selected quantity
            const basePrice = 0.01; // This should come from contract
            const totalPrice = (basePrice * this.selectedQuantity).toFixed(3);
            document.getElementById('priceDisplay').textContent = `${totalPrice} ETH`;
        }
    }
    
    updateStockDisplay(stock) {
        document.getElementById('stockDisplay').textContent = stock;
    }
    
    updateStatus(status) {
        document.getElementById('statusDisplay').textContent = status;
    }
    
    showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }
    
    showSuccessModal() {
        document.getElementById('successModal').style.display = 'flex';
    }
    
    closeModal() {
        document.getElementById('successModal').style.display = 'none';
    }
    
    checkConnection() {
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_accounts' })
                .then(accounts => {
                    if (accounts.length > 0) {
                        this.currentAccount = accounts[0];
                        this.connectWallet();
                    }
                })
                .catch(console.error);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gumballApp = new GumballMachineApp();
});

// Handle wallet changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (window.gumballApp) {
            if (accounts.length === 0) {
                window.gumballApp.disconnectWallet();
            } else {
                window.gumballApp.currentAccount = accounts[0];
                window.gumballApp.connectWallet();
            }
        }
    });
    
    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
}
