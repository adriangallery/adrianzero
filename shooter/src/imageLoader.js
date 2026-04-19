// Asset loading

import { ZOMBIE_TYPES } from './zombieManager.js';
import { createZombiePlaceholder, getColorForType } from './utils.js';

export function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.warn(`Failed to load: ${src}`);
            resolve(null);
        };
        img.src = src;
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
        'assets/backgrounds/layer0.svg',
        'assets/backgrounds/layer1.svg',
        'assets/backgrounds/layer2.svg',
        'assets/backgrounds/layer3.svg',
        'assets/backgrounds/layer4.svg'
    ];
    const layers = [];
    for (let i = 0; i < paths.length; i++) {
        const image = await loadImage(paths[i]);
        layers.push({ image, speed: 0.1 + i * 0.2 });
    }
    return layers;
}
