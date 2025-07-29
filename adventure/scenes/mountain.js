// Mountain Scene - Escena de montaña
class MountainScene extends BaseScene {
    constructor() {
        super('mountain', 'Mountain');
        this.imagePath = 'scenes/images/mountain.png';
        this.overlayText = {
            title: 'Mountain Peak',
            subtitle: 'The highest point of your journey...'
        };
        console.log('MountainScene constructor called with overlayText:', this.overlayText);
    }

    setupHotspots() {
        console.log('MountainScene setupHotspots called');
        // Hotspots para la escena de montaña con temática web3
        this.hotspots = [
            // Peak - cima de la montaña
            {
                name: 'Mountain Peak',
                x: [45.0, 55.0],
                y: [15.0, 25.0],
                action: 'explore_peak',
                messages: {
                    explore: "🏔️ You've reached the peak! The view is absolutely breathtaking... and so is the gas fee!",
                    use: "🔭 You use the peak as a vantage point. You can see all the way to the next blockchain!",
                    take: "💎 You try to take the peak. It's too heavy, but you find a rare mountain NFT!",
                    inspect: "🔍 The peak is covered in ancient runes that spell out 'HODL' in binary.",
                    open: "🚪 You can't open a mountain peak, but you can open your mind to new possibilities!",
                    close: "🔒 The peak is always open. It's a public good!"
                }
            },
            // Rocks - rocas
            {
                name: 'Rocks',
                x: [25.0, 35.0],
                y: [40.0, 50.0],
                action: 'explore_rocks',
                messages: {
                    explore: "🪨 Solid rocks, as reliable as a well-audited smart contract!",
                    use: "🛠️ You use the rocks to build a small shelter. Very decentralized!",
                    take: "💎 You pick up a rock. It's a rare geological NFT!",
                    inspect: "🔍 The rocks have fossilized memes embedded in them.",
                    open: "🪨 Rocks don't open, but they do contain hidden treasures!",
                    close: "🔒 Rocks are always closed. They're immutable!"
                }
            },
            // Path - sendero
            {
                name: 'Mountain Path',
                x: [60.0, 70.0],
                y: [60.0, 70.0],
                action: 'explore_path',
                messages: {
                    explore: "🛤️ A winding path leads down the mountain. The journey is the destination!",
                    use: "🚶 You use the path to descend. Each step is a new block in the chain!",
                    take: "🛤️ You can't take the path, but you can follow it to new adventures!",
                    inspect: "🔍 The path is paved with good intentions and some lost private keys.",
                    open: "🚪 The path is always open. It's permissionless!",
                    close: "🔒 You can't close a mountain path. It's decentralized!"
                }
            },
            // Sky - cielo
            {
                name: 'Sky',
                x: [10.0, 20.0],
                y: [10.0, 20.0],
                action: 'explore_sky',
                messages: {
                    explore: "🌌 The sky is clear and full of stars. Each one could be a different token!",
                    use: "🚀 You use the sky to navigate. The stars form a constellation of crypto symbols!",
                    take: "⭐ You try to grab a star. It turns into a staking reward!",
                    inspect: "🔭 You spot a shooting star. It's actually a flash loan!",
                    open: "✨ The sky is always open. It's the ultimate open source!",
                    close: "☁️ The sky can't be closed. It's censorship-resistant!"
                }
            },
            // Trees - árboles
            {
                name: 'Trees',
                x: [75.0, 85.0],
                y: [30.0, 40.0],
                action: 'explore_trees',
                messages: {
                    explore: "🌲 Ancient trees stand tall. They've seen more market cycles than you!",
                    use: "🌳 You use the trees for shade. They provide natural cooling, like a good DeFi protocol!",
                    take: "🍃 You can't take the trees, but you can plant new ones and earn carbon credits!",
                    inspect: "🔍 The trees have QR codes carved into their bark. Each leads to a different dApp!",
                    open: "🌲 Trees don't open, but they do provide oxygen for your brain to process crypto!",
                    close: "🔒 Trees are always growing. They're unstoppable!"
                }
            }
        ];
        console.log('MountainScene hotspots configurados:', this.hotspots);
    }

    setupEventListeners() {
        const clickArea = document.getElementById('click-area-mountain');
        if (clickArea) {
            clickArea.addEventListener('click', (event) => this.handleClick(event));
        }
    }

    // Sobrescribir comandos específicos de la montaña
    handleExploreCommand(hotspot, x, y) {
        showFloatingText(hotspot.messages?.explore || `You explore the ${hotspot.name}.`, x, y);
    }

    handleUseCommand(hotspot, x, y) {
        showFloatingText(hotspot.messages?.use || `You use the ${hotspot.name}.`, x, y);
    }

    handleTakeCommand(hotspot, x, y) {
        showFloatingText(hotspot.messages?.take || `You try to take the ${hotspot.name}.`, x, y);
    }

    handleInspectCommand(hotspot, x, y) {
        showFloatingText(hotspot.messages?.inspect || `You inspect the ${hotspot.name}.`, x, y);
    }

    handleOpenCommand(hotspot, x, y) {
        showFloatingText(hotspot.messages?.open || `You try to open the ${hotspot.name}.`, x, y);
    }

    handleCloseCommand(hotspot, x, y) {
        showFloatingText(hotspot.messages?.close || `You try to close the ${hotspot.name}.`, x, y);
    }
}

// Exportar la clase
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MountainScene;
} 