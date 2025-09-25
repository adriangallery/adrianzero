/**
 * Builder Battle - Voting & Lottery System
 * Complete voting system with wallet integration and fair lottery
 */

class BuilderBattle {
    constructor() {
        this.currentAccount = null;
        this.participants = [];
        this.votes = new Map(); // address -> participantId
        this.voters = [];
        this.isAdmin = false;
        this.maxVotesPerUser = 1;
        this.apiBase = '/api/votes';
        
        this.init();
    }

    async init() {
        console.log('🏗️ Builder Battle initialized');
        
        // Check for URL parameters
        this.checkUrlParameters();
        
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

        // Load participants from API
        await this.loadData();
        this.updateUI();
        
        // Update meta tags if there's a participant parameter (after data is loaded)
        if (this.highlightParticipant) {
            this.updateMetaTagsForParticipant(this.highlightParticipant);
        }
    }

    checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const participantId = urlParams.get('participant');
        
        if (participantId) {
            console.log('Participant ID from URL:', participantId);
            this.highlightParticipant = parseInt(participantId);
            // Meta tags will be updated after data is loaded
        }
    }

    updateMetaTagsForParticipant(participantId) {
        // Find the participant in the current data
        const participant = this.participants.find(p => p.id === parseInt(participantId));
        
        if (participant) {
            // Update page title
            document.title = `${participant.name} - Builder Battle`;
            
            // Update Twitter Card meta tags
            const xProfile = participant.x_profile || participant.xProfile || '';
            const imageUrl = `https://builderbattle.vercel.app/api/static-image?participantId=${participant.id}`;
            this.updateMetaTag('twitter:title', `${participant.name} - Builder Battle`);
            this.updateMetaTag('twitter:description', `Vote for ${participant.name} in Builder Battle! ${xProfile ? `by ${xProfile}` : ''} Join the battle and help decide the winner.`);
            this.updateMetaTag('twitter:image', imageUrl);
            
            // Update Open Graph meta tags
            this.updateMetaTag('og:title', `${participant.name} - Builder Battle`);
            this.updateMetaTag('og:description', `Vote for ${participant.name} in Builder Battle! ${xProfile ? `by ${xProfile}` : ''} Join the battle and help decide the winner.`);
            this.updateMetaTag('og:image', imageUrl);
            this.updateMetaTag('og:url', window.location.href);
        }
    }

    updateMetaTag(property, content) {
        // Update existing meta tag or create new one
        let metaTag = document.querySelector(`meta[name="${property}"], meta[property="${property}"]`);
        
        if (metaTag) {
            metaTag.setAttribute('content', content);
        } else {
            metaTag = document.createElement('meta');
            if (property.startsWith('og:')) {
                metaTag.setAttribute('property', property);
            } else {
                metaTag.setAttribute('name', property);
            }
            metaTag.setAttribute('content', content);
            document.head.appendChild(metaTag);
        }
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
        this.voters = [];
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
            '0x4943407105999e3e97efa2035f5cbc64d72581c6', // Your address
            // Add more admin addresses as needed
        ];
        return adminAddresses.includes(address.toLowerCase());
    }

    // Data Management
    async loadData() {
        try {
            this.showLoading(true);
            const response = await fetch(this.apiBase + '?t=' + Date.now(), {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            const result = await response.json();
            
            if (result.success) {
                this.participants = result.data.participants;
                this.voters = result.data.voters || [];
                
                // Load votes from API data
                this.votes.clear();
                if (result.data.votes) {
                    Object.entries(result.data.votes).forEach(([voterAddress, participantId]) => {
                        this.votes.set(voterAddress, participantId);
                    });
                }
                
                console.log('Loaded data:', {
                    participants: this.participants.length,
                    voters: this.voters.length,
                    votersData: this.voters,
                    votes: this.votes.size
                });
                this.updateUI();
            } else {
                this.showError('Failed to load data from server');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Error loading data: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async loadVotes() {
        try {
            const response = await fetch(this.apiBase);
            const result = await response.json();
            
            if (result.success) {
                // Convert votes object to Map
                this.votes.clear();
                this.voters.clear();
                
                // This would need to be implemented in the API
                // For now, we'll use a simple approach
                this.updateUI();
            }
        } catch (error) {
            console.error('Error loading votes:', error);
        }
    }

    // Voting System
    async vote(participantId) {
        if (!this.currentAccount) {
            this.showError('Please connect your wallet first.');
            return;
        }

        // Additional validation
        if (!participantId) {
            this.showError('Invalid participant ID.');
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

            // Send vote to API
            const voteData = {
                action: 'vote',
                address: this.currentAccount,
                participantId: participantId,
                signature: signature,
                message: message
            };
            
            console.log('Sending vote data:', voteData);
            
            const response = await fetch(this.apiBase, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(voteData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.votes.set(this.currentAccount, participantId);
                if (!this.voters.includes(this.currentAccount)) {
                    this.voters.push(this.currentAccount);
                }
                this.updateUI();
                this.updateVoteStatus();
                this.showSuccess(`Vote recorded for ${result.participant.name}!`);
            } else {
                this.showError(result.error || 'Failed to record vote');
            }
            
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
    async removeParticipant(participantId) {
        if (!this.isAdmin) {
            this.showError('Only admins can remove participants.');
            return;
        }

        if (!confirm('Are you sure you want to remove this participant? This will also remove all votes for this participant.')) {
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await fetch(this.apiBase, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'removeParticipant',
                    participantId: participantId,
                    adminAddress: this.currentAccount
                })
            });

            const result = await response.json();
            
            if (result.success) {
                // Find participant name before removing
                const participant = this.participants.find(p => p.id === participantId);
                const participantName = participant ? participant.name : 'Participant';
                
                // Remove from local array
                this.participants = this.participants.filter(p => p.id !== participantId);
                this.updateUI();
                this.showSuccess(`Participant "${participantName}" removed successfully!`);
            } else {
                this.showError(result.error || 'Failed to remove participant');
            }
            
        } catch (error) {
            console.error('Error removing participant:', error);
            this.showError('Error removing participant: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async addParticipant() {
        if (!this.isAdmin) {
            this.showError('Only admins can add participants.');
            return;
        }

        const name = document.getElementById('participantName').value.trim();
        const xProfile = document.getElementById('participantXProfile').value.trim();
        const imageFile = document.getElementById('participantImage').files[0];

        if (!name) {
            this.showError('Please enter a participant name.');
            return;
        }

        if (!imageFile) {
            this.showError('Please select an image.');
            return;
        }

        // Validate X profile format if provided
        if (xProfile && !xProfile.startsWith('@')) {
            this.showError('X profile must start with @ symbol.');
            return;
        }

        try {
            this.showLoading(true);
            
            // Convert image to base64
            const imageData = await this.fileToBase64(imageFile);
            
            // Send to API
            const response = await fetch(this.apiBase, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'addParticipant',
                    name: name,
                    image: imageData,
                    xProfile: xProfile,
                    adminAddress: this.currentAccount
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.participants.push(result.participant);
                this.updateUI();
                
                // Clear form
                document.getElementById('participantName').value = '';
                document.getElementById('participantXProfile').value = '';
                document.getElementById('participantImage').value = '';
                
                this.showSuccess(`Participant "${name}" added successfully!`);
            } else {
                this.showError(result.error || 'Failed to add participant');
            }
            
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
    async drawWinners() {
        if (this.participants.length === 0) {
            this.showError('No participants to draw from.');
            return;
        }

        console.log('Draw winners check:', {
            participants: this.participants.length,
            voters: this.voters.length,
            votes: Object.keys(this.votes).length,
            votersData: this.voters
        });
        
        if (this.voters.length < 3) {
            this.showError(`Need at least 3 voters to draw voter winners. Current: ${this.voters.length}`);
            return;
        }

        try {
            this.showLoading(true);
            document.getElementById('lotteryBtn').disabled = true;
            document.getElementById('lotteryLoading').style.display = 'block';

            // Send lottery request to API
            const response = await fetch(this.apiBase, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'drawWinners',
                    adminAddress: this.currentAccount
                })
            });

            const result = await response.json();
            
            if (result.success) {
                // Show winners with animation
                setTimeout(() => {
                    this.showWinners(result.winningParticipant, result.winningVoters);
                    this.showLoading(false);
                    document.getElementById('lotteryBtn').disabled = false;
                    document.getElementById('lotteryLoading').style.display = 'none';
                }, 2000);
            } else {
                this.showError(result.error || 'Failed to draw winners');
                this.showLoading(false);
                document.getElementById('lotteryBtn').disabled = false;
                document.getElementById('lotteryLoading').style.display = 'none';
            }

        } catch (error) {
            console.error('Error drawing winners:', error);
            this.showError('Error drawing winners: ' + error.message);
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

    showWinners(winningParticipant, winningVoters) {
        const winnerResult = document.getElementById('winnerResult');
        const winnerDetails = document.getElementById('winnerDetails');
        
        const voterPositions = ['🥇', '🥈', '🥉'];
        const voterColors = ['#ffd700', '#c0c0c0', '#cd7f32']; // Gold, Silver, Bronze
        
        winnerDetails.innerHTML = `
            <h2 style="color: #fff; font-size: 2.5rem; margin-bottom: 30px; text-align: center;">🏆 WINNERS ANNOUNCED! 🏆</h2>
            
            <!-- Winning Participant -->
            <div style="margin-bottom: 40px;">
                <h3 style="color: #00ff88; font-size: 1.8rem; margin-bottom: 20px; text-align: center;">🏗️ WINNING BUILDER</h3>
                <div style="display: flex; align-items: center; gap: 20px; padding: 20px; background: rgba(0, 255, 136, 0.1); border-radius: 15px; min-width: 400px; margin: 0 auto; border: 2px solid #00ff88;">
                    <div style="font-size: 3rem;">🏆</div>
                    <img src="${winningParticipant.image}" alt="${winningParticipant.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; box-shadow: 0 0 20px #00ff8840;">
                    <div>
                        <h3 style="color: #00ff88; font-size: 1.5rem; margin: 0;">${winningParticipant.name}</h3>
                        <p style="color: #fff; margin: 5px 0;">${winningParticipant.votes} votes</p>
                        ${winningParticipant.x_profile ? `<p style="color: #00ff88; margin: 0; font-size: 0.9rem;">@${winningParticipant.x_profile}</p>` : ''}
                    </div>
                </div>
            </div>

            <!-- Winning Voters -->
            <div>
                <h3 style="color: #ffd700; font-size: 1.8rem; margin-bottom: 20px; text-align: center;">🎲 WINNING VOTERS</h3>
                <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
                    ${winningVoters.map((voter, index) => `
                        <div style="display: flex; align-items: center; gap: 20px; padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 15px; min-width: 400px;">
                            <div style="font-size: 2.5rem;">${voterPositions[index]}</div>
                            <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(45deg, #1a1a2e, #16213e); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px ${voterColors[index]}40;">
                                <span style="color: ${voterColors[index]}; font-size: 1.5rem;">👤</span>
                            </div>
                            <div>
                                <h3 style="color: ${voterColors[index]}; font-size: 1.2rem; margin: 0;">Voter #${index + 1}</h3>
                                <p style="color: #fff; margin: 5px 0; font-family: monospace; font-size: 0.9rem;">${voter.address.slice(0, 6)}...${voter.address.slice(-4)}</p>
                                <p style="color: #ccc; margin: 0; font-size: 0.8rem;">Randomly selected voter</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <p style="font-size: 1.2rem; color: #ccc; margin-top: 30px; text-align: center;">Congratulations to all winners! 🎉</p>
        `;
        
        winnerResult.classList.add('show');
        
        // Scroll to winners
        winnerResult.scrollIntoView({ behavior: 'smooth' });
    }

    // UI Updates
    updateUI() {
        this.updateStats();
        this.renderParticipants();
        
        // Show special message if viewing specific participant
        if (this.highlightParticipant) {
            this.showParticipantMessage();
        }
    }

    showParticipantMessage() {
        const participant = this.participants.find(p => p.id === this.highlightParticipant);
        if (participant) {
            // Create or update special message
            let messageDiv = document.getElementById('participantMessage');
            if (!messageDiv) {
                messageDiv = document.createElement('div');
                messageDiv.id = 'participantMessage';
                messageDiv.className = 'participant-message';
                document.querySelector('.hero-section').appendChild(messageDiv);
            }
            
            const xProfile = participant.x_profile || participant.xProfile || '';
            messageDiv.innerHTML = `
                <div class="highlighted-participant-info">
                    <h2>🎯 Voting for ${participant.name}${xProfile ? ` by ${xProfile}` : ''}</h2>
                    <p>This participant has ${participant.votes} vote${participant.votes !== 1 ? 's' : ''}</p>
                    <p>Scroll down to vote or see all participants!</p>
                </div>
            `;
        }
    }

    updateStats() {
        const totalParticipants = this.participants.length;
        const totalVotes = this.participants.reduce((sum, p) => sum + p.votes, 0);
        const votersCount = this.voters ? this.voters.length : 0;

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
            
            // Highlight participant if specified in URL
            if (this.highlightParticipant && participant.id === this.highlightParticipant) {
                card.classList.add('highlighted-participant');
            }
            
            const hasVoted = this.votes.has(this.currentAccount);
            const userVotedForThis = this.votes.get(this.currentAccount) === participant.id;
            
            // Admin remove button
            const adminControls = this.isAdmin ? 
                `<button class="remove-btn" onclick="builderBattle.removeParticipant(${participant.id})" title="Remove Participant">
                    🗑️ Remove
                </button>` : '';
            
            // X profile link
            const xProfile = participant.x_profile || participant.xProfile; // Support both formats
            const xProfileLink = xProfile ? 
                `<a href="https://x.com/${xProfile.replace('@', '')}" target="_blank" class="x-profile-link">by ${xProfile}</a>` : 
                '';

            card.innerHTML = `
                <div class="participant-image-container">
                    <img src="${participant.image}" alt="${participant.name}" class="participant-image">
                </div>
                <div class="participant-info">
                    <div class="participant-name">${participant.name} ${xProfileLink}</div>
                    <div class="vote-count">${participant.votes} votes</div>
                    <div class="button-row">
                        <button class="vote-btn" 
                                onclick="builderBattle.vote(${participant.id})" 
                                ${hasVoted ? 'disabled' : ''}>
                            ${hasVoted ? (userVotedForThis ? '✓ Voted' : 'Already Voted') : 'Vote'}
                        </button>
                        <button class="share-btn" onclick="builderBattle.shareParticipant(${participant.id})">
                            Share
                        </button>
                    </div>
                    ${adminControls}
                </div>
            `;
            
            grid.appendChild(card);
        });
    }

    // Share Function
    shareParticipant(participantId) {
        const participant = this.participants.find(p => p.id === participantId);
        if (!participant) {
            this.showError('Participant not found.');
            return;
        }

        // Create share message
        const xProfile = participant.x_profile || participant.xProfile || '';
        const shareMessage = `#BuilderBattle ${participant.name}${xProfile ? ` by ${xProfile}` : ''} - Vote for your favorite builder!`;
        const shareUrl = `https://builderbattle.vercel.app/api/participant?participantId=${participantId}`;
        
        // Create image URL for X sharing
        const imageUrl = `https://builderbattle.vercel.app/api/static-image?participantId=${participantId}`;
        
        // Create Twitter share URL with image
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`;
        
        // Open Twitter in new window
        window.open(twitterUrl, '_blank', 'width=600,height=400');
        
        // Update meta tags for better sharing
        this.updateMetaTags(participant, imageUrl);
        
        this.showSuccess('Share window opened! Help spread the word! 🚀');
    }

    // Update meta tags for better sharing
    updateMetaTags(participant, imageUrl) {
        // Update Open Graph meta tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDescription = document.querySelector('meta[property="og:description"]');
        const ogImage = document.querySelector('meta[property="og:image"]');
        const ogUrl = document.querySelector('meta[property="og:url"]');
        
        // Update Twitter Card meta tags
        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        const twitterDescription = document.querySelector('meta[name="twitter:description"]');
        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        
        if (ogTitle) ogTitle.setAttribute('content', `${participant.name} - Builder Battle`);
        if (ogDescription) ogDescription.setAttribute('content', `Vote for ${participant.name} in Builder Battle!`);
        if (ogImage && imageUrl) ogImage.setAttribute('content', imageUrl);
        if (ogUrl) ogUrl.setAttribute('content', `https://builderbattle.vercel.app?participant=${participant.id}`);
        
        if (twitterTitle) twitterTitle.setAttribute('content', `${participant.name} - Builder Battle`);
        if (twitterDescription) twitterDescription.setAttribute('content', `Vote for ${participant.name} in Builder Battle!`);
        if (twitterImage && imageUrl) twitterImage.setAttribute('content', imageUrl);
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

function drawWinners() {
    builderBattle.drawWinners();
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
