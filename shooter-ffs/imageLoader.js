// Image loading logic
import { createFootImage, getColorForType, lightenColor } from './utils.js';

export function selectRandomImages() {
    const totalImages = 4200;
    const imagesToSelect = 20;
    const selectedNumbers = new Set();
    
    // Keep selecting random numbers until we have 20 unique ones
    while(selectedNumbers.size < imagesToSelect) {
        const randomNumber = Math.floor(Math.random() * totalImages) + 1;
        selectedNumbers.add(randomNumber);
    }
    
    // Convert the Set to an Array and return it
    const selectedNumbersArray = Array.from(selectedNumbers);
    console.log("Selected 20 random images:", selectedNumbersArray);
    return selectedNumbersArray;
}

export function findImageForType(metadata, typeName) {
    // Randomly select one of our 20 pre-selected image numbers
    const randomIndex = Math.floor(Math.random() * this.selectedImageNumbers.length);
    const imageNumber = this.selectedImageNumbers[randomIndex];
    
    // Use image number as-is, no leading zeros
    const imagePath = `./images/filthyfeetsecrets${imageNumber}.png`;
    
    console.log(`Using image: ${imagePath} (${randomIndex + 1}/20)`);
    
    // Since metadata loading failed, use hardcoded values based on image number ranges
    let footType = 'Light'; // Default
    let points = 10; // Default
    let speed = 2; // Default
    
    // Assign foot type and points based on image number ranges
    if (imageNumber >= 3500) {
        footType = 'Gold';
        points = 200;
        speed = 1;
    } else if (imageNumber >= 2800) {
        footType = 'Zombie';
        points = 100;
        speed = 1.5;
    } else if (imageNumber >= 2100) {
        footType = 'Alien';
        points = 50;
        speed = 2;
    } else if (imageNumber >= 1400) {
        footType = 'Ape';
        points = 25;
        speed = 2.5;
    } else if (imageNumber >= 700) {
        footType = 'Dark';
        points = 10;
        speed = 3;
    } else {
        footType = 'Light';
        points = 10;
        speed = 3;
    }
    
    return Promise.resolve({
        path: imagePath,
        metadata: {
            footType: footType,
            points: points,
            speed: speed,
            imageNumber: imageNumber
        }
    });
}

export function loadImages() {
    // We'll load images for each selected image number
    const imagePromises = [];
    
    // Load all 20 selected images
    this.selectedImageNumbers.forEach((imageNumber, index) => {
        // Use image number as-is, no leading zeros
        const imagePath = `./images/filthyfeetsecrets${imageNumber}.png`;
        
        // Determine foot type and points based on image number
        let footType = 'Light';
        let points = 10;
        let speed = 2;
        
        if (imageNumber >= 3500) {
            footType = 'Gold';
            points = 200;
            speed = 1;
        } else if (imageNumber >= 2800) {
            footType = 'Zombie';
            points = 100;
            speed = 1.5;
        } else if (imageNumber >= 2100) {
            footType = 'Alien';
            points = 50;
            speed = 2;
        } else if (imageNumber >= 1400) {
            footType = 'Ape';
            points = 25;
            speed = 2.5;
        } else if (imageNumber >= 700) {
            footType = 'Dark';
            points = 10;
            speed = 3;
        } else {
            footType = 'Light';
            points = 10;
            speed = 3;
        }
        
        // Create an image object for this image
        const img = new Image();
        const promise = new Promise((resolve, reject) => {
            img.onload = () => {
                console.log(`Loaded image ${index + 1}/20: ${imagePath}`);
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
                        dirty: createFootImage(getColorForType(type.name), type.width, type.height),
                        clean: createFootImage(lightenColor(getColorForType(type.name)), type.width, type.height)
                    };
                });
            }
        })
        .catch(error => {
            console.error('Error loading feet images:', error);
        });
}

export function createCleanedVersion(img) {
    // Create a canvas to draw the cleaned version
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match the image
    canvas.width = img.width || 100;
    canvas.height = img.height || 50;
    
    // Draw the original image
    if (img.complete) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
        // If image isn't loaded yet, just create a blue rectangle
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Apply a "cleaned" effect - brighten and add a blue tint
    ctx.fillStyle = 'rgba(100, 200, 255, 0.5)';
    ctx.globalCompositeOperation = 'lighten';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create a new image from the canvas
    const cleanedImg = new Image();
    cleanedImg.src = canvas.toDataURL();
    
    return cleanedImg;
}