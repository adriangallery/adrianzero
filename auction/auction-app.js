// AdrianAuction DApp - Main Application Logic

// Contract addresses
const AUCTION_CONTRACT = "0x73DC057131BD058981355907614F5944Fc4B93D3";
const ADRIAN_TOKEN = "0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea";
const BASE_CHAIN_ID = 8453; // Base Mainnet

// Contract ABIs
const AUCTION_ABI = [
    "function getAuctionStats() external view returns (uint256 _highestBid, address _highestBidder, uint256 _totalTokens, uint256 _bidderCount, uint256 _auctionStartTime, uint256 _auctionEndTime)",
    "function getAllBids() external view returns (address[] memory, uint256[] memory)",
    "function getTimeRemaining() external view returns (uint256)",
    "function bid(uint256 amount) external"
];

const ERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function decimals() external view returns (uint8)"
];

// Global state
let readProvider = null; // Alchemy or public provider for reading
let writeProvider = null; // MetaMask provider for writing
let signer = null;
let userAddress = null;
let auctionContract = null;
let adrianTokenContract = null;
let countdownInterval = null;

// Auction data
let auctionStats = {
    highestBid: 0,
    highestBidder: null,
    totalTokens: 0,
    bidderCount: 0,
    startTime: 0,
    endTime: 0
};

// Initialize Alchemy provider
async function initAlchemyProvider() {
    try {
        // Try to load config from traitlab (shared config)
        let alchemyKey = null;
        
        // Check if config-keys.js is available (from traitlab)
        if (window.ALCHEMY_KEYS_CONFIG) {
            alchemyKey = window.ALCHEMY_KEYS_CONFIG.primary || window.ALCHEMY_KEYS_CONFIG.fallbacks?.[0];
            console.log('✅ Using Alchemy key from config');
        }
        
        // Fallback to public key
        if (!alchemyKey) {
            alchemyKey = "pqRmKgTaLqm2eak9iML1f";
            console.log('⚠️ Using fallback Alchemy key');
        }
        
        const alchemyUrl = `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`;
        readProvider = new ethers.providers.JsonRpcProvider(alchemyUrl);
        
        console.log('✅ Alchemy provider initialized');
        return true;
    } catch (error) {
        console.error('Error initializing Alchemy:', error);
        // Fallback to public RPC
        readProvider = new ethers.providers.JsonRpcProvider("https://mainnet.base.org");
        console.log('⚠️ Using public Base RPC as fallback');
        return false;
    }
}

// Load Alchemy config if available
function loadAlchemyConfig() {
    const script = document.createElement('script');
    script.src = '../traitlab/config-keys.js';
    script.onerror = () => {
        console.warn('config-keys.js not found, using fallback keys');
    };
    document.head.appendChild(script);
}

// Initialize read-only contracts (no wallet needed)
async function initReadContracts() {
    if (!readProvider) {
        await initAlchemyProvider();
    }
    
    auctionContract = new ethers.Contract(AUCTION_CONTRACT, AUCTION_ABI, readProvider);
    adrianTokenContract = new ethers.Contract(ADRIAN_TOKEN, ERC20_ABI, readProvider);
    
    console.log('✅ Read contracts initialized');
}

// Load auction data (no wallet needed)
async function loadAuctionData() {
    try {
        if (!auctionContract) {
            await initReadContracts();
        }
        
        // Get auction stats
        const stats = await auctionContract.getAuctionStats();
        auctionStats = {
            highestBid: stats._highestBid,
            highestBidder: stats._highestBidder,
            totalTokens: stats._totalTokens,
            bidderCount: stats._bidderCount.toNumber(),
            startTime: stats._auctionStartTime.toNumber(),
            endTime: stats._auctionEndTime.toNumber()
        };
        
        // Debug: Log times to verify
        console.log('Auction times:', {
            startTime: auctionStats.startTime,
            endTime: auctionStats.endTime,
            now: Math.floor(Date.now() / 1000),
            remaining: auctionStats.endTime - Math.floor(Date.now() / 1000)
        });
        
        // Update UI
        updateAuctionInfo();
        
        // Load top bidders
        await loadTopBidders();
        
        // Start countdown if auction is active
        const now = Math.floor(Date.now() / 1000);
        if (now >= auctionStats.startTime && now < auctionStats.endTime) {
            startCountdown();
        } else {
            updateAuctionStatus();
        }
        
    } catch (error) {
        console.error('Error loading auction data:', error);
        showStatus('Error loading auction data. Please refresh.', 'error');
    }
}

