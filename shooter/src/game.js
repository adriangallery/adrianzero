// Main game class

import { loadZombieImages, loadBackgroundLayers, loadImage } from './imageLoader.js';
import { spawnZombie, MOVEMENT_STATES } from './zombieManager.js';
import { render, CANVAS_W, CANVAS_H, getStartBtnBounds, getGameOverBtns } from './renderEngine.js';
import { tierForScore } from './scoreTiers.js';
import { attemptMint, onWalletChange, getAddress } from './web3.js';

class ZombieShooter {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) throw new Error('gameCanvas element not found');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = CANVAS_W;
        this.canvas.height = CANVAS_H;

        this.score = 0;
        this.timeLeft = 60;
        this.gameActive = false;
        this.gameStarted = false;
        this.zombies = [];
        this.hitEffects = [];
        this.backgroundLayers = [];
        this.zombieImages = {};
        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height / 2;
        this.highScore = parseInt(localStorage.getItem('zombieHighScore') || '0', 10);
        this.currentTier = tierForScore(0);
        this.startButtonBounds = null;
        this.gameOverBtns = null;
        this.crosshair = null;
        this.crosshairLoaded = false;
        this.isMinting = false;

        this.init();
    }

    async init() {
        this.canvas.style.cursor = 'default';

        this.crosshair = await loadImage('assets/ui/crosshair.svg');
        this.crosshairLoaded = !!this.crosshair;

        this.backgroundLayers = await loadBackgroundLayers();
        this.zombieImages = await loadZombieImages();

        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

        onWalletChange((addr) => this.updateWalletUI(addr));
        this.updateWalletUI(getAddress());

        this.renderLoop();
    }

    renderLoop() {
        if (this.gameActive) this.update();
        render.call(this);
        requestAnimationFrame(this.renderLoop.bind(this));
    }

    update() {
        const now = Date.now();
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const z = this.zombies[i];
            if (!z.visible) { this.zombies.splice(i, 1); continue; }

            if (z.hitFlash > 0) z.hitFlash--;

            switch (z.movementState) {
                case MOVEMENT_STATES.RISING:
                    z.y -= z.speed;
                    if (z.y <= z.targetY) {
                        z.y = z.targetY;
                        z.movementState = MOVEMENT_STATES.WAITING;
                        z.waitStart = now;
                    }
                    break;
                case MOVEMENT_STATES.WAITING:
                    if (now - z.waitStart >= z.waitTime) z.movementState = MOVEMENT_STATES.FALLING;
                    break;
                case MOVEMENT_STATES.FALLING:
                    z.y += z.speed * 1.6;
                    if (z.y > this.canvas.height) this.zombies.splice(i, 1);
                    break;
            }
        }

        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            const e = this.hitEffects[i];
            e.radius += 1.5;
            e.alpha -= 0.04;
            if (e.alpha <= 0 || e.radius >= e.maxRadius) this.hitEffects.splice(i, 1);
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        this.mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);

        if (!this.gameActive) {
            const btns = !this.gameStarted
                ? [this.startButtonBounds]
                : [this.gameOverBtns?.restart, this.gameOverBtns?.mint];
            const hover = btns.some(b => b && hitRect(this.mouseX, this.mouseY, b));
            this.canvas.style.cursor = hover ? 'pointer' : 'default';
        }
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

        if (!this.gameStarted) {
            if (hitRect(x, y, this.startButtonBounds)) this.startGame();
            return;
        }
        if (!this.gameActive) {
            const btns = this.gameOverBtns;
            if (!btns) return;
            if (hitRect(x, y, btns.restart)) { this.startGame(); return; }
            if (btns.mint && hitRect(x, y, btns.mint)) { this.triggerMint(); return; }
            return;
        }

        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const z = this.zombies[i];
            if (!z.visible || z.killed) continue;
            if (x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height) {
                z.killed = true;
                z.hitFlash = 3;
                this.score += z.points;
                this.currentTier = tierForScore(this.score);
                z.pointAnimation = { points: z.points, startTime: Date.now(), duration: 900 };
                this.hitEffects.push({ x: z.x + z.width / 2, y: z.y + z.height / 2, radius: 4, maxRadius: 38, alpha: 1 });
                setTimeout(() => { z.visible = false; }, 400);
                return;
            }
        }
    }

    startGame() {
        this.score = 0;
        this.timeLeft = 60;
        this.zombies = [];
        this.hitEffects = [];
        this.gameActive = true;
        this.gameStarted = true;
        this.currentTier = tierForScore(0);
        this.canvas.style.cursor = 'none';

        clearInterval(this.spawnTimer);
        clearInterval(this.timer);

        this.spawnTimer = setInterval(() => spawnZombie.call(this), 900);
        this.timer = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) this.endGame();
        }, 1000);
    }

    endGame() {
        this.gameActive = false;
        clearInterval(this.spawnTimer);
        clearInterval(this.timer);
        this.canvas.style.cursor = 'default';
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('zombieHighScore', String(this.highScore));
        }
    }

    async triggerMint() {
        if (this.isMinting) return;
        if (!this.currentTier || !this.currentTier.mintable) return;
        this.isMinting = true;
        const status = document.getElementById('mintStatus');
        const setStatus = (msg, color = '#ffd24a') => {
            if (status) { status.textContent = msg; status.style.color = color; }
        };
        try {
            setStatus('Preparing mint…');
            const result = await attemptMint(this.score, this.currentTier, setStatus);
            if (status) {
                status.innerHTML = `Minted! <a href="https://basescan.org/tx/${result.txHash}" target="_blank">view tx</a>`;
                status.style.color = '#6aff6a';
            }
        } catch (err) {
            console.error(err);
            setStatus(`Mint failed: ${err.shortMessage || err.message || err}`, '#ff8a8a');
        } finally {
            this.isMinting = false;
        }
    }

    updateWalletUI(addr) {
        const el = document.getElementById('walletAddress');
        if (!el) return;
        el.textContent = addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : 'Not connected';
    }
}

function hitRect(x, y, r) {
    if (!r) return false;
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

const game = new ZombieShooter();
export default game;
