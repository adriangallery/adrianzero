// Standalone version of game.js without ES6 modules
class ShooterGame {
    constructor() {
        // Initialize canvas and context
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Could not get 2D context from canvas!');
            return;
        }
        
        // Set canvas to window size
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas.bind(this));
        
        // Update canvas size to 1920x1080
        this.canvas.width = 1920 * 0.5;
        this.canvas.height = 1080 * 0.5;
        
        // Game state
        this.gameState = 'start'; // 'start', 'playing', 'paused', 'gameOver'
        this.score = 0;
        this.timeLeft = 60;
        this.highScore = localStorage.getItem('shooterHighScore') || 0;
        
        // Game objects
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            width: 50,
            height: 50,
            speed: 5,
            color: '#00ff00'
        };
        
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        
        // Game timing
        this.lastTime = 0;
        this.timer = null;
        this.spawnTimer = null;
        
        // Callbacks
        this.onScoreUpdate = null;
        this.onGameOver = null;
        
        // Load background images
        this.loadBackgroundImages();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Create UI elements
        this.createUIElements();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    loadBackgroundImages() {
        // Load main background
        const bgImage = new Image();
        bgImage.onload = () => {
            this.backgroundLayers = [
                { image: bgImage, speed: 0.1, x: 0, y: 0, width: this.canvas.width, height: this.canvas.height }
            ];
        };
        bgImage.src = '../level1.png';
    }
    
    setupEventListeners() {
        // Keyboard controls
        this.keys = {};
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse controls
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState === 'playing') {
                this.shoot();
            }
        });
    }
    
    createUIElements() {
        // Create UI container if it doesn't exist
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
            uiContainer.style.zIndex = '100';
            document.body.appendChild(uiContainer);
        }
        
        // Create score display
        let scoreDisplay = document.getElementById('scoreDisplay');
        if (!scoreDisplay) {
            scoreDisplay = document.createElement('div');
            scoreDisplay.id = 'scoreDisplay';
            scoreDisplay.style.position = 'absolute';
            scoreDisplay.style.top = '20px';
            scoreDisplay.style.left = '20px';
            scoreDisplay.style.color = 'white';
            scoreDisplay.style.fontSize = '24px';
            scoreDisplay.style.fontFamily = 'Arial, sans-serif';
            scoreDisplay.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
            scoreDisplay.textContent = 'Score: 0';
            uiContainer.appendChild(scoreDisplay);
        }
        
        // Create time display
        let timeDisplay = document.getElementById('timeDisplay');
        if (!timeDisplay) {
            timeDisplay = document.createElement('div');
            timeDisplay.id = 'timeDisplay';
            timeDisplay.style.position = 'absolute';
            timeDisplay.style.top = '60px';
            timeDisplay.style.left = '20px';
            timeDisplay.style.color = 'white';
            timeDisplay.style.fontSize = '24px';
            timeDisplay.style.fontFamily = 'Arial, sans-serif';
            timeDisplay.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
            timeDisplay.textContent = 'Time: 60';
            uiContainer.appendChild(timeDisplay);
        }
    }
    
    start() {
        if (this.gameState === 'start') {
            this.gameState = 'playing';
            this.score = 0;
            this.timeLeft = 60;
            this.bullets = [];
            this.enemies = [];
            this.particles = [];
            
            // Clear any existing timers
            if (this.timer) clearInterval(this.timer);
            if (this.spawnTimer) clearInterval(this.spawnTimer);
            
            // Start game loop
            this.timer = setInterval(() => {
                this.timeLeft--;
                if (this.timeLeft <= 0) {
                    this.endGame();
                }
            }, 1000);
            
            // Start enemy spawning
            this.spawnTimer = setInterval(() => {
                this.spawnEnemy();
            }, 2000);
            
            // Start game loop
            this.gameLoop();
        }
    }
    
    endGame() {
        this.gameState = 'gameOver';
        
        // Clear timers
        if (this.timer) clearInterval(this.timer);
        if (this.spawnTimer) clearInterval(this.spawnTimer);
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('shooterHighScore', this.highScore);
        }
        
        // Call callbacks
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        if (this.onGameOver) this.onGameOver(this.score);
        
        // Show game over screen
        this.showGameOverScreen();
    }
    
    showGameOverScreen() {
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            const finalScore = document.getElementById('finalScore');
            const highScore = document.getElementById('highScore');
            
            if (finalScore) finalScore.textContent = this.score;
            if (highScore) highScore.textContent = this.highScore;
            
            gameOverScreen.classList.remove('hidden');
        }
    }
    
    spawnEnemy() {
        if (this.gameState !== 'playing') return;
        
        const enemy = {
            x: Math.random() * (this.canvas.width - 50),
            y: -50,
            width: 50,
            height: 50,
            speed: 2 + Math.random() * 3,
            color: '#ff0000'
        };
        
        this.enemies.push(enemy);
    }
    
    shoot() {
        if (this.gameState !== 'playing') return;
        
        const bullet = {
            x: this.player.x + this.player.width / 2,
            y: this.player.y,
            width: 5,
            height: 10,
            speed: 8,
            color: '#ffff00'
        };
        
        this.bullets.push(bullet);
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update player
        this.updatePlayer();
        
        // Update bullets
        this.updateBullets();
        
        // Update enemies
        this.updateEnemies();
        
        // Update particles
        this.updateParticles();
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        this.updateUI();
    }
    
    updatePlayer() {
        // Keyboard movement
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x = Math.max(0, this.player.x - this.player.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + this.player.speed);
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.y = Math.max(0, this.player.y - this.player.speed);
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.y = Math.min(this.canvas.height - this.player.height, this.player.y + this.player.speed);
        }
        
        // Mouse movement
        if (this.mouseX !== undefined && this.mouseY !== undefined) {
            this.player.x = this.mouseX - this.player.width / 2;
            this.player.y = this.mouseY - this.player.height / 2;
        }
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.y -= bullet.speed;
            
            // Remove bullets that are off screen
            if (bullet.y < 0) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.y += enemy.speed;
            
            // Remove enemies that are off screen
            if (enemy.y > this.canvas.height) {
                this.enemies.splice(i, 1);
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        // Bullet vs Enemy collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (this.isColliding(bullet, enemy)) {
                    // Remove bullet and enemy
                    this.bullets.splice(i, 1);
                    this.enemies.splice(j, 1);
                    
                    // Add score
                    this.score += 10;
                    
                    // Create explosion particles
                    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    
                    break;
                }
            }
        }
        
        // Player vs Enemy collisions
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (this.isColliding(this.player, enemy)) {
                // Game over
                this.endGame();
                break;
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30,
                color: '#ffaa00'
            });
        }
    }
    
    updateUI() {
        const scoreDisplay = document.getElementById('scoreDisplay');
        const timeDisplay = document.getElementById('timeDisplay');
        
        if (scoreDisplay) scoreDisplay.textContent = `Score: ${this.score}`;
        if (timeDisplay) timeDisplay.textContent = `Time: ${this.timeLeft}`;
        
        // Update score in game UI
        const scoreElement = document.getElementById('score');
        const timeElement = document.getElementById('time');
        
        if (scoreElement) scoreElement.textContent = this.score;
        if (timeElement) timeElement.textContent = this.timeLeft;
        
        // Call score update callback
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw game objects
        this.drawPlayer();
        this.drawBullets();
        this.drawEnemies();
        this.drawParticles();
    }
    
    drawBackground() {
        if (this.backgroundLayers && this.backgroundLayers[0] && this.backgroundLayers[0].image) {
            this.ctx.drawImage(
                this.backgroundLayers[0].image,
                0, 0, this.canvas.width, this.canvas.height
            );
        }
    }
    
    drawPlayer() {
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    }
    
    drawBullets() {
        this.ctx.fillStyle = '#ffff00';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
    }
    
    drawEnemies() {
        this.ctx.fillStyle = '#ff0000';
        this.enemies.forEach(enemy => {
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x, particle.y, 3, 3);
        });
    }
    
    gameLoop() {
        this.update();
        this.render();
        
        if (this.gameState === 'playing') {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    reset() {
        this.gameState = 'start';
        this.score = 0;
        this.timeLeft = 60;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        
        // Clear timers
        if (this.timer) clearInterval(this.timer);
        if (this.spawnTimer) clearInterval(this.spawnTimer);
        
        // Reset player position
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 100;
    }
}
