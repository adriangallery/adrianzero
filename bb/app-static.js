// Builder Battle - Static Version with Supabase
class BuilderBattle {
    constructor() {
        this.currentAccount = null;
        this.isAdmin = false;
        this.participants = [];
        this.votes = {};
        this.voters = [];
        this.winners = [];
        
        // Initialize Supabase
        this.supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        
        this.init();
    }

    async init() {
        console.log('Initializing Builder Battle Static...');
        
        // Check for participant parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const participantId = urlParams.get('participant');
        
        if (participantId) {
            this.highlightParticipant(participantId);
        }
        
        // Load data from Supabase
        await this.loadData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI
        this.updateUI();
    }

    async loadData() {
        try {
            console.log('Loading data from Supabase...');
            
            // Load participants
            const { data: participants, error: participantsError } = await this.supabase
                .from('participants')
                .select('*')
                .order('id', { ascending: true });

            if (participantsError) {
                console.error('Error loading participants:', participantsError);
                return;
            }

            this.participants = participants || [];
            console.log('Loaded participants:', this.participants.length);

            // Load votes
            const { data: votes, error: votesError } = await this.supabase
                .from('votes')
                .select('*');

            if (votesError) {
                console.error('Error loading votes:', votesError);
                return;
            }

            // Convert votes to object format
            this.votes = {};
            this.voters = [];
            votes.forEach(vote => {
                this.votes[vote.voter_address] = vote.participant_id;
                this.voters.push(vote.voter_address);
            });

            console.log('Loaded votes:', Object.keys(this.votes).length);

        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async saveData() {
        try {
            console.log('Saving data to Supabase...');
            
            // Update participants
            for (const participant of this.participants) {
                const { error } = await this.supabase
                    .from('participants')
                    .upsert({
                        id: participant.id,
                        name: participant.name,
                        image: participant.image,
                        x_profile: participant.x_profile || '',
                        votes: participant.votes || 0,
                        updated_at: new Date().toISOString()
                    });

                if (error) {
                    console.error('Error saving participant:', error);
                    return false;
                }
            }

            // Clear existing votes
            const { error: deleteError } = await this.supabase
                .from('votes')
                .delete()
                .neq('id', 0);

            if (deleteError) {
                console.error('Error clearing votes:', deleteError);
                return false;
            }

            // Insert new votes
            const votesToInsert = Object.entries(this.votes).map(([voterAddress, participantId]) => ({
                voter_address: voterAddress,
                participant_id: participantId,
                created_at: new Date().toISOString()
            }));

            if (votesToInsert.length > 0) {
                const { error: votesError } = await this.supabase
                    .from('votes')
                    .insert(votesToInsert);

                if (votesError) {
                    console.error('Error saving votes:', votesError);
                    return false;
                }
            }

            console.log('Data saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    setupEventListeners() {
        // Connect wallet button
        const connectBtn = document.getElementById('connectBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectWallet());
        }

        // Disconnect wallet button
        const disconnectBtn = document.getElementById('disconnectBtn');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.disconnectWallet());
        }

        // Add participant button
        const addParticipantBtn = document.getElementById('addParticipantBtn');
        if (addParticipantBtn) {
            addParticipantBtn.addEventListener('click', () => this.addParticipant());
        }

        // Vote buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('vote-btn')) {
                const participantId = parseInt(e.target.dataset.participantId);
                this.vote(participantId);
            }
        });

