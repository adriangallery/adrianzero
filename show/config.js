/**
 * Configuration for AdrianZERO Infinite Tunnel
 */

export const CONFIG = {
    // GitHub repository configuration (same as showcase)
    githubRepo: 'adriangallery/AdrianLAB',
    githubBranch: 'd05193bc1dbc1c577c051656111a3c07281ba019',
    imagePath: 'public/rendered-toggles',
    baseImageUrl: 'https://raw.githubusercontent.com/adriangallery/AdrianLAB/d05193bc1dbc1c577c051656111a3c07281ba019/public/rendered-toggles',
    
    // Tunnel settings
    tunnel: {
        radius: 5,              // Radius of the tunnel
        segments: 32,          // Number of segments around the tunnel
        segmentLength: 10,     // Length of each segment
        numSegments: 20,       // Number of segments to keep in memory
        speed: 0.1,            // Base speed of movement
        minSpeed: 0.01,        // Minimum speed
        maxSpeed: 0.5,         // Maximum speed
        speedStep: 0.01,       // Speed increment/decrement step
    },

    // Camera settings
    camera: {
        fov: 75,
        near: 0.1,
        far: 1000,
        position: { x: 0, y: 0, z: 0 },
    },

    // Lighting
    lighting: {
        ambient: {
            color: 0xffffff,
            intensity: 0.4,
        },
        directional: {
            color: 0xffffff,
            intensity: 0.8,
            position: { x: 5, y: 5, z: 5 },
        },
        point: {
            color: 0x00D632,  // AdrianZERO green
            intensity: 0.5,
            distance: 50,
        },
    },

    // Asset loading
    assets: {
        itemsPerBatch: 50,
        cacheSize: 200,
        preloadCount: 10,
    },

    // Particle sprites (images)
    particles: {
        count: 100,              // Number of particle sprites with images
        size: 2.0,               // Size of each sprite
        minRadius: 3,            // Minimum distance from center
        maxRadius: 8,            // Maximum distance from center
        spreadZ: 200,            // Spread along Z axis
    },

    // UI settings
    ui: {
        showInfo: true,
        showControls: true,
        showInstructions: true,
        fadeInDuration: 1.0,
    },

    // Performance
    performance: {
        enableShadows: true,
        shadowMapSize: 2048,
        antialias: true,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
    },
};
