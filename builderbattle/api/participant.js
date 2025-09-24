// Builder Battle - Participant-specific page with proper meta tags
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
        const { participantId } = req.query;

        if (!participantId) {
            return res.redirect('/');
        }

        // Get participant data from Supabase
        const { data: participant, error } = await supabase
            .from('participants')
            .select('*')
            .eq('id', participantId)
            .single();

        if (error || !participant) {
            return res.redirect('/');
        }

        const xProfile = participant.x_profile || '';
        const imageUrl = `https://builderbattle.vercel.app/api/image?participantId=${participantId}`;
        const pageUrl = `https://builderbattle.vercel.app?participant=${participantId}`;

        // Generate HTML with proper meta tags
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${participant.name} - Builder Battle</title>
    
    <!-- X (Twitter) Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@adriangallery">
    <meta name="twitter:title" content="${participant.name} - Builder Battle">
    <meta name="twitter:description" content="Vote for ${participant.name} in Builder Battle! ${xProfile ? `by ${xProfile}` : ''} Join the battle and help decide the winner.">
    <meta name="twitter:image" content="${imageUrl}">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${participant.name} - Builder Battle">
    <meta property="og:description" content="Vote for ${participant.name} in Builder Battle! ${xProfile ? `by ${xProfile}` : ''} Join the battle and help decide the winner.">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:type" content="website">
    
    <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js"></script>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏗️</text></svg>">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'VT323', monospace;
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            min-height: 100vh;
            color: #fff;
        }

        .hero-section {
            background: rgba(0, 0, 0, 0.3);
            padding: 60px 0;
            text-align: center;
            border-bottom: 3px solid #00ff88;
        }

        .hero-title {
            font-size: 4rem;
            font-weight: bold;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }

        .hero-subtitle {
            font-size: 1.5rem;
            color: #00ff88;
            margin-bottom: 30px;
        }

        .participant-message {
            margin-top: 30px;
            padding: 20px;
            background: rgba(255, 215, 0, 0.1);
            border: 2px solid #ffd700;
            border-radius: 15px;
            text-align: center;
        }

        .highlighted-participant-info h2 {
            color: #ffd700;
            font-size: 2rem;
            margin-bottom: 15px;
        }

        .highlighted-participant-info p {
            color: #ffffff;
            font-size: 1.2rem;
            margin-bottom: 10px;
        }

        .loading {
            text-align: center;
            padding: 50px;
            font-size: 1.5rem;
        }
    </style>
</head>
<body>
    <div class="hero-section">
        <h1 class="hero-title">🏗️ Builder Battle</h1>
        <p class="hero-subtitle">Vote for your favorite builder and enter the lottery! v1.2.0</p>
        
        <div class="participant-message">
            <div class="highlighted-participant-info">
                <h2>🎯 Voting for ${participant.name}${xProfile ? ` by ${xProfile}` : ''}</h2>
                <p>This participant has ${participant.votes} vote${participant.votes !== 1 ? 's' : ''}</p>
                <p>Loading the full application...</p>
            </div>
        </div>
    </div>
    
    <div class="loading">
        <p>Redirecting to Builder Battle...</p>
    </div>

    <script>
        // Redirect to the main app with participant parameter
        setTimeout(() => {
            window.location.href = 'https://builderbattle.vercel.app?participant=${participantId}';
        }, 2000);
    </script>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        return res.status(200).send(html);

    } catch (error) {
        console.error('Participant page error:', error);
        return res.redirect('/');
    }
};
