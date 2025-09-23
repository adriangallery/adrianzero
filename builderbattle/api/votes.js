// Simple API for Builder Battle
const fs = require('fs');
const path = require('path');

// Simple in-memory database (for Vercel serverless)
let data = {
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
  voters: []
};

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

    if (req.method === 'GET') {
      // Return all data
      return res.status(200).json({
        success: true,
        data: {
          participants: data.participants,
          totalVotes: Object.keys(data.votes).length,
          voters: data.voters.length
        }
      });
    }

    if (req.method === 'POST') {
      const { action, ...payload } = req.body;

      if (action === 'vote') {
        const { address, participantId } = payload;
        
        if (!address || !participantId) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user already voted
        if (data.votes[address]) {
          return res.status(400).json({ error: 'User has already voted' });
        }

        // Record the vote
        data.votes[address] = {
          participantId,
          timestamp: new Date().toISOString()
        };

        // Add to voters list
        if (!data.voters.includes(address)) {
          data.voters.push(address);
        }

        // Update participant vote count
        const participant = data.participants.find(p => p.id === participantId);
        if (participant) {
          participant.votes++;
        }

        return res.status(200).json({
          success: true,
          message: 'Vote recorded successfully',
          participant: participant
        });
      }

      if (action === 'addParticipant') {
        const { name, image, adminAddress } = payload;
        
        if (!name || !image || !adminAddress) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Simple admin check
        const adminAddresses = [
          '0x4943407105999e3e97efa2035f5cbc64d72581c6'
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

        return res.status(200).json({
          success: true,
          message: 'Participant added successfully',
          participant: newParticipant
        });
      }

      if (action === 'drawWinner') {
        const { adminAddress } = payload;
        
        // Simple admin check
        const adminAddresses = [
          '0x4943407105999e3e97efa2035f5cbc64d72581c6'
        ];

        if (!adminAddresses.includes(adminAddress.toLowerCase())) {
          return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }

        if (data.participants.length === 0) {
          return res.status(400).json({ error: 'No participants to draw from' });
        }

        // Simple random selection
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
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
};