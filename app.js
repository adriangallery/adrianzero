// BASE Network configuration
const BASE_CHAIN_ID = '0x2105'; // 8453 in decimal
const BASE_RPC_URL = 'https://mainnet.base.org';
const BASE_EXPLORER = 'https://basescan.org';

// Global variables
let provider;
let signer;
let isWalletConnected = false;
let isMuted = false;
let introTimer;
let musicInitialized = false;
let ethersLoaded = false;
let progressInterval;
let isMobile = false;

// DOM elements
const introScreen = document.getElementById('intro-screen');
const mainScreen = document.getElementById('main-screen');
const floppyScreen = document.getElementById('floppy-screen');
const introImage = document.getElementById('intro-image');
const backgroundMusic = document.getElementById('background-music');
const muteButton = document.getElementById('mute-button');
const connectWalletBtn = document.getElementById('connect-wallet');
const clickArea = document.getElementById('click-area');
const mintPopup = document.getElementById('mint-popup');
const closePopupBtn = document.getElementById('close-popup');
const buyFloppyBtn = document.getElementById('buy-floppy');
const backToMainBtn = document.getElementById('back-to-main');
const progressFill = document.querySelector('.progress-fill');
const progressText = document.querySelector('.progress-text');

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    detectMobile();
    initializeApp();
    setupEventListeners();
    startIntro();
});

function detectMobile() {
    // Check if device is mobile
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    console.log('Mobile device detected:', isMobile);
}

function initializeApp() {
    // Configure music
    backgroundMusic.volume = 0.3;
    
    // Multiple strategies to force music autoplay
    forceMusicAutoplay();
    
    // Don't initialize ethers here - will load when needed
    console.log('App initialized - ethers will load when needed');
}

function forceMusicAutoplay() {
    if (musicInitialized) return;
    
    console.log('Attempting to force music autoplay...');
    
    // Strategy 1: Immediate autoplay attempt
    try {
        backgroundMusic.load();
        backgroundMusic.play().then(() => {
            console.log('Music autoplay successful!');
            musicInitialized = true;
        }).catch(e => {
            console.log('Strategy 1 failed:', e.message);
            // Continue to next strategy
        });
    } catch (e) {
        console.log('Strategy 1 error:', e.message);
    }
    
    // Strategy 2: Delayed retry attempt
    setTimeout(() => {
        if (!musicInitialized) {
            console.log('Trying Strategy 2: Delayed autoplay...');
            backgroundMusic.play().catch(e => {
                console.log('Strategy 2 failed:', e.message);
            });
        }
    }, 500);
    
    // Strategy 3: User interaction simulation
    setTimeout(() => {
        if (!musicInitialized) {
            console.log('Trying Strategy 3: User interaction simulation...');
            // Simulate user interaction by dispatching events
            const events = ['mousedown', 'mouseup', 'click', 'touchstart', 'touchend'];
            events.forEach(eventType => {
                document.dispatchEvent(new Event(eventType, { bubbles: true }));
            });
            
            // Try to play after simulated interaction
            setTimeout(() => {
                if (!musicInitialized) {
                    backgroundMusic.play().catch(e => {
                        console.log('Strategy 3 failed:', e.message);
                    });
                }
            }, 100);
        }
    }, 1000);
}

function setupEventListeners() {
    // Intro screen - use both click and touch events
    introScreen.addEventListener('click', handleIntroClick, true);
    introScreen.addEventListener('touchstart', handleIntroClick, true);
    
    // Music
    muteButton.addEventListener('click', toggleMute);
    
    // Wallet
    connectWalletBtn.addEventListener('click', connectWallet);
    
    // Navigation
    clickArea.addEventListener('click', handleBasementClick);
    closePopupBtn.addEventListener('click', closeMintPopup);
    buyFloppyBtn.addEventListener('click', handleBuyFloppy);
    backToMainBtn.addEventListener('click', goToMainScreen);
    
    // MetaMask events
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
    }
}

