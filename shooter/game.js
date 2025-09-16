// Import modules
import { createUIElements } from './gameUI.js';
import { loadImages, selectRandomImages, findImageForType, createCleanedVersion } from './imageLoader.js';
import { spawnFoot } from './footManager.js';
import { render, renderCleaningEffects } from './renderEngine.js';
import { createFootImage, getColorForType, lightenColor } from './utils.js';
import { updateGameOverScreen, showScreen } from './gameUI.js';

class FilthyFeetGame {
    // Add this method to the FilthyFeetGame class
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    // Call this method in the constructor
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
        
        // Add background layers for parallax effect
        this.backgroundLayers = [
            { image: null, speed: 0.1, x: 0 },   // Layer 0 (back)
            { image: null, speed: 0.3, x: 0 },   // Layer 1
            { image: null, speed: 0.5, x: 0 },   // Layer 2
            { image: null, speed: 0.7, x: 0 },   // Layer 3 (front)
            { image: null, speed: 0.9, x: 0 }    // Layer 4 (very front)
        ];
        
        // Define which layer each foot type appears in
        this.footLayerMapping = {
            'small': 0,    // Small feet appear after layer 0
            'medium': 1,   // Medium feet appear after layer 1
            'large': 2,    // Large feet appear after layer 2
            'Xlarge': 3    // Xlarge feet appear after layer 3
        };
        
        // Track mouse position for parallax
        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height / 2;
        
        // Add properties for foot movement behavior
        this.footMovementStates = {
            RISING: 'rising',
            WAITING: 'waiting',
            FALLING: 'falling'
        };
        
        // Define which layer each foot appears in (randomly assigned)
        this.footLayers = [1, 2]; // Feet can appear between layers 1 and 2
        
        this.score = 0;
        this.timeLeft = 60;
        this.gameActive = false;
        this.feet = [];
        this.feetTypes = [
            { name: 'small', points: 10, width: 60, height: 60, speed: 3, yPosition: 112 },
            { name: 'medium', points: 20, width: 80, height: 80, speed: 2, yPosition: 205 },
            { name: 'large', points: 30, width: 100, height: 100, speed: 1, yPosition: 275 },
            { name: 'Xlarge', points: 40, width: 120, height: 120, speed: 0.5, yPosition: 350 }
        ];
        
        this.feetImages = {
            small: { dirty: null, clean: null },
            medium: { dirty: null, clean: null },
            large: { dirty: null, clean: null },
            Xlarge: { dirty: null, clean: null }
        };
        
        this.cleaningEffects = [];
        this.highScore = localStorage.getItem('filthyFeetHighScore') || 0;
        
        // Add a property to store our 20 selected image numbers
        this.selectedImageNumbers = [];
        
