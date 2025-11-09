// Target Rush - Game & Watch Edition
class TargetRushGame {
    constructor() {
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
        
        // Game state
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        this.gameActive = false;
        this.targets = [];
        this.particles = [];
        this.powerUps = [];
        
        // Wave system
        this.targetsInWave = 0;
        this.targetsKilledInWave = 0;
        this.waveTargetCount = 10; // Targets per wave
        
        // Spawn settings
        this.spawnTimer = null;
        this.powerUpSpawnTimer = null;
        this.spawnInterval = 2000; // ms between spawns
        this.targetSpeed = 1.5;
        this.powerUpSpawnChance = 0.15; // 15% chance per wave
        
        // Combo system
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboTimeout = 2000; // ms to maintain combo
        
        // Power-up system
        this.activePowerUps = {
            slowMotion: false,
            multiplier: 1,
            bonus: false
        };
        
        // Loaded images
        this.loadedImages = [];
        this.loadImages();
        
        this.init();
    }
    
    init() {
        // Set up canvas
        this.canvas.width = 480;
        this.canvas.height = 640;
        
        // Update UI
        this.updateUI();
    }
    
    async loadImages() {
        // Load foot images from shooter
        const imagePromises = [];
        const selectedNumbers = this.selectRandomImages(10); // Load 10 random foot images
        
        selectedNumbers.forEach((imageNumber, index) => {
            const img = new Image();
            const promise = new Promise((resolve) => {
                // Try different path formats
                const paths = [
                    `../shooter/Images/filthyfeetsecrets${imageNumber}.png`,
                    `./../shooter/Images/filthyfeetsecrets${imageNumber}.png`,
                    `/games/shooter/Images/filthyfeetsecrets${imageNumber}.png`
                ];
                
                let pathIndex = 0;
                
                const tryLoad = () => {
                    if (pathIndex < paths.length) {
                        img.src = paths[pathIndex];
                    }
                };
                
                img.onload = () => {
                    console.log(`Loaded foot image ${index + 1}/10: ${imageNumber}`);
                    resolve(img);
                };
                
                img.onerror = () => {
                    pathIndex++;
                    if (pathIndex < paths.length) {
                        tryLoad();
                    } else {
                        console.warn(`Failed to load image: ${imageNumber} (tried all paths)`);
                        resolve(null);
                    }
                };
                
                tryLoad();
            });
            imagePromises.push(promise);
        });
        
        const images = await Promise.all(imagePromises);
        this.loadedImages = images.filter(img => img !== null);
        console.log(`Successfully loaded ${this.loadedImages.length} foot images`);
    }
    
    loadPowerUpImages() {
        // Load power-up images from mcorder
        const powerUps = ['Burger', 'Coke', 'Fries', 'Nuggets'];
        powerUps.forEach(name => {
            const img = new Image();
            img.onload = () => {
                this.powerUpImages[name.toLowerCase()] = img;
                console.log(`Loaded power-up: ${name}`);
            };
            img.onerror = () => {
                console.warn(`Failed to load power-up: ${name}`);
            };
            img.src = `../mcorder/${name}.png`;
        });
    }
    
    selectRandomImages(count) {
        // Only use images that actually exist (1-25, with some missing)
        const availableImages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25];
        const selected = [];
        const used = new Set();
        
        while (selected.length < count && selected.length < availableImages.length) {
            const randomIndex = Math.floor(Math.random() * availableImages.length);
            const imageNum = availableImages[randomIndex];
            if (!used.has(imageNum)) {
                selected.push(imageNum);
                used.add(imageNum);
            }
        }
        
