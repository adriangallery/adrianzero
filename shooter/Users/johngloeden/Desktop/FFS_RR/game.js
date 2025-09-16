class FilthyFeetGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 550;
        
        this.score = 0;
        this.timeLeft = 60;
        this.gameActive = false;
        this.feet = [];
        
        // Updated feet types based on metadata
        this.feetTypes = [
            { name: 'Light', points: 10, width: 80, height: 40, speed: 2.5, probability: 0.25 },
            { name: 'Medium', points: 10, width: 80, height: 40, speed: 2.5, probability: 0.25 },
            { name: 'Dark', points: 10, width: 80, height: 40, speed: 2.5, probability: 0.20 },
            { name: 'Ape', points: 25, width: 90, height: 45, speed: 3, probability: 0.15 },
            { name: 'Alien', points: 50, width: 90, height: 45, speed: 3.5, probability: 0.08 },
            { name: 'Zombie', points: 100, width: 100, height: 50, speed: 4, probability: 0.05 },
            { name: 'Gold', points: 200, width: 100, height: 50, speed: 5, probability: 0.02 }
        ];
        
        this.feetImages = {};
        this.cleaningEffects = [];
        this.highScore = localStorage.getItem('filthyFeetHighScore') || 0;
        
        this.init();
    }
    
    init() {
        // Load images
        this.loadImages();
        
        // Set up event listeners
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        document.getElementById('startButton').addEventListener('click', this.startGame.bind(this));
        document.getElementById('restartButton').addEventListener('click', this.startGame.bind(this));
        
        // Display start screen
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
    
    loadImages() {
        // Load actual feet images from the FFS-4200_2023 directory
        const basePath = '/Users/johngloeden/Desktop/FFS_RR/FFS-4200_2023/';
        
        // We'll load a sample of each type
        // In a real implementation, you would load all images and randomly select them
        const imagePromises = [];
        
        this.feetTypes.forEach(type => {
            this.feetImages[type.name] = {
                dirty: new Image(),
                clean: new Image() // We'll create a "cleaned" version
            };
            
            // Find a sample image for each type
            // This is a placeholder - you'll need to implement the actual loading logic
            const promise = this.loadSampleImageForType(basePath, type.name)
                .then(imagePath => {
                    return new Promise((resolve, reject) => {
                        this.feetImages[type.name].dirty.onload = resolve;
                        this.feetImages[type.name].dirty.onerror = reject;
                        this.feetImages[type.name].dirty.src = imagePath;
                    });
                })
                .then(() => {
                    // Create a "cleaned" version (lighter version of the original)
                    this.feetImages[type.name].clean = this.createCleanedVersion(this.feetImages[type.name].dirty);
                });
            
            imagePromises.push(promise);
        });
        
        // Wait for all images to load
        Promise.all(imagePromises).then(() => {
            console.log('All feet images loaded successfully');
        }).catch(error => {
            console.error('Error loading feet images:', error);
            // Fallback to colored rectangles if images fail to load
            this.createFallbackImages();
        });
    }
    
    loadSampleImageForType(basePath, typeName) {
        // This is a placeholder function
        // In a real implementation, you would read the metadata files to find images of each type
        // For now, we'll return a promise that resolves with a sample image path
        return new Promise((resolve) => {
            // Simulate loading metadata and finding an image
            // In reality, you would parse the JSON files to find images of each type
            setTimeout(() => {
                // This is just a placeholder path - you'll need to implement the actual logic
                resolve(`${basePath}sample_${typeName.toLowerCase()}.png`);
            }, 100);
        });
    }
    
    createCleanedVersion(originalImage) {
        // Create a "cleaned" version of the foot (lighter version)
        const canvas = document.createElement('canvas');
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        const ctx = canvas.getContext('2d');
        
        // Draw the original image
        ctx.drawImage(originalImage, 0, 0);
        
        // Apply a brightness filter
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Create a new image from the canvas
        const cleanedImage = new Image();
        cleanedImage.src = canvas.toDataURL();
        
        return cleanedImage;
    }
    
    createFallbackImages() {
        // Create fallback colored rectangles if images fail to load
        this.feetTypes.forEach(type => {
            // Create a color based on the type
            let color;
            switch(type.name) {
                case 'Light': color = '#FFE4C4'; break;
                case 'Medium': color = '#D2B48C'; break;
                case 'Dark': color = '#8B4513'; break;
                case 'Ape': color = '#A0522D'; break;
                case 'Alien': color = '#32CD32'; break;
                case 'Zombie': color = '#556B2F'; break;
                case 'Gold': color = '#FFD700'; break;
                default: color = '#A0522D';
            }
            
            this.feetImages[type.name] = {
                dirty: this.createFootImage(color, type.width, type.height),
                clean: this.createFootImage(this.lightenColor(color), type.width, type.height)
            };
        });
    }
    
    lightenColor(color) {
        // Simple function to lighten a hex color
        const r = parseInt(color.substr(1, 2), 16);
        const g = parseInt(color.substr(3, 2), 16);
        const b = parseInt(color.substr(5, 2), 16);
        
        const newR = Math.min(255, r + 100);
        const newG = Math.min(255, g + 100);
        const newB = Math.min(255, b + 100);
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    
    createFootImage(color, width, height) {
        // Create a foot-shaped canvas element (fallback)
        const footCanvas = document.createElement('canvas');
        footCanvas.width = width;
        footCanvas.height = height;
        const footCtx = footCanvas.getContext('2d');
        
        // Draw a foot-like shape
        footCtx.fillStyle = color;
        footCtx.beginPath();
        footCtx.ellipse(width * 0.7, height * 0.5, width * 0.3, height * 0.5, 0, 0, Math.PI * 2);
        footCtx.fill();
        
        // Draw toes
        for (let i = 0; i < 5; i++) {
            const toeSize = height * 0.2;
            const spacing = width * 0.12;
            footCtx.beginPath();
            footCtx.arc(width * 0.3 + i * spacing, height * 0.3, toeSize, 0, Math.PI * 2);
            footCtx.fill();
        }
        
        return footCanvas;
    }
    
    startGame() {
        this.score = 0;
        this.timeLeft = 60;
        this.feet = [];
        this.cleaningEffects = [];
        this.gameActive = true;
        
        document.getElementById('score').textContent = this.score;
        document.getElementById('time').textContent = this.timeLeft;
        
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('time').textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
        
        this.spawnTimer = setInterval(() => {
            this.spawnFoot();
        }, 1000);
        
        this.gameLoop();
    }
    
    spawnFoot() {
        if (!this.gameActive) return;
        
        // Use probability-based selection for foot type
        const random = Math.random();
        let cumulativeProbability = 0;
        let selectedType = this.feetTypes[0]; // Default to first type
        
        for (const type of this.feetTypes) {
            cumulativeProbability += type.probability;
            if (random <= cumulativeProbability) {
                selectedType = type;
                break;
            }
        }
        
        const foot = {
            x: Math.random() * (this.canvas.width - selectedType.width),
            y: this.canvas.height,
            width: selectedType.width,
            height: selectedType.height,
            type: selectedType.name,
            points: selectedType.points,
            speed: selectedType.speed,
            cleaned: false,
            visible: true
        };
        
        this.feet.push(foot);
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background (could be an image in a real game)
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw feet
        for (const foot of this.feet) {
            if (!foot.visible) continue;
            
            const image = foot.cleaned ? 
                this.feetImages[foot.type].clean : 
                this.feetImages[foot.type].dirty;
            
            // Draw the foot image
            if (image instanceof HTMLImageElement) {
                // If it's an actual loaded image
                this.ctx.drawImage(image, foot.x, foot.y, foot.width, foot.height);
            } else {
                // If it's a canvas (fallback)
                this.ctx.drawImage(image, foot.x, foot.y);
            }
            
            // Display points value above the foot
            if (!foot.cleaned) {
                this.ctx.fillStyle = 'white';
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 2;
                this.ctx.font = 'bold 16px Arial';
                const pointsText = `${foot.points}`;
                const textWidth = this.ctx.measureText(pointsText).width;
                const textX = foot.x + (foot.width - textWidth) / 2;
                const textY = foot.y - 10;
                
                this.ctx.strokeText(pointsText, textX, textY);
                this.ctx.fillText(pointsText, textX, textY);
            }
        }
        
        // Draw cleaning effects
        for (const effect of this.cleaningEffects) {
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${effect.alpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
    }
}