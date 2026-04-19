// Utility functions
export function createFootImage(color, width, height) {
    const footCanvas = document.createElement('canvas');
    const footCtx = footCanvas.getContext('2d');
    
    footCanvas.width = width;
    footCanvas.height = height;
    
    // Draw foot shape
    footCtx.fillStyle = color;
    footCtx.beginPath();
    footCtx.ellipse(width * 0.5, height * 0.6, width * 0.4, height * 0.35, 0, 0, Math.PI * 2);
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

export function getColorForType(typeName) {
    switch(typeName) {
        case 'small': return '#8B4513'; // Brown
        case 'medium': return '#A0522D'; // Sienna
        case 'large': return '#CD853F'; // Peru
        default: return '#D2B48C'; // Tan
    }
}

export function lightenColor(color) {
    // Convert hex to RGB
    let r = parseInt(color.substr(1, 2), 16);
    let g = parseInt(color.substr(3, 2), 16);
    let b = parseInt(color.substr(5, 2), 16);
    
    // Lighten by 50%
    r = Math.min(255, Math.floor(r * 1.5));
    g = Math.min(255, Math.floor(g * 1.5));
    b = Math.min(255, Math.floor(b * 1.5));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}