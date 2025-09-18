// Mountain Scene - Escena de montaña (Patient Zero Rehabilitation Clinic)
class MountainScene extends BaseScene {
    constructor() {
        super('mountain', 'Patient Zero Rehabilitation Clinic');
        this.imagePath = 'scenes/images/mountain.png';
        this.overlayText = {
            title: 'Patient Zero Rehabilitation Clinic',
            subtitle: 'Where wallets go to recover from memecoin season...'
        };
        console.log('MountainScene constructor called with overlayText:', this.overlayText);
    }

    setupHotspots() {
        console.log('MountainScene setupHotspots called');
        // Hotspots para la clínica de rehabilitación con temática web3
        this.hotspots = [
            // Clinic Sign - letrero de la clínica
            {
                name: 'Clinic Sign',
                x: [13.1, 43.1],
                y: [77.1, 77.7],
                action: 'read_sign',
                messages: {
                    explore: "🏥 You see the ominous sign: 'Patient Zero Rehabilitation Clinic'. Where they send wallets that went too deep into memecoin season.",
                    use: "📖 You read the sign carefully. The fine print mentions 'No refunds, no regrets, only recovery'.",
                    take: "🚫 You can't take the sign, but you can take a screenshot for your portfolio losses.",
                    inspect: "🔍 The sign has a QR code that leads to a support group for rekt traders.",
                    open: "📋 The sign doesn't open, but it opens your eyes to the reality of crypto addiction.",
                    close: "🚪 You can't close the sign, but you can close your trading app."
                }
            },
            // Winding Path - sendero serpenteante
            {
                name: 'Winding Path',
                x: [69.2, 82.7],
                y: [58.8, 96.2],
                action: 'follow_path',
                messages: {
                    explore: "🛤️ A long winding path leads to the clinic. A long journey ahead. Hope you've got stamina... and a decent gas allowance.",
                    use: "🚶 You use the path to approach the clinic. Each step feels like another failed trade.",
                    take: "🛤️ You can't take the path, but you can follow it to recovery... or more losses.",
                    inspect: "🔍 The path is paved with broken dreams and empty wallets. Some say you can still hear the sound of liquidations.",
                    open: "🚪 The path is always open. It's a one-way road to financial therapy.",
                    close: "🔒 You can't close the path, but you can close your positions."
                }
            },
            // Clinic Lights - luces de la clínica
            {
                name: 'Clinic Lights',
                x: [84.1, 84.1],
                y: [40.3, 40.3],
                action: 'observe_lights',
                messages: {
                    explore: "💡 The lights are on in the clinic. But are they expecting you? Or just logging every approach?",
                    use: "🔦 You use the lights to signal for help. Maybe they'll give you a discount on therapy.",
                    take: "💡 You can't take the lights, but you can take their advice on risk management.",
                    inspect: "🔍 The lights flicker like unstable protocols. Reality here is barely forked.",
                    open: "💡 The lights don't open, but they do illuminate your poor trading decisions.",
                    close: "🔒 You can't close the lights, but you can close your leverage positions."
                }
            },
            // Tree Line - línea de árboles
            {
                name: 'Tree Line',
                x: [60.0, 60.0],
                y: [71.4, 71.4],
                action: 'observe_trees',
                messages: {
                    explore: "🌲 Something's moving in the shadows of the trees... could be a dev debugging or just your paranoia.",
                    use: "🌳 You use the trees for cover. Maybe the clinic staff won't see you coming.",
                    take: "🍃 You can't take the trees, but you can take shelter under them while you reconsider your life choices.",
                    inspect: "🔍 The trees whisper forgotten secrets about the patients who never returned from the clinic.",
                    open: "🌲 The trees don't open, but they do provide a natural barrier from the outside world.",
                    close: "🔒 You can't close the trees, but you can close your eyes and pretend this is all a bad dream."
                }
            },
            // Mountain Sky - cielo de la montaña
            {
                name: 'Mountain Sky',
                x: [18.8, 64.2],
                y: [25.6, 32.7],
                action: 'observe_sky',
                messages: {
                    explore: "🌌 Clouds shift like unstable protocols in the mountain sky. Reality here is barely forked.",
                    use: "☁️ You use the sky to navigate. The clouds form patterns that look suspiciously like candlestick charts.",
                    take: "⭐ You try to grab a cloud. It turns into a vaporware token.",
                    inspect: "🔭 You spot a shooting star. It's actually a flash loan gone wrong.",
                    open: "✨ The sky is always open. It's the ultimate open source, unlike some closed protocols.",
                    close: "☁️ The sky can't be closed. It's censorship-resistant, unlike some centralized exchanges."
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