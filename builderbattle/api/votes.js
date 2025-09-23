/**
 * Vercel API Function for Builder Battle Votes
 * Handles vote storage and retrieval
 */

const fs = require('fs');
const path = require('path');

// Simple file-based database
const DATA_FILE = path.join(process.cwd(), 'data', 'builderbattle.json');

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  const initialData = {
    participants: [
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
    ],
    votes: {},
    voters: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return null;
  }
}

function writeData(data) {
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data:', error);
    return false;
  }
}

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const data = readData();
  if (!data) {
    return res.status(500).json({ error: 'Failed to read data' });
  }

  switch (req.method) {
    case 'GET':
      // Get all data
      return res.status(200).json({
        success: true,
        data: {
          participants: data.participants,
          totalVotes: Object.keys(data.votes).length,
          voters: data.voters.length,
          lastUpdated: data.lastUpdated
        }
      });

    case 'POST':
      // Handle vote or add participant
      const { action, ...payload } = req.body;

      if (action === 'vote') {
        const { address, participantId, signature, message } = payload;
        
        if (!address || !participantId || !signature) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user already voted
        if (data.votes[address]) {
          return res.status(400).json({ error: 'User has already voted' });
        }

        // Record the vote
        data.votes[address] = {
          participantId,
          signature,
          message,
          timestamp: new Date().toISOString()
        };

        // Add to voters list if not already there
        if (!data.voters.includes(address)) {
          data.voters.push(address);
        }

        // Update participant vote count
        const participant = data.participants.find(p => p.id === participantId);
        if (participant) {
          participant.votes++;
        }

        if (writeData(data)) {
          return res.status(200).json({
            success: true,
            message: 'Vote recorded successfully',
            participant: participant
          });
        } else {
          return res.status(500).json({ error: 'Failed to save vote' });
        }
      }

      if (action === 'addParticipant') {
        const { name, image, adminAddress } = payload;
        
        if (!name || !image || !adminAddress) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Simple admin check (you can make this more sophisticated)
        const adminAddresses = [
          '0x4943407105999e3E97EFA2035F5cbC64D72581C6', // Your address
          // Add more admin addresses as needed
        ];

        if (!adminAddresses.includes(adminAddress.toLowerCase())) {
          return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }

        // Create new participant
        const newParticipant = {
          id: Date.now(),
          name,
          image,
          votes: 0,
          createdAt: new Date().toISOString()
        };

        data.participants.push(newParticipant);

        if (writeData(data)) {
          return res.status(200).json({
            success: true,
            message: 'Participant added successfully',
            participant: newParticipant
          });
        } else {
          return res.status(500).json({ error: 'Failed to add participant' });
        }
      }

      if (action === 'drawWinner') {
        const { adminAddress } = payload;
        
        // Simple admin check
        const adminAddresses = [
          '0x4943407105999e3E97EFA2035F5cbC64D72581C6',
        ];

        if (!adminAddresses.includes(adminAddress.toLowerCase())) {
          return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }

        if (data.participants.length === 0) {
          return res.status(400).json({ error: 'No participants to draw from' });
        }

        // Simple random selection (you can enhance this with blockchain randomness)
        const randomIndex = Math.floor(Math.random() * data.participants.length);
        const winner = data.participants[randomIndex];

        return res.status(200).json({
          success: true,
          message: 'Winner drawn successfully',
          winner: winner,
          randomIndex: randomIndex
        });
      }

      return res.status(400).json({ error: 'Invalid action' });

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
