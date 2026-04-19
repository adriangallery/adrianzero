// Utility helpers

export function getColorForType(typeName) {
    switch (typeName) {
        case 'common': return '#5a7a3a';
        case 'runner': return '#8a4a3a';
        case 'brute':  return '#5a3a6a';
        case 'boss':   return '#c8a24a';
        default:       return '#888888';
    }
}

export function lightenColor(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 0xff) + 60);
    const g = Math.min(255, ((n >> 8) & 0xff) + 60);
    const b = Math.min(255, (n & 0xff) + 60);
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

export function createZombiePlaceholder(color, w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    const img = new Image();
    img.src = c.toDataURL();
    return img;
}

export function formatEth(wei) {
    if (typeof wei !== 'bigint') wei = BigInt(wei);
    const whole = wei / 10n ** 18n;
    const frac = (wei % 10n ** 18n).toString().padStart(18, '0').slice(0, 4);
    return `${whole}.${frac}`;
}
