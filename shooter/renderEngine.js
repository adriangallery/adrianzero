// Rendering logic
// Add defensive checks at the beginning of the render function
// Make sure the render function is properly exported
export function render() {
    // Check if 'this' is properly defined
    if (!this || !this.ctx) {
        console.error('Context is undefined in render function. Make sure to call render.call(game) or bind it properly.');
        return;
    }
    
    // Ensure canvas has the correct 16:9 dimensions (920x540)
    if (this.canvas.width !== 920 || this.canvas.height !== 540) {
        this.canvas.width = 920;
        this.canvas.height = 540;
        
        // Also update the CSS to ensure proper display without stretching
        this.canvas.style.width = '920px';
        this.canvas.style.height = '540px';
        this.canvas.style.margin = '0 auto';
        this.canvas.style.display = 'block';
        
        console.log('Canvas resized to 920x540 (16:9 aspect ratio)');
    }
    
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Create a sorted array of feet by layer
    const feetByLayer = {
        0: [], // Small feet (after layer 0)
        1: [], // Medium feet (after layer 1)
        2: [], // Large feet (after layer 2)
        3: []  // Xlarge feet (after layer 3)
    };
    
    // Sort feet into their respective layers
    this.feet.forEach(foot => {
        const layer = this.footLayerMapping[foot.type] || 0;
        feetByLayer[layer].push(foot);
    });
    
    // Render background layer 0 (back)
    if (this.backgroundLayers[0].image) {
        // Calculate parallax offset based on mouse position with reduced effect
        const parallaxX = (this.mouseX - (this.canvas.width / 2)) * this.backgroundLayers[0].speed * 0.6;
        
        // Calculate horizontal position to center the image
        const imageWidth = this.backgroundLayers[0].image.width * 0.5;
        const xPosition = (this.canvas.width - imageWidth) / 2 + parallaxX;
        
        // Calculate vertical position to center the image
        const imageHeight = this.backgroundLayers[0].image.height * 0.5;
        const yPosition = (this.canvas.height - imageHeight) / 2;
        
        this.ctx.drawImage(
            this.backgroundLayers[0].image,
            xPosition, 
            yPosition,
            imageWidth, 
            imageHeight
        );
    }
    
    // Render small feet (layer 0)
    feetByLayer[0].forEach(foot => renderFoot.call(this, foot));
    
    // Render background layer 1
    if (this.backgroundLayers[1].image) {
        // Calculate parallax offset based on mouse position with reduced effect
        const parallaxX = (this.mouseX - (this.canvas.width / 2)) * this.backgroundLayers[1].speed * 0.6;
        
        // Calculate horizontal position to center the image
        const imageWidth = this.backgroundLayers[1].image.width * 0.5;
        const xPosition = (this.canvas.width - imageWidth) / 2 + parallaxX;
        
        // Calculate vertical position to center the image
        const imageHeight = this.backgroundLayers[1].image.height * 0.5;
        const yPosition = (this.canvas.height - imageHeight) / 2;
        
        this.ctx.drawImage(
            this.backgroundLayers[1].image,
            xPosition, 
            yPosition,
            imageWidth, 
            imageHeight
        );
    }
    
    // Render medium feet (layer 1)
    feetByLayer[1].forEach(foot => renderFoot.call(this, foot));
    
    // Render background layer 2
    if (this.backgroundLayers[2].image) {
        // Calculate parallax offset based on mouse position with reduced effect
        const parallaxX = (this.mouseX - (this.canvas.width / 2)) * this.backgroundLayers[2].speed * 0.6;
        
        // Calculate horizontal position to center the image
        const imageWidth = this.backgroundLayers[2].image.width * 0.5;
        const xPosition = (this.canvas.width - imageWidth) / 2 + parallaxX;
        
        this.ctx.drawImage(
            this.backgroundLayers[2].image,
            xPosition, 
            this.canvas.height - (this.backgroundLayers[2].image.height * 0.5),
            imageWidth, 
            this.backgroundLayers[2].image.height * 0.5
        );
    }
    
    // Render large feet (layer 2)
    feetByLayer[2].forEach(foot => renderFoot.call(this, foot));
    
    // Render background layer 3
    if (this.backgroundLayers[3].image) {
        // Calculate parallax offset based on mouse position with reduced effect
        const parallaxX = (this.mouseX - (this.canvas.width / 2)) * this.backgroundLayers[3].speed * 0.6;
        
        // Calculate horizontal position to center the image
        const imageWidth = this.backgroundLayers[3].image.width * 0.5;
        const xPosition = (this.canvas.width - imageWidth) / 2 + parallaxX;
        
        this.ctx.drawImage(
            this.backgroundLayers[3].image,
            xPosition, 
            this.canvas.height - (this.backgroundLayers[3].image.height * 0.5),
            imageWidth, 
            this.backgroundLayers[3].image.height * 0.5
        );
    }
    
    // Render Xlarge feet (layer 3)
    feetByLayer[3].forEach(foot => renderFoot.call(this, foot));
    
    // Render background layer 4 (front)
    if (this.backgroundLayers[4].image) {
        // Calculate parallax offset based on mouse position with reduced effect
        const parallaxX = (this.mouseX - (this.canvas.width / 2)) * this.backgroundLayers[4].speed * 0.6;
        
        // Calculate horizontal position to center the image
        const imageWidth = this.backgroundLayers[4].image.width * 0.5;
        const xPosition = (this.canvas.width - imageWidth) / 2 + parallaxX;
        
        this.ctx.drawImage(
            this.backgroundLayers[4].image,
            xPosition, 
            this.canvas.height - (this.backgroundLayers[4].image.height * 0.5),
            imageWidth, 
            this.backgroundLayers[4].image.height * 0.5
        );
    }
    
    // Render cleaning effects on top of everything
    renderCleaningEffects.call(this);
    
    // Draw crosshair at mouse position
    if (this.crosshairLoaded) {
        const crosshairSize = 40; // Further reduced size
        this.ctx.drawImage(
            this.crosshair,
            this.mouseX - crosshairSize/2,
            this.mouseY - crosshairSize/2,
            crosshairSize,
            crosshairSize
        );
    }
    
    // Remove the duplicate UI in top-left (only keep the top-right one)
    // Add UI overlay - only in top right corner with better styling
    this.ctx.save();
    // Draw score panel with better visibility
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(this.canvas.width - 180, 10, 160, 100);
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.canvas.width - 180, 10, 160, 100);
    
    // Draw score text with improved styling
    this.ctx.font = 'bold 20px "Pixelify Sans", sans-serif';
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(`Score: ${this.score}`, this.canvas.width - 160, 20);
    this.ctx.fillText(`Target: ${this.targetScore || 0}`, this.canvas.width - 160, 50);
    this.ctx.fillText(`Time: ${this.timeLeft}`, this.canvas.width - 160, 80);
    this.ctx.restore();
    
    // Add game over screen overlay when game is over
    if (this.timeLeft <= 0 || this.gameOver) {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Game over text
        this.ctx.save();
        this.ctx.font = 'bold 48px "Pixelify Sans", sans-serif';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 60);
        
        // Score display
        this.ctx.font = 'bold 32px "Pixelify Sans", sans-serif';
        this.ctx.fillText(`Your score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`High score: ${this.highScore || this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
        
        // Restart button
        this.ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonX = (this.canvas.width - buttonWidth) / 2;
        const buttonY = this.canvas.height / 2 + 120;
        this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Button text
        this.ctx.font = 'bold 24px "Pixelify Sans", sans-serif';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('Play Again', this.canvas.width / 2, buttonY + buttonHeight / 2);
        
        // Store button coordinates for click detection
        this.restartButtonBounds = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };
        this.ctx.restore();
    }
}