function startIntro() {
    // Reset progress bar
    progressFill.style.width = '0%';
    progressText.textContent = 'LOADING...';
    
    // Show progress bar
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) {
        progressContainer.style.display = 'block';
    }
    
    // Fade in intro image
    introImage.style.opacity = '0';
    introImage.style.transition = 'opacity 2s ease-in-out';
    
    // Start progress bar animation for fade in
    startProgressBar(0, 50, 2000, () => {
        // Progress bar complete for fade in
        console.log('Fade in progress complete - 50%');
        
        // Automatically continue to 100% after fade in
        startProgressBar(50, 100, 5000, () => {
            // Progress bar complete for fade out
            progressText.textContent = 'COMPLETE!';
            console.log('Fade out progress complete - 100%');
            
            // Hide progress bar after completion
            setTimeout(() => {
                const progressContainer = document.querySelector('.progress-container');
                if (progressContainer) {
                    progressContainer.style.display = 'none';
                    console.log('Progress bar hidden');
                }
            }, 500);
        });
        
        // Start transition to main screen
        goToMainScreen();
    });
    
    setTimeout(() => {
        introImage.style.opacity = '1';
    }, 100);
}

function startProgressBar(startPercent, endPercent, duration, callback) {
    const startTime = Date.now();
    const startWidth = startPercent;
    const endWidth = endPercent;
    
    // Clear any existing interval
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    
    console.log(`Starting progress bar: ${startPercent}% to ${endPercent}% over ${duration}ms`);
    
    progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentWidth = startWidth + (endWidth - startWidth) * progress;
        progressFill.style.width = currentWidth + '%';
        
        console.log(`Progress: ${currentWidth.toFixed(1)}%`);
        
        if (progress >= 1) {
            clearInterval(progressInterval);
            progressFill.style.width = endWidth + '%'; // Ensure it reaches exactly 100%
            console.log(`Progress bar complete: ${endWidth}%`);
            if (callback) callback();
        }
    }, 16); // ~60fps
}

function handleIntroClick(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('Manual intro click detected');
    clearTimeout(introTimer);
    clearInterval(progressInterval);
    
    // Initialize and start music if not already started
    if (!musicInitialized) {
        musicInitialized = true;
        backgroundMusic.load();
        if (!isMuted) {
            backgroundMusic.play().catch(e => console.log('Audio play failed:', e));
        }
    }
    
    // Continue progress bar from current position to 100%
    const currentProgress = parseFloat(progressFill.style.width) || 0;
    console.log(`Continuing progress from ${currentProgress}% to 100%`);
    
    startProgressBar(currentProgress, 100, 5000, () => {
        // Progress bar complete for fade out
        progressText.textContent = 'COMPLETE!';
        console.log('Fade out progress complete - 100%');
        
        // Hide progress bar after completion
        setTimeout(() => {
            const progressContainer = document.querySelector('.progress-container');
            if (progressContainer) {
                progressContainer.style.display = 'none';
                console.log('Progress bar hidden');
            }
        }, 500);
    });
    
    goToMainScreen();
}

function goToMainScreen() {
    console.log('Starting transition to main screen');
    
    // Fade out intro (7 seconds - changed from 5)
    introScreen.style.opacity = '0';
    introScreen.style.transition = 'opacity 7s ease-in-out';
    
    setTimeout(() => {
        introScreen.classList.remove('active');
        introScreen.style.display = 'none';
        
        // Ensure progress bar is hidden when basement appears
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'none';
            console.log('Progress bar hidden on basement transition');
        }
        
        // Fade in main screen
        mainScreen.style.display = 'block';
        mainScreen.style.opacity = '0';
        mainScreen.style.transition = 'opacity 2s ease-in-out';
        
        setTimeout(() => {
            mainScreen.classList.add('active');
            mainScreen.style.opacity = '1';
            
            // Load ethers.js when entering main screen
            if (!ethersLoaded) {
                loadEthersWhenNeeded();
            }
        }, 100);
    }, 7000);
}

async function loadEthersWhenNeeded() {
    try {
        await window.loadEthers();
        ethersLoaded = true;
        console.log('Ethers.js loaded successfully');
        
        // Initialize MetaMask connection
        if (typeof window.ethereum !== 'undefined') {
            try {
                provider = new ethers.providers.Web3Provider(window.ethereum);
                checkWalletConnection();
            } catch (error) {
                console.warn('Ethers.js initialization error:', error);
            }
        } else {
            showNotification('MetaMask is not installed', 'error');
        }
    } catch (error) {
        console.error('Failed to load ethers.js:', error);
        showNotification('Failed to load blockchain library', 'error');
    }
}

