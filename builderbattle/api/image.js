// Image serving endpoint for X (Twitter) sharing
const fs = require('fs');
const path = require('path');

// Data file path
const DATA_FILE = path.join(process.cwd(), 'data.json');

// Load data from file
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const fileData = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(fileData);
        }
        return { participants: [] };
    } catch (error) {
        console.error('Error loading data:', error);
        return { participants: [] };
    }
}

module.exports = async function handler(req, res) {
    try {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        if (req.method === 'GET') {
            const { participantId } = req.query;
            
            if (!participantId) {
                return res.status(400).json({ error: 'Participant ID is required' });
            }

            // Load data
            const data = loadData();
            
            // Find participant
            const participant = data.participants.find(p => p.id == participantId);
            
            if (!participant) {
                return res.status(404).json({ error: 'Participant not found' });
            }

            // Check if image is base64
            if (participant.image.startsWith('data:image/')) {
                // Extract base64 data
                const base64Data = participant.image.split(',')[1];
                const mimeType = participant.image.split(';')[0].split(':')[1];
                
                // Set appropriate headers
                res.setHeader('Content-Type', mimeType);
                res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
                res.setHeader('Content-Length', base64Data.length);
                
                // Convert base64 to buffer and send
                const imageBuffer = Buffer.from(base64Data, 'base64');
                return res.status(200).send(imageBuffer);
            } else {
                // If it's a URL, redirect to it
                return res.redirect(302, participant.image);
            }
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Image API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
