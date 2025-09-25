// Script to generate static pages for participants
// This would be run during build process

const fs = require('fs');
const path = require('path');

// This is a template for participant pages
const participantPageTemplate = (participant) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${participant.name} - Builder Battle</title>
    
    <!-- X (Twitter) Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@adriangallery">
    <meta name="twitter:creator" content="${participant.x_profile || '@adriangallery'}">
    <meta name="twitter:title" content="${participant.name} - Builder Battle">
    <meta name="twitter:description" content="Vote for ${participant.name} in Builder Battle! ${participant.x_profile ? `by ${participant.x_profile}` : ''} Join the battle and help decide the winner.">
    <meta name="twitter:image" content="${participant.image}">
    <meta name="twitter:image:alt" content="${participant.name} - Builder Battle participant">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${participant.name} - Builder Battle">
    <meta property="og:description" content="Vote for ${participant.name} in Builder Battle! ${participant.x_profile ? `by ${participant.x_profile}` : ''} Join the battle and help decide the winner.">
    <meta property="og:image" content="${participant.image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${participant.name} - Builder Battle participant">
    <meta property="og:url" content="https://adriangallery.github.io/adrianzero-1/bb/participant-${participant.id}.html">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Builder Battle">
    
    <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js"></script>
    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
    <script src="config.js"></script>
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
        
        .participant-image-container {
            margin-top: 20px;
            text-align: center;
        }
        
        .participant-image-large {
            width: 300px;
            height: 300px;
            border-radius: 50%;
            object-fit: cover;
            border: 4px solid #ffd700;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
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
                <h2>🎯 Voting for ${participant.name}${participant.x_profile ? ` by ${participant.x_profile}` : ''}</h2>
                <p>This participant has ${participant.votes} vote${participant.votes !== 1 ? 's' : ''}</p>
                <p>Loading the full application...</p>
            </div>
            <div class="participant-image-container">
                <img src="${participant.image}" alt="${participant.name} - Builder Battle participant" class="participant-image-large">
            </div>
        </div>
    </div>
    
    <div class="loading">
        <p>Redirecting to Builder Battle...</p>
    </div>

    <script>
        // Redirect to the main app with participant parameter
        setTimeout(() => {
            window.location.href = 'https://adriangallery.github.io/adrianzero-1/bb/?participant=${participant.id}';
        }, 2000);
    </script>
</body>
</html>`;

// This would be called during build process
function generateParticipantPages(participants) {
    participants.forEach(participant => {
        const html = participantPageTemplate(participant);
        const filename = `participant-${participant.id}.html`;
        fs.writeFileSync(filename, html);
        console.log(`Generated ${filename}`);
    });
}

module.exports = { generateParticipantPages, participantPageTemplate };
