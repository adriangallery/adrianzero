/**
 * Builder Battle - Voting & Lottery System
 * Complete voting system with wallet integration and fair lottery
 */

class BuilderBattle {
    constructor() {
        this.currentAccount = null;
        this.participants = [];
        this.votes = new Map(); // address -> participantId
        this.voters = new Set();
        this.isAdmin = false;
        this.maxVotesPerUser = 1;
        
        this.init();
    }

    async init() {
        console.log('🏗️ Builder Battle initialized');
        
        // Check if wallet is already connected
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.currentAccount = accounts[0];
                    this.showAccountSection();
                    await this.loadData();
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
            }
        }

        // Load participants from localStorage
        this.loadParticipants();
        this.updateUI();
    }

    // Wallet Connection
    async connectWallet() {
        try {
            if (typeof window.ethereum === 'undefined') {
                this.showError('MetaMask is not installed. Please install MetaMask to continue.');
                return;
            }

            this.showLoading(true);
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.currentAccount = accounts[0];
            
            this.showAccountSection();
            await this.loadData();
            this.showSuccess('Wallet connected successfully!');
            
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.showError('Error connecting wallet: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    disconnectWallet() {
        this.currentAccount = null;
        this.votes.clear();
        this.voters.clear();
        document.getElementById('connectSection').style.display = 'block';
        document.getElementById('accountSection').style.display = 'none';
        document.getElementById('adminSection').style.display = 'none';
        this.updateUI();
    }

    showAccountSection() {
        document.getElementById('connectSection').style.display = 'none';
        document.getElementById('accountSection').style.display = 'block';
        document.getElementById('accountAddress').textContent = this.currentAccount;
        
        // Check if user is admin (simple check - you can make this more sophisticated)
        this.isAdmin = this.isAdminAddress(this.currentAccount);
        if (this.isAdmin) {
            document.getElementById('adminSection').style.display = 'block';
        }
        
        this.updateVoteStatus();
    }

    isAdminAddress(address) {
        // Add your admin addresses here
        const adminAddresses = [
            '0x4943407105999e3E97EFA2035F5cbC64D72581C6', // Your address
            // Add more admin addresses as needed
        ];
        return adminAddresses.includes(address.toLowerCase());
    }

    // Data Management
    async loadData() {
        this.loadParticipants();
        this.loadVotes();
        this.updateUI();
    }

    loadParticipants() {
        const saved = localStorage.getItem('builderbattle_participants');
        if (saved) {
            this.participants = JSON.parse(saved);
        } else {
            // Default participants
            this.participants = [
                {
                    id: 1,
                    name: 'Builder Alpha',
                    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmY2YjM1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFscGhhPC90ZXh0Pjwvc3ZnPg==',
                    votes: 0
                },
                {
                    id: 2,
                    name: 'Builder Beta',
                    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDBmZjg4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJldGE8L3RleHQ+PC9zdmc+',
                    votes: 0
                }
            ];
            this.saveParticipants();
        }
    }

    saveParticipants() {
        localStorage.setItem('builderbattle_participants', JSON.stringify(this.participants));
    }

    loadVotes() {
        const saved = localStorage.getItem('builderbattle_votes');
        if (saved) {
            const votesData = JSON.parse(saved);
            this.votes = new Map(votesData.votes);
            this.voters = new Set(votesData.voters);
        }
    }

    saveVotes() {
        localStorage.setItem('builderbattle_votes', JSON.stringify({
            votes: Array.from(this.votes.entries()),
            voters: Array.from(this.voters)
        }));
    }

    // Voting System
    async vote(participantId) {
        if (!this.currentAccount) {
            this.showError('Please connect your wallet first.');
            return;
        }

        if (this.votes.has(this.currentAccount)) {
            this.showError('You have already voted!');
            return;
        }

        try {
            this.showLoading(true);
            
            // Sign a message to prove ownership
            const message = `Vote for participant ${participantId} in Builder Battle - ${Date.now()}`;
            const signature = await this.signMessage(message);
            
            if (!signature) {
                this.showError('Failed to sign message. Please try again.');
                return;
            }

            // Record the vote
            this.votes.set(this.currentAccount, participantId);
            this.voters.add(this.currentAccount);
            
            // Update participant vote count
            const participant = this.participants.find(p => p.id === participantId);
            if (participant) {
                participant.votes++;
            }

            this.saveVotes();
            this.saveParticipants();
            this.updateUI();
            this.updateVoteStatus();
            
            this.showSuccess(`Vote recorded for ${participant.name}!`);
            
        } catch (error) {
            console.error('Error voting:', error);
            this.showError('Error recording vote: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async signMessage(message) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            return await signer.signMessage(message);
        } catch (error) {
            console.error('Error signing message:', error);
            return null;
        }
    }

    updateVoteStatus() {
        const hasVoted = this.votes.has(this.currentAccount);
        const votesUsed = hasVoted ? 1 : 0;
        
        document.getElementById('votesUsed').textContent = votesUsed;
        document.getElementById('maxVotes').textContent = this.maxVotesPerUser;
    }

    // Participant Management
    async addParticipant() {
        if (!this.isAdmin) {
            this.showError('Only admins can add participants.');
            return;
        }

        const name = document.getElementById('participantName').value.trim();
        const imageFile = document.getElementById('participantImage').files[0];

        if (!name) {
            this.showError('Please enter a participant name.');
            return;
        }

        if (!imageFile) {
            this.showError('Please select an image.');
            return;
        }

        try {
            this.showLoading(true);
            
            // Convert image to base64
            const imageData = await this.fileToBase64(imageFile);
            
            // Create new participant
            const newParticipant = {
                id: Date.now(), // Simple ID generation
                name: name,
                image: imageData,
                votes: 0
            };

            this.participants.push(newParticipant);
            this.saveParticipants();
            this.updateUI();
            
            // Clear form
            document.getElementById('participantName').value = '';
            document.getElementById('participantImage').value = '';
            
            this.showSuccess(`Participant "${name}" added successfully!`);
            
        } catch (error) {
            console.error('Error adding participant:', error);
            this.showError('Error adding participant: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Lottery System
    async drawWinner() {
        if (this.participants.length === 0) {
            this.showError('No participants to draw from.');
            return;
        }

        try {
            this.showLoading(true);
            document.getElementById('lotteryBtn').disabled = true;
            document.getElementById('lotteryLoading').style.display = 'block';

            // Use blockchain randomness for fair drawing
            const randomSeed = await this.getBlockchainRandomness();
            const winnerIndex = randomSeed % this.participants.length;
            const winner = this.participants[winnerIndex];

            // Show winner with animation
            setTimeout(() => {
                this.showWinner(winner);
                this.showLoading(false);
                document.getElementById('lotteryBtn').disabled = false;
                document.getElementById('lotteryLoading').style.display = 'none';
            }, 2000);

        } catch (error) {
            console.error('Error drawing winner:', error);
            this.showError('Error drawing winner: ' + error.message);
            this.showLoading(false);
            document.getElementById('lotteryBtn').disabled = false;
            document.getElementById('lotteryLoading').style.display = 'none';
        }
    }

    async getBlockchainRandomness() {
        try {
            // Use current block hash for randomness
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const blockNumber = await provider.getBlockNumber();
            const block = await provider.getBlock(blockNumber);
            
            // Convert block hash to number
            const hash = block.hash;
            const randomNumber = parseInt(hash.slice(2, 10), 16);
            
            return randomNumber;
        } catch (error) {
            console.warn('Blockchain randomness failed, using fallback:', error);
            // Fallback to Math.random if blockchain fails
            return Math.floor(Math.random() * 1000000);
        }
    }

    showWinner(winner) {
        const winnerResult = document.getElementById('winnerResult');
        const winnerDetails = document.getElementById('winnerDetails');
        
        winnerDetails.innerHTML = `
            <img src="${winner.image}" alt="${winner.name}" style="max-width: 300px; max-height: 300px; border-radius: 15px; margin: 20px 0; box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);">
            <h3 style="color: #ffd700; font-size: 2rem; margin-bottom: 10px;">${winner.name}</h3>
            <p style="font-size: 1.2rem; color: #fff;">Received ${winner.votes} votes</p>
            <p style="font-size: 1rem; color: #ccc; margin-top: 10px;">Congratulations! 🎉</p>
        `;
        
        winnerResult.classList.add('show');
        
        // Scroll to winner
        winnerResult.scrollIntoView({ behavior: 'smooth' });
    }

    // UI Updates
    updateUI() {
        this.updateStats();
        this.renderParticipants();
    }

    updateStats() {
        const totalParticipants = this.participants.length;
        const totalVotes = this.participants.reduce((sum, p) => sum + p.votes, 0);
        const votersCount = this.voters.size;

        document.getElementById('totalParticipants').textContent = totalParticipants;
        document.getElementById('totalVotes').textContent = totalVotes;
        document.getElementById('votersCount').textContent = votersCount;
    }

    renderParticipants() {
        const grid = document.getElementById('participantsGrid');
        grid.innerHTML = '';

        this.participants.forEach(participant => {
            const card = document.createElement('div');
            card.className = 'participant-card';
            
            const hasVoted = this.votes.has(this.currentAccount);
            const userVotedForThis = this.votes.get(this.currentAccount) === participant.id;
            
            card.innerHTML = `
                <img src="${participant.image}" alt="${participant.name}" class="participant-image">
                <div class="participant-name">${participant.name}</div>
                <div class="vote-count">${participant.votes} votes</div>
                <button class="vote-btn" 
                        onclick="builderBattle.vote(${participant.id})" 
                        ${hasVoted ? 'disabled' : ''}>
                    ${hasVoted ? (userVotedForThis ? '✓ Voted' : 'Already Voted') : 'Vote'}
                </button>
            `;
            
            grid.appendChild(card);
        });
    }

    // Utility Functions
    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }
}

// Global functions for HTML onclick events
function connectWallet() {
    builderBattle.connectWallet();
}

function disconnectWallet() {
    builderBattle.disconnectWallet();
}

function addParticipant() {
    builderBattle.addParticipant();
}

function drawWinner() {
    builderBattle.drawWinner();
}

// Initialize the app
let builderBattle;
window.addEventListener('load', () => {
    builderBattle = new BuilderBattle();
});

// Listen for account changes
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            builderBattle.disconnectWallet();
        } else {
            builderBattle.currentAccount = accounts[0];
            builderBattle.showAccountSection();
            builderBattle.loadData();
        }
    });
}
