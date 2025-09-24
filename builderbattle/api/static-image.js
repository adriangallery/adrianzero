// Builder Battle - Static Image for X Cards
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

        // Generate a simple SVG image that X can definitely read
        const xProfile = participant.x_profile || '';
        const votes = participant.votes || 0;
        
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#16213e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f3460;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Border -->
  <rect x="20" y="20" width="1160" height="590" fill="none" stroke="#00ff88" stroke-width="4" rx="20"/>
  
  <!-- Title -->
  <text x="600" y="100" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="48" font-weight="bold">
    🏗️ Builder Battle
  </text>
  
  <!-- Participant Name -->
  <text x="600" y="200" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="36" font-weight="bold">
    ${participant.name}
  </text>
  
  ${xProfile ? `<text x="600" y="250" text-anchor="middle" fill="#00ff88" font-family="Arial, sans-serif" font-size="24">
    by ${xProfile}
  </text>` : ''}
  
  <text x="600" y="320" text-anchor="middle" fill="#ffd700" font-family="Arial, sans-serif" font-size="32" font-weight="bold">
    ${votes} vote${votes !== 1 ? 's' : ''}
  </text>
  
  <!-- Call to Action -->
  <text x="600" y="450" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="28">
    Vote for your favorite builder!
  </text>
  
  <text x="600" y="500" text-anchor="middle" fill="#00ff88" font-family="Arial, sans-serif" font-size="20">
    builderbattle.vercel.app
  </text>
</svg>`;
        
        // Set headers for SVG
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        return res.status(200).send(svg);

    } catch (error) {
        console.error('Static image generation error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