function goToFloppyScreen() {
    mainScreen.classList.remove('active');
    mainScreen.style.opacity = '0';
    mainScreen.style.transition = 'opacity 2s ease-in-out';
    
    setTimeout(() => {
        mainScreen.style.display = 'none';
        floppyScreen.style.display = 'block';
        floppyScreen.style.opacity = '0';
        floppyScreen.style.transition = 'opacity 2s ease-in-out';
        
        setTimeout(() => {
            floppyScreen.classList.add('active');
            floppyScreen.style.opacity = '1';
        }, 100);
    }, 2000);
}

function goToMainScreen() {
    floppyScreen.classList.remove('active');
    floppyScreen.style.opacity = '0';
    floppyScreen.style.transition = 'opacity 2s ease-in-out';
    
    setTimeout(() => {
        floppyScreen.style.display = 'none';
        mainScreen.style.display = 'block';
        mainScreen.style.opacity = '0';
        mainScreen.style.transition = 'opacity 2s ease-in-out';
        
        setTimeout(() => {
            mainScreen.classList.add('active');
            mainScreen.style.opacity = '1';
        }, 100);
    }, 2000);
}

function toggleMute() {
    isMuted = !isMuted;
    
    if (isMuted) {
        backgroundMusic.pause();
        if (isMobile) {
            muteButton.textContent = 'Music OFF';
        } else {
            muteButton.textContent = '🔇';
        }
    } else {
        if (musicInitialized) {
            backgroundMusic.play().catch(e => console.log('Audio play failed'));
        }
        if (isMobile) {
            muteButton.textContent = 'Music ON';
        } else {
            muteButton.textContent = '🔊';
        }
    }
}

async function connectWallet() {
    if (!ethersLoaded) {
        showNotification('Loading blockchain library...', 'info');
        await loadEthersWhenNeeded();
    }
    
    if (!window.ethereum) {
        showNotification('MetaMask is not installed', 'error');
        return;
    }
    
    try {
        // Check if already connected first
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
            // Already connected
            await checkAndSwitchNetwork();
            isWalletConnected = true;
            updateWalletUI();
            showNotification('Wallet already connected', 'success');
            return;
        }
        
        // Request account connection
        const newAccounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (newAccounts.length > 0) {
            await checkAndSwitchNetwork();
            isWalletConnected = true;
            updateWalletUI();
            showNotification('Wallet connected successfully', 'success');
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        
        // Handle specific mobile MetaMask errors
        if (error.code === 4001) {
            showNotification('Connection rejected by user', 'warning');
        } else if (error.code === -32002) {
            showNotification('Please check MetaMask app', 'info');
        } else {
            showNotification('Error connecting wallet: ' + error.message, 'error');
        }
    }
}

async function checkAndSwitchNetwork() {
    try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId !== BASE_CHAIN_ID) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: BASE_CHAIN_ID }]
                });
                showNotification('Switched to Base network', 'success');
            } catch (switchError) {
                console.log('Switch error:', switchError);
                
                // If network doesn't exist, add it
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: BASE_CHAIN_ID,
                                chainName: 'Base',
                                nativeCurrency: {
                                    name: 'ETH',
                                    symbol: 'ETH',
                                    decimals: 18
                                },
                                rpcUrls: [BASE_RPC_URL],
                                blockExplorerUrls: [BASE_EXPLORER]
                            }]
                        });
                        showNotification('Base network added successfully', 'success');
                    } catch (addError) {
                        console.error('Add network error:', addError);
                        showNotification('Error adding Base network. Please add it manually in MetaMask.', 'error');
                    }
                } else if (switchError.code === 4001) {
                    showNotification('Network switch rejected by user', 'warning');
                } else {
                    showNotification('Error switching to Base network. Please switch manually in MetaMask.', 'error');
                }
            }
        }
    } catch (error) {
        console.error('Network check error:', error);
        showNotification('Error checking network connection', 'error');
    }
}

function checkWalletConnection() {
    if (window.ethereum && window.ethereum.selectedAddress) {
        isWalletConnected = true;
        updateWalletUI();
    }
}

function updateWalletUI() {
    if (isWalletConnected) {
        const shortAddress = window.ethereum.selectedAddress.slice(0, 6) + '...' + window.ethereum.selectedAddress.slice(-4);
        connectWalletBtn.textContent = shortAddress;
        connectWalletBtn.style.background = '#00ff00';
        connectWalletBtn.style.color = '#000';
        
        // Notify iframe about wallet connection
        notifyIframeWalletConnected();
    } else {
        connectWalletBtn.textContent = 'Connect Wallet';
        connectWalletBtn.style.background = '#000';
        connectWalletBtn.style.color = '#00ff00';
        
        // Notify iframe about wallet disconnection
        notifyIframeWalletDisconnected();
    }
}

