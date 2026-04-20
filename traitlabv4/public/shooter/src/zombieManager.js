// Zombie spawning + lifecycle management

export const ZOMBIE_TYPES = [
    { name: 'common', points: 10,  width: 74,  height: 74,  speed: 2.0, yPosition: 380, weight: 55, asset: 'assets/zombies/common.png' },
    { name: 'runner', points: 25,  width: 74,  height: 74,  speed: 3.2, yPosition: 340, weight: 25, asset: 'assets/zombies/runner.png' },
    { name: 'brute',  points: 50,  width: 111, height: 111, speed: 1.2, yPosition: 300, weight: 15, asset: 'assets/zombies/brute.png'  },
    { name: 'boss',   points: 200, width: 148, height: 148, speed: 0.7, yPosition: 260, weight: 5,  asset: 'assets/zombies/boss.png'   }
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
        targetY: type.yPosition + (Math.random() * 20 - 10),
        waitTime: 1200 + Math.random() * 2500,
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
