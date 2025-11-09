// UI-related code
export function createUIElements() {
    const screenArea = document.getElementById('screen-area') || document.querySelector('.screen-area') || document.body;

    // Check if UI container exists, if not create it
    let uiContainer = document.getElementById('uiContainer');
    if (!uiContainer) {
        uiContainer = document.createElement('div');
        uiContainer.id = 'uiContainer';
        uiContainer.className = 'ui-layer';
        uiContainer.style.pointerEvents = 'none';
        screenArea.appendChild(uiContainer);
    }
    
    // Create start screen if it doesn't exist
    let startScreen = document.getElementById('startScreen');
    if (!startScreen) {
        startScreen = document.createElement('div');
        startScreen.id = 'startScreen';
        startScreen.className = 'overlay-panel start-screen';
        startScreen.style.pointerEvents = 'auto';

        const startTitle = document.createElement('h1');
        startTitle.className = 'overlay-title';
        startTitle.textContent = 'Filthy Feet Dash';
        startScreen.appendChild(startTitle);

        const startHint = document.createElement('p');
        startHint.className = 'overlay-hint';
        startHint.textContent = 'Haz clic en cada pie para limpiarlo antes de que escape.';
        startScreen.appendChild(startHint);
   
        const startButton = document.createElement('button');
        startButton.id = 'startButton';
        startButton.textContent = 'Start Game';
        startButton.className = 'btn-control overlay-button';
        startScreen.appendChild(startButton);
        
        uiContainer.appendChild(startScreen);
    }
    
    // Create game over screen if it doesn't exist
    let gameOverScreen = document.getElementById('gameOverScreen');
    if (!gameOverScreen) {
        gameOverScreen = document.createElement('div');
        gameOverScreen.id = 'gameOverScreen';
        gameOverScreen.className = 'overlay-panel game-over-screen hidden';
        gameOverScreen.style.pointerEvents = 'auto';
        
        const gameOverTitle = document.createElement('h1');
        gameOverTitle.textContent = 'Game Over!';
        gameOverTitle.className = 'overlay-title';
        gameOverScreen.appendChild(gameOverTitle);

        const gameOverHint = document.createElement('p');
        gameOverHint.className = 'overlay-hint';
        gameOverHint.textContent = 'Los pies más sucios regresarán pronto. ¿Listo para otra ronda?';
        gameOverScreen.appendChild(gameOverHint);
        
        const scoreText = document.createElement('p');
        scoreText.innerHTML = 'Your Score: <span id="finalScore">0</span>';
        scoreText.className = 'overlay-stat';
        gameOverScreen.appendChild(scoreText);
        
        const highScoreText = document.createElement('p');
        highScoreText.innerHTML = 'High Score: <span id="highScore">0</span>';
        highScoreText.className = 'overlay-stat';
        gameOverScreen.appendChild(highScoreText);
        
        const restartButton = document.createElement('button');
        restartButton.id = 'restartButton';
        restartButton.textContent = 'Play Again';
        restartButton.className = 'btn-control overlay-button';
        gameOverScreen.appendChild(restartButton);
        
        uiContainer.appendChild(gameOverScreen);
    }
    
    // Ensure score/time placeholders exist for legacy markup
    if (!document.getElementById('score')) {
        const fallbackScoreDisplay = document.createElement('div');
        fallbackScoreDisplay.id = 'scoreDisplay';
        fallbackScoreDisplay.className = 'hud-fallback';
        fallbackScoreDisplay.innerHTML = 'Score: <span id="score">0</span> · Time: <span id="time">60</span>';
        uiContainer.appendChild(fallbackScoreDisplay);
    }
}

// Add a new function to update the game over screen
// Add or update this function in gameUI.js
export function updateGameOverScreen(score, highScore) {
    console.log(`Updating game over screen: score=${score}, highScore=${highScore}`);
    
    const finalScoreElement = document.getElementById('finalScore');
    const highScoreElement = document.getElementById('highScore');
    
    if (finalScoreElement) {
        finalScoreElement.textContent = score;
        console.log('Updated finalScore element');
    } else {
        console.error('finalScore element not found');
    }
    
    if (highScoreElement) {
        highScoreElement.textContent = highScore;
        console.log('Updated highScore element');
    } else {
        console.error('highScore element not found');
    }
}

// Add a function to show/hide screens
export function showScreen(screenId) {
    // Hide all screens first
    const screens = ['startScreen', 'gameOverScreen'];
    screens.forEach(id => {
        const screen = document.getElementById(id);
        if (screen) {
            screen.classList.add('hidden');
        }
    });
    
    // Show the requested screen
    const screenToShow = document.getElementById(screenId);
    if (screenToShow) {
        screenToShow.classList.remove('hidden');
    }
}