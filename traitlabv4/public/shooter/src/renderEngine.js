// Rendering

import { getColorForType, lightenColor } from './utils.js';

const CANVAS_W = 960;
const CANVAS_H = 540;

export function render() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 3-row perspective: each row has its own z-index
    //   row 0 (back)  — drawn before bg3 → hidden by acid+platform
    //   row 1 (mid)   — drawn between bg3 and bg4 → wades through foreground
    //   row 2 (front) — drawn after bg4 → fully visible
    const back = [], mid = [], front = [];
    for (const z of this.zombies) {
        if (z.renderOrder === 0) back.push(z);
        else if (z.renderOrder === 1) mid.push(z);
        else front.push(z);
    }

    drawBg.call(this, 0);
    drawBg.call(this, 1);
    drawBg.call(this, 2);
    back.forEach(z => drawZombie.call(this, z));
    drawBg.call(this, 3);
    mid.forEach(z => drawZombie.call(this, z));
    drawBg.call(this, 4);
    front.forEach(z => drawZombie.call(this, z));

    renderHitEffects.call(this);
    renderHUD.call(this);

    if (this.gameActive && this.crosshairLoaded) {
        const s = 40;
        ctx.drawImage(this.crosshair, this.mouseX - s / 2, this.mouseY - s / 2, s, s);
    }

    if (!this.gameActive && this.gameStarted) renderGameOver.call(this);
    if (!this.gameStarted) renderStartScreen.call(this);
}

function drawBg(layerIndex) {
    const ctx = this.ctx;
    const layer = this.backgroundLayers[layerIndex];
    if (!layer || !layer.image) return;

    const img = layer.image;
    const aspect = img.width / img.height;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // Need enough horizontal overdraw to absorb parallax motion without exposing edges.
    // Max parallax magnitude = (cw/2) * speed * multiplier. Layer4 (speed 0.9) needs
    // the most margin, so we compute per-layer.
    const PARALLAX_MULT = 0.3;
    const maxOffset = (cw / 2) * layer.speed * PARALLAX_MULT;
    const targetWidth = cw + 2 * Math.ceil(maxOffset) + 40; // 40px safety buffer

    let drawW, drawH, drawY;

    if (layerIndex === 0) {
        // Full-canvas back wall.
        drawH = ch;
        drawW = drawH * aspect;
        if (drawW < targetWidth) { drawW = targetWidth; drawH = drawW / aspect; }
        drawY = 0;
    } else if (layerIndex === 1 || layerIndex === 2) {
        drawW = targetWidth;
        drawH = drawW / aspect;
        if (drawH < ch) { drawH = ch; drawW = drawH * aspect; }
        drawY = 0;
    } else if (layerIndex === 3) {
        drawW = targetWidth;
        drawH = ch * 0.55;
        drawY = ch - drawH;
    } else {
        // Foreground — thicker so it dominates the bottom of the scene
        drawW = targetWidth;
        drawH = ch * 0.31;
        drawY = ch - drawH;
    }

    // Clamp parallax so the image edges never come inside the canvas.
    const available = (drawW - cw) / 2;
    let parallaxX = (this.mouseX - cw / 2) * layer.speed * PARALLAX_MULT;
    if (parallaxX >  available) parallaxX =  available;
    if (parallaxX < -available) parallaxX = -available;

    const xOffset = (cw - drawW) / 2 + parallaxX;
    ctx.drawImage(img, xOffset, drawY, drawW, drawH);
}

function drawZombie(z) {
    if (!z.visible) return;
    const ctx = this.ctx;

    if (z.image) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        const filters = [];
        if (z.hitFlash > 0) {
            filters.push('brightness(1.8)', 'saturate(0)');
        } else {
            if (z.type === 'boss')   filters.push('sepia(1)', 'saturate(2.2)', 'hue-rotate(-10deg)', 'brightness(1.15)');
            if (z.type === 'runner') filters.push('hue-rotate(-40deg)', 'saturate(1.4)');
            // Depth dimming — back row deep shadow, mid slightly, front full bright
            if (z.row === 'back')      filters.push('brightness(0.55)', 'contrast(0.85)', 'blur(0.4px)');
            else if (z.row === 'mid')  filters.push('brightness(0.85)');
        }
        if (filters.length) ctx.filter = filters.join(' ');
        if (z.row === 'back')      ctx.globalAlpha = 0.85;
        else if (z.row === 'mid')  ctx.globalAlpha = 0.95;

        ctx.drawImage(z.image, z.x, z.y, z.width, z.height);
        ctx.restore();
    } else {
        ctx.fillStyle = z.killed ? lightenColor(getColorForType(z.type)) : getColorForType(z.type);
        ctx.fillRect(z.x, z.y, z.width, z.height);
    }

    if (z.pointAnimation) renderPointPopup.call(this, z);
}

function renderPointPopup(z) {
    const ctx = this.ctx;
    const progress = (Date.now() - z.pointAnimation.startTime) / z.pointAnimation.duration;
    if (progress >= 1) { z.pointAnimation = null; return; }

    const x = z.x + z.width / 2;
    const y = z.y - 16 - (progress * 40);
    const opacity = progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) : 1;
    const scale = progress < 0.3 ? 0.5 + (progress / 0.3) * 1.5 : (progress > 0.7 ? 2 - ((progress - 0.7) / 0.3) : 2);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px "Pixelify Sans", monospace';
    ctx.fillStyle = `rgba(0,0,0,${opacity * 0.7})`;
    ctx.fillText(`+${z.pointAnimation.points}`, 2, 2);
    ctx.fillStyle = `rgba(255,220,60,${opacity})`;
    ctx.fillText(`+${z.pointAnimation.points}`, 0, 0);
    ctx.restore();
}

