// UI-related code
export function createUIElements() {
    // Check if UI container exists, if not create it
    let uiContainer = document.getElementById('uiContainer');
    if (!uiContainer) {
        uiContainer = document.createElement('div');
        uiContainer.id = 'uiContainer';
        uiContainer.style.position = 'absolute';
        uiContainer.style.top = '0';
        uiContainer.style.left = '0';
        uiContainer.style.width = '100%';
        uiContainer.style.height = '100%';
        uiContainer.style.pointerEvents = 'none';
        document.body.appendChild(uiContainer);
    }
    
    // Create start screen if it doesn't exist
    let startScreen = document.getElementById('startScreen');
    if (!startScreen) {
        startScreen = document.createElement('div');
        startScreen.id = 'startScreen';
        startScreen.style.position = 'absolute';
        startScreen.style.top = '30%';
        startScreen.style.left = '50%';
        startScreen.style.transform = 'translate(-50%, -50%)';
        startScreen.style.textAlign = 'center';
        startScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        startScreen.style.padding = '20px';
        startScreen.style.borderRadius = '10px';
        startScreen.style.color = 'white';
        startScreen.style.pointerEvents = 'auto';
   
        // Add Zombie Adrian image
        const zombieImage = document.createElement('img');
        zombieImage.src = './Zombie_Adrian.gif';
        zombieImage.style.width = '200px';
        zombieImage.style.height = '200px';
        zombieImage.style.marginBottom = '20px';
        zombieImage.style.borderRadius = '10px';
        startScreen.appendChild(zombieImage);
        
        const startButton = document.createElement('button');
        startButton.id = 'startButton';
        startButton.textContent = 'Start Game';
        startButton.style.padding = '10px 20px';
        startButton.style.fontSize = '30px';
        startButton.style.cursor = 'pointer';
        startScreen.appendChild(startButton);
        
        uiContainer.appendChild(startScreen);
    }
    
    // Create game over screen if it doesn't exist
    let gameOverScreen = document.getElementById('gameOverScreen');
    if (!gameOverScreen) {
        gameOverScreen = document.createElement('div');
        gameOverScreen.id = 'gameOverScreen';
        gameOverScreen.classList.add('hidden');
        gameOverScreen.style.position = 'absolute';
        gameOverScreen.style.top = '30%';
        gameOverScreen.style.left = '50%';
        gameOverScreen.style.transform = 'translate(-50%, -50%)';
        gameOverScreen.style.textAlign = 'center';
        gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        gameOverScreen.style.padding = '20px';
        gameOverScreen.style.borderRadius = '10px';
        gameOverScreen.style.color = 'white';
        gameOverScreen.style.pointerEvents = 'auto';
        
        const gameOverTitle = document.createElement('h1');
        gameOverTitle.textContent = 'Game Over!';
        gameOverScreen.appendChild(gameOverTitle);
        
        const scoreText = document.createElement('p');
        scoreText.innerHTML = 'Your Score: <span id="finalScore">0</span>';
        scoreText.style.fontSize = '24px';
        gameOverScreen.appendChild(scoreText);
        
        const highScoreText = document.createElement('p');
        highScoreText.innerHTML = 'High Score: <span id="highScore">0</span>';
        highScoreText.style.fontSize = '24px';
        gameOverScreen.appendChild(highScoreText);
        
        const restartButton = document.createElement('button');
        restartButton.id = 'restartButton';
        restartButton.textContent = 'Play Again';
        restartButton.style.padding = '10px 20px';
        restartButton.style.fontSize = '18px';
        restartButton.style.cursor = 'pointer';
        gameOverScreen.appendChild(restartButton);
        
        uiContainer.appendChild(gameOverScreen);
    }
    
    // Create score and time display if they don't exist
    let scoreDisplay = document.getElementById('scoreDisplay');
    if (!scoreDisplay) {
        scoreDisplay = document.createElement('div');
        scoreDisplay.id = 'scoreDisplay';
        scoreDisplay.style.position = 'absolute';
        scoreDisplay.style.top = '10px';
        scoreDisplay.style.left = '10px';
        scoreDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        scoreDisplay.style.color = 'white';
        scoreDisplay.style.padding = '10px';
        scoreDisplay.style.borderRadius = '5px';
        scoreDisplay.style.pointerEvents = 'none';
        
        const scoreText = document.createElement('div');
        scoreText.innerHTML = 'Score: <span id="score">0</span>';
        scoreDisplay.appendChild(scoreText);
        
        const timeText = document.createElement('div');
        timeText.innerHTML = 'Time: <span id="time">60</span>';
        scoreDisplay.appendChild(timeText);
        
        uiContainer.appendChild(scoreDisplay);
    }
}

// Add a new function to update the game over screen
// Add or update this function in gameUI.js
export function updateGameOverScreen(score, highScore) {
    console.log(`Updating game over screen: score=${score}, highScore=${highScore}`);
    
    // Find the game over screen
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (!gameOverScreen) {
        console.error('Game over screen not found');
        return;
    }
    
    // Find or create the score elements within the game over screen
    let finalScoreElement = gameOverScreen.querySelector('#finalScore');
    let highScoreElement = gameOverScreen.querySelector('#highScore');
    
    // If elements don't exist, create them
    if (!finalScoreElement) {
        const scoreText = gameOverScreen.querySelector('p');
        if (scoreText) {
            scoreText.innerHTML = `Your Score: <span id="finalScore">${score}</span>`;
            finalScoreElement = gameOverScreen.querySelector('#finalScore');
        }
    }
    
    if (!highScoreElement) {
        const highScoreText = gameOverScreen.querySelectorAll('p')[1];
        if (highScoreText) {
            highScoreText.innerHTML = `High Score: <span id="highScore">${highScore}</span>`;
            highScoreElement = gameOverScreen.querySelector('#highScore');
        }
    }
    
    // Update the elements
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