// Update auction info in UI
function updateAuctionInfo() {
    const highestBidEl = document.getElementById('highestBid');
    const highestBidderEl = document.getElementById('highestBidder');
    const totalDepositedEl = document.getElementById('totalDeposited');
    const bidderCountEl = document.getElementById('bidderCount');
    
    if (highestBidEl) {
        const bidAmount = parseFloat(ethers.utils.formatEther(auctionStats.highestBid));
        highestBidEl.textContent = bidAmount > 0 ? bidAmount.toLocaleString() : '0';
    }
    
    if (highestBidderEl) {
        if (auctionStats.highestBidder && auctionStats.highestBidder !== ethers.constants.AddressZero) {
            const addr = auctionStats.highestBidder;
            highestBidderEl.textContent = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
        } else {
            highestBidderEl.textContent = 'No bids yet';
        }
    }
    
    if (totalDepositedEl) {
        const total = parseFloat(ethers.utils.formatEther(auctionStats.totalTokens));
        totalDepositedEl.textContent = total > 0 ? total.toLocaleString() : '0';
    }
    
    if (bidderCountEl) {
        bidderCountEl.textContent = auctionStats.bidderCount;
    }
    
    updateAuctionStatus();
}

// Update auction status badge
function updateAuctionStatus() {
    const statusEl = document.getElementById('auctionStatus');
    if (!statusEl) return;
    
    const now = Math.floor(Date.now() / 1000);
    
    if (now < auctionStats.startTime) {
        statusEl.textContent = 'Not Started';
        statusEl.className = 'auction-status status-not-started';
    } else if (now >= auctionStats.startTime && now < auctionStats.endTime) {
        statusEl.textContent = 'Active';
        statusEl.className = 'auction-status status-active';
    } else {
        statusEl.textContent = 'Ended';
        statusEl.className = 'auction-status status-ended';
    }
}

// Start countdown timer
function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    const countdownEl = document.getElementById('countdown');
    if (!countdownEl) return;
    
    const updateCountdown = () => {
        const now = Math.floor(Date.now() / 1000);
        let remaining = auctionStats.endTime - now;
        
        // Debug log
        console.log('Countdown calculation:', {
            endTime: auctionStats.endTime,
            now: now,
            remaining: remaining,
            remainingInDays: remaining / 86400
        });
        
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            countdownEl.textContent = '00:00:00';
            updateAuctionStatus();
            return;
        }
        
        // Ensure remaining is a valid number
        if (isNaN(remaining) || remaining < 0) {
            countdownEl.textContent = '--:--:--';
            return;
        }
        
        const days = Math.floor(remaining / 86400);
        remaining = remaining % 86400;
        const hours = Math.floor(remaining / 3600);
        remaining = remaining % 3600;
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        
        if (days > 0) {
            countdownEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        } else if (hours > 0) {
            countdownEl.textContent = `${hours}h ${minutes}m ${seconds}s`;
        } else {
            countdownEl.textContent = `${minutes}m ${seconds}s`;
        }
        
        updateAuctionStatus();
    };
    
    // Initial update
    updateCountdown();
    
    // Update every second
    countdownInterval = setInterval(updateCountdown, 1000);
}

// Load and display top 10 bidders
async function loadTopBidders() {
    try {
        if (!auctionContract) {
            await initReadContracts();
        }
        
        const [addresses, amounts] = await auctionContract.getAllBids();
        
        // Create array of bidders with amounts
        const bidders = [];
        for (let i = 0; i < addresses.length; i++) {
            bidders.push({
                address: addresses[i],
                amount: amounts[i]
            });
        }
        
        // Sort by amount (descending)
        bidders.sort((a, b) => {
            return b.amount.sub(a.amount).gt(0) ? 1 : -1;
        });
        
        // Take top 10
        const top10 = bidders.slice(0, 10);
        
        // Render bidders
        renderBidders(top10);
        
    } catch (error) {
        console.error('Error loading bidders:', error);
        const listEl = document.getElementById('biddersList');
        if (listEl) {
            listEl.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--muted);">Error loading bidders</div>';
        }
    }
}