function renderHitEffects() {
    const ctx = this.ctx;
    this.hitEffects.forEach(e => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 20, 20, ${e.alpha})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 60, ${e.alpha * 0.8})`;
        ctx.fill();
    });
}

function renderHUD() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(this.canvas.width - 210, 10, 200, 110);
    ctx.strokeStyle = '#8a1a1a';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.canvas.width - 210, 10, 200, 110);

    ctx.font = 'bold 18px "Pixelify Sans", monospace';
    ctx.fillStyle = '#ffd24a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`SCORE ${this.score}`, this.canvas.width - 200, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`TIME  ${this.timeLeft}s`, this.canvas.width - 200, 50);

    const tier = this.currentTier;
    ctx.fillStyle = tier && tier.mintable ? '#6aff6a' : '#888';
    ctx.font = 'bold 14px "Pixelify Sans", monospace';
    ctx.fillText(`TIER  ${tier ? tier.name : '—'}`, this.canvas.width - 200, 85);
    ctx.restore();
}

function renderStartScreen() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff2a2a';
    ctx.font = 'bold 52px "Pixelify Sans", monospace';
    ctx.fillText('ZOMBIE SHOOTER', this.canvas.width / 2, this.canvas.height / 2 - 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Pixelify Sans", monospace';
    ctx.fillText('Shoot zombies. Higher score = cheaper mint.', this.canvas.width / 2, this.canvas.height / 2 - 60);
    ctx.font = 'bold 16px "Pixelify Sans", monospace';
    ctx.fillStyle = '#c8c8c8';
    ctx.fillText('150 pts: Mint unlocked', this.canvas.width / 2, this.canvas.height / 2 - 20);
    ctx.fillText('600 pts: 25% off', this.canvas.width / 2, this.canvas.height / 2 + 5);
    ctx.fillText('1500 pts: 50% off', this.canvas.width / 2, this.canvas.height / 2 + 30);
    ctx.fillText('3000 pts: FREE mint', this.canvas.width / 2, this.canvas.height / 2 + 55);

    const btn = getStartBtnBounds(this.canvas);
    ctx.fillStyle = '#8a1a1a';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = '#ffd24a';
    ctx.lineWidth = 3;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Pixelify Sans", monospace';
    ctx.fillText('START', this.canvas.width / 2, btn.y + btn.h / 2);
    ctx.restore();

    this.startButtonBounds = btn;
}

function renderGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff2a2a';
    ctx.font = 'bold 44px "Pixelify Sans", monospace';
    ctx.fillText('GAME OVER', this.canvas.width / 2, 90);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Pixelify Sans", monospace';
    ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, 150);
    ctx.font = 'bold 18px "Pixelify Sans", monospace';
    ctx.fillStyle = '#ffd24a';
    ctx.fillText(`High: ${this.highScore}`, this.canvas.width / 2, 185);

    const tier = this.currentTier;
    ctx.font = 'bold 22px "Pixelify Sans", monospace';
    if (tier && tier.mintable) {
        ctx.fillStyle = '#6aff6a';
        ctx.fillText(`${tier.name} unlocked — ${tier.label}`, this.canvas.width / 2, 230);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Pixelify Sans", monospace';
        const priceLabel = tier.priceZero === '0'
            ? 'Price: FREE'
            : `Price: ${Number(tier.priceZero).toLocaleString('en-US')} ZERO`;
        ctx.fillText(priceLabel, this.canvas.width / 2, 260);
    } else {
        ctx.fillStyle = '#ff8a8a';
        ctx.fillText('Mint locked — score 150+ to unlock', this.canvas.width / 2, 240);
    }

    const btns = getGameOverBtns(this.canvas, tier && tier.mintable);
    // restart
    ctx.fillStyle = '#333';
    ctx.fillRect(btns.restart.x, btns.restart.y, btns.restart.w, btns.restart.h);
    ctx.strokeStyle = '#ffd24a';
    ctx.lineWidth = 2;
    ctx.strokeRect(btns.restart.x, btns.restart.y, btns.restart.w, btns.restart.h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px "Pixelify Sans", monospace';
    ctx.fillText('PLAY AGAIN', btns.restart.x + btns.restart.w / 2, btns.restart.y + btns.restart.h / 2);

    if (btns.mint) {
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(btns.mint.x, btns.mint.y, btns.mint.w, btns.mint.h);
        ctx.strokeStyle = '#6aff6a';
        ctx.strokeRect(btns.mint.x, btns.mint.y, btns.mint.w, btns.mint.h);
        ctx.fillStyle = '#fff';
        ctx.fillText('MINT NFT', btns.mint.x + btns.mint.w / 2, btns.mint.y + btns.mint.h / 2);
    }
    ctx.restore();

    this.gameOverBtns = btns;
}

export function getStartBtnBounds(canvas) {
    const w = 240, h = 60;
    return { x: (canvas.width - w) / 2, y: canvas.height / 2 + 100, w, h };
}

export function getGameOverBtns(canvas, canMint) {
    if (!canMint) {
        const w = 220, h = 56;
        return { restart: { x: (canvas.width - w) / 2, y: 320, w, h } };
    }
    const w = 200, h = 56;
    const gap = 20;
    const totalW = w * 2 + gap;
    const x0 = (canvas.width - totalW) / 2;
    return {
        restart: { x: x0, y: 320, w, h },
        mint:    { x: x0 + w + gap, y: 320, w, h }
    };
}

export { CANVAS_W, CANVAS_H };
