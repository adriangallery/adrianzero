// Zombie spawning + lifecycle management with 3-depth perspective
//
// Each ROW has a fixed size regardless of zombie type.
// Type still determines points, speed, sprite and tint.
//
// Canvas 960×540. Layer breakdown:
//   bg3 opaque content from canvas y=341
//   bg4 transparent fade y=324, fully opaque from y=393

export const ROWS = {
    back:  { feetY: 348, width:  70, height:  70, renderOrder: 0, weight: 40 },
    mid:   { feetY: 435, width: 115, height: 115, renderOrder: 1, weight: 35 },
    front: { feetY: 540, width: 170, height: 170, renderOrder: 2, weight: 25 }
};

export const ZOMBIE_TYPES = [
    { name: 'common', points: 10,  speed: 2.0, weight: 55, asset: 'assets/zombies/common.png' },
    { name: 'runner', points: 25,  speed: 3.2, weight: 25, asset: 'assets/zombies/runner.png' },
    { name: 'brute',  points: 50,  speed: 1.2, weight: 15, asset: 'assets/zombies/brute.png'  },
    { name: 'boss',   points: 200, speed: 0.7, weight: 5,  asset: 'assets/zombies/boss.png'   }
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
    const width  = row.width;
    const height = row.height;
    // Speed scaled by row — farther rows move slower for depth feel
    const rowSpeed = row.key === 'back' ? 0.6 : row.key === 'mid' ? 0.85 : 1.0;
    const speed = type.speed * rowSpeed;

    const image = this.zombieImages[type.name];
    const targetY = row.feetY - height;

    const zombie = {
        x: Math.random() * (this.canvas.width - width),
        y: this.canvas.height,
        width,
        height,
        type: type.name,
        row: row.key,
        renderOrder: row.renderOrder,
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
