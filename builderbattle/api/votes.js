// Builder Battle API - Persistent Data Storage using GitHub API
const fs = require('fs');
const path = require('path');

// Data file path (will be committed to GitHub)
const DATA_FILE = path.join(process.cwd(), 'data.json');

// GitHub API configuration
const GITHUB_OWNER = 'adrianzero-1';
const GITHUB_REPO = 'adrianzero-1';
const GITHUB_PATH = 'builderbattle/data.json';
const GITHUB_API_BASE = 'https://api.github.com';

// Default data structure
const defaultData = {
    participants: [
        {
            id: 1,
            name: 'Builder Alpha',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmY2YjM1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFscGhhPC90ZXh0Pjwvc3ZnPg==',
            xProfile: '@builderalpha',
            votes: 0
        },
        {
            id: 2,
            name: 'Builder Beta',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDBmZjg4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJldGE8L3RleHQ+PC9zdmc+',
            xProfile: '@builderbeta',
            votes: 0
        }
    ],
    votes: {},
    voters: [],
    winners: [],
    lastUpdated: null
};

// Admin address
const ADMIN_ADDRESS = '0x4943407105999e3e97efa2035f5cbc64d72581c6';

// Load data from GitHub file
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const fileData = fs.readFileSync(DATA_FILE, 'utf8');
            const data = JSON.parse(fileData);
            console.log('Data loaded from GitHub file');
            return data;
        } else {
            console.log('No data file found, using default data');
            return defaultData;
        }
    } catch (error) {
        console.error('Error loading data:', error);
        return defaultData;
    }
}