// Helper method to render a single foot
function renderFoot(foot) {
    // Check if context exists
    if (!this || !this.ctx) {
        console.error('Context is undefined in renderFoot function');
        return;
    }
    
    if (!foot.visible) return;
    
    if (foot.image) {
        // Use the loaded image
        const img = foot.cleaned ? foot.cleanImage : foot.image;
        
        // If the image hasn't been processed for transparency yet
        if (!img.processed) {
            processImageTransparency.call(this, img);
        }
        
        this.ctx.drawImage(img, foot.x, foot.y, foot.width, foot.height);
        
        // Render point popup if foot was just cleaned
        if (foot.pointAnimation) {
            renderPointPopup.call(this, foot);
        }
    } else {
        // Use the fallback colored rectangle
        const color = foot.cleaned ? 
            this.lightenColor(this.getColorForType(foot.type)) : 
            this.getColorForType(foot.type);
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(foot.x, foot.y, foot.width, foot.height);
        
        // Render point popup if foot was just cleaned
        if (foot.pointAnimation) {
            renderPointPopup.call(this, foot);
        }
    }
}

// Add a new function to process image transparency
function processImageTransparency(img) {
    // Create a temporary canvas for processing
    const tempCanvas = document.createElement('canvas');
    const size = Math.max(img.width, img.height);
    
    // Set canvas to a square with the determined size
    tempCanvas.width = size;
    tempCanvas.height = size;
    const ctx = tempCanvas.getContext('2d');
    
    // Clear the canvas with a transparent background
    ctx.clearRect(0, 0, size, size);
    
    // Draw the loaded image centered in the canvas
    ctx.drawImage(img, 0, 0, img.width, img.height, 
                  0, 0, size, size);
    
    // Get the image data to process pixels
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    
    // Define the background colors to remove
    const targetColors = [
        { r: 4, g: 140, b: 184 },  // #048cb8
        { r: 48, g: 158, b: 199 }  // #309ec7
    ];
    const colorThreshold = 30; // Tolerance for color matching
    
    // Process each pixel
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Check if the pixel color is close to any of the target colors
        for (const color of targetColors) {
            if (
                Math.abs(r - color.r) < colorThreshold &&
                Math.abs(g - color.g) < colorThreshold &&
                Math.abs(b - color.b) < colorThreshold
            ) {
                // Make this pixel transparent
                data[i + 3] = 0;
                break;
            }
        }
    }
    
    // Put the modified image data back on the canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Update the original image with the processed version
    img.src = tempCanvas.toDataURL('image/png');
    img.processed = true;
    
    return img;
}

