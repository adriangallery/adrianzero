// Foot creation and management
import { createCleanedVersion } from './imageLoader.js';

export function spawnFoot() {
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
        const cleanedImage = createCleanedVersion(randomImage);
        
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
            cleanImage: cleanedImage
        };
        
        console.log(`Spawned ${metadata.footType} foot with ${metadata.points} points and speed ${metadata.speed}`);
        
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
            visible: true
        };
        
        this.feet.push(foot);
    }
}