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
        
        // Update UI after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.updateUI();
        }, 100);
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
            
            // Get current participant IDs from database
            const { data: existingParticipants, error: fetchError } = await this.supabase
                .from('participants')
                .select('id');

            if (fetchError) {
                console.error('Error fetching existing participants:', fetchError);
                return false;
            }

            const existingIds = existingParticipants.map(p => p.id);
            const currentIds = this.participants.map(p => p.id);
            const toDelete = existingIds.filter(id => !currentIds.includes(id));

            // Delete participants that are no longer in the list
            if (toDelete.length > 0) {
                const { error: deleteError } = await this.supabase
                    .from('participants')
                    .delete()
                    .in('id', toDelete);

                if (deleteError) {
                    console.error('Error deleting participants:', deleteError);
                    return false;
                }
            }
            
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

        // Share buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('share-btn')) {
                const participantId = parseInt(e.target.dataset.participantId);
                this.shareParticipant(participantId);
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
                const form = document.querySelector('.add-participant-form');
                if (form) {
                    form.reset();
                }
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

    shareParticipant(participantId) {
        const participant = this.participants.find(p => p.id === participantId);
        if (!participant) {
            this.showError('Participant not found.');
            return;
        }

        // Create share message
        const xProfile = participant.x_profile || '';
        const shareMessage = `#BuilderBattle ${participant.name}${xProfile ? ` by ${xProfile}` : ''} - Vote for your favorite builder!`;
        const shareUrl = `https://adrianzero.com/bb/participant.html?participant=${participantId}`;
        
        // Create Twitter share URL
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`;
        
        // Open Twitter in new window
        window.open(twitterUrl, '_blank', 'width=600,height=400');
        
        this.showSuccess('Share window opened! Help spread the word! 🚀');
    }

    highlightParticipant(participantId) {
        // This will be handled by CSS and JavaScript
        console.log('Highlighting participant:', participantId);
    }

    updateUI() {
        console.log('Updating UI...');
        console.log('Participants:', this.participants.length);
        console.log('Votes:', Object.keys(this.votes).length);
        console.log('Current account:', this.currentAccount);
        console.log('Is admin:', this.isAdmin);
        
        this.updateParticipants();
        this.updateVoteStatus();
        this.updateAdminPanel();
        this.updateConnectSection();
        this.updateStats();
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
        console.log('Updating participants...');
        const participantsContainer = document.getElementById('participantsGrid');
        console.log('Participants container:', participantsContainer);
        
        if (!participantsContainer) {
            console.error('Participants container not found!');
            return;
        }

        participantsContainer.innerHTML = '';
        console.log('Rendering', this.participants.length, 'participants');

        this.participants.forEach(participant => {
            const participantCard = document.createElement('div');
            participantCard.className = 'participant-card';
            // Validate image URL - only accept valid HTTP/HTTPS URLs or data URLs
            let imageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2NjYyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
            
            if (participant.image) {
                // Check if it's a valid HTTP/HTTPS URL
                if (participant.image.startsWith('http://') || participant.image.startsWith('https://')) {
                    imageUrl = participant.image;
                }
                // Check if it's a valid data URL
                else if (participant.image.startsWith('data:')) {
                    imageUrl = participant.image;
                }
                // For invalid URLs (like c:\fakepath\), use placeholder
            }
            
            participantCard.innerHTML = `
                <div class="participant-image-container">
                    <img src="${imageUrl}" alt="${participant.name}" class="participant-image">
                </div>
                <div class="participant-info">
                    <h3>${participant.name}</h3>
                    ${participant.x_profile ? `<p class="x-profile">by ${participant.x_profile}</p>` : ''}
                    <div class="votes">
                        <span class="vote-count">${participant.votes || 0}</span>
                        <span class="vote-label">vote${participant.votes !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="button-row">
                        <button class="vote-btn" data-participant-id="${participant.id}">
                            Vote
                        </button>
                        <button class="share-btn" data-participant-id="${participant.id}">
                            Share on X
                        </button>
                    </div>
                    ${this.isAdmin ? `<button class="remove-btn" data-participant-id="${participant.id}">Remove</button>` : ''}
                </div>
            `;
            participantsContainer.appendChild(participantCard);
        });
    }

    updateVoteStatus() {
        // console.log('Updating vote status...');
        // TODO: Add vote status element to HTML
        // For now, we'll skip this functionality
    }

    updateAdminPanel() {
        const adminPanel = document.getElementById('adminSection');
        if (!adminPanel) return;

        if (this.isAdmin) {
            adminPanel.style.display = 'block';
        } else {
            adminPanel.style.display = 'none';
        }
    }

    updateStats() {
        // console.log('Updating stats...');
        
        // Update total participants
        const totalParticipants = document.getElementById('totalParticipants');
        if (totalParticipants) {
            totalParticipants.textContent = this.participants.length;
        }

        // Update total votes
        const totalVotes = document.getElementById('totalVotes');
        if (totalVotes) {
            const totalVoteCount = this.participants.reduce((sum, p) => sum + (p.votes || 0), 0);
            totalVotes.textContent = totalVoteCount;
        }

        // Update voters count
        const votersCount = document.getElementById('votersCount');
        if (votersCount) {
            votersCount.textContent = this.voters.length;
        }

        // Update votes used for current user
        const votesUsed = document.getElementById('votesUsed');
        if (votesUsed) {
            const userVotes = this.currentAccount ? (this.votes[this.currentAccount] ? 1 : 0) : 0;
            votesUsed.textContent = userVotes;
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