// Render bidders list
function renderBidders(bidders) {
    const listEl = document.getElementById('biddersList');
    if (!listEl) return;
    
    if (bidders.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--muted);">No bidders yet</div>';
        return;
    }
    
    listEl.innerHTML = bidders.map((bidder, index) => {
        const rank = index + 1;
        const amount = parseFloat(ethers.utils.formatEther(bidder.amount));
        const addr = bidder.address;
        const isHighest = addr.toLowerCase() === auctionStats.highestBidder?.toLowerCase();
        
        return `
            <div class="bidder-item ${isHighest ? 'highest' : ''}">
                <div class="bidder-rank">#${rank}</div>
                <div class="bidder-info">
                    <div class="bidder-address">${addr.slice(0, 6)}...${addr.slice(-4)}</div>
                </div>
                <div class="bidder-amount">${amount.toLocaleString()} $ADRIAN</div>
                ${isHighest ? '<span class="highest-badge">Highest</span>' : ''}
            </div>
        `;
    }).join('');
}

// Connect wallet (renamed to avoid conflict with menu.js)
async function connectAuctionWallet() {
    try {
        if (!window.ethereum) {
            showStatus('Please install MetaMask!', 'error');
            return;
        }
        
        showStatus('Connecting wallet...', 'loading');
        
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAddress = accounts[0];
        
        writeProvider = new ethers.providers.Web3Provider(window.ethereum);
        signer = writeProvider.getSigner();
        
        // Check network
        await ensureCorrectNetwork();
        
        // Initialize write contracts
        auctionContract = new ethers.Contract(AUCTION_CONTRACT, AUCTION_ABI, signer);
        adrianTokenContract = new ethers.Contract(ADRIAN_TOKEN, ERC20_ABI, signer);
        
        // Load balance
        await loadBalance();
        
        // Update UI
        updateWalletUI();
        
        showStatus('Wallet connected!', 'success');
        
    } catch (error) {
        console.error('Connection error:', error);
        if (error.code === 4001) {
            showStatus('Connection rejected', 'error');
        } else {
            showStatus('Failed to connect wallet', 'error');
        }
    }
}

// Ensure correct network (Base Mainnet)
async function ensureCorrectNetwork() {
    try {
        const network = await writeProvider.getNetwork();
        if (network.chainId !== BASE_CHAIN_ID) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }],
                });
            } catch (switchError) {
                // If chain doesn't exist, add it
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
                            chainName: 'Base',
                            nativeCurrency: {
                                name: 'ETH',
                                symbol: 'ETH',
                                decimals: 18
                            },
                            rpcUrls: ['https://mainnet.base.org'],
                            blockExplorerUrls: ['https://basescan.org']
                        }],
                    });
                } else {
                    throw switchError;
                }
            }
        }
    } catch (error) {
        console.error('Network error:', error);
        throw error;
    }
}

// Load user balance
async function loadBalance() {
    try {
        if (!adrianTokenContract || !userAddress) return;
        
        const balance = await adrianTokenContract.balanceOf(userAddress);
        const balanceFormatted = parseFloat(ethers.utils.formatEther(balance));
        
        const balanceEl = document.getElementById('walletBalance');
        if (balanceEl) {
            balanceEl.textContent = balanceFormatted.toLocaleString();
        }
    } catch (error) {
        console.error('Error loading balance:', error);
    }
}

// Update wallet UI
function updateWalletUI() {
    const connectBtn = document.getElementById('connectBtn');
    const walletSection = document.getElementById('walletSection');
    const bidForm = document.getElementById('bidForm');
    const walletAddress = document.getElementById('walletAddress');
    
    if (userAddress) {
        if (connectBtn) connectBtn.style.display = 'none';
        if (walletSection) walletSection.style.display = 'none';
        if (bidForm) bidForm.style.display = 'block';
        if (walletAddress) {
            walletAddress.textContent = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
        }
    } else {
        if (connectBtn) connectBtn.style.display = 'block';
        if (walletSection) walletSection.style.display = 'block';
        if (bidForm) bidForm.style.display = 'none';
    }
}

// Check if already connected
async function checkAuctionConnection() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectAuctionWallet();
            }
        } catch (error) {
            console.error("Connection check failed:", error);
        }
    }
}

