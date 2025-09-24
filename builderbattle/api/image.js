// Builder Battle - Image Generation for X Cards
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { participantId } = req.query;

        if (!participantId) {
            return res.status(400).json({ error: 'Participant ID is required' });
        }

        // Get participant data from Supabase
        const { data: participant, error } = await supabase
            .from('participants')
            .select('*')
            .eq('id', participantId)
            .single();

        if (error || !participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        // Generate SVG image
        const svg = generateParticipantCard(participant);
        
        // Set headers for SVG
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        
        return res.status(200).send(svg);

    } catch (error) {
        console.error('Image generation error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

function generateParticipantCard(participant) {
    const xProfile = participant.x_profile || '';
    const votes = participant.votes || 0;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#16213e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f3460;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00ff88;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffd700;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Border -->
  <rect x="20" y="20" width="1160" height="590" fill="none" stroke="url(#accent)" stroke-width="4" rx="20"/>
  
  <!-- Title -->
  <text x="600" y="100" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="48" font-weight="bold">
    🏗️ Builder Battle
  </text>
  
  <!-- Participant Image -->
  <image x="100" y="150" width="300" height="300" href="${participant.image}" clip-path="circle(150 300 150)"/>
  
  <!-- Participant Info -->
  <text x="500" y="200" fill="#ffffff" font-family="Arial, sans-serif" font-size="36" font-weight="bold">
    ${participant.name}
  </text>
  
  ${xProfile ? `<text x="500" y="250" fill="#00ff88" font-family="Arial, sans-serif" font-size="24">
    by ${xProfile}
  </text>` : ''}
  
  <text x="500" y="320" fill="#ffd700" font-family="Arial, sans-serif" font-size="32" font-weight="bold">
    ${votes} vote${votes !== 1 ? 's' : ''}
  </text>
  
  <!-- Call to Action -->
  <text x="600" y="450" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="28">
    Vote for your favorite builder!
  </text>
  
  <text x="600" y="500" text-anchor="middle" fill="#00ff88" font-family="Arial, sans-serif" font-size="20">
    builderbattle.vercel.app
  </text>
  
  <!-- Decorative elements -->
  <circle cx="1000" cy="100" r="50" fill="url(#accent)" opacity="0.3"/>
  <circle cx="1100" cy="500" r="30" fill="url(#accent)" opacity="0.2"/>
  <rect x="50" y="500" width="100" height="4" fill="url(#accent)" opacity="0.5"/>
</svg>`;
}