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
        this.currentTraitIndex = 0;
        this.animationId = null;
        this.particles = null;
        this.particleSystem = null;
        
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
            
            // Create particles
            this.createParticles();
            
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
        // Load image list (same way as showcase)
        try {
            // Ensure imagePath is defined (fallback for old configs)
            const imagePath = CONFIG.imagePath || 'public/rendered-toggles';
            if (!CONFIG.imagePath) {
                console.warn('⚠️ CONFIG.imagePath is undefined, using fallback:', imagePath);
            }
            const apiUrl = `https://api.github.com/repos/${CONFIG.githubRepo}/contents/${imagePath}?ref=${CONFIG.githubBranch}`;
            console.log('🔍 Loading assets from:', apiUrl);
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            
            const files = await response.json();
            
            // Check if files is an array
            if (!Array.isArray(files)) {
                console.error('GitHub API returned non-array:', files);
                throw new Error('Invalid response format from GitHub API');
            }
            
            // Filter for image files (PNG only, like showcase)
            const imageFiles = files
                .filter(file => file.name && file.name.endsWith('.png'))
                .map(file => ({
                    name: file.name,
                    url: `${CONFIG.baseImageUrl}/${file.name}`,
                    path: file.path
                }));
            
            this.assets = imageFiles;
            console.log(`Loaded ${this.assets.length} assets from GitHub`);
            
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
        if (this.textureCache.has(url)) {
            return this.textureCache.get(url);
        }
        
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                url,
                (texture) => {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.minFilter = THREE.LinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    this.textureCache.set(url, texture);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.warn('Error loading texture:', url, error);
                    reject(error);
                }
            );
        });
    }

    createTunnel() {
        const { radius, segments, segmentLength, numSegments } = CONFIG.tunnel;
        
        // Create initial tunnel segments
        for (let i = 0; i < numSegments; i++) {
            const z = i * segmentLength;
            const segment = this.createTunnelSegment(z);
            this.tunnelSegments.push(segment);
            this.scene.add(segment);
        }
        
        this.currentZ = numSegments * segmentLength;
    }

    createParticles() {
        const particleCount = 1000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const color = new THREE.Color();
        color.setHex(CONFIG.lighting.point.color);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Random positions in tunnel
            const angle = Math.random() * Math.PI * 2;
            const radius = CONFIG.tunnel.radius * (0.3 + Math.random() * 0.7);
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = (Math.random() - 0.5) * 20;
            positions[i3 + 2] = Math.random() * 200 - 100;
            
            // Colors
            const intensity = 0.5 + Math.random() * 0.5;
            colors[i3] = color.r * intensity;
            colors[i3 + 1] = color.g * intensity;
            colors[i3 + 2] = color.b * intensity;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
        });
        
        this.particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(this.particleSystem);
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
        
        // Create material
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.BackSide, // Inside of tunnel
            emissive: 0x000000,
            emissiveIntensity: 0.2,
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
        this.loadTexture(asset.url).catch(() => {});
        
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
        
        // Update particles
        if (this.particleSystem) {
            const positions = this.particleSystem.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 2] -= moveDistance;
                
                // Reset particles that are behind
                if (positions[i + 2] < this.camera.position.z - 50) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = CONFIG.tunnel.radius * (0.3 + Math.random() * 0.7);
                    positions[i] = Math.cos(angle) * radius;
                    positions[i + 1] = (Math.random() - 0.5) * 20;
                    positions[i + 2] = this.camera.position.z + 100 + Math.random() * 50;
                }
            }
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }
        
        // Check if segments need to be recycled
        this.tunnelSegments.forEach((segment, index) => {
            segment.position.z -= moveDistance;
            segment.userData.z -= moveDistance;
            
            // If segment is behind camera, move it forward
            if (segment.position.z < -segmentLength) {
                const newZ = this.currentZ + (numSegments - 1) * segmentLength;
                segment.position.z = newZ;
                segment.userData.z = newZ;
                
                // Update texture for recycled segment
                const assetIndex = Math.floor(newZ / segmentLength) % this.assets.length;
                segment.userData.assetIndex = assetIndex;
                
                // Update material with new texture
                const texture = this.getTextureForSegment(assetIndex);
                if (texture && segment.material) {
                    segment.material.map = texture;
                    segment.material.needsUpdate = true;
                }
                
                // Update current trait info
                if (assetIndex < this.assets.length) {
                    this.updateTraitInfo(this.assets[assetIndex]);
                }
            }
        });
        
        // Preload textures for upcoming segments
        const upcomingZ = this.currentZ + segmentLength * 5;
        const upcomingAssetIndex = Math.floor(upcomingZ / segmentLength);
        if (upcomingAssetIndex < this.assets.length) {
            this.preloadTextures(upcomingAssetIndex, CONFIG.assets.preloadCount);
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
            speedDisplay.textContent = `${this.speed.toFixed(1)}x`;
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
            
            // Reset tunnel segments
            this.tunnelSegments.forEach((segment, index) => {
                const z = index * CONFIG.tunnel.segmentLength;
                gsap.to(segment.position, {
                    z: z,
                    duration: 1.5,
                    ease: 'power2.inOut'
                });
                segment.userData.z = z;
            });
        } else {
            // Fallback if GSAP not loaded
            this.camera.position.set(
                CONFIG.camera.position.x,
                CONFIG.camera.position.y,
                CONFIG.camera.position.z
            );
            this.speed = CONFIG.tunnel.speed;
            this.tunnelSegments.forEach((segment, index) => {
                const z = index * CONFIG.tunnel.segmentLength;
                segment.position.z = z;
                segment.userData.z = z;
            });
        }
        
        this.currentZ = CONFIG.tunnel.numSegments * CONFIG.tunnel.segmentLength;
        this.isPaused = false;
        this.updateSpeedDisplay();
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.querySelector('.icon').textContent = '⏸';
        }
        
        // Reset particles
        if (this.particleSystem) {
            const positions = this.particleSystem.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                const angle = Math.random() * Math.PI * 2;
                const radius = CONFIG.tunnel.radius * (0.3 + Math.random() * 0.7);
                positions[i] = Math.cos(angle) * radius;
                positions[i + 1] = (Math.random() - 0.5) * 20;
                positions[i + 2] = Math.random() * 200 - 100;
            }
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
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