        this.init();
    }
    
    // In the init method of FilthyFeetGame class
    init() {
    // Load background images
    this.loadBackgroundImages();
    
    // Set custom cursor
    this.canvas.style.cursor = 'none'; // Hide the default cursor
    this.loadCrosshair(); // Load the custom crosshair
    
    // Add mouse move event listener for parallax
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
        // Select 20 random images from the 4200 available
        this.selectRandomImages();
        
        // Load images
        this.loadImages();
        
        // Set up event listeners for the canvas
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        
        // Create UI elements if they don't exist
        this.createUIElements();
        
        // Set up event listeners for buttons
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', this.startGame.bind(this));
        }
        
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.addEventListener('click', this.startGame.bind(this));
        }
        
        // Display start screen
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        
        if (startScreen) {
            startScreen.classList.remove('hidden');
        }
        if (gameOverScreen) {
            gameOverScreen.classList.add('hidden');
        }
    }
    
    // Add this new method to load and display the crosshair
    loadCrosshair() {
        this.crosshair = new Image();
        this.crosshair.src = './Images/crosshair.png';
        this.crosshairLoaded = false;
        this.crosshair.onload = () => {
            this.crosshairLoaded = true;
            console.log('Crosshair loaded');
        };
    }
    
    // Delegate to imported modules
    createUIElements() {
        createUIElements.call(this);
    }
    
    selectRandomImages() {
        this.selectedImageNumbers = selectRandomImages();
    }
    
    async loadMetadata() {
        console.log("Loading metadata from local JSON file");
        try {
            // Updated to use the new Metadata.json file
            const response = await fetch('./Images/Metadata.json');
            if (!response.ok) {
                throw new Error(`Failed to load metadata: ${response.status}`);
            }
            
            const text = await response.text();
            // Fix potential JSON syntax errors
            const cleanedText = text.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
            
            try {
                const data = JSON.parse(cleanedText);
                // Check if data is an object with an array property
                let collection = [];
                
                if (Array.isArray(data)) {
                    collection = data;
                } else if (data && typeof data === 'object') {
                    // Try to find an array property in the object
                    for (const key in data) {
                        if (Array.isArray(data[key]) && data[key].length > 0) {
                            collection = data[key];
                            break;
                        }
                    }
                }
                
                console.log(`Successfully loaded metadata for ${collection.length} tokens`);
                return collection;
            } catch (error) {
                console.error(`JSON parse error: ${error.message}`);
                return this.createFallbackCollection();
            }
        } catch (error) {
            console.error('Error loading metadata from JSON file:', error);
            console.log("Falling back to hardcoded metadata");
            return this.createFallbackCollection();
        }
    }
    
    // Update the code that's using collection.find
    // Around line 240-242
    loadRandomTokens(count) {
        const tokens = [];
        const availableTokens = [...this.tokens]; // Create a copy of the tokens array
        
        // Instead of using collection.find, use array methods to find tokens
        for (let i = 0; i < count && availableTokens.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableTokens.length);
            const token = availableTokens.splice(randomIndex, 1)[0]; // Remove and get the token
            
            if (token) {
                token.visible = true;
                token.hit = false;
                this.positionToken(token);
                tokens.push(token);
            }
        }
        
        return tokens;
    }
    
    // Helper method to create a fallback collection
    createFallbackCollection() {
        console.log("Using fallback foot type mapping");
        
        // Create a simplified mapping of foot types to their properties
        const footTypes = [
            { type: "Gold", points: 200, speed: 1 },
            { type: "Zombie", points: 100, speed: 1.5 },
            { type: "Alien", points: 50, speed: 2 },
            { type: "Ape", points: 25, speed: 2.5 },
            { type: "Dark", points: 15, speed: 2.8 },
            { type: "Medium", points: 12, speed: 3 },
            { type: "Light", points: 10, speed: 3 },
            { type: "Albino", points: 10, speed: 3 }
        ];
        
        // Create a collection with entries for all possible image numbers (1-4200)
        const collection = [];
        for (let i = 1; i <= 4200; i++) {
            // Assign a random foot type for each image
            const randomFootType = footTypes[Math.floor(Math.random() * footTypes.length)];
            
            collection.push({
                name: `FilthyFeetSecrets${i}`,
                image: `filthyfeetsecrets${i}.png`,
                attributes: [
                    {
                        trait_type: "Foot",
                        value: randomFootType.type
                    }
                ],
                metadata: {
                    points: randomFootType.points,
                    speed: randomFootType.speed
                }
            });
        }
        
        return collection;
    }
    
    // Helper method to get points based on foot type
    getPointsForFootType(metadata) {
        // Find the Foot trait
        const footTrait = metadata.attributes?.find(attr => attr.trait_type === 'Foot');
        const footType = footTrait?.value || 'Light';
        
        // Assign points based on foot type
        switch(footType) {
            case 'Gold':
                return 200;
            case 'Zombie':
                return 100;
            case 'Alien':
                return 50;
            case 'Ape':
                return 25;
            case 'Dark':
                return 15;
            case 'Medium':
                return 12;
            case 'Light':
            case 'Albino':
            default:
                return 10;
        }
    }
    
    // Helper method to get speed based on foot type
    getSpeedForFootType(metadata) {
        // Find the Foot trait
        const footTrait = metadata.attributes?.find(attr => attr.trait_type === 'Foot');
        const footType = footTrait?.value || 'Light';
        
        // Assign speed based on foot type
        switch(footType) {
            case 'Gold':
                return 1;
            case 'Zombie':
                return 1.5;
            case 'Alien':
                return 2;
            case 'Ape':
                return 2.5;
            case 'Dark':
                return 2.8;
            case 'Medium':
                return 3;
            case 'Light':
            case 'Albino':
            default:
                return 3;
        }
    }
    
    // Helper method to create a fallback entry
    createFallbackEntry(imageNumber) {
        // Create a simplified mapping of foot types to their properties
        const footTypes = [
            { type: "Gold", points: 200, speed: 1 },
            { type: "Zombie", points: 100, speed: 2 },
            { type: "Alien", points: 50, speed: 2.5 },
            { type: "Ape", points: 25, speed: 2.8 },
            { type: "Dark", points: 10, speed: 3 },
            { type: "Medium", points: 10, speed: 3 },
            { type: "Light", points: 10, speed: 3 },
            { type: "Albino", points: 10, speed: 3 }
        ];
        
        // Choose a random foot type
        const randomFootType = footTypes[Math.floor(Math.random() * footTypes.length)];
        
        return {
            name: `FilthyFeetSecrets${imageNumber}`,
            image: `filthyfeetsecrets${imageNumber}.png`,
            attributes: [
                {
                    trait_type: "Foot",
                    value: randomFootType.type
                }
            ],
            metadata: {
                points: randomFootType.points,
                speed: randomFootType.speed
            }
        };
    }
    
    // Then update the loadImages method to use the metadata
    loadImages() {
        // First load the metadata
        this.loadMetadata().then(collection => {
            // We'll load images for each selected image number
            const imagePromises = [];
            
            // Load all 20 selected images
            this.selectedImageNumbers.forEach((imageNumber, index) => {
                // Find the metadata for this image number
                let imageMetadata = null;
                
                // Make sure collection is an array before using find
                if (Array.isArray(collection)) {
                    imageMetadata = collection.find(item => {
                        if (!item || !item.name) return false;
                        // Extract the number from the name (e.g., "FilthyFeetSecrets42" -> 42)
                        const nameNumber = parseInt(item.name.replace('FilthyFeetSecrets', ''));
                        return nameNumber === imageNumber;
                    });
                }
                
                // If no metadata found, use fallback
                if (!imageMetadata) {
                    console.log(`No metadata found for image ${imageNumber}, using fallback`);
                    imageMetadata = this.createFallbackEntry(imageNumber);
                }
                
                // Determine the file extension based on metadata
                let fileExtension = 'png'; // Default to png
                
                if (imageMetadata && imageMetadata.properties && 
                    imageMetadata.properties.files && 
                    imageMetadata.properties.files.length > 0) {
                    const fileUri = imageMetadata.properties.files[0].uri;
                    if (fileUri.endsWith('.gif')) {
                        fileExtension = 'gif';
                    }
                }
                
                // Fix the path to use correct capitalization and file extension
                const imagePath = `./Images/filthyfeetsecrets${imageNumber}.${fileExtension}`;
                
                // Rest of your code for determining foot type, points, etc.
                let footType = 'Light';
                let points = 10;
                let speed = 3;
                
                if (imageMetadata) {
                    // Find the Foot trait
                    const footTrait = imageMetadata.attributes.find(attr => 
                        attr.trait_type === 'Foot');
                    
                    if (footTrait) {
                        footType = footTrait.value;
                        
                        // Assign points and speed based on foot type
                        switch(footType) {
                            case 'Gold':
                                points = 200;
                                speed = 1;
                                break;
                            case 'Zombie':
                                points = 100;
                                speed = 1.5;
                                break;
                            case 'Alien':
                                points = 50;
                                speed = 2;
                                break;
                            case 'Ape':
                                points = 25;
                                speed = 2.5;
                                break;
                            case 'Dark':
                                points = 15;
                                speed = 2.8;
                                break;
                            case 'Medium':
                                points = 12;
                                speed = 3;
                                break;
                            case 'Light':
                            case 'Albino':
                            default:
                                points = 10;
                                speed = 3;
                                break;
                        }
                    }
                }
                
                // Create an image object for this image
                const img = new Image();
                
                // Store metadata with the image
                img.metadata = {
                    footType: footType,
                    points: points,
                    speed: speed,
                    imageNumber: imageNumber
                };
                
                const promise = new Promise((resolve, reject) => {
                    img.onload = () => {
                        console.log(`Loaded image ${index + 1}/20: ${imagePath} (${footType}, ${points} points)`);
                        resolve(img);
                    };
                    img.onerror = () => {
                        console.warn(`Failed to load image: ${imagePath}`);
                        resolve(null); // Resolve with null to continue loading other images
                    };
                    img.src = imagePath;
                });
                
                imagePromises.push(promise);
            });
            
            // Wait for all images to load
            Promise.all(imagePromises)
                .then(images => {
                    // Filter out any null images (failed to load)
                    this.loadedImages = images.filter(img => img !== null);
                    console.log(`Successfully loaded ${this.loadedImages.length} out of 20 images`);
                    
                    // If we have at least one image, we can start the game
                    if (this.loadedImages.length > 0) {
                        console.log('All feet images loaded successfully');
                    } else {
                        console.warn('No images loaded, using fallback images');
                        // Create fallback images for each foot type
                        this.feetTypes.forEach(type => {
                            this.feetImages[type.name] = {
                                dirty: this.createFootImage(this.getColorForType(type.name), type.width, type.height),
                                clean: this.createFootImage(this.lightenColor(this.getColorForType(type.name)), type.width, type.height)
                            };
                        });
                    }
                })
                .catch(error => {
                    console.error('Error loading feet images:', error);
                });
        }).catch(error => {
            console.error('Error in metadata loading:', error);
        });
    }
    
    // Update the spawnFoot method to use the metadata stored with each image
    spawnFoot() {
        if (!this.gameActive) return;
        
        const typeIndex = Math.floor(Math.random() * this.feetTypes.length);
        const type = this.feetTypes[typeIndex];
        
        // Use a random loaded image if available
        if (this.loadedImages && this.loadedImages.length > 0) {
            const randomImageIndex = Math.floor(Math.random() * this.loadedImages.length);
            const randomImage = this.loadedImages[randomImageIndex];
            
            // Use the metadata stored with the image
            const metadata = randomImage.metadata || {
                footType: 'Default',
                points: type.points,
                speed: type.speed,
                imageNumber: 0
            };
            
            // Create a cleaned version of the image
            const cleanedImage = this.createCleanedVersion(randomImage);
            
            // Create the foot object with metadata from the image
            const foot = {
                x: Math.random() * (this.canvas.width - type.width),
                y: this.canvas.height,
                width: type.width,
                height: type.height,
                type: type.name,
                points: metadata.points,
                speed: metadata.speed,
                footType: metadata.footType,
                cleaned: false,
                visible: true,
                image: randomImage,
                cleanImage: cleanedImage,
                // Add movement state properties
                movementState: this.footMovementStates.RISING,
                targetY: type.yPosition, // Use the specific yPosition for this type
                waitTime: 1000 + Math.random() * 3000, // Random wait time between 1-4 seconds
                waitStart: 0
            };
            
            this.feet.push(foot);
        } else {
            // Fallback to using the default images
            const foot = {
                x: Math.random() * (this.canvas.width - type.width),
                y: this.canvas.height,
                width: type.width,
                height: type.height,
                type: type.name,
                points: type.points,
                speed: type.speed,
                footType: 'Default',
                cleaned: false,
                visible: true,
                // Add movement state properties
                movementState: this.footMovementStates.RISING,
                targetY: type.yPosition, // Use the specific yPosition for this type
                waitTime: 1000 + Math.random() * 3000, // Random wait time between 1-4 seconds
                waitStart: 0
            };
            
            this.feet.push(foot);
        }
    }
    
    // Fix the render method implementation
    render() {
    // Don't call the imported render function here
    // This method will be called by the gameLoop
    }
    
    createCleanedVersion(img) {
    return createCleanedVersion(img);
    }
    
    createFootImage(color, width, height) {
    return createFootImage(color, width, height);
    }
    
    getColorForType(typeName) {
    return getColorForType(typeName);
    }
    
    lightenColor(color) {
    return lightenColor(color);
    }
    
    endGame() {
        this.gameActive = false;
        clearInterval(this.timer);
        clearInterval(this.spawnTimer);
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('filthyFeetHighScore', this.highScore);
        }
        
        // Update the hidden elements that store the values
        const finalScoreElement = document.getElementById('finalScore');
        const highScoreElement = document.getElementById('highScore');
        
        if (finalScoreElement) {
            finalScoreElement.textContent = this.score;
        }
        
        if (highScoreElement) {
            highScoreElement.textContent = this.highScore;
        }
        
        // Update and show game over screen
        updateGameOverScreen(this.score, this.highScore);
        showScreen('gameOverScreen');
    }
    
    handleClick(event) {
        if (!this.gameActive) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Check if game is over and restart button is clicked
        if ((this.timeLeft <= 0 || this.gameOver) && this.restartButtonBounds) {
            if (x >= this.restartButtonBounds.x && 
                x <= this.restartButtonBounds.x + this.restartButtonBounds.width &&
                y >= this.restartButtonBounds.y && 
                y <= this.restartButtonBounds.y + this.restartButtonBounds.height) {
                // Reset game
                this.resetGame();
                return;
            }
        }
        
        for (let i = this.feet.length - 1; i >= 0; i--) {
            const foot = this.feet[i];
            
            if (foot.visible && !foot.cleaned &&
                x >= foot.x && x <= foot.x + foot.width &&
                y >= foot.y && y <= foot.y + foot.height) {
                
                // Mark as cleaned
                foot.cleaned = true;
                
                // Add points
                this.score += foot.points;
                document.getElementById('score').textContent = this.score;
                
                // Add point animation
                foot.pointAnimation = {
                    points: foot.points,
                    startTime: Date.now(),
                    duration: 1000 // Animation lasts 1 second
                };
                
                // Add cleaning effect
                this.cleaningEffects.push({
                    x: foot.x + foot.width / 2,
                    y: foot.y + foot.height / 2,
                    radius: 5,
                    maxRadius: 30,
                    alpha: 1
                });
                
                // Remove foot after a short delay
                setTimeout(() => {
                    foot.visible = false;
                }, 500);
                
                // Only clean one foot per click
                break;
            }
        }
    }
    
    startGame() {
        // Reset game state
        this.score = 0;
        this.timeLeft = 60;
        this.gameActive = true;
        this.feet = [];
        this.cleaningEffects = [];
        
        // Update UI
        document.getElementById('score').textContent = this.score;
        document.getElementById('time').textContent = this.timeLeft;
        
        // Hide screens
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        // Start game loop
        this.gameLoop();
        
        // Start spawning feet
        this.spawnTimer = setInterval(() => {
            this.spawnFoot();
        }, 1000);
        
        // Start countdown timer
        this.timer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('time').textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    // Inside the FilthyFeetGame class
    gameLoop() {
        if (!this.gameActive) return;
        
        this.update();
        // Call the imported render function directly here
        render.call(this);
        
        // Use bind to preserve the this context for the next animation frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    update() {
        // Add this line to define currentTime
        const currentTime = Date.now();
        
        // Update feet positions
        for (let i = this.feet.length - 1; i >= 0; i--) {
            const foot = this.feet[i];
            
            if (!foot.visible) {
                // Remove invisible feet
                this.feet.splice(i, 1);
                continue;
            }
            
            // Handle different movement states
            switch (foot.movementState) {
                case this.footMovementStates.RISING:
                    // Move foot upward
                    foot.y -= foot.speed;
                    
                    // Check if reached target position
                    if (foot.y <= foot.targetY) {
                        foot.y = foot.targetY; // Ensure it stops exactly at target
                        foot.movementState = this.footMovementStates.WAITING;
                        foot.waitStart = currentTime;
                    }
                    break;
                    
                case this.footMovementStates.WAITING:
                    // Check if wait time is over
                    if (currentTime - foot.waitStart >= foot.waitTime) {
                        foot.movementState = this.footMovementStates.FALLING;
                    }
                    break;
                    
                case this.footMovementStates.FALLING:
                    // Move foot downward
                    foot.y += foot.speed * 1.5; // Fall faster than rising
                    
                    // Remove feet that have moved off the bottom of the screen
                    if (foot.y > this.canvas.height) {
                        this.feet.splice(i, 1);
                    }
                    break;
            }
        }
        
        // Update cleaning effects
        for (let i = this.cleaningEffects.length - 1; i >= 0; i--) {
            const effect = this.cleaningEffects[i];
            
            effect.radius += 1;
            effect.alpha -= 0.05;
            
            if (effect.alpha <= 0 || effect.radius >= effect.maxRadius) {
                this.cleaningEffects.splice(i, 1);
            }
        }
    }
    
    // Helper method to get foot type from metadata
    getFootTypeFromMetadata(imageMetadata) {
        if (!imageMetadata || !imageMetadata.attributes) {
            return 'Light';
        }
        
        // Find the Foot trait
        const footTrait = imageMetadata.attributes.find(attr => 
            attr.trait_type === 'Foot');
        
        return footTrait?.value || 'Light';
    }
    
    // Add these methods inside the class
    // In the loadBackgroundImages method
    loadBackgroundImages() {
        // Load 5 background layers (0.png through 4.png)
        for (let i = 0; i <= 4; i++) {
            const img = new Image();
            img.src = `./Images/${i}.png`;
            img.onerror = () => {
                console.error(`Failed to load background layer ${i}`);
            };
            img.onload = () => {
                console.log(`Loaded background layer ${i}: ${img.width}x${img.height}`);
                this.backgroundLayers[i].image = img;
                
                // Force a render after all images are loaded
                if (i === 4) {
                    this.render();
                }
            };
        }
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
    }

    // Add resetGame method inside the class
    resetGame() {
        this.score = 0;
        this.timeLeft = 60;
        this.feet = [];
        this.gameOver = false;
        
        // Start spawning feet again
        this.startGame();
    }
}

// Create and export the game instance
const game = new FilthyFeetGame();
export default game;