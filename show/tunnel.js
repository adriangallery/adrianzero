/**
 * AdrianZERO Infinite Tunnel
 * 3D tunnel experience using three.js and GSAP
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from './config.js';

class InfiniteTunnel {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.tunnelSegments = [];
        this.currentZ = 0;
        this.speed = CONFIG.tunnel.speed;
        this.isPaused = false;
        this.assets = [];
        this.textureCache = new Map();
        this.textureLoader = new THREE.TextureLoader(); // Initialize texture loader once
        this.currentTraitIndex = 0;
        this.animationId = null;
        this.particles = null;
        this.particleSystem = null;
        this.particleSprites = []; // Array of sprites with images
        
        this.init();
    }

    async init() {
        try {
            // Setup Three.js
            this.setupScene();
            this.setupCamera();
            this.setupRenderer();
            this.setupLighting();
            this.setupControls();
            
            // Load assets
            await this.loadAssets();
            
            // Create tunnel
            this.createTunnel();
            
            // Create particles (sprites with images)
            await this.createParticles();
            
            // Setup UI
            this.setupUI();
            
            // Start animation
            this.animate();
            
            // Hide loading screen
            this.hideLoading();
        } catch (error) {
            console.error('Error initializing tunnel:', error);
            this.showError('Failed to initialize tunnel. Please refresh.');
        }
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.Fog(0x000000, 10, 200);
    }

    setupCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.camera.fov,
            aspect,
            CONFIG.camera.near,
            CONFIG.camera.far
        );
        this.camera.position.set(
            CONFIG.camera.position.x,
            CONFIG.camera.position.y,
            CONFIG.camera.position.z
        );
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: CONFIG.performance.antialias,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(CONFIG.performance.pixelRatio);
        
        if (CONFIG.performance.enableShadows) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        const container = document.getElementById('container');
        container.appendChild(this.renderer.domElement);
        
        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(
            CONFIG.lighting.ambient.color,
            CONFIG.lighting.ambient.intensity
        );
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(
            CONFIG.lighting.directional.color,
            CONFIG.lighting.directional.intensity
        );
        directionalLight.position.set(
            CONFIG.lighting.directional.position.x,
            CONFIG.lighting.directional.position.y,
            CONFIG.lighting.directional.position.z
        );
        if (CONFIG.performance.enableShadows) {
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = CONFIG.performance.shadowMapSize;
            directionalLight.shadow.mapSize.height = CONFIG.performance.shadowMapSize;
        }
        this.scene.add(directionalLight);
        
        // Point light (accent color)
        const pointLight = new THREE.PointLight(
            CONFIG.lighting.point.color,
            CONFIG.lighting.point.intensity,
            CONFIG.lighting.point.distance
        );
        pointLight.position.set(0, 0, 0);
        this.scene.add(pointLight);
        this.pointLight = pointLight;
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 20;
        this.controls.maxPolarAngle = Math.PI / 2.2; // Prevent going below tunnel
        this.controls.minPolarAngle = Math.PI / 3; // Prevent going too high
    }

    async loadAssets() {
        // DEBUG: Using local images from components/images/ instead of GitHub
        try {
            // List of local images from components/images/ folder
            const localImages = [
                '10000.gif', '10001.gif', '10002.gif', '10003.gif', '10004.gif', '10005.gif',
                '10007.gif', '10007.png', '10008.gif', '10009.gif', '10010.gif', '10011.gif',
                '10012.gif', '10013.gif', '1011.png', '150.png', '15009.png', '15010.png',
                '262144.gif', '262145.gif', '262146.gif', '262147.gif', '559.png', '595.png',
                '983.png', '989.png', 'ADRIAN_Coin_Back.gif', 'ADRIAN_Coin.gif',
                'ADRIAN_ZERO_Banner.gif', 'adrianlogo.png', 'adrianzero.png', 'bereal.png',
                'com1.png', 'com2.png', 'com3.png', 'com4.png', 'comrades.gif', 'glasses.png',
                'hellowenlogo.png', 'pumpkin.gif'
            ];
            
            // Create image files array with local paths (relative from show/ folder)
            const imageFiles = localImages.map(fileName => ({
                name: fileName,
                url: `../components/images/${fileName}`,
                path: `../components/images/${fileName}`
            }));
            
            this.assets = imageFiles;
            console.log(`✅ Loaded ${this.assets.length} assets from local components/images/ folder`);
            
            if (this.assets.length === 0) {
                console.warn('No assets loaded, using placeholder');
                this.assets = [{
                    name: 'placeholder',
                    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzAwRDM2MiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QURSSUFOWkVSTzwvdGV4dD48L3N2Zz4='
                }];
            } else {
                // Preload first batch of textures
                await this.preloadTextures(0, CONFIG.assets.preloadCount);
            }
            
            /* COMENTADO: Carga desde GitHub para debug
            // Load image list - try GitHub API first, fallback to alternative method
            // Try GitHub API - if 403, generate file list from known pattern
            const apiUrl = `https://api.github.com/repos/${CONFIG.githubRepo}/contents/${CONFIG.imagePath}?ref=${CONFIG.githubBranch}`;
            console.log('🔍 Loading assets from:', apiUrl);
            
            let response = await fetch(apiUrl);
            
            // If 403, handle gracefully - tunnel will be invisible, only stars visible
            if (!response.ok && response.status === 403) {
                console.warn('⚠️ GitHub API returned 403 (rate limit or access denied)');
                console.warn('💡 Tunnel structure will be hidden, only stars visible');
                // Set empty assets - tunnel will be invisible, only particles (stars) will show
                this.assets = [];
                return;
            }
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            
            const files = await response.json();
            
            // Check if files is an array (same validation as showcase)
            if (!Array.isArray(files)) {
                console.error('❌ GitHub API returned non-array:', files);
                console.error('Response type:', typeof files);
                console.error('Response keys:', files ? Object.keys(files) : 'null');
                throw new Error('Invalid response format from GitHub API');
            }
            
            // Filter PNG files (same as showcase)
            const allPngFiles = files.filter(file => file.name && file.name.endsWith('.png'));
            
            const imageFiles = allPngFiles.map(file => ({
                name: file.name,
                url: `${CONFIG.baseImageUrl}/${file.name}`,
                path: file.path
            }));
            
            this.assets = imageFiles;
            console.log(`✅ Loaded ${this.assets.length} assets from ${allPngFiles.length} PNG files`);
            */
        } catch (error) {
            console.error('Error loading assets:', error);
            // Use placeholder if loading fails
            this.assets = [{
                name: 'placeholder',
                url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzAwRDM2MiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QURSSUFOWkVSTzwvdGV4dD48L3N2Zz4='
            }];
        }
    }

    async preloadTextures(startIndex, count) {
        const endIndex = Math.min(startIndex + count, this.assets.length);
        const promises = [];
        
        for (let i = startIndex; i < endIndex; i++) {
            if (!this.textureCache.has(this.assets[i].url)) {
                promises.push(this.loadTexture(this.assets[i].url));
            }
        }
        
        await Promise.all(promises);
    }

    loadTexture(url) {
        // Always return a Promise for consistency
        return new Promise((resolve, reject) => {
            // Check cache first
            if (this.textureCache.has(url)) {
                const cachedTexture = this.textureCache.get(url);
                resolve(cachedTexture);
                return;
            }
            
            // Ensure textureLoader is initialized
            if (!this.textureLoader) {
                this.textureLoader = new THREE.TextureLoader();
            }
            
            // Load texture
            this.textureLoader.load(
                url,
                (texture) => {
                    if (texture) {
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.minFilter = THREE.LinearFilter;
                        texture.magFilter = THREE.LinearFilter;
                        this.textureCache.set(url, texture);
                        resolve(texture);
                    } else {
                        reject(new Error('Texture loaded but is null'));
                    }
                },
                undefined, // onProgress
                (error) => {
                    console.warn('Error loading texture:', url, error);
                    reject(error);
                }
            );
        });
    }

    createTunnel() {
        // Tunnel is now hidden - only particle sprites with images are visible
        // Keep this method for compatibility but don't create any segments
        const { numSegments, segmentLength } = CONFIG.tunnel;
        this.currentZ = numSegments * segmentLength;
    }

    async createParticles() {
        const particleCount = CONFIG.particles.count;
        this.particleSprites = [];
        
        // If no assets loaded, create placeholder sprites
        if (this.assets.length === 0) {
            console.warn('No assets loaded, creating placeholder sprites');
            return;
        }
        
        // Create sprites with images
        for (let i = 0; i < particleCount; i++) {
            // Select an asset (cycle through available assets)
            const assetIndex = i % this.assets.length;
            const asset = this.assets[assetIndex];
            
            // Load texture for this sprite
            let texture = this.textureCache.get(asset.url);
            if (!texture) {
                try {
                    texture = await this.loadTexture(asset.url);
                } catch (error) {
                    console.warn(`Failed to load texture for ${asset.name}:`, error);
                    continue; // Skip this sprite if texture fails to load
                }
            }
            
            // Create sprite material
            const spriteMaterial = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                opacity: 1.0,
                depthTest: true,
                depthWrite: false,
            });
            
            // Create sprite
            const sprite = new THREE.Sprite(spriteMaterial);
            
            // Set sprite size
            sprite.scale.set(CONFIG.particles.size, CONFIG.particles.size, 1);
            
            // Random position in tunnel
            const angle = Math.random() * Math.PI * 2;
            const radius = CONFIG.particles.minRadius + 
                          Math.random() * (CONFIG.particles.maxRadius - CONFIG.particles.minRadius);
            sprite.position.x = Math.cos(angle) * radius;
            sprite.position.y = (Math.random() - 0.5) * 20;
            sprite.position.z = Math.random() * CONFIG.particles.spreadZ - CONFIG.particles.spreadZ / 2;
            
            // Store asset index for recycling
            sprite.userData.assetIndex = assetIndex;
            sprite.userData.originalZ = sprite.position.z;
            
            this.particleSprites.push(sprite);
            this.scene.add(sprite);
        }
        
        console.log(`✅ Created ${this.particleSprites.length} particle sprites with images`);
    }

    createTunnelSegment(z) {
        const { radius, segments, segmentLength } = CONFIG.tunnel;
        
        // Create tube geometry
        const curve = new THREE.LineCurve3(
            new THREE.Vector3(0, 0, z),
            new THREE.Vector3(0, 0, z + segmentLength)
        );
        
        const geometry = new THREE.TubeGeometry(
            curve,
            segments,
            radius,
            segments,
            false
        );
        
        // Get texture for this segment
        const assetIndex = Math.floor(z / segmentLength) % this.assets.length;
        const texture = this.getTextureForSegment(assetIndex);
        
        // Create material - completely invisible when no texture (only show stars/particles)
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.BackSide, // Inside of tunnel
            emissive: 0x000000,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: texture ? 1.0 : 0.0, // Completely invisible if no texture
            visible: texture !== null && texture !== undefined, // Only visible when texture exists
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = z;
        mesh.userData.assetIndex = assetIndex;
        mesh.userData.z = z;
        
        return mesh;
    }

    getTextureForSegment(assetIndex) {
        if (this.assets.length === 0) return null;
        
        const asset = this.assets[assetIndex % this.assets.length];
        const texture = this.textureCache.get(asset.url);
        
        if (texture) {
            return texture;
        }
        
        // Load texture if not cached
        this.loadTexture(asset.url).then((loadedTexture) => {
            // Update material when texture loads
            this.tunnelSegments.forEach(segment => {
                if (segment.userData.assetIndex === assetIndex) {
                    segment.material.map = loadedTexture;
                    segment.material.opacity = 1.0;
                    segment.material.visible = true;
                    segment.material.needsUpdate = true;
                }
            });
        }).catch(() => {});
        
        // Return placeholder or null
        return null;
    }

    updateTunnel() {
        if (this.isPaused) return;
        
        const { segmentLength, numSegments } = CONFIG.tunnel;
        const moveDistance = this.speed;
        
        // Move camera forward
        this.camera.position.z += moveDistance;
        this.currentZ += moveDistance;
        
        // Update point light position with smooth animation
        if (typeof gsap !== 'undefined') {
            gsap.to(this.pointLight.position, {
                z: this.camera.position.z,
                duration: 0.1,
                ease: 'power2.out'
            });
            
            // Update point light intensity based on speed
            const intensity = CONFIG.lighting.point.intensity * (0.5 + this.speed / CONFIG.tunnel.maxSpeed * 0.5);
            gsap.to(this.pointLight, {
                intensity: intensity,
                duration: 0.3,
                ease: 'power2.out'
            });
        } else {
            // Fallback if GSAP not loaded
            this.pointLight.position.z = this.camera.position.z;
        }
        
        // Update particle sprites
        if (this.particleSprites && this.particleSprites.length > 0) {
            this.particleSprites.forEach((sprite) => {
                // Move sprite backward
                sprite.position.z -= moveDistance;
                
                // If sprite is behind camera, recycle it forward with a new image
                if (sprite.position.z < this.camera.position.z - 50) {
                    // Move sprite forward
                    sprite.position.z = this.camera.position.z + 100 + Math.random() * 50;
                    
                    // Assign a new random image from assets
                    if (this.assets.length > 0) {
                        const newAssetIndex = Math.floor(Math.random() * this.assets.length);
                        const newAsset = this.assets[newAssetIndex];
                        
                        // Load new texture
                        this.loadTexture(newAsset.url).then((texture) => {
                            if (texture && sprite.material) {
                                sprite.material.map = texture;
                                sprite.material.needsUpdate = true;
                                sprite.userData.assetIndex = newAssetIndex;
                                
                                // Update current trait info
                                this.updateTraitInfo(newAsset);
                            }
                        }).catch(() => {
                            // If texture fails to load, keep current texture
                        });
                    }
                    
                    // Reposition sprite in circular pattern
                    const angle = Math.random() * Math.PI * 2;
                    const radius = CONFIG.particles.minRadius + 
                                  Math.random() * (CONFIG.particles.maxRadius - CONFIG.particles.minRadius);
                    sprite.position.x = Math.cos(angle) * radius;
                    sprite.position.y = (Math.random() - 0.5) * 20;
                }
            });
        }
        
        // Preload textures for upcoming sprites
        if (this.assets.length > 0) {
            const upcomingAssetIndex = Math.floor(Math.random() * this.assets.length);
            if (upcomingAssetIndex < this.assets.length) {
                this.preloadTextures(upcomingAssetIndex, CONFIG.assets.preloadCount);
            }
        }
    }

    updateTraitInfo(asset) {
        if (!asset) return;
        
        const nameElement = document.getElementById('currentTraitName');
        const infoElement = document.getElementById('currentTraitInfo');
        
        if (nameElement) {
            const newName = asset.name.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '').toUpperCase();
            if (nameElement.textContent !== newName) {
                // Animate text change with GSAP
                if (typeof gsap !== 'undefined') {
                    gsap.to(nameElement, {
                        opacity: 0,
                        duration: 0.2,
                        onComplete: () => {
                            nameElement.textContent = newName;
                            gsap.to(nameElement, {
                                opacity: 1,
                                duration: 0.3
                            });
                        }
                    });
                } else {
                    nameElement.textContent = newName;
                }
            }
        }
        
        if (infoElement) {
            infoElement.textContent = `Exploring trait collection`;
        }
    }

    setupUI() {
        // Pause/Play button
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }
        
        // Speed controls
        const speedUpBtn = document.getElementById('speedUpBtn');
        const speedDownBtn = document.getElementById('speedDownBtn');
        const speedDisplay = document.getElementById('speedDisplay');
        
        if (speedUpBtn) {
            speedUpBtn.addEventListener('click', () => this.adjustSpeed(1));
        }
        
        if (speedDownBtn) {
            speedDownBtn.addEventListener('click', () => this.adjustSpeed(-1));
        }
        
        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
        
        // Scroll to adjust speed
        window.addEventListener('wheel', (e) => {
            if (e.deltaY > 0) {
                this.adjustSpeed(-1);
            } else {
                this.adjustSpeed(1);
            }
        }, { passive: true });
        
        // Update speed display
        this.updateSpeedDisplay();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.querySelector('.icon').textContent = this.isPaused ? '▶' : '⏸';
        }
    }

    adjustSpeed(direction) {
        const step = CONFIG.tunnel.speedStep;
        const newSpeed = this.speed + (direction * step);
        this.speed = Math.max(
            CONFIG.tunnel.minSpeed,
            Math.min(CONFIG.tunnel.maxSpeed, newSpeed)
        );
        this.updateSpeedDisplay();
    }

    updateSpeedDisplay() {
        const speedDisplay = document.getElementById('speedDisplay');
        if (speedDisplay) {
            // Show speed as multiplier of base speed
            const baseSpeed = CONFIG.tunnel.speed;
            const multiplier = (this.speed / baseSpeed).toFixed(1);
            speedDisplay.textContent = `${multiplier}x`;
        }
    }

    reset() {
        // Animate camera reset with GSAP
        if (typeof gsap !== 'undefined') {
            gsap.to(this.camera.position, {
                x: CONFIG.camera.position.x,
                y: CONFIG.camera.position.y,
                z: CONFIG.camera.position.z,
                duration: 1.5,
                ease: 'power2.inOut'
            });
            
            // Animate speed reset
            gsap.to(this, {
                speed: CONFIG.tunnel.speed,
                duration: 0.5,
                ease: 'power2.out',
                onUpdate: () => this.updateSpeedDisplay()
            });
            
            // Reset particle sprites positions
            if (this.particleSprites && this.particleSprites.length > 0) {
                this.particleSprites.forEach((sprite) => {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = CONFIG.particles.minRadius + 
                                  Math.random() * (CONFIG.particles.maxRadius - CONFIG.particles.minRadius);
                    const z = Math.random() * CONFIG.particles.spreadZ - CONFIG.particles.spreadZ / 2;
                    
                    gsap.to(sprite.position, {
                        x: Math.cos(angle) * radius,
                        y: (Math.random() - 0.5) * 20,
                        z: z,
                        duration: 1.5,
                        ease: 'power2.inOut'
                    });
                });
            }
        } else {
            // Fallback if GSAP not loaded
            this.camera.position.set(
                CONFIG.camera.position.x,
                CONFIG.camera.position.y,
                CONFIG.camera.position.z
            );
            this.speed = CONFIG.tunnel.speed;
            // Reset particle sprites positions
            if (this.particleSprites && this.particleSprites.length > 0) {
                this.particleSprites.forEach((sprite) => {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = CONFIG.particles.minRadius + 
                                  Math.random() * (CONFIG.particles.maxRadius - CONFIG.particles.minRadius);
                    sprite.position.x = Math.cos(angle) * radius;
                    sprite.position.y = (Math.random() - 0.5) * 20;
                    sprite.position.z = Math.random() * CONFIG.particles.spreadZ - CONFIG.particles.spreadZ / 2;
                });
            }
        }
        
        this.currentZ = CONFIG.tunnel.numSegments * CONFIG.tunnel.segmentLength;
        this.isPaused = false;
        this.updateSpeedDisplay();
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.querySelector('.icon').textContent = '⏸';
        }
        
        // Reset particles
        // Reset particle sprites positions
        if (this.particleSprites && this.particleSprites.length > 0) {
            this.particleSprites.forEach((sprite) => {
                const angle = Math.random() * Math.PI * 2;
                const radius = CONFIG.particles.minRadius + 
                              Math.random() * (CONFIG.particles.maxRadius - CONFIG.particles.minRadius);
                sprite.position.x = Math.cos(angle) * radius;
                sprite.position.y = (Math.random() - 0.5) * 20;
                sprite.position.z = Math.random() * CONFIG.particles.spreadZ - CONFIG.particles.spreadZ / 2;
            });
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Update tunnel
        this.updateTunnel();
        
        // Update controls
        this.controls.update();
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }

    hideLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    showError(message) {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            const loadingText = loadingScreen.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
                loadingText.style.color = '#ff4444';
            }
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new InfiniteTunnel();
    });
} else {
    new InfiniteTunnel();
}
