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
        // Initialize speed to show 0.2x in display
        this.speed = CONFIG.tunnel.speed * 0.2;
        this.isPaused = false;
        this.assets = [];
        this.textureCache = new Map();
        this.loadingTextures = new Set(); // Track textures currently loading to avoid duplicates
        this.textureLoader = new THREE.TextureLoader(); // Initialize texture loader once
        this.currentTraitIndex = 0;
        this.animationId = null;
        this.particles = null;
        this.particleSystem = null;
        this.particleSprites = []; // Array of sprites with images
        this.raycaster = new THREE.Raycaster(); // For detecting sprite clicks
        this.mouse = new THREE.Vector2(); // Mouse position in normalized coordinates
        this.selectedSprite = null; // Currently selected sprite
        
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
        // Load image list from GitHub API (only URLs/metadata, not textures)
        try {
            const apiUrl = `https://api.github.com/repos/${CONFIG.githubRepo}/contents/${CONFIG.imagePath}?ref=${CONFIG.githubBranch}`;
            console.log('🔍 Loading assets from:', apiUrl);
            
            const response = await fetch(apiUrl);
            
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
            console.log(`✅ Loaded ${this.assets.length} asset URLs from ${allPngFiles.length} PNG files (textures will load lazy)`);
            
            // No preload textures here - they will load lazy when needed
            if (this.assets.length === 0) {
                console.warn('No assets loaded, using placeholder');
                this.assets = [{
                    name: 'placeholder',
                    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzAwRDM2MiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QURSSUFOWkVSTzwvdGV4dD48L3N2Zz4='
                }];
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
        // Always return a Promise for consistency
        return new Promise((resolve, reject) => {
            // Check cache first
            if (this.textureCache.has(url)) {
                const cachedTexture = this.textureCache.get(url);
                resolve(cachedTexture);
                return;
            }
            
            // Check if already loading to avoid duplicate requests
            if (this.loadingTextures.has(url)) {
                // Wait for existing load to complete
                const checkInterval = setInterval(() => {
                    if (this.textureCache.has(url)) {
                        clearInterval(checkInterval);
                        resolve(this.textureCache.get(url));
                    } else if (!this.loadingTextures.has(url)) {
                        // Loading failed or was cancelled
                        clearInterval(checkInterval);
                        reject(new Error('Texture loading was cancelled or failed'));
                    }
                }, 100);
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    if (!this.textureCache.has(url)) {
                        reject(new Error('Texture loading timeout'));
                    }
                }, 10000);
                return;
            }
            
            // Mark as loading
            this.loadingTextures.add(url);
            
            // Ensure textureLoader is initialized
            if (!this.textureLoader) {
                this.textureLoader = new THREE.TextureLoader();
            }
            
            // Load texture
            this.textureLoader.load(
                url,
                (texture) => {
                    this.loadingTextures.delete(url); // Remove from loading set
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
                    this.loadingTextures.delete(url); // Remove from loading set on error
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
        
        // Create placeholder texture for initial sprites
        const placeholderTexture = this.createPlaceholderTexture();
        
        // Create sprites with placeholder textures (lazy load real textures)
        for (let i = 0; i < particleCount; i++) {
            // Select an asset (cycle through available assets)
            const assetIndex = i % this.assets.length;
            const asset = this.assets[assetIndex];
            
            // Create sprite material with placeholder initially
            const spriteMaterial = new THREE.SpriteMaterial({
                map: placeholderTexture,
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
            sprite.userData.assetUrl = asset.url;
            
            this.particleSprites.push(sprite);
            this.scene.add(sprite);
            
            // Load texture lazy in background (don't await)
            this.loadTextureLazy(asset.url, sprite, spriteMaterial);
        }
        
        console.log(`✅ Created ${this.particleSprites.length} particle sprites (textures loading lazy)`);
    }
    
    createPlaceholderTexture() {
        // Create a simple placeholder texture
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#00D632';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LOADING', 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    async loadTextureLazy(url, sprite, material) {
        try {
            const texture = await this.loadTexture(url);
            if (texture && sprite && material) {
                material.map = texture;
                material.needsUpdate = true;
            }
        } catch (error) {
            // Texture failed to load, keep placeholder
            console.warn(`Failed to load texture lazy for sprite:`, error);
        }
    }
    
    preloadNearbyTextures() {
        if (!this.particleSprites || this.particleSprites.length === 0 || this.assets.length === 0) {
            return;
        }
        
        const cameraZ = this.camera.position.z;
        const preloadDistance = 150; // Preload textures for sprites within this distance
        const maxConcurrent = 5; // Limit concurrent loads
        
        // Find sprites that are approaching visibility and need textures
        const spritesToPreload = this.particleSprites
            .filter(sprite => {
                const distance = sprite.position.z - cameraZ;
                // Sprites ahead of camera, within preload distance
                return distance > 0 && distance < preloadDistance;
            })
            .filter(sprite => {
                // Only preload if texture is not cached and not already loading
                const url = sprite.userData.assetUrl;
                return url && !this.textureCache.has(url) && !this.loadingTextures.has(url);
            })
            .slice(0, maxConcurrent); // Limit to max concurrent
        
        // Preload textures for these sprites (lazy, don't block)
        spritesToPreload.forEach(sprite => {
            const url = sprite.userData.assetUrl;
            if (url) {
                // Load in background without blocking
                this.loadTexture(url).catch(() => {
                    // Silently fail, texture will load when needed
                });
            }
        });
    }
        
        // Progressive background loading: load textures in batches
    }
    
    /**
     * Progressive background loading of textures in batches
     */
    progressiveBackgroundLoad() {
        // Only load if we have capacity (not too many concurrent loads)
        if (this.loadingTextures.size >= 15) {
            return; // Too many concurrent loads, wait
        
        // Progressive background loading: load textures in batches
        this.progressiveBackgroundLoad();
        }
        
        // Load next batch of textures progressively
        const batchSize = 5; // Load 5 textures at a time
        let loaded = 0;
        
        while (loaded < batchSize && this.progressiveLoadIndex < this.assets.length) {
            const asset = this.assets[this.progressiveLoadIndex];
            
            // Skip if already cached or loading
            if (!this.textureCache.has(asset.url) && !this.loadingTextures.has(asset.url)) {
                // Load in background
                this.loadTexture(asset.url).catch(() => {
                    // Silently fail
                });
                loaded++;
            }
            
            this.progressiveLoadIndex++;
            
            // Reset if we've gone through all assets (cycle through)
            if (this.progressiveLoadIndex >= this.assets.length) {
                this.progressiveLoadIndex = 0;
            }
        }
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
                        
                        // Update asset info
                                sprite.userData.assetIndex = newAssetIndex;
                        sprite.userData.assetUrl = newAsset.url;
                        
                        // Check if texture is already cached
                        const cachedTexture = this.textureCache.get(newAsset.url);
                        if (cachedTexture && sprite.material) {
                            // Use cached texture immediately
                            sprite.material.map = cachedTexture;
                            sprite.material.needsUpdate = true;
                            this.updateTraitInfo(newAsset);
                        } else {
                            // Load texture lazy (don't block)
                            this.loadTextureLazy(newAsset.url, sprite, sprite.material);
                                this.updateTraitInfo(newAsset);
                            }
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
        
        // Preload textures for sprites that are approaching visibility
        this.preloadNearbyTextures();
    }

    /**
     * Parse filename to extract tokenId and hash
     * Formats: {tokenId}_{hash}.png
     */
    parseFileName(filename) {
        // Try standard format: {tokenId}_{hash}.png
        let match = filename.match(/^(\d+)_([a-f0-9]+)\.png$/i);
        if (match) {
            return {
                tokenId: parseInt(match[1], 10),
                hash: match[2]
            };
        }
        return { tokenId: null, hash: null };
    }

    /**
     * Handle click on sprites using raycasting
     */
    handleSpriteClick(event) {
        if (!this.camera || !this.particleSprites || this.particleSprites.length === 0) return;

        // Calculate mouse position in normalized device coordinates (-1 to +1)
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update raycaster with camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Find intersections with sprites
        const intersects = this.raycaster.intersectObjects(this.particleSprites, false);

        if (intersects.length > 0) {
            // Get the first intersected sprite
            const clickedSprite = intersects[0].object;
            this.openModal(clickedSprite);
        }
    }

    /**
     * Open modal with sprite information
     */
    async openModal(sprite) {
        if (!sprite || !sprite.userData.assetUrl) return;

        // Get asset from sprite userData
        const assetIndex = sprite.userData.assetIndex;
        const asset = this.assets[assetIndex];
        
        if (!asset) return;

        // Parse filename to get tokenId and hash
        const parsed = this.parseFileName(asset.name);
        const tokenId = parsed.tokenId;
        const hash = parsed.hash;

        // Create metadata
        const metadata = {
            tokenId: tokenId,
            name: tokenId ? `AdrianZERO #${tokenId}` : asset.name.replace(/\.(png|jpg|jpeg|gif|webp)$/i, ''),
            hash: hash,
            description: hash ? `Trait hash: ${hash}` : 'Exploring trait collection'
        };

        // Show modal
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // Render modal content
        this.renderModalContent(asset, metadata);
    }

    /**
     * Close modal
     */
    closeModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Render modal content
     */
    renderModalContent(asset, metadata) {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;

        modalContent.classList.remove('loading');

        const imageContainer = document.createElement('div');
        imageContainer.className = 'modal-image-container';

        // Create image
        const img = document.createElement('img');
        img.src = asset.url;
        img.alt = metadata.name;
        img.onload = () => {
            // Image loaded successfully
        };
        img.onerror = () => {
            // Handle error - show placeholder
            imageContainer.innerHTML = '<div class="modal-image-placeholder">Failed to load image</div>';
        };
        imageContainer.appendChild(img);

        // Create info section
        const hashText = metadata.hash ? `<div class="trait-hash">Trait Hash: ${metadata.hash}</div>` : '';
        
        const html = `
            ${imageContainer.outerHTML}
            <div class="modal-info">
                <h2>${metadata.name}</h2>
                ${metadata.tokenId ? `<div class="token-id">Token ID: #${metadata.tokenId}</div>` : ''}
                ${hashText}
                ${metadata.description ? `<p class="modal-description">${metadata.description}</p>` : ''}
            </div>
        `;

        modalContent.innerHTML = html;
    }

    updateTraitInfo(asset) {
        if (!asset) return;
        
        const nameElement = document.getElementById('currentTraitName');
        const infoElement = document.getElementById('currentTraitInfo');
        
        if (nameElement) {
            // Parse filename to extract tokenId
            const parsed = this.parseFileName(asset.name);
            const newName = parsed.tokenId ? `AdrianZERO #${parsed.tokenId}` : asset.name.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '').toUpperCase();
            
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
        
        // Click detection for sprites
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.addEventListener('click', (event) => this.handleSpriteClick(event));
        }

        // Modal close button
        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        // Close modal on overlay click
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }

        // Close modal on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
        
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
