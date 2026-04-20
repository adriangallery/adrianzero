// Asset loading

import { ZOMBIE_TYPES } from './zombieManager.js';
import { createZombiePlaceholder, getColorForType } from './utils.js';
import { CONFIG } from './config.js';

function assetUrl(path) {
    if (/^https?:\/\//.test(path)) return path;
    const base = CONFIG.assetBaseUrl || '';
    return base + path;
}

export function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.warn(`Failed to load: ${src}`);
            resolve(null);
        };
        img.src = assetUrl(src);
    });
}

export async function loadZombieImages() {
    const images = {};
    for (const type of ZOMBIE_TYPES) {
        const img = await loadImage(type.asset);
        images[type.name] = img || createZombiePlaceholder(getColorForType(type.name), type.width, type.height);
    }
    return images;
}

export async function loadBackgroundLayers() {
    const paths = [
        'assets/backgrounds/layer0.png',
        'assets/backgrounds/layer1.png',
        'assets/backgrounds/layer2.png',
        'assets/backgrounds/layer3.png',
        'assets/backgrounds/layer4.png'
    ];
    const layers = [];
    for (let i = 0; i < paths.length; i++) {
        const image = await loadImage(paths[i]);
        layers.push({ image, speed: 0.1 + i * 0.2 });
    }
    return layers;
}