// Save data to GitHub using API
async function saveData(data) {
    try {
        data.lastUpdated = new Date().toISOString();
        const content = JSON.stringify(data, null, 2);
        
        // Get GitHub token from environment
        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) {
            console.error('GITHUB_TOKEN environment variable not set');
            return false;
        }
        
        // First, get the current file to get the SHA
        const getResponse = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        let sha = null;
        if (getResponse.ok) {
            const fileData = await getResponse.json();
            sha = fileData.sha;
        }
        
        // Update the file
        const updateResponse = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Update Builder Battle data - ${new Date().toISOString()}`,
                content: Buffer.from(content).toString('base64'),
                sha: sha
            })
        });
        
        if (updateResponse.ok) {
            console.log('Data saved to GitHub via API');
            return true;
        } else {
            const error = await updateResponse.text();
            console.error('GitHub API error:', error);
            return false;
        }
    } catch (error) {
        console.error('Error saving data to GitHub:', error);
        return false;
    }
}

module.exports = async function handler(req, res) {
    try {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        // Load current data
        let data = loadData();

        if (req.method === 'GET') {
            // Return all data
            return res.status(200).json({
                success: true,
                data: {
                    participants: data.participants,
                    totalVotes: Object.keys(data.votes).length,
                    voters: data.voters.length,
                    lastUpdated: data.lastUpdated
                }
            });
        }

        if (req.method === 'POST') {
            const { action, ...payload } = req.body;
            
            console.log('API received:', { action, payload });
            
            if (action === 'vote') {
                const { address, participantId } = payload;
                
                console.log('Vote data:', { address, participantId });
                console.log('Available participants:', data.participants.map(p => ({ id: p.id, name: p.name })));
                console.log('Current voters:', data.voters);
                
                if (!address || !participantId) {
                    console.log('Missing required fields for vote:', { address: !!address, participantId: !!participantId });
                    return res.status(400).json({ error: 'Missing required fields' });
                }

                // Check if user has already voted
                if (data.voters.includes(address)) {
                    console.log('User already voted:', address);
                    return res.status(400).json({ error: 'User has already voted' });
                }

                // Check if participant exists
                const participant = data.participants.find(p => p.id === participantId);
                if (!participant) {
                    console.log('Participant not found:', participantId);
                    return res.status(400).json({ error: 'Participant not found' });
                }

                // Record vote
                data.votes[address] = participantId;
                data.voters.push(address);
                participant.votes++;
                
                console.log('Vote recorded, participant votes:', participant.votes);

                // Save data
                if (await saveData(data)) {
                    console.log('Vote saved successfully');
                    return res.status(200).json({
                        success: true,
                        message: 'Vote recorded successfully',
                        participant: participant
                    });
                } else {
                    console.error('Failed to save vote data');
                    return res.status(500).json({ error: 'Failed to save vote' });
                }
            }

            if (action === 'addParticipant') {
                const { name, image, xProfile } = payload;
                
                console.log('Adding participant:', { name, xProfile, hasImage: !!image });
                
                if (!name || !image) {
                    console.log('Missing required fields:', { name: !!name, image: !!image });
                    return res.status(400).json({ error: 'Name and image are required' });
                }

                // Create new participant
                const nextId = data.participants.length > 0 
                    ? Math.max(...data.participants.map(p => p.id), 0) + 1
                    : 1;
                
                console.log('Next participant ID:', nextId);
                
                const newParticipant = {
                    id: nextId,
                    name: name,
                    image: image,
                    xProfile: xProfile || '',
                    votes: 0
                };

                data.participants.push(newParticipant);
                console.log('Participant added to data, total participants:', data.participants.length);

                // Save data
                if (await saveData(data)) {
                    console.log('Participant saved successfully');
                    return res.status(200).json({
                        success: true,
                        message: 'Participant added successfully',
                        participant: newParticipant
                    });
                } else {
                    console.error('Failed to save participant data');
                    return res.status(500).json({ error: 'Failed to save participant' });
                }
            }

            if (action === 'removeParticipant') {
                const { participantId } = payload;
                
                if (!participantId) {
                    return res.status(400).json({ error: 'Participant ID is required' });
                }

                // Find and remove participant
                const participantIndex = data.participants.findIndex(p => p.id === participantId);
                if (participantIndex === -1) {
                    return res.status(400).json({ error: 'Participant not found' });
                }

                const participant = data.participants[participantIndex];
                data.participants.splice(participantIndex, 1);

                // Remove votes for this participant
                Object.keys(data.votes).forEach(voter => {
                    if (data.votes[voter] === participantId) {
                        delete data.votes[voter];
                        const voterIndex = data.voters.indexOf(voter);
                        if (voterIndex > -1) {
                            data.voters.splice(voterIndex, 1);
                        }
                    }
                });

                // Save data
                if (await saveData(data)) {
                    return res.status(200).json({
                        success: true,
                        message: 'Participant removed successfully'
                    });
                } else {
                    return res.status(500).json({ error: 'Failed to save changes' });
                }
            }

            if (action === 'drawWinner') {
                const { address } = payload;
                
                // Check if user is admin
                if (address.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
                    return res.status(403).json({ error: 'Unauthorized' });
                }

                if (data.participants.length === 0) {
                    return res.status(400).json({ error: 'No participants to draw from' });
                }

                // Simple random selection based on current time
                const randomIndex = Math.floor(Math.random() * data.participants.length);
                const winner = data.participants[randomIndex];

                // Add to winners history
                data.winners.push({
                    participant: winner,
                    drawnAt: new Date().toISOString(),
                    totalParticipants: data.participants.length,
                    totalVotes: Object.keys(data.votes).length
                });

                // Save data
                if (await saveData(data)) {
                    return res.status(200).json({
                        success: true,
                        message: 'Winner drawn successfully',
                        winner: winner
                    });
                } else {
                    return res.status(500).json({ error: 'Failed to save winner' });
                }
            }

            if (action === 'backupData') {
                const { address } = payload;
                
                // Check if user is admin
                if (address.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
                    return res.status(403).json({ error: 'Unauthorized' });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Data backup created',
                    data: data
                });
            }

            if (action === 'resetData') {
                const { address } = payload;
                
                // Check if user is admin
                if (address.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
                    return res.status(403).json({ error: 'Unauthorized' });
                }

                // Reset to default data
                data = { ...defaultData };
                
                if (await saveData(data)) {
                    return res.status(200).json({
                        success: true,
                        message: 'Data reset successfully'
                    });
                } else {
                    return res.status(500).json({ error: 'Failed to reset data' });
                }
            }

            if (action === 'getWinners') {
                return res.status(200).json({
                    success: true,
                    winners: data.winners
                });
            }

            return res.status(400).json({ error: 'Invalid action' });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};