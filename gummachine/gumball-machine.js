// Gumball Machine Pixel Art Renderer
class GumballMachineRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.pixelSize = 2; // 2x2 pixels for each "pixel"
        this.colors = {
            machine: '#2a2a2a',
            metal: '#444444',
            glass: '#87CEEB',
            highlight: '#666666',
            shadow: '#1a1a1a',
            accent: '#00ff88',
            gumball1: '#ff6b6b',
            gumball2: '#4ecdc4',
            gumball3: '#45b7d1',
            gumball4: '#96ceb4',
            gumball5: '#feca57'
        };
        
        this.init();
    }
    
    init() {
        this.drawMachine();
        this.animateGumballs();
    }
    
    drawMachine() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.machine;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Main body
        this.drawRect(50, 100, 300, 400, this.colors.machine);
        this.drawRect(60, 110, 280, 380, this.colors.metal);
        
        // Top dome
        this.drawCircle(200, 120, 80, this.colors.glass);
        this.drawCircle(200, 120, 75, this.colors.machine);
        
        // Glass window
        this.drawRect(80, 200, 240, 200, this.colors.glass);
        this.drawRect(85, 205, 230, 190, this.colors.machine);
        
        // Coin slot area
        this.drawRect(320, 150, 40, 60, this.colors.metal);
        this.drawRect(325, 155, 30, 50, this.colors.shadow);
        
        // Display panel
        this.drawRect(100, 420, 200, 60, this.colors.metal);
        this.drawRect(105, 425, 190, 50, this.colors.shadow);
        
        // Control panel
        this.drawRect(120, 500, 160, 80, this.colors.metal);
        this.drawRect(125, 505, 150, 70, this.colors.shadow);
        
        // Dispenser
        this.drawRect(170, 580, 60, 20, this.colors.metal);
        this.drawRect(175, 585, 50, 10, this.colors.shadow);
        
        // Decorative elements
        this.drawDecorativeElements();
        
        // Gumballs inside
        this.drawGumballs();
    }
    
    drawDecorativeElements() {
        // Rivets
        const rivets = [
            [70, 130], [330, 130], [70, 350], [330, 350],
            [70, 450], [330, 450], [140, 520], [260, 520]
        ];
        
        rivets.forEach(([x, y]) => {
            this.drawCircle(x, y, 3, this.colors.highlight);
            this.drawCircle(x, y, 1, this.colors.shadow);
        });
        
        // Stripes
        for (let i = 0; i < 5; i++) {
            const y = 120 + i * 60;
            this.drawRect(60, y, 280, 2, this.colors.highlight);
        }
        
        // Logo area
        this.drawRect(150, 140, 100, 40, this.colors.accent);
        this.drawText('ADRIAN', 200, 160, this.colors.machine, 3);
    }
    
    drawGumballs() {
        // Random gumballs inside the machine
        const gumballColors = [this.colors.gumball1, this.colors.gumball2, this.colors.gumball3, this.colors.gumball4, this.colors.gumball5];
        
        for (let i = 0; i < 15; i++) {
            const x = 100 + Math.random() * 200;
            const y = 220 + Math.random() * 160;
            const color = gumballColors[Math.floor(Math.random() * gumballColors.length)];
            const size = 8 + Math.random() * 4;
            
            this.drawCircle(x, y, size, color);
            this.drawCircle(x - 2, y - 2, 2, this.colors.highlight);
        }
    }
    
    animateGumballs() {
        let frame = 0;
        
        const animate = () => {
            frame++;
            
            // Clear gumball area
            this.ctx.fillStyle = this.colors.machine;
            this.ctx.fillRect(85, 205, 230, 190);
            
            // Redraw gumballs with slight movement
            const gumballColors = [this.colors.gumball1, this.colors.gumball2, this.colors.gumball3, this.colors.gumball4, this.colors.gumball5];
            
            for (let i = 0; i < 15; i++) {
                const baseX = 100 + (i * 13) % 200;
                const baseY = 220 + Math.floor(i / 5) * 40;
                const x = baseX + Math.sin(frame * 0.02 + i) * 3;
                const y = baseY + Math.cos(frame * 0.015 + i) * 2;
                const color = gumballColors[i % gumballColors.length];
                const size = 8 + Math.sin(frame * 0.01 + i) * 2;
                
                this.drawCircle(x, y, size, color);
                this.drawCircle(x - 2, y - 2, 2, this.colors.highlight);
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    // Utility drawing functions
    drawRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.pixelSize, y * this.pixelSize, width * this.pixelSize, height * this.pixelSize);
    }
    
    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x * this.pixelSize, y * this.pixelSize, radius * this.pixelSize, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    
    drawText(text, x, y, color, size = 2) {
        this.ctx.fillStyle = color;
        this.ctx.font = `${size * this.pixelSize * 8}px VT323`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x * this.pixelSize, y * this.pixelSize);
    }
    
    // Animation methods for interactions
    insertCoin() {
        const coinSlot = document.querySelector('.coin-slot');
        coinSlot.classList.add('coin-inserted');
        
        setTimeout(() => {
            coinSlot.classList.remove('coin-inserted');
        }, 500);
    }
    
    dispense() {
        const dispenser = document.querySelector('.dispenser');
        dispenser.classList.add('dispenser-active');
        
        // Add dispense animation to canvas
        this.drawDispenseAnimation();
        
        setTimeout(() => {
            dispenser.classList.remove('dispenser-active');
        }, 300);
    }
    
    drawDispenseAnimation() {
        // Draw a gumball falling from dispenser
        let frame = 0;
        const animate = () => {
            frame++;
            const y = 580 + frame * 2;
            
            if (y < 650) {
                // Clear previous frame
                this.ctx.fillStyle = this.colors.machine;
                this.ctx.fillRect(170 * this.pixelSize, (y - 2) * this.pixelSize, 60 * this.pixelSize, 4 * this.pixelSize);
                
                // Draw falling gumball
                this.drawCircle(200, y, 8, this.colors.gumball1);
                this.drawCircle(198, y - 2, 2, this.colors.highlight);
                
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    // Update display elements
    updatePrice(price) {
        document.getElementById('priceDisplay').textContent = price;
    }
    
    updateStock(stock) {
        document.getElementById('stockDisplay').textContent = stock;
    }
    
    updateStatus(status) {
        document.getElementById('statusDisplay').textContent = status;
    }
}

// Initialize the renderer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gumballRenderer = new GumballMachineRenderer('gumballCanvas');
});