// Place bid (with approve if needed)
async function placeBid() {
    if (!userAddress) {
        showStatus('Please connect wallet first!', 'error');
        return;
    }
    
    const amountInput = document.getElementById('bidAmount');
    if (!amountInput) return;
    
    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) {
        showStatus('Please enter a valid bid amount', 'error');
        return;
    }
    
    try {
        // Check if auction is active
        const now = Math.floor(Date.now() / 1000);
        if (now < auctionStats.startTime) {
            showStatus('Auction has not started yet', 'error');
            return;
        }
        if (now >= auctionStats.endTime) {
            showStatus('Auction has ended', 'error');
            return;
        }
        
        const bidBtn = document.getElementById('bidBtn');
        const approveBtn = document.getElementById('approveBtn');
        
        // Disable buttons
        if (bidBtn) bidBtn.disabled = true;
        if (approveBtn) approveBtn.disabled = true;
        
        const amountWei = ethers.utils.parseEther(amount.toString());
        
        // Check balance
        const balance = await adrianTokenContract.balanceOf(userAddress);
        if (balance.lt(amountWei)) {
            showStatus('Insufficient $ADRIAN balance', 'error');
            if (bidBtn) bidBtn.disabled = false;
            return;
        }
        
        // Check allowance
        const allowance = await adrianTokenContract.allowance(userAddress, AUCTION_CONTRACT);
        
        if (allowance.lt(amountWei)) {
            // Need to approve first
            showStatus('Approval needed. Please approve in MetaMask...', 'loading');
            
            if (approveBtn) {
                approveBtn.style.display = 'block';
                approveBtn.disabled = false;
                approveBtn.onclick = async () => {
                    try {
                        approveBtn.disabled = true;
                        showStatus('Approving $ADRIAN tokens...', 'loading');
                        
                        const approveTx = await adrianTokenContract.approve(AUCTION_CONTRACT, amountWei);
                        showStatus('Waiting for approval confirmation...', 'loading');
                        
                        await approveTx.wait();
                        
                        showStatus('Approval confirmed! You can now place your bid.', 'success');
                        approveBtn.style.display = 'none';
                        if (bidBtn) bidBtn.disabled = false;
                        
                        await loadBalance();
                    } catch (error) {
                        console.error('Approve error:', error);
                        showStatus('Approval failed: ' + parseError(error), 'error');
                        approveBtn.disabled = false;
                    }
                };
            }
            return;
        }
        
        // Place bid
        showStatus('Placing bid... Please confirm in MetaMask.', 'loading');
        
        const bidTx = await auctionContract.bid(amountWei);
        showStatus('Waiting for bid confirmation...', 'loading');
        
        await bidTx.wait();
        
        showStatus('🎉 Bid placed successfully!', 'success');
        
        // Refresh data
        await loadAuctionData();
        await loadBalance();
        
        // Clear input
        if (amountInput) amountInput.value = '';
        
        if (bidBtn) bidBtn.disabled = false;
        
    } catch (error) {
        console.error('Bid error:', error);
        showStatus('Bid failed: ' + parseError(error), 'error');
        
        const bidBtn = document.getElementById('bidBtn');
        const approveBtn = document.getElementById('approveBtn');
        if (bidBtn) bidBtn.disabled = false;
        if (approveBtn) approveBtn.disabled = false;
    }
}

// Parse error messages
function parseError(error) {
    if (error.code === 4001) {
        return 'Transaction rejected by user';
    } else if (error.message && error.message.includes('insufficient funds')) {
        return 'Insufficient funds';
    } else if (error.message && error.message.includes('allowance')) {
        return 'Need to approve tokens first';
    } else if (error.message && error.message.includes('Auction not started')) {
        return 'Auction has not started yet';
    } else if (error.message && error.message.includes('Auction ended')) {
        return 'Auction has ended';
    } else {
        return error.message || 'Unknown error occurred';
    }
}

// Show status message
function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `status-message status-${type}`;
    statusEl.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }
}

// Auto-refresh auction data every 30 seconds
function startAutoRefresh() {
    setInterval(async () => {
        // Always refresh auction data to keep it up to date
        await loadAuctionData();
    }, 30000);
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    // Load Alchemy config
    loadAlchemyConfig();
    
    // Wait a bit for config to load
    setTimeout(async () => {
        // Initialize read contracts and load data (no wallet needed)
        await initReadContracts();
        await loadAuctionData();
        
        // Check if wallet already connected
        await checkAuctionConnection();
        
        // Setup event listeners
        const connectBtn = document.getElementById('connectBtn');
        const bidBtn = document.getElementById('bidBtn');
        
        if (connectBtn) {
            connectBtn.addEventListener('click', connectAuctionWallet);
        }
        
        if (bidBtn) {
            bidBtn.addEventListener('click', placeBid);
        }
        
        // Start auto-refresh
        startAutoRefresh();
    }, 500);
});

// Listen for account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            userAddress = null;
            signer = null;
            writeProvider = null;
            updateWalletUI();
        } else {
            connectAuctionWallet();
        }
    });
    
    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
}