function notifyIframeWalletConnected() {
    const iframe = document.querySelector('#mint-popup iframe');
    if (iframe && iframe.contentWindow) {
        try {
            console.log('Sending wallet connection to iframe:', {
                address: window.ethereum.selectedAddress,
                chainId: window.ethereum.chainId
            });
            
            iframe.contentWindow.postMessage({
                type: 'WALLET_CONNECTED',
                address: window.ethereum.selectedAddress,
                chainId: window.ethereum.chainId
            }, '*');
        } catch (error) {
            console.log('Could not notify iframe:', error);
        }
    }
}

function notifyIframeWalletDisconnected() {
    const iframe = document.querySelector('#mint-popup iframe');
    if (iframe && iframe.contentWindow) {
        try {
            iframe.contentWindow.postMessage({
                type: 'WALLET_DISCONNECTED'
            }, '*');
        } catch (error) {
            console.log('Could not notify iframe:', error);
        }
    }
}

function handleBasementClick(event) {
    if (!isWalletConnected) {
        showNotification('Connect your wallet first', 'warning');
        return;
    }
    
    // Show mint popup
    mintPopup.classList.add('active');
    
    // Notify iframe about wallet connection immediately when popup opens
    setTimeout(() => {
        notifyIframeWalletConnected();
    }, 100);
}

function closeMintPopup() {
    mintPopup.classList.remove('active');
}

async function handleBuyFloppy() {
    if (!isWalletConnected) {
        showNotification('Connect your wallet first', 'warning');
        return;
    }
    
    try {
        if (!ethersLoaded) {
            await loadEthersWhenNeeded();
        }
        
        if (!window.ethers || !window.ethers.utils) {
            showNotification('Ethers.js not loaded properly', 'error');
            return;
        }
        
        const price = ethers.utils.parseEther('0.01');
        
        if (!signer) {
            signer = provider.getSigner();
        }
        
        const tx = await signer.sendTransaction({
            to: '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea', // Adrian Token address
            value: price
        });
        
        showNotification('Transaction sent: ' + tx.hash, 'success');
        
        // Wait for confirmation
        await tx.wait();
        showNotification('Floppy purchased successfully!', 'success');
        
    } catch (error) {
        console.error('Error buying floppy:', error);
        showNotification('Error in purchase', 'error');
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        isWalletConnected = false;
        updateWalletUI();
        showNotification('Wallet disconnected', 'warning');
    } else {
        checkWalletConnection();
    }
}

function handleChainChanged(chainId) {
    if (chainId !== BASE_CHAIN_ID) {
        showNotification('Switch to Base network', 'warning');
    }
}

function showNotification(message, type = 'info') {
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Mobile-friendly positioning
    const isMobile = window.innerWidth <= 768;
    const position = isMobile ? 'center' : 'bottom-right';
    
    notification.style.cssText = `
        position: fixed;
        ${position === 'center' ? 'top: 50%; left: 50%; transform: translate(-50%, -50%);' : 'bottom: 20px; right: 20px;'}
        background: #000;
        color: ${type === 'error' ? '#ff0000' : type === 'success' ? '#00ff00' : type === 'warning' ? '#ffff00' : '#00ff00'};
        border: 2px solid ${type === 'error' ? '#ff0000' : type === 'success' ? '#00ff00' : type === 'warning' ? '#ffff00' : '#00ff00'};
        padding: ${isMobile ? '1.5rem' : '1rem'};
        font-family: 'Press Start 2P', monospace;
        font-size: ${isMobile ? '0.7rem' : '0.6rem'};
        z-index: 10000;
        max-width: ${isMobile ? '90vw' : '300px'};
        min-width: ${isMobile ? '250px' : '200px'};
        word-wrap: break-word;
        box-shadow: 0 0 20px ${type === 'error' ? '#ff0000' : type === 'success' ? '#00ff00' : type === 'warning' ? '#ffff00' : '#00ff00'};
        text-align: center;
        border-radius: 8px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 1s ease-out';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 1000);
    }, 5000);
}

// Prevent right-click context menu
document.addEventListener('contextmenu', e => e.preventDefault());

// Prevent zoom on mobile
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());
document.addEventListener('gestureend', e => e.preventDefault()); 