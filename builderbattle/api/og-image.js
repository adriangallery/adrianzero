// Builder Battle - Open Graph Image Generation (PNG)
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

        // Generate HTML for image generation
        const html = generateImageHTML(participant);
        
        // Set headers for HTML (we'll use a service to convert to image)
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        return res.status(200).send(html);

    } catch (error) {
        console.error('OG Image generation error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

function generateImageHTML(participant) {
    const xProfile = participant.x_profile || '';
    const votes = participant.votes || 0;
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            margin: 0;
            padding: 0;
            width: 1200px;
            height: 630px;
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            font-family: Arial, sans-serif;
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            overflow: hidden;
        }
        
        .border {
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 4px solid #00ff88;
            border-radius: 20px;
        }
        
        .title {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            z-index: 10;
        }
        
        .participant-info {
            text-align: center;
            z-index: 10;
        }
        
        .participant-name {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #ffffff;
        }
        
        .participant-x {
            font-size: 24px;
            color: #00ff88;
            margin-bottom: 20px;
        }
        
        .participant-votes {
            font-size: 32px;
            font-weight: bold;
            color: #ffd700;
            margin-bottom: 30px;
        }
        
        .cta {
            font-size: 28px;
            color: #ffffff;
            margin-bottom: 10px;
        }
        
        .url {
            font-size: 20px;
            color: #00ff88;
        }
        
        .participant-image {
            position: absolute;
            right: 100px;
            top: 50%;
            transform: translateY(-50%);
            width: 300px;
            height: 300px;
            border-radius: 50%;
            object-fit: cover;
            border: 4px solid #ffd700;
            z-index: 5;
        }
        
        .decorative {
            position: absolute;
            width: 100px;
            height: 100px;
            background: linear-gradient(45deg, #00ff88, #ffd700);
            border-radius: 50%;
            opacity: 0.3;
        }
        
        .decorative:nth-child(1) {
            top: 50px;
            right: 50px;
        }
        
        .decorative:nth-child(2) {
            bottom: 50px;
            left: 50px;
            width: 60px;
            height: 60px;
        }
    </style>
</head>
<body>
    <div class="border"></div>
    <div class="decorative"></div>
    <div class="decorative"></div>
    
    <h1 class="title">🏗️ Builder Battle</h1>
    
    <div class="participant-info">
        <div class="participant-name">${participant.name}</div>
        ${xProfile ? `<div class="participant-x">by ${xProfile}</div>` : ''}
        <div class="participant-votes">${votes} vote${votes !== 1 ? 's' : ''}</div>
        <div class="cta">Vote for your favorite builder!</div>
        <div class="url">builderbattle.vercel.app</div>
    </div>
    
    <img src="${participant.image}" alt="${participant.name}" class="participant-image">
</body>
</html>`;
}