// Helper method to render point popup animation
function renderPointPopup(foot) {
    // Check if context exists
    if (!this || !this.ctx) {
        console.error('Context is undefined in renderPointPopup function');
        return;
    }
    
    // Calculate animation progress (0 to 1)
    const progress = (Date.now() - foot.pointAnimation.startTime) / foot.pointAnimation.duration;
    
    if (progress >= 1) {
        // Animation complete, remove it
        foot.pointAnimation = null;
        return;
    }
    
    // Calculate position (moves upward during animation)
    const x = foot.x + foot.width / 2;
    const y = foot.y - 20 - (progress * 40); // Start 20px above foot and move up 40px
    
    // Calculate opacity (fade out at the end)
    const opacity = progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) : 1;
    
    // Calculate scale (start small, get bigger, then smaller)
    let scale = 1;
    if (progress < 0.3) {
        scale = 0.5 + (progress / 0.3) * 1.5; // 0.5 to 2.0
    } else if (progress > 0.7) {
        scale = 2.0 - ((progress - 0.7) / 0.3) * 1.0; // 2.0 to 1.0
    } else {
        scale = 2.0; // Stay at max scale in the middle
    }
    
    // Draw the points text
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = 'bold 16px "Pixelify Sans", cursive';
    
    // Text shadow for better visibility
    this.ctx.fillStyle = 'rgba(0, 0, 0, ' + opacity * 0.7 + ')';
    this.ctx.fillText(`+${foot.pointAnimation.points}`, 2, 2);
    
    // Main text
    this.ctx.fillStyle = `rgba(255, 255, 0, ${opacity})`;
    this.ctx.fillText(`+${foot.pointAnimation.points}`, 0, 0);
    this.ctx.restore();
}

// Helper method to render cleaning effects
export function renderCleaningEffects() {
    // Check if context exists
    if (!this || !this.ctx) {
        console.error('Context is undefined in renderCleaningEffects function');
        return;
    }
    
    this.cleaningEffects.forEach(effect => {
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 0, 0, ${effect.alpha})`;
        this.ctx.fill();
    });
}

// Remove this standalone code at the end of the file that's causing errors
// For any other text rendering in your game
// this.ctx.font = '20px "Pixelify Sans", cursive';