        return selected;
    }
    
    updateUI() {
        const scoreEl = document.getElementById('score');
        const waveEl = document.getElementById('wave');
        const livesEl = document.getElementById('lives');
        
        if (scoreEl) scoreEl.textContent = this.score;
        if (waveEl) waveEl.textContent = this.wave;
        if (livesEl) livesEl.textContent = this.lives;
    }
    
    startGame() {
        // Reset state
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        this.targets = [];
        this.particles = [];
        this.powerUps = [];
        this.targetsInWave = 0;
        this.targetsKilledInWave = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.activePowerUps = {
            slowMotion: false,
            multiplier: 1,
            bonus: false
        };
        
        this.gameActive = true;
        this.updateUI();
        
        // Start spawning
        this.startWave();
        this.gameLoop();
    }
    
    startWave() {
        this.targetsInWave = 0;
        this.targetsKilledInWave = 0;
        this.waveTargetCount = 10 + (this.wave - 1) * 5; // Increase targets per wave
        this.targetSpeed = 1.5 + (this.wave - 1) * 0.3; // Increase speed
        this.spawnInterval = Math.max(800, 2000 - (this.wave - 1) * 100); // Decrease spawn interval
        
        // Clear existing spawn timer
        if (this.spawnTimer) {
            clearInterval(this.spawnTimer);
        }
        
        // Start spawning targets
        this.spawnTarget();
        this.spawnTimer = setInterval(() => {
            if (this.targetsInWave < this.waveTargetCount) {
                this.spawnTarget();
            }
        }, this.spawnInterval);
        
        // Spawn power-up occasionally
        if (Math.random() < this.powerUpSpawnChance) {
            setTimeout(() => {
                if (this.gameActive) {
                    this.spawnPowerUp();
                }
            }, 3000 + Math.random() * 2000);
        }
    }
    
    spawnPowerUp() {
        if (!this.gameActive) return;
        
        const types = ['multiplier', 'slowMotion', 'bonus'];
        const type = types[Math.floor(Math.random() * types.length)];
        const edge = Math.floor(Math.random() * 4);
        const size = 35;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        let x, y;
        switch (edge) {
            case 0: x = Math.random() * this.canvas.width; y = -size; break;
            case 1: x = this.canvas.width + size; y = Math.random() * this.canvas.height; break;
            case 2: x = Math.random() * this.canvas.width; y = this.canvas.height + size; break;
            case 3: x = -size; y = Math.random() * this.canvas.height; break;
        }
        
        const powerUp = {
            x,
            y,
            targetX: centerX,
            targetY: centerY,
            size,
            type,
            lifetime: 0,
            maxLifetime: 8000,
            speed: 1.2,
            image: this.powerUpImages[['burger', 'coke', 'fries', 'nuggets'][Math.floor(Math.random() * 4)]]
        };
        
        this.powerUps.push(powerUp);
    }
    
    spawnTarget() {
        if (!this.gameActive) return;
        if (this.targetsInWave >= this.waveTargetCount) return;
        
        this.targetsInWave++;
        
        // Random edge: 0=top, 1=right, 2=bottom, 3=left
        const edge = Math.floor(Math.random() * 4);
        const size = 40 + Math.random() * 30; // 40-70px
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        let x, y, targetX, targetY;
        
        switch (edge) {
            case 0: // Top
                x = Math.random() * this.canvas.width;
                y = -size;
                targetX = centerX + (Math.random() - 0.5) * 100;
                targetY = centerY + (Math.random() - 0.5) * 100;
                break;
            case 1: // Right
                x = this.canvas.width + size;
                y = Math.random() * this.canvas.height;
                targetX = centerX + (Math.random() - 0.5) * 100;
                targetY = centerY + (Math.random() - 0.5) * 100;
                break;
            case 2: // Bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + size;
                targetX = centerX + (Math.random() - 0.5) * 100;
                targetY = centerY + (Math.random() - 0.5) * 100;
                break;
            case 3: // Left
                x = -size;
                y = Math.random() * this.canvas.height;
                targetX = centerX + (Math.random() - 0.5) * 100;
                targetY = centerY + (Math.random() - 0.5) * 100;
                break;
        }
        
        // Select random image
        const image = this.loadedImages.length > 0 
            ? this.loadedImages[Math.floor(Math.random() * this.loadedImages.length)]
            : null;
        
        const target = {
            x,
            y,
            targetX,
            targetY,
            size,
            image,
            lifetime: 0,
            maxLifetime: 5000 + Math.random() * 3000, // 5-8 seconds
            points: Math.floor(10 + size / 5), // Bigger = more points
            hit: false
        };
        
        this.targets.push(target);
    }
    
    handleClick(event) {
        if (!this.gameActive) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        // Check if clicked on a power-up first
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            const distance = Math.sqrt(
                Math.pow(clickX - powerUp.x, 2) + 
                Math.pow(clickY - powerUp.y, 2)
            );
            
            if (distance < powerUp.size / 2) {
                this.collectPowerUp(i);
                return;
            }
        }
        
        // Check if clicked on a target
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const target = this.targets[i];
            if (target.hit) continue;
            
            const distance = Math.sqrt(
                Math.pow(clickX - target.x, 2) + 
                Math.pow(clickY - target.y, 2)
            );
            
            if (distance < target.size / 2) {
                this.hitTarget(i);
                break; // Only hit one target per click
            }
        }
    }
    
    collectPowerUp(index) {
        const powerUp = this.powerUps[index];
        
        switch (powerUp.type) {
            case 'multiplier':
                this.activePowerUps.multiplier = 2;
                setTimeout(() => {
                    this.activePowerUps.multiplier = 1;
                }, 10000); // 10 seconds
                break;
            case 'slowMotion':
                this.activePowerUps.slowMotion = true;
                setTimeout(() => {
                    this.activePowerUps.slowMotion = false;
                }, 8000); // 8 seconds
                break;
            case 'bonus':
                this.score += 500;
                this.updateUI();
                break;
        }
        
        this.createParticles(powerUp.x, powerUp.y, powerUp.size);
        this.powerUps.splice(index, 1);
    }
    
    hitTarget(index) {
        const target = this.targets[index];
        if (target.hit) return;
        
        target.hit = true;
        
        // Update combo
        this.comboCount++;
        this.comboTimer = this.comboTimeout;
        
        // Calculate score with combo multiplier
        const comboMultiplier = Math.min(1 + this.comboCount * 0.1, 3); // Max 3x
        const powerUpMultiplier = this.activePowerUps.multiplier;
        const baseScore = target.points;
        const finalScore = Math.floor(baseScore * comboMultiplier * powerUpMultiplier);
        
        this.score += finalScore;
        this.targetsKilledInWave++;
        
        // Create particles
        this.createParticles(target.x, target.y, target.size);
        
        // Remove target
        this.targets.splice(index, 1);
        
        // Check wave completion
        if (this.targetsKilledInWave >= this.waveTargetCount && this.targets.length === 0) {
            this.completeWave();
        }
        
        this.updateUI();
    }
    
    createParticles(x, y, size) {
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                lifetime: 30,
                maxLifetime: 30,
                size: 3 + Math.random() * 3
            });
        }
    }
    
    completeWave() {
        this.wave++;
        this.comboCount = 0; // Reset combo between waves
        
        // Bonus for completing wave
        const waveBonus = this.wave * 50;
        this.score += waveBonus;
        
        this.updateUI();
        
        // Start next wave after a short delay
        setTimeout(() => {
            if (this.gameActive) {
                this.startWave();
            }
        }, 2000);
    }
    
    update() {
        if (!this.gameActive) return;
        
        const currentTime = Date.now();
        const speedMultiplier = this.activePowerUps.slowMotion ? 0.5 : 1;
        
        // Update power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            
            const dx = powerUp.targetX - powerUp.x;
            const dy = powerUp.targetY - powerUp.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                powerUp.x += (dx / distance) * powerUp.speed * speedMultiplier;
                powerUp.y += (dy / distance) * powerUp.speed * speedMultiplier;
            }
            
            powerUp.lifetime += 16;
            if (powerUp.lifetime >= powerUp.maxLifetime || distance < 5) {
                this.powerUps.splice(i, 1);
            }
        }
        
        // Update targets
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const target = this.targets[i];
            
            if (target.hit) {
                this.targets.splice(i, 1);
                continue;
            }
            
            // Move towards target position
            const dx = target.targetX - target.x;
            const dy = target.targetY - target.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                target.x += (dx / distance) * this.targetSpeed * speedMultiplier;
                target.y += (dy / distance) * this.targetSpeed * speedMultiplier;
            }
            
            // Update lifetime
            target.lifetime += 16; // ~60fps
            
            // Remove if lifetime expired or reached center
            if (target.lifetime >= target.maxLifetime || distance < 5) {
                // Target reached center - lose a life
                if (distance < 5) {
                    this.lives--;
                    this.comboCount = 0; // Reset combo
                    this.updateUI();
                    
                    if (this.lives <= 0) {
                        this.endGame();
                        return;
                    }
                }
                
                this.targets.splice(i, 1);
                
                // Check if wave should end
                if (this.targetsKilledInWave >= this.waveTargetCount && this.targets.length === 0) {
                    this.completeWave();
                }
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.lifetime--;
            
            if (particle.lifetime <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= 16;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = 'rgba(200, 216, 174, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw center zone (danger area)
        this.ctx.strokeStyle = 'rgba(229, 62, 62, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 50, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw power-ups
        this.powerUps.forEach(powerUp => {
            this.ctx.save();
            this.ctx.translate(powerUp.x, powerUp.y);
            
            // Pulsing effect
            const pulse = Math.sin(Date.now() / 200) * 0.1 + 1;
            const size = powerUp.size * pulse;
            
            if (powerUp.image) {
                this.ctx.drawImage(powerUp.image, -size / 2, -size / 2, size, size);
            } else {
                this.ctx.fillStyle = '#f6d10c';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.strokeStyle = '#1a1a1a';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.restore();
        });
        
        // Draw targets
        this.targets.forEach(target => {
            if (target.hit) return;
            
            this.ctx.save();
            this.ctx.translate(target.x, target.y);
            
            if (target.image && target.image.complete && target.image.naturalWidth > 0) {
                // Draw image
                const size = target.size;
                this.ctx.drawImage(target.image, -size / 2, -size / 2, size, size);
            } else {
                // Fallback circle with gradient
                const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, target.size / 2);
                gradient.addColorStop(0, '#ff6b6b');
                gradient.addColorStop(1, '#e53e3e');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, target.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Draw outline
            this.ctx.strokeStyle = '#1a1a1a';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, target.size / 2, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.restore();
        });
        
        // Draw particles
        this.particles.forEach(particle => {
            const alpha = particle.lifetime / particle.maxLifetime;
            this.ctx.fillStyle = `rgba(246, 209, 12, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw combo indicator
        if (this.comboCount > 1) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 10, 150, 40);
            this.ctx.fillStyle = '#f6d10c';
            this.ctx.font = 'bold 12px "Press Start 2P"';
            this.ctx.fillText(`COMBO x${this.comboCount.toFixed(1)}`, 15, 30);
        }
    }
    
    gameLoop() {
        if (!this.gameActive) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    endGame() {
        this.gameActive = false;
        
        if (this.spawnTimer) {
            clearInterval(this.spawnTimer);
        }
        
        // Save high score
        const highScore = localStorage.getItem('targetRushHighScore') || 0;
        if (this.score > highScore) {
            localStorage.setItem('targetRushHighScore', this.score);
        }
        
        // Show game over (simple alert for now)
        setTimeout(() => {
            alert(`Game Over!\nScore: ${this.score}\nWave: ${this.wave}\nHigh Score: ${Math.max(this.score, highScore)}`);
        }, 100);
    }
    
    resetGame() {
        this.gameActive = false;
        
        if (this.spawnTimer) {
            clearInterval(this.spawnTimer);
        }
        
        this.targets = [];
        this.particles = [];
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        
        this.updateUI();
    }
}

// Create and export game instance
const game = new TargetRushGame();
export default game;