        // Add participant form
        const addParticipantForm = document.getElementById('addParticipantForm');
        if (addParticipantForm) {
            addParticipantForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addParticipant();
            });
        }

        // Remove participant buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                const participantId = parseInt(e.target.dataset.participantId);
                this.removeParticipant(participantId);
            }
        });
    }

    async connectWallet() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.currentAccount = accounts[0];
                this.isAdmin = this.currentAccount.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
                
                console.log('Connected:', this.currentAccount);
                console.log('Is admin:', this.isAdmin);
                
                this.updateUI();
                this.showSuccess('Wallet connected successfully!');
            } else {
                this.showError('MetaMask not found. Please install MetaMask.');
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.showError('Error connecting wallet: ' + error.message);
        }
    }

    disconnectWallet() {
        this.currentAccount = null;
        this.isAdmin = false;
        this.updateUI();
        this.showSuccess('Wallet disconnected successfully!');
    }

    async vote(participantId) {
        if (!this.currentAccount) {
            this.showError('Please connect your wallet first.');
            return;
        }

        if (this.votes[this.currentAccount]) {
            this.showError('You have already voted!');
            return;
        }

        try {
            this.showLoading(true);
            
            // Find participant
            const participant = this.participants.find(p => p.id === participantId);
            if (!participant) {
                this.showError('Participant not found');
                return;
            }

            // Add vote
            this.votes[this.currentAccount] = participantId;
            this.voters.push(this.currentAccount);
            participant.votes = (participant.votes || 0) + 1;

            // Save to Supabase
            if (await this.saveData()) {
                this.updateUI();
                this.showSuccess(`Vote recorded for ${participant.name}!`);
            } else {
                this.showError('Failed to save vote');
            }
            
        } catch (error) {
            console.error('Error voting:', error);
            this.showError('Error voting: ' + error.message);
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

        if (!name || !imageFile) {
            this.showError('Name and image are required.');
            return;
        }

        try {
            this.showLoading(true);
            
            // Convert image to base64
            const imageBase64 = await this.fileToBase64(imageFile);
            
            // Create new participant
            const nextId = this.participants.length > 0 
                ? Math.max(...this.participants.map(p => p.id), 0) + 1
                : 1;
            
            const newParticipant = {
                id: nextId,
                name: name,
                image: imageBase64,
                x_profile: xProfile || '',
                votes: 0
            };

            this.participants.push(newParticipant);

            // Save to Supabase
            if (await this.saveData()) {
                this.updateUI();
                this.showSuccess(`Participant "${name}" added successfully!`);
                
                // Clear form
                document.getElementById('addParticipantForm').reset();
            } else {
                this.showError('Failed to save participant');
            }
            
        } catch (error) {
            console.error('Error adding participant:', error);
            this.showError('Error adding participant: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

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
            
            // Find participant
            const participant = this.participants.find(p => p.id === participantId);
            if (!participant) {
                this.showError('Participant not found');
                return;
            }

            // Remove participant
            this.participants = this.participants.filter(p => p.id !== participantId);

            // Remove votes for this participant
            Object.keys(this.votes).forEach(voter => {
                if (this.votes[voter] === participantId) {
                    delete this.votes[voter];
                    const voterIndex = this.voters.indexOf(voter);
                    if (voterIndex > -1) {
                        this.voters.splice(voterIndex, 1);
                    }
                }
            });

            // Save to Supabase
            if (await this.saveData()) {
                this.updateUI();
                this.showSuccess(`Participant "${participant.name}" removed successfully!`);
            } else {
                this.showError('Failed to save changes');
            }
            
        } catch (error) {
            console.error('Error removing participant:', error);
            this.showError('Error removing participant: ' + error.message);
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

    highlightParticipant(participantId) {
        // This will be handled by CSS and JavaScript
        console.log('Highlighting participant:', participantId);
    }

    updateUI() {
        this.updateParticipants();
        this.updateVoteStatus();
        this.updateAdminPanel();
        this.updateConnectSection();
    }

    updateConnectSection() {
        const connectSection = document.getElementById('connectSection');
        const accountSection = document.getElementById('accountSection');
        
        if (this.currentAccount) {
            connectSection.style.display = 'none';
            accountSection.style.display = 'block';
        } else {
            connectSection.style.display = 'block';
            accountSection.style.display = 'none';
        }
    }

    updateParticipants() {
        const participantsContainer = document.getElementById('participants');
        if (!participantsContainer) return;

        participantsContainer.innerHTML = '';

        this.participants.forEach(participant => {
            const participantCard = document.createElement('div');
            participantCard.className = 'participant-card';
            participantCard.innerHTML = `
                <div class="participant-image">
                    <img src="${participant.image}" alt="${participant.name}">
                </div>
                <div class="participant-info">
                    <h3>${participant.name}</h3>
                    ${participant.x_profile ? `<p class="x-profile">by ${participant.x_profile}</p>` : ''}
                    <div class="votes">
                        <span class="vote-count">${participant.votes || 0}</span>
                        <span class="vote-label">vote${participant.votes !== 1 ? 's' : ''}</span>
                    </div>
                    <button class="vote-btn" data-participant-id="${participant.id}">
                        Vote
                    </button>
                    ${this.isAdmin ? `<button class="remove-btn" data-participant-id="${participant.id}">Remove</button>` : ''}
                </div>
            `;
            participantsContainer.appendChild(participantCard);
        });
    }

    updateVoteStatus() {
        const voteStatus = document.getElementById('voteStatus');
        if (!voteStatus) return;

        if (this.currentAccount) {
            if (this.votes[this.currentAccount]) {
                const votedParticipant = this.participants.find(p => p.id === this.votes[this.currentAccount]);
                voteStatus.innerHTML = `✅ You voted for: ${votedParticipant ? votedParticipant.name : 'Unknown'}`;
            } else {
                voteStatus.innerHTML = '❌ You haven\'t voted yet';
            }
        } else {
            voteStatus.innerHTML = '🔗 Connect your wallet to vote';
        }
    }

    updateAdminPanel() {
        const adminPanel = document.getElementById('adminPanel');
        if (!adminPanel) return;

        if (this.isAdmin) {
            adminPanel.style.display = 'block';
        } else {
            adminPanel.style.display = 'none';
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }

    showSuccess(message) {
        // Simple alert for now - can be improved with a proper notification system
        alert('✅ ' + message);
    }

    showError(message) {
        // Simple alert for now - can be improved with a proper notification system
        alert('❌ ' + message);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BuilderBattle();
});
