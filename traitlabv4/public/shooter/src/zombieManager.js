// Zombie spawning + lifecycle management

// Canvas is 960×540. After background analysis:
//   bg3's first acid wave runs canvas y=341-379
//   bg3's dark platform (solid) runs y=379-502   ← zombies here = invisible
//   bg4 foreground strip runs y=400-540
// So zombies' feet must rest at GROUND_Y ≈ 380 to land on the acid-wave band,
// with their torso/head sticking up over y=341 (visible LAB background).
const GROUND_Y = 380;

export const ZOMBIE_TYPES = [
    { name: 'common', points: 10,  width: 100, height: 100, speed: 2.0, yPosition: GROUND_Y - 100, weight: 55, asset: 'assets/zombies/common.png' },
    { name: 'runner', points: 25,  width: 100, height: 100, speed: 3.2, yPosition: GROUND_Y - 100, weight: 25, asset: 'assets/zombies/runner.png' },
    { name: 'brute',  points: 50,  width: 140, height: 140, speed: 1.2, yPosition: GROUND_Y - 140, weight: 15, asset: 'assets/zombies/brute.png'  },
    { name: 'boss',   points: 200, width: 180, height: 180, speed: 0.7, yPosition: GROUND_Y - 180, weight: 5,  asset: 'assets/zombies/boss.png'   }
];

export const MOVEMENT_STATES = {
    RISING:  'rising',
    WAITING: 'waiting',
    FALLING: 'falling'
};

function pickWeightedType() {
    const total = ZOMBIE_TYPES.reduce((s, t) => s + t.weight, 0);
    let r = Math.random() * total;
    for (const t of ZOMBIE_TYPES) {
        if (r < t.weight) return t;
        r -= t.weight;
    }
    return ZOMBIE_TYPES[0];
}

export function spawnZombie() {
    if (!this.gameActive) return;

    const type = pickWeightedType();
    const image = this.zombieImages[type.name];

    const zombie = {
        x: Math.random() * (this.canvas.width - type.width),
        y: this.canvas.height,
        width: type.width,
        height: type.height,
        type: type.name,
        points: type.points,
        speed: type.speed,
        killed: false,
        visible: true,
        image,
        movementState: MOVEMENT_STATES.RISING,
        targetY: type.yPosition + (Math.random() * 12 - 6),
        waitTime: 800 + Math.random() * 1200,
        waitStart: 0,
        hitFlash: 0
    };

    this.zombies.push(zombie);
}

export function layerFor(typeName) {
    switch (typeName) {
        case 'common': return 1;
        case 'runner': return 2;
        case 'brute':  return 3;
        case 'boss':   return 3;
        default:       return 1;
    }
}
