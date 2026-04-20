// Zombie spawning + lifecycle management with 3-depth perspective

// Canvas is 960×540. Background breakdown:
//   bg3 acid wave  → canvas y=341-379   (translucent)
//   bg3 platform   → canvas y=379-502   (solid dark)
//   bg4 foreground → canvas y=400-540   (solid)
// We spawn zombies at three depths. Each row anchors feet at a different
// y and applies a scale so farther rows look smaller.
//
//   BACK : small, drawn BEFORE bg3 → emerges from the far acid wave
//   MID  : medium, drawn BETWEEN bg3 and bg4 → wades through mid ground
//   FRONT: full size, drawn AFTER bg4 → fully in front of everything

export const ROWS = {
    back:  { feetY: 358, scale: 0.42, renderOrder: 0, weight: 40 },
    mid:   { feetY: 405, scale: 0.75, renderOrder: 1, weight: 35 },
    front: { feetY: 535, scale: 1.20, renderOrder: 2, weight: 25 }
};

export const ZOMBIE_TYPES = [
    { name: 'common', points: 10,  baseWidth: 100, baseHeight: 100, speed: 2.0, weight: 55, asset: 'assets/zombies/common.png' },
    { name: 'runner', points: 25,  baseWidth: 100, baseHeight: 100, speed: 3.2, weight: 25, asset: 'assets/zombies/runner.png' },
    { name: 'brute',  points: 50,  baseWidth: 140, baseHeight: 140, speed: 1.2, weight: 15, asset: 'assets/zombies/brute.png'  },
    { name: 'boss',   points: 200, baseWidth: 180, baseHeight: 180, speed: 0.7, weight: 5,  asset: 'assets/zombies/boss.png'   }
];

export const MOVEMENT_STATES = {
    RISING:  'rising',
    WAITING: 'waiting',
    FALLING: 'falling'
};

function weightedPick(items) {
    const total = items.reduce((s, t) => s + t.weight, 0);
    let r = Math.random() * total;
    for (const t of items) {
        if (r < t.weight) return t;
        r -= t.weight;
    }
    return items[0];
}

function pickRow() {
    const arr = [
        { key: 'back',  ...ROWS.back  },
        { key: 'mid',   ...ROWS.mid   },
        { key: 'front', ...ROWS.front }
    ];
    return weightedPick(arr);
}

export function spawnZombie() {
    if (!this.gameActive) return;

    const type = weightedPick(ZOMBIE_TYPES);
    const row  = pickRow();
    const width  = Math.round(type.baseWidth  * row.scale);
    const height = Math.round(type.baseHeight * row.scale);
    const speed  = type.speed * (0.7 + row.scale * 0.5); // farther = a bit slower

    const image = this.zombieImages[type.name];
    const targetY = (row.feetY - height) + (Math.random() * 8 - 4);

    const zombie = {
        x: Math.random() * (this.canvas.width - width),
        y: this.canvas.height,
        width,
        height,
        type: type.name,
        row: row.key,
        renderOrder: row.renderOrder,
        scale: row.scale,
        points: type.points,
        speed,
        killed: false,
        visible: true,
        image,
        movementState: MOVEMENT_STATES.RISING,
        targetY,
        waitTime: 800 + Math.random() * 1200,
        waitStart: 0,
        hitFlash: 0
    };

    this.zombies.push(zombie);
}
