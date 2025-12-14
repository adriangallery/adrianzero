/**
 * AdrianZERO Showcase - Interactive Grid Gallery
 * Features: 3D effects, lazy loading, metadata cards, infinite scroll
 */

class Showcase {
    constructor() {
        this.images = [];
        this.floppyGifs = [];
        this.loadedImages = new Set();
        this.currentIndex = 0;
        this.gridElement = document.getElementById('showcaseGrid');
        this.gridWrapper = document.getElementById('gridWrapper');
        this.loadingState = document.getElementById('loadingState');
        this.modalOverlay = document.getElementById('modalOverlay');
        this.modalContent = document.getElementById('modalContent');
        this.modalClose = document.getElementById('modalClose');
        this.modalPrev = document.getElementById('modalPrev');
        this.modalNext = document.getElementById('modalNext');
        this.scrollIndicator = document.getElementById('scrollIndicator');
        
        // Configuration
        this.config = {
            githubRepo: 'adriangallery/AdrianLAB',
            githubBranch: 'd05193bc1dbc1c577c051656111a3c07281ba019',
            imagePath: 'public/rendered-toggles',
            baseImageUrl: 'https://raw.githubusercontent.com/adriangallery/AdrianLAB/d05193bc1dbc1c577c051656111a3c07281ba019/public/rendered-toggles',
            itemsPerPage: 50,
            loadThreshold: 0.8, // Load more when 80% scrolled
            imageCache: new Map(),
            metadataCache: new Map(),
            floppyGifPath: 'floppy/',
            gifFrequency: 30, // Show GIF every 30 items
            model3dPath: 'WEN-LAMBO.gltf',
            model3dFrequency: 30, // Show 3D model every 30 items
            adrianLabMetadataUrl: 'https://adrianlab.vercel.app/api/metadata/floppy'
        };

        // State
        this.state = {
            isLoading: false,
            hasMore: true, // Always true for infinite scroll
            currentPage: 1,
            activeModalIndex: -1,
            mouseX: 0,
            mouseY: 0,
            autoScrollX: 0,
            autoScrollY: 0,
            autoScrollInterval: null,
            autoScrollStartTime: null,
            autoScrollDuration: 5000, // 5 seconds in milliseconds
            totalItemsRendered: 0 // Track total items rendered for infinite loop
        };

        // Intersection Observer for lazy loading
        this.imageObserver = null;
        this.scrollObserver = null;

        // Idle state
        this.idleStateConfig = null;
        this.idleStateOverlay = document.getElementById('idleStateOverlay');
        this.idleStateText = document.getElementById('idleStateText');
        this.idleTimer = null;
        this.isIdle = false;
        this.lastActivityTime = Date.now();

        this.init();
    }

    async init() {
        try {
            await Promise.all([
                this.loadImageList(),
                this.loadFloppyGifs(),
                this.loadIdleStateConfig()
            ]);
            this.setupObservers();
            this.setupEventListeners();
            this.setupIdleState();
            this.hideLoading();
            this.renderInitialGrid();
        } catch (error) {
            console.error('Error initializing showcase:', error);
            this.showError('Failed to load collection. Please refresh the page.');
        }
    }

    /**
     * Load list of floppy GIFs and 3D models - verify files exist before adding
     */
    async loadFloppyGifs() {
        // List of all possible floppy files (from local folder)
        const allPossibleFiles = [
            // Original numbered GIFs (may not exist)
            '10000.gif', '10001.gif', '10002.gif', '10003.gif', '10004.gif',
            '10005.gif', '10009.gif', '10010.gif', '10013.gif', '10014.gif',
            '10015.gif', '262144.gif', '262145.gif', '262146.gif', '262147.gif',
            // New GIFs
            'ADRIAN__GoldenFloppy_Disk.gif',
            'ADRIAN_Floppy_Disk.gif',
            'ADRIAN_OG-Floppy_Disk.gif',
            'ADRIAN_Punks.gif',
            'ADRIAN_Starter-Floppy_Disk.gif',
            'ADRIAN_X-Mas-Floppy.gif',
            'ADRIAN-Bootleg_Floppy_Disk.gif',
            'ADRIAN-GF-Serum.gif',
            'Black-Light.gif',
            'Commrades.gif',
            'Serum_Creature.gif',
            'Serum_DNA.gif',
            'Serum_Venum.gif',
            'Serum-Gold_1-1.gif',
            'Serum-Gold_1.gif',
            'Serum-Gold_2.gif',
            // 3D Models (GLTF)
            '$A-Snot.gltf',
            '$A.gltf',
            'DISCORD-Snot.gltf',
            'Discord.gltf',
            'FAQ-OFF-Snot.gltf',
            'FAQ-OFF.gltf',
            'GM-Snot.gltf',
            'GM.gltf',
            'GN-Snot.gltf',
            'GN.gltf',
            'LAB-Snot.gltf',
            'LFG-Snot.gltf',
            'LFG.gltf',
            'V-Snot.gltf',
            'WEN_LAMBO.gltf',
            'WEN-LAMBO-Snot.gltf',
            'WEN-LAMBO.gltf',
            'WTF-Snot.gltf',
            'WTF.gltf',
            'X.gltf'
        ];

        // Verify which files actually exist by trying to load them
        const fileChecks = await Promise.allSettled(
            allPossibleFiles.map(async (filename) => {
                const url = `${this.config.floppyGifPath}${filename}`;
                try {
                    const response = await fetch(url, { method: 'HEAD' });
                    return response.ok ? filename : null;
                } catch {
                    return null;
                }
            })
        );

        // Get list of files that exist
        const existingFiles = fileChecks
            .map((result, index) => result.status === 'fulfilled' && result.value ? allPossibleFiles[index] : null)
            .filter(file => file !== null);

        this.floppyGifs = existingFiles.map(filename => {
            // Check if it's a numbered GIF (old format)
            let match = filename.match(/^(\d+)\.gif$/);
            let tokenId = match ? parseInt(match[1], 10) : null;
            
            // Determine type
            const is3D = filename.endsWith('.gltf');
            const type = is3D ? '3d-model' : 'floppy';
            
            // For non-numbered files, use filename as identifier
            if (!tokenId) {
                tokenId = filename.replace(/\.(gif|gltf)$/, '');
            }
            
            return {
                filename,
                tokenId: tokenId || filename,
                url: `${this.config.floppyGifPath}${filename}`,
                type: type
            };
        });

        // Shuffle for variety
        this.shuffleArray(this.floppyGifs);
        
        const gifCount = this.floppyGifs.filter(f => f.type === 'floppy').length;
        const modelCount = this.floppyGifs.filter(f => f.type === '3d-model').length;
        console.log(`Loaded ${this.floppyGifs.length} floppy items (verified): ${gifCount} GIFs, ${modelCount} 3D models`);
    }

    /**
     * Get random floppy GIF
     */
    getRandomFloppyGif() {
        if (this.floppyGifs.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * this.floppyGifs.length);
        return this.floppyGifs[randomIndex];
    }

    /**
     * Load list of images from GitHub API
     */
    async loadImageList() {
        const apiUrl = `https://api.github.com/repos/${this.config.githubRepo}/contents/${this.config.imagePath}?ref=${this.config.githubBranch}`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const files = await response.json();
            
            // Filter PNG files and parse metadata
            const allPngFiles = files.filter(file => file.name.endsWith('.png'));
            const parsedImages = allPngFiles.map(file => {
                const parsed = this.parseFileName(file.name);
                return {
                    name: file.name,
                    url: `${this.config.baseImageUrl}/${file.name}`,
                    tokenId: parsed.tokenId,
                    hash: parsed.hash,
                    ...parsed
                };
            });

            // Filter out invalid images and log them
            const invalidImages = parsedImages.filter(img => img.tokenId === null || img.hash === null);
            if (invalidImages.length > 0) {
                console.warn(`Skipping ${invalidImages.length} images with invalid format:`, 
                    invalidImages.map(img => img.name));
            }

            this.images = parsedImages
                .filter(image => image.tokenId !== null && image.hash !== null) // Only include valid parsed images
                .sort((a, b) => {
                    // Sort by tokenId, then by hash
                    if (a.tokenId !== b.tokenId) {
                        return a.tokenId - b.tokenId;
                    }
                    // Handle null hashes (shouldn't happen after filter, but safe check)
                    if (!a.hash || !b.hash) {
                        return (a.hash || '').localeCompare(b.hash || '');
                    }
                    return a.hash.localeCompare(b.hash);
                });

            // Shuffle array randomly using Fisher-Yates algorithm
            this.shuffleArray(this.images);

            console.log(`Loaded ${this.images.length} valid images from ${allPngFiles.length} PNG files (randomized)`);
        } catch (error) {
            console.error('Error loading image list:', error);
            throw error;
        }
    }

    /**
     * Shuffle array randomly using Fisher-Yates algorithm
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Parse filename to extract tokenId and hash
     * Formats: {tokenId}_{hash}.png or {tokenId}_banana.png
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
        // Try banana format: {tokenId}_banana.png
        match = filename.match(/^(\d+)_banana\.png$/i);
        if (match) {
            return {
                tokenId: parseInt(match[1], 10),
                hash: 'banana'
            };
        }
        return { tokenId: null, hash: null };
    }

    /**
     * Setup Intersection Observers for lazy loading
     */
    setupObservers() {
        // Observer for images
        this.imageObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const item = entry.target;
                        // Small delay to prevent loading all at once
                        setTimeout(() => {
                            this.loadImage(item);
                        }, Math.random() * 100); // Random delay 0-100ms for smoother loading
                        this.imageObserver.unobserve(item);
                    }
                });
            },
            {
                rootMargin: '500px', // Start loading 500px before visible for smoother experience
                threshold: 0.01
            }
        );

        // Observer for scroll-based loading (all directions)
        this.scrollObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && this.state.hasMore) {
                        const sentinel = entry.target;
                        const direction = sentinel.dataset.direction || 'vertical';
                        this.loadMoreItems(direction);
                    }
                });
            },
            {
                rootMargin: '800px',
                threshold: 0.1
            }
        );
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // 3D effect on mouse move (throttled with requestAnimationFrame)
        let rafId = null;
        this.gridWrapper.addEventListener('mousemove', (e) => {
            // Reset idle timer on mouse move
            this.resetIdleTimer();
            
            if (rafId === null) {
                rafId = requestAnimationFrame(() => {
                    this.handleMouseMove(e);
                    rafId = null;
                });
            }
        }, { passive: true });

        // Reset 3D effects when mouse leaves
        this.gridWrapper.addEventListener('mouseleave', () => {
            if (rafId) cancelAnimationFrame(rafId);
            this.handleMouseLeave();
        });

        // Touch events for mobile (passive for better performance)
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.gridWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        this.gridWrapper.addEventListener('touchmove', (e) => {
            // Reset idle timer on touch move
            this.resetIdleTimer();
            
            if (e.touches.length === 1) {
                this.handleTouchMove(e, touchStartX, touchStartY);
            }
        }, { passive: true });

        // Modal controls
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modalPrev.addEventListener('click', () => this.navigateModal(-1));
        this.modalNext.addEventListener('click', () => this.navigateModal(1));
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.closeModal();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Reset idle timer on key press
            this.resetIdleTimer();
            
            if (this.state.activeModalIndex >= 0) {
                if (e.key === 'Escape') {
                    this.closeModal();
                } else if (e.key === 'ArrowLeft') {
                    this.navigateModal(-1);
                } else if (e.key === 'ArrowRight') {
                    this.navigateModal(1);
                }
            }
        });

        // Scroll indicator and scroll animations (throttled)
        let scrollRafId = null;
        let lastScrollTop = 0;
        let scrollTimeout = null;
        this.gridWrapper.addEventListener('scroll', () => {
            // Hide scroll indicator immediately
            this.hideScrollIndicator();
            
            // Reset idle timer on scroll
            this.resetIdleTimer();
            
            // Throttle heavy operations
            if (scrollTimeout) return;
            scrollTimeout = setTimeout(() => {
                if (scrollRafId === null) {
                    scrollRafId = requestAnimationFrame(() => {
                        this.handleScroll();
                        const currentScrollTop = this.gridWrapper.scrollTop;
                        lastScrollTop = currentScrollTop;
                        scrollRafId = null;
                    });
                }
                scrollTimeout = null;
            }, 150); // Throttle to 150ms
        }, { passive: true });
    }

    /**
     * Load idle state configuration from JSON
     */
    async loadIdleStateConfig() {
        try {
            const response = await fetch('idle-state.json');
            if (!response.ok) {
                throw new Error(`Failed to load idle state config: ${response.status}`);
            }
            const config = await response.json();
            this.idleStateConfig = config.idleState;
            console.log('✅ Idle state config loaded:', this.idleStateConfig);
        } catch (error) {
            console.warn('⚠️ Failed to load idle state config, using defaults:', error);
            // Default config if JSON fails to load
            this.idleStateConfig = {
                enabled: true,
                idleTimeout: 5000,
                fadeInDuration: 2000,
                fadeOutDuration: 1000,
                text: {
                    content: "So basically, we vibe-coded our own ecosystem — starting with $ADRIAN, a token powering auctions, staking, and all on-chain mints. Then we built AdrianZERO, a community-assembled NFT that evolves through Floppys, Packs, and Pagers, burning traits as it grows. Now we're layering AI on top to extend creativity even further — turning the whole thing into a controlled experiment in collaboration, ownership, and beautifully engineered chaos.",
                    scrollSpeed: 50,
                    fontSize: "clamp(1rem, 2vw, 1.5rem)",
                    color: "#ffffff",
                    opacity: 0.9
                },
                overlay: {
                    backgroundColor: "rgba(0, 0, 0, 0.85)",
                    transitionDuration: "2s"
                }
            };
        }
    }

    /**
     * Setup idle state detection and display
     */
    setupIdleState() {
        if (!this.idleStateConfig || !this.idleStateConfig.enabled) {
            console.log('⏸️ Idle state disabled or config not available');
            return;
        }

        console.log('🔧 Setting up idle state:', {
            timeout: this.idleStateConfig.idleTimeout,
            fadeIn: this.idleStateConfig.fadeInDuration,
            fadeOut: this.idleStateConfig.fadeOutDuration
        });

        // Set text content
        if (this.idleStateText && this.idleStateConfig.text) {
            this.idleStateText.textContent = this.idleStateConfig.text.content;
            // Use font family from config (monospace for old computer style)
            if (this.idleStateConfig.text.fontFamily) {
                this.idleStateText.style.fontFamily = this.idleStateConfig.text.fontFamily;
            }
            // Font size is now set via CSS (clamp), but we can override if needed
            if (this.idleStateConfig.text.fontSize) {
                this.idleStateText.style.fontSize = this.idleStateConfig.text.fontSize;
            }
            // Use color from config
            if (this.idleStateConfig.text.color) {
                this.idleStateText.style.color = this.idleStateConfig.text.color;
            }
            this.idleStateText.style.opacity = '1';
            
            console.log('✅ Idle state text configured:', {
                length: this.idleStateConfig.text.content.length,
                fontSize: this.idleStateConfig.text.fontSize || 'CSS clamp',
                fontFamily: this.idleStateConfig.text.fontFamily || 'default',
                color: this.idleStateConfig.text.color || '#ffffff'
            });
        } else {
            console.warn('⚠️ Idle state text element not found');
        }
        
        // Set title content if exists
        const idleStateTitle = document.getElementById('idleStateTitle');
        if (idleStateTitle && this.idleStateConfig.title) {
            if (this.idleStateConfig.title.content) {
                idleStateTitle.textContent = this.idleStateConfig.title.content;
            }
            if (this.idleStateConfig.title.fontFamily) {
                idleStateTitle.style.fontFamily = this.idleStateConfig.title.fontFamily;
            }
            if (this.idleStateConfig.title.fontSize) {
                idleStateTitle.style.fontSize = this.idleStateConfig.title.fontSize;
            }
            if (this.idleStateConfig.title.color) {
                idleStateTitle.style.color = this.idleStateConfig.title.color;
            }
            
            // Load custom font for title if needed
            if (this.idleStateConfig.title.fontFamily && this.idleStateConfig.title.fontFamily.includes('AdrianZero')) {
                if (document.fonts) {
                    const font = new FontFace('AdrianZero', 'url(../components/fonts/ADRIAN_ZERO.otf)');
                    font.load().then((loadedFont) => {
                        document.fonts.add(loadedFont);
                        console.log('✅ Font AdrianZero loaded successfully for title');
                    }).catch((error) => {
                        console.warn('⚠️ Error loading AdrianZero font:', error);
                    });
                }
            }
        }

        // Set overlay background
        if (this.idleStateOverlay && this.idleStateConfig.overlay) {
            this.idleStateOverlay.style.transition = `opacity ${this.idleStateConfig.fadeInDuration}ms ease-in-out, background-color ${this.idleStateConfig.fadeInDuration}ms ease-in-out`;
            console.log('✅ Idle state overlay configured');
        } else {
            console.warn('⚠️ Idle state overlay element not found');
        }

        // Setup activity listeners
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'touchmove', 'click'];
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                console.log(`🔄 Activity detected: ${event} - resetting idle timer`);
                this.resetIdleTimer();
            }, { passive: true });
        });

        console.log(`👂 Listening for activity events: ${activityEvents.join(', ')}`);

        // Start idle timer
        this.resetIdleTimer();
        console.log(`⏱️ Idle timer started: ${this.idleStateConfig.idleTimeout}ms (${this.idleStateConfig.idleTimeout / 1000}s)`);
    }

    /**
     * Reset idle timer when user activity is detected
     */
    resetIdleTimer() {
        if (!this.idleStateConfig || !this.idleStateConfig.enabled) {
            return;
        }

        // Hide idle state if active
        if (this.isIdle) {
            console.log('👋 User activity detected while idle - hiding idle state');
            this.hideIdleState();
        }

        // Clear existing timer
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            const timeSinceLastActivity = Date.now() - this.lastActivityTime;
            console.log(`⏱️ Timer reset - was ${timeSinceLastActivity}ms since last activity`);
        }

        // Update last activity time
        this.lastActivityTime = Date.now();

        // Set new timer
        this.idleTimer = setTimeout(() => {
            console.log(`⏰ Idle timeout reached (${this.idleStateConfig.idleTimeout}ms) - showing idle state`);
            this.showIdleState();
        }, this.idleStateConfig.idleTimeout);
        
        console.log(`🔄 Idle timer reset - will trigger in ${this.idleStateConfig.idleTimeout}ms (${this.idleStateConfig.idleTimeout / 1000}s)`);
    }

    /**
     * Show idle state overlay
     */
    showIdleState() {
        if (!this.idleStateOverlay) {
            console.error('❌ Cannot show idle state - overlay element not found');
            return;
        }
        
        if (this.isIdle) {
            console.log('ℹ️ Idle state already active');
            return;
        }

        this.isIdle = true;
        this.idleStateOverlay.classList.add('active');
        console.log('💤 Idle state ACTIVATED', {
            timestamp: new Date().toISOString(),
            timeSinceLastActivity: Date.now() - this.lastActivityTime,
            overlayElement: !!this.idleStateOverlay,
            textElement: !!this.idleStateText
        });
    }

    /**
     * Hide idle state overlay
     */
    hideIdleState() {
        if (!this.idleStateOverlay) {
            console.error('❌ Cannot hide idle state - overlay element not found');
            return;
        }
        
        if (!this.isIdle) {
            console.log('ℹ️ Idle state already inactive');
            return;
        }

        this.isIdle = false;
        this.idleStateOverlay.classList.remove('active');
        console.log('✨ Idle state DEACTIVATED', {
            timestamp: new Date().toISOString(),
            timeSinceLastActivity: Date.now() - this.lastActivityTime
        });
    }

    /**
     * Handle mouse move for 3D effects (optimized)
     */
    handleMouseMove(e) {
        const rect = this.gridWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.state.mouseX = x;
        this.state.mouseY = y;

        // Viewport parallax effect
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const maxOffset = 15; // Maximum parallax offset in pixels
        const offsetX = ((mouseX - centerX) / centerX) * maxOffset;
        const offsetY = ((mouseY - centerY) / centerY) * maxOffset;
        
        // Apply parallax to grid wrapper
        this.gridWrapper.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        
        // Auto-scroll based on mouse position
        // Calculate scroll velocity based on distance from center
        const scrollIntensity = 0.3; // How fast to scroll (lower = slower)
        const maxScrollSpeed = 5; // Maximum pixels per frame
        
        const scrollX = ((mouseX - centerX) / centerX) * maxScrollSpeed * scrollIntensity;
        const scrollY = ((mouseY - centerY) / centerY) * maxScrollSpeed * scrollIntensity;
        
        // Store scroll velocities (update continuously while mouse moves)
        this.state.autoScrollX = scrollX;
        this.state.autoScrollY = scrollY;
        this.state.autoScrollStartTime = Date.now(); // Reset timer when mouse moves
        
        // Start auto-scroll if not already running
        if (!this.state.autoScrollInterval) {
            try {
                if (typeof this.startAutoScroll === 'function') {
                    this.startAutoScroll();
                }
            } catch (error) {
                console.warn('Auto-scroll not available:', error);
            }
        }

        // Apply 3D effect to visible items (only those in viewport)
        const items = Array.from(this.gridWrapper.querySelectorAll('.grid-item'));
        const viewportTop = this.gridWrapper.scrollTop;
        const viewportBottom = viewportTop + this.gridWrapper.clientHeight;
        
        items.forEach(item => {
            const itemTop = item.offsetTop;
            const itemBottom = itemTop + item.offsetHeight;
            
            // Only process items in or near viewport
            if (itemBottom < viewportTop - 200 || itemTop > viewportBottom + 200) {
                return;
            }
            
            // Skip items that are being hovered (let CSS handle the flip effect)
            // But still apply subtle 3D movement
            const isHovered = item.matches(':hover');
            
            const itemRect = item.getBoundingClientRect();
            const itemCenterX = itemRect.left + itemRect.width / 2;
            const itemCenterY = itemRect.top + itemRect.height / 2;
            
            const deltaX = (e.clientX - itemCenterX) / itemRect.width;
            const deltaY = (e.clientY - itemCenterY) / itemRect.height;
            
            // Calculate distance from center for intensity
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const intensity = Math.min(distance * 1.5, 1);
            
            // More pronounced 3D movement
            const rotateX = deltaY * 12 * intensity; // Max 12 degrees (more visible)
            const rotateY = deltaX * -12 * intensity; // Max -12 degrees
            const scale = isHovered ? 1.15 : (1 + (intensity * 0.05)); // More scale
            const translateZ = intensity * 25; // More Z translation for depth
            
            // Combine with parallax if exists
            const parallaxX = parseFloat(item.dataset.parallaxX) || 0;
            const parallaxY = parseFloat(item.dataset.parallaxY) || 0;
            const parallaxZ = parseFloat(item.dataset.parallaxZ) || 0;
            
            // Only apply transforms when mouse is active (intensity > 0.1)
            // No movement when mouse is not over items
            if (intensity > 0.1) {
                // Mouse is active, apply 3D transforms
                if (isHovered) {
                    // When hovered, CSS handles the transform via :hover
                    item.style.transform = '';
                } else {
                    // Normal 3D movement with mouse
                    item.style.transform = `translate3d(${parallaxX}px, ${parallaxY}px, ${parallaxZ}px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale}) translateZ(${translateZ}px)`;
                }
            } else {
                // Mouse not active, no transforms
                item.style.transform = '';
            }
        });
    }

    /**
     * Reset 3D effects when mouse leaves
     */
    handleMouseLeave() {
        // Reset parallax
        this.gridWrapper.style.transform = '';
        
        // Don't stop auto-scroll immediately - let momentum continue
        // The scroll will naturally decay and stop on its own
        
        const items = this.gridWrapper.querySelectorAll('.grid-item');
        items.forEach(item => {
            item.style.transform = '';
            item.style.animationPlayState = 'running'; // Resume CSS animation
        });
    }

    /**
     * Start auto-scroll animation
     */
    startAutoScroll() {
        if (this.state.autoScrollInterval) return;
        
        const scroll = () => {
            // Calculate time elapsed since scroll started
            const elapsed = Date.now() - (this.state.autoScrollStartTime || Date.now());
            const progress = Math.min(elapsed / this.state.autoScrollDuration, 1); // 0 to 1 over 5 seconds
            
            // Calculate decay factor using ease-out curve (starts fast, ends slow)
            // Using easeOutCubic: 1 - (1 - t)^3
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const decayFactor = 1 - easeOutCubic; // Goes from 1 to 0 over 5 seconds
            
            // Apply scroll with momentum
            const currentScrollLeft = this.gridWrapper.scrollLeft;
            const currentScrollTop = this.gridWrapper.scrollTop;
            
            const maxScrollLeft = this.gridWrapper.scrollWidth - this.gridWrapper.clientWidth;
            const maxScrollTop = this.gridWrapper.scrollHeight - this.gridWrapper.clientHeight;
            
            // Get initial velocities (stored when mouse was moving)
            const initialScrollX = this.state.autoScrollX;
            const initialScrollY = this.state.autoScrollY;
            
            // Apply decay to velocities
            const currentScrollX = initialScrollX * decayFactor;
            const currentScrollY = initialScrollY * decayFactor;
            
            // Calculate new scroll position
            let newScrollLeft = currentScrollLeft + currentScrollX;
            let newScrollTop = currentScrollTop + currentScrollY;
            
            // Clamp to boundaries
            newScrollLeft = Math.max(0, Math.min(maxScrollLeft, newScrollLeft));
            newScrollTop = Math.max(0, Math.min(maxScrollTop, newScrollTop));
            
            // Check if we've hit a boundary
            const hitBoundaryX = (newScrollLeft === 0 && currentScrollX < 0) || 
                                 (newScrollLeft >= maxScrollLeft && currentScrollX > 0);
            const hitBoundaryY = (newScrollTop === 0 && currentScrollY < 0) || 
                                 (newScrollTop >= maxScrollTop && currentScrollY > 0);
            
            // Apply scroll
            this.gridWrapper.scrollLeft = newScrollLeft;
            this.gridWrapper.scrollTop = newScrollTop;
            
            // Stop if time elapsed or hit boundary
            if (progress >= 1 || (hitBoundaryX && hitBoundaryY)) {
                this.state.autoScrollX = 0;
                this.state.autoScrollY = 0;
                this.stopAutoScroll();
                return;
            }
            
            // Update velocities for next frame (will be recalculated based on time)
            this.state.autoScrollX = currentScrollX;
            this.state.autoScrollY = currentScrollY;
        };
        
        // Use requestAnimationFrame for smooth scrolling
        const animate = () => {
            scroll();
            if (this.state.autoScrollX !== 0 || this.state.autoScrollY !== 0) {
                this.state.autoScrollInterval = requestAnimationFrame(animate);
            } else {
                this.state.autoScrollInterval = null;
            }
        };
        
        this.state.autoScrollInterval = requestAnimationFrame(animate);
    }

    /**
     * Stop auto-scroll animation
     */
    stopAutoScroll() {
        if (this.state.autoScrollInterval) {
            cancelAnimationFrame(this.state.autoScrollInterval);
            this.state.autoScrollInterval = null;
        }
        this.state.autoScrollX = 0;
        this.state.autoScrollY = 0;
        this.state.autoScrollStartTime = null;
    }

    /**
     * Handle touch move for mobile 3D effects
     */
    handleTouchMove(e, startX, startY) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        
        // Subtle 3D effect on touch
        const items = this.gridWrapper.querySelectorAll('.grid-item');
        items.forEach((item, index) => {
            const intensity = Math.min(Math.abs(deltaX) + Math.abs(deltaY), 50) / 50;
            const rotateX = (deltaY / 10) * intensity;
            const rotateY = (deltaX / -10) * intensity;
            
            item.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
    }

    /**
     * Render initial grid items
     */
    renderInitialGrid() {
        const initialItems = this.images.slice(0, this.config.itemsPerPage);
        initialItems.forEach((image, i) => {
            const index = this.state.totalItemsRendered;
            this.createGridItem(image, index);
            this.state.totalItemsRendered++;
        });

        // Create sentinel for infinite scroll
        this.createScrollSentinels();
    }

    /**
     * Create a grid item element with staggered animation
     */
    createGridItem(image, index) {
        const item = this.createGridItemElement(image, index);
        this.gridElement.appendChild(item);
        this.imageObserver.observe(item);
    }

    /**
     * Load image with error handling and smooth transition
     */
    async loadImage(itemElement) {
        const img = itemElement.querySelector('img');
        const placeholder = itemElement.querySelector('.image-placeholder');
        
        if (!img || img.dataset.loaded === 'true') return;

        const imageUrl = img.dataset.src;
        
        // Check cache first
        if (this.config.imageCache.has(imageUrl)) {
            const cachedImg = this.config.imageCache.get(imageUrl);
            img.src = cachedImg.src;
            img.classList.add('loaded');
            if (placeholder) placeholder.style.display = 'none';
            img.dataset.loaded = 'true';
            return;
        }

        // Mark as loading to prevent duplicate loads
        img.dataset.loaded = 'loading';

        // Preload image with timeout
        const imageLoader = new Image();
        let loadTimeout;
        
        imageLoader.onload = () => {
            clearTimeout(loadTimeout);
            
            // Cache the image
            this.config.imageCache.set(imageUrl, imageLoader);
            
            // Smooth transition
            requestAnimationFrame(() => {
                img.src = imageUrl;
                img.classList.add('loaded');
                
                // Hide placeholder after image is loaded
                setTimeout(() => {
                    if (placeholder) placeholder.style.display = 'none';
                }, 150);
                
                img.dataset.loaded = 'true';
            });
        };

        imageLoader.onerror = () => {
            clearTimeout(loadTimeout);
            console.warn(`Failed to load image: ${imageUrl}`);
            img.classList.add('error');
            img.dataset.loaded = 'error';
            if (placeholder) {
                placeholder.textContent = 'Image unavailable';
                placeholder.style.color = 'rgba(255, 255, 255, 0.4)';
            }
        };

        // Timeout after 10 seconds
        loadTimeout = setTimeout(() => {
            if (img.dataset.loaded === 'loading') {
                imageLoader.onerror();
            }
        }, 10000);

        // Start loading
        imageLoader.src = imageUrl;
    }

    /**
     * Create scroll sentinels for infinite loading in all directions
     */
    createScrollSentinels() {
        // Remove existing sentinels
        const existingSentinels = this.gridElement.querySelectorAll('.scroll-sentinel');
        existingSentinels.forEach(s => s.remove());

        // Bottom sentinel (vertical down)
        const bottomSentinel = document.createElement('div');
        bottomSentinel.className = 'scroll-sentinel scroll-sentinel-bottom';
        bottomSentinel.dataset.direction = 'vertical';
        bottomSentinel.style.height = '1px';
        bottomSentinel.style.gridColumn = '1 / -1';
        this.gridElement.appendChild(bottomSentinel);
        this.scrollObserver.observe(bottomSentinel);

        // Right sentinel (horizontal right)
        const rightSentinel = document.createElement('div');
        rightSentinel.className = 'scroll-sentinel scroll-sentinel-right';
        rightSentinel.dataset.direction = 'horizontal';
        rightSentinel.style.width = '1px';
        rightSentinel.style.height = '100%';
        rightSentinel.style.gridColumn = '-1';
        rightSentinel.style.gridRow = '1 / -1';
        this.gridElement.appendChild(rightSentinel);
        this.scrollObserver.observe(rightSentinel);
    }

    /**
     * Load more items when scrolling (infinite scroll)
     */
    loadMoreItems(direction = 'vertical') {
        if (this.state.isLoading) return;

        this.state.isLoading = true;

        // Use requestAnimationFrame to batch DOM operations
        requestAnimationFrame(() => {
            // Remove sentinels temporarily
            const sentinels = this.gridElement.querySelectorAll('.scroll-sentinel');
            sentinels.forEach(s => s.remove());

            // Load next batch
            const batchSize = this.config.itemsPerPage;
            const imagesToAdd = [];

            for (let i = 0; i < batchSize; i++) {
                // Use modulo to loop through images infinitely
                const imageIndex = this.state.totalItemsRendered % this.images.length;
                const image = this.images[imageIndex];
                
                // If we've looped back to the start, reshuffle for variety
                if (imageIndex === 0 && this.state.totalItemsRendered > 0) {
                    this.shuffleArray(this.images);
                }
                
                imagesToAdd.push({
                    image: image,
                    index: this.state.totalItemsRendered
                });
                
                this.state.totalItemsRendered++;
            }

            // Batch DOM updates
            const fragment = document.createDocumentFragment();
            imagesToAdd.forEach(({ image, index }) => {
                const item = this.createGridItemElement(image, index);
                fragment.appendChild(item);
            });

            // Single DOM operation
            this.gridElement.appendChild(fragment);

            // Observe new items
            imagesToAdd.forEach(({ image, index }) => {
                const item = this.gridElement.querySelector(`[data-index="${index}"]`);
                if (item) this.imageObserver.observe(item);
            });

            // Re-add sentinels for next batch
            this.createScrollSentinels();

            this.state.isLoading = false;
        });
    }

    /**
     * Create grid item element (without appending, for batching)
     */
    createGridItemElement(image, index) {
        const item = document.createElement('div');
        item.className = 'grid-item';
        item.dataset.index = index;
        
        // Check if this should be a special item (floppy or 3D model) - truly random 1 in every gifFrequency
        // Use probability instead of modulo to avoid clustering in rows/columns
        const isSpecialItem = (Math.random() < (1 / this.config.gifFrequency));
        let floppyGif = null;
        let is3dModel = false;
        let isFloppyGif = false;
        
        if (isSpecialItem) {
            // Randomly choose from all floppy items (GIFs and 3D models)
            if (this.floppyGifs.length > 0) {
                const randomItem = this.getRandomFloppyGif();
                if (randomItem) {
                    if (randomItem.type === '3d-model') {
                        // Show 3D model
                        is3dModel = true;
                        item.classList.add('grid-item-3d');
                        item.dataset.type = '3d-model';
                        item.dataset.model3d = 'true';
                        item.dataset.modelPath = randomItem.url;
                    } else {
                        // Show floppy GIF
                        isFloppyGif = true;
                        floppyGif = randomItem;
                        item.classList.add('grid-item-gif');
                        item.dataset.isGif = 'true';
                        item.dataset.floppyTokenId = floppyGif.tokenId;
                        item.dataset.type = 'floppy';
                    }
                }
            }
        }
        
        if (!isSpecialItem || (!is3dModel && !isFloppyGif)) {
            item.dataset.tokenId = image.tokenId;
            item.dataset.hash = image.hash;
            item.dataset.type = 'adrianzero';
        }
        
        // Stagger animation delay based on index
        const delay = (index % 20) * 0.03;
        item.style.animationDelay = `${delay}s`;
        item.style.setProperty('--item-index', index % 8); // Vary swing timing

        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';

        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';

        if (is3dModel) {
            // Create 3D model viewer element (single model, no tint)
            const modelPath = item.dataset.modelPath || this.config.model3dPath;
            this.create3dModelViewer(imageContainer, index, modelPath);
        } else if (isFloppyGif && floppyGif) {
            // Create floppy GIF element with transparent background
            const gif = document.createElement('img');
            gif.src = floppyGif.url;
            gif.alt = `AdrianLAB Floppy #${floppyGif.tokenId}`;
            gif.className = 'gif-image';
            gif.dataset.loaded = 'true';
            gif.dataset.tokenId = floppyGif.tokenId;
            // Set transparent background for floppy GIFs
            imageContainer.style.background = 'transparent';
            imageContainer.appendChild(gif);
        } else {
            // Regular image
            const img = document.createElement('img');
            img.dataset.src = image.url;
            img.dataset.index = index;
            img.alt = `AdrianZERO #${image.tokenId}`;
            imageContainer.appendChild(placeholder);
            imageContainer.appendChild(img);
        }

        item.appendChild(imageContainer);

        // Click handler - only for regular AdrianZERO items (not floppys or 3D models)
        const itemIndex = index;
        const isFloppy = isFloppyGif && floppyGif;
        const is3d = is3dModel;
        
        // Only add click handler for regular items (not floppys or 3D models)
        if (!is3d && !isFloppy) {
            item.addEventListener('click', () => {
                this.openModal(itemIndex, 'adrianzero');
            });
        } else {
            // Floppys and 3D models are not clickable - change cursor to default
            item.style.cursor = 'default';
        }

        return item;
    }

    /**
     * Create 3D model viewer with swing animation (single model, no tint)
     */
    create3dModelViewer(container, index, modelPath = null) {
        const modelWrapper = document.createElement('div');
        modelWrapper.className = 'model-3d-wrapper';
        modelWrapper.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
        `;

        // Single model viewer (no tint, no overlay)
        const modelViewer = document.createElement('model-viewer');
        modelViewer.src = modelPath || this.config.model3dPath;
        modelViewer.alt = '3D Model';
        modelViewer.className = 'model-3d';
        
        // Set initial camera position with slight offset for swing effect
        const swingOffset = (index % 8) * 0.5; // Small offset based on index
        modelViewer.setAttribute('camera-orbit', `${swingOffset}deg 75deg 2.5m`); // Slight horizontal offset
        modelViewer.setAttribute('camera-target', '0m 0m 0m');
        modelViewer.setAttribute('field-of-view', '30deg'); // Smaller FOV = smaller model
        modelViewer.setAttribute('auto-rotate', '');
        modelViewer.setAttribute('auto-rotate-delay', '0');
        modelViewer.setAttribute('auto-rotate-speed', '0.3'); // Even slower for smoother rotation
        modelViewer.setAttribute('interaction-policy', 'allow-when-focused');
        modelViewer.setAttribute('render-scale', '2'); // Higher resolution for better quality
        modelViewer.setAttribute('exposure', '1.2'); // Slightly brighter
        modelViewer.setAttribute('shadow-intensity', '0.5');
        modelViewer.setAttribute('disable-zoom', ''); // Disable zoom to prevent jumps
        modelViewer.setAttribute('camera-controls', ''); // Enable smooth camera controls
        modelViewer.style.cssText = `
            position: relative;
            width: 80%;
            height: 80%;
            max-width: 100%;
            max-height: 100%;
            background: transparent;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        `;

        // No swing animation - removed as per user request
        modelViewer.style.transformOrigin = 'center center';

        modelWrapper.appendChild(modelViewer);
        container.appendChild(modelWrapper);
    }

    /**
     * Open modal with metadata
     */
    async openModal(index, type = 'adrianzero') {
        // Get the actual image from the item's data attributes
        const item = this.gridElement.querySelector(`[data-index="${index}"]`);
        if (!item) return;

        this.state.activeModalIndex = index;
        
        let image = null;
        let metadata = null;

        if (type === '3d-model') {
            const modelPath = item.dataset.modelPath || this.config.model3dPath;
            const modelName = modelPath.split('/').pop().replace('.gltf', '').replace(/-/g, ' ');
            image = {
                url: modelPath,
                type: '3d-model',
                tokenId: modelName
            };
            
            metadata = {
                tokenId: modelName,
                name: `${modelName} 3D Model`,
                description: '3D model with swing animation'
            };
        } else if (type === 'floppy') {
            const floppyTokenId = item.dataset.floppyTokenId;
            if (!floppyTokenId) return;
            
            // Find the floppy GIF
            const floppyGif = this.floppyGifs.find(g => g.tokenId === parseInt(floppyTokenId));
            if (!floppyGif) return;
            
            image = {
                url: floppyGif.url,
                tokenId: floppyGif.tokenId,
                type: 'floppy'
            };
            
            // Load metadata from AdrianLAB
            metadata = await this.loadFloppyMetadata(floppyGif.tokenId);
        } else {
            const tokenId = item.dataset.tokenId;
            const hash = item.dataset.hash;
            
            // Find the image in our array
            image = this.images.find(img => 
                img.tokenId === parseInt(tokenId) && img.hash === hash
            );
            
            if (!image) return;
            
            metadata = await this.loadMetadata(image);
        }
        
        // Create zoom animation before showing modal
        await this.createZoomAnimation(item, image);
        
        this.modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Show loading state
        this.modalContent.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p class="loading-text">Loading metadata...</p></div>';
        this.modalContent.classList.add('loading');

        // Render modal content
        this.renderModalContent(image, metadata);

        // Update navigation buttons
        this.updateModalNavigation();
    }

    /**
     * Create professional zoom animation from item to modal
     */
    async createZoomAnimation(item, image) {
        // Get item position and size
        const itemRect = item.getBoundingClientRect();
        const itemImg = item.querySelector('img') || item.querySelector('.gif-image') || item.querySelector('.model-3d-wrapper');
        if (!itemImg) return;
        
        // Get viewport center
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Calculate transforms needed
        const startX = itemRect.left + itemRect.width / 2;
        const startY = itemRect.top + itemRect.height / 2;
        const translateX = centerX - startX;
        const translateY = centerY - startY;
        
        // Calculate scale (from item size to modal size)
        const modalWidth = Math.min(600, window.innerWidth * 0.9);
        const modalHeight = Math.min(window.innerHeight * 0.9, 800);
        const scaleX = modalWidth / itemRect.width;
        const scaleY = modalHeight / itemRect.height;
        const scale = Math.min(scaleX, scaleY) * 0.8; // Slightly smaller for better effect
        
        // Create temporary zoom element
        const zoomElement = document.createElement('div');
        zoomElement.className = 'zoom-animation-element';
        zoomElement.style.cssText = `
            position: fixed;
            left: ${itemRect.left}px;
            top: ${itemRect.top}px;
            width: ${itemRect.width}px;
            height: ${itemRect.height}px;
            z-index: 3000;
            pointer-events: none;
            overflow: hidden;
            border-radius: 8px;
        `;
        
        // Clone the image or 3D model
        const imgClone = itemImg.cloneNode(true);
        if (itemImg.tagName === 'IMG' || itemImg.classList.contains('gif-image')) {
            imgClone.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            `;
        } else if (itemImg.classList.contains('model-3d-wrapper')) {
            imgClone.style.cssText = `
                width: 100%;
                height: 100%;
            `;
        }
        zoomElement.appendChild(imgClone);
        document.body.appendChild(zoomElement);
        
        // Hide original item temporarily
        item.style.opacity = '0';
        
        // Animate
        requestAnimationFrame(() => {
            zoomElement.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease-out';
            zoomElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            zoomElement.style.opacity = '0';
        });
        
        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Cleanup
        zoomElement.remove();
        item.style.opacity = '';
    }

    /**
     * Load metadata for a floppy (AdrianLAB)
     */
    async loadFloppyMetadata(tokenId) {
        // Check cache
        const cacheKey = `floppy_${tokenId}`;
        if (this.config.metadataCache.has(cacheKey)) {
            return this.config.metadataCache.get(cacheKey);
        }

        try {
            // Try to load from AdrianLAB API
            const apiUrl = `${this.config.adrianLabMetadataUrl}/${tokenId}`;
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const metadata = await response.json();
                this.config.metadataCache.set(cacheKey, metadata);
                return metadata;
            }
        } catch (error) {
            console.warn(`Failed to load floppy metadata for token ${tokenId}:`, error);
        }

        // Return basic metadata
        return {
            tokenId: tokenId,
            name: `AdrianLAB Floppy #${tokenId}`,
            description: `Floppy disc from AdrianLAB collection`
        };
    }

    /**
     * Load metadata for an image
     */
    async loadMetadata(image) {
        // Check cache
        const cacheKey = `${image.tokenId}_${image.hash}`;
        if (this.config.metadataCache.has(cacheKey)) {
            return this.config.metadataCache.get(cacheKey);
        }

        try {
            // Try to load from API
            const apiUrl = `https://adrianlab.vercel.app/api/metadata/${image.tokenId}`;
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const metadata = await response.json();
                this.config.metadataCache.set(cacheKey, metadata);
                return metadata;
            }
        } catch (error) {
            console.warn(`Failed to load metadata for token ${image.tokenId}:`, error);
        }

        // Return basic metadata
        return {
            tokenId: image.tokenId,
            hash: image.hash,
            name: `AdrianZERO #${image.tokenId}`,
            description: `AdrianZERO NFT with trait hash: ${image.hash}`
        };
    }

    /**
     * Render modal content
     */
    renderModalContent(image, metadata) {
        this.modalContent.classList.remove('loading');
        
        const is3dModel = image.type === '3d-model';
        const isFloppy = image.type === 'floppy';
        const displayName = metadata.name || (is3dModel ? 'WEN LAMBO 3D Model' : (isFloppy ? `AdrianLAB Floppy #${image.tokenId}` : `AdrianZERO #${image.tokenId}`));
        const tokenIdText = is3dModel ? '3D Model: WEN LAMBO' : (isFloppy ? `AdrianLAB Token ID: #${image.tokenId}` : `Token ID: #${image.tokenId}`);
        const hashText = image.hash ? `<div class="trait-hash">Trait Hash: ${image.hash}</div>` : '';
        
        const imageContainer = document.createElement('div');
        imageContainer.className = 'modal-image-container';
        
        if (is3dModel) {
            // Create 3D model viewer for modal (single model, no tint)
            const modelWrapper = document.createElement('div');
            modelWrapper.className = 'modal-model-3d-wrapper';
            modelWrapper.style.cssText = `
                position: relative;
                width: 100%;
                height: 100%;
                min-height: 400px;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
            `;

            // Single model viewer (no tint, no overlay)
            const modelViewer = document.createElement('model-viewer');
            modelViewer.src = image.url;
            modelViewer.alt = '3D Model';
            modelViewer.setAttribute('camera-orbit', '0deg 75deg 2.5m'); // Further away to prevent clipping
            modelViewer.setAttribute('camera-target', '0m 0m 0m');
            modelViewer.setAttribute('field-of-view', '30deg'); // Smaller FOV = smaller model
            modelViewer.setAttribute('auto-rotate', '');
            modelViewer.setAttribute('auto-rotate-delay', '0');
            modelViewer.setAttribute('auto-rotate-speed', '0.3'); // Even slower for smoother rotation
            modelViewer.setAttribute('interaction-policy', 'allow-when-focused');
            modelViewer.setAttribute('render-scale', '2'); // Higher resolution
            modelViewer.setAttribute('exposure', '1.2');
            modelViewer.setAttribute('shadow-intensity', '0.5');
            modelViewer.setAttribute('disable-zoom', ''); // Disable zoom to prevent jumps
            modelViewer.setAttribute('camera-controls', ''); // Enable smooth camera controls
            modelViewer.style.cssText = `
                position: relative;
                width: 80%;
                height: 80%;
                max-width: 100%;
                max-height: 100%;
                background: transparent;
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
                transform-origin: center center;
            `;

            modelWrapper.appendChild(modelViewer);
            imageContainer.appendChild(modelWrapper);
        } else {
            // Regular image placeholder
            const placeholder = document.createElement('div');
            placeholder.className = 'modal-image-placeholder';
            placeholder.innerHTML = '<div class="loading-spinner"></div>';
            imageContainer.appendChild(placeholder);
        }
        
        const html = `
            ${imageContainer.outerHTML}
            <div class="modal-info">
                <h2>${displayName}</h2>
                <div class="token-id">${tokenIdText}</div>
                ${hashText}
                ${metadata.description ? `<p class="modal-description">${metadata.description}</p>` : ''}
                ${this.renderMetadataDetails(metadata)}
            </div>
        `;

        this.modalContent.innerHTML = html;

        // Load image or 3D model
        if (!is3dModel) {
            const modalImgContainer = this.modalContent.querySelector('.modal-image-container');
            const img = document.createElement('img');
            img.alt = displayName;
            
            const imgLoader = new Image();
            imgLoader.onload = () => {
                img.src = image.url;
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.3s ease-out';
                modalImgContainer.innerHTML = '';
                modalImgContainer.appendChild(img);
                requestAnimationFrame(() => {
                    img.style.opacity = '1';
                });
            };
            imgLoader.onerror = () => {
                modalImgContainer.innerHTML = '<div class="modal-image-placeholder">Failed to load image</div>';
            };
            imgLoader.src = image.url;
        }
    }

    /**
     * Render metadata details
     */
    renderMetadataDetails(metadata) {
        if (!metadata.attributes && !metadata.properties) {
            return '';
        }

        const attributes = metadata.attributes || metadata.properties || [];
        if (attributes.length === 0) return '';

        let html = '<div class="modal-metadata">';
        attributes.forEach(attr => {
            html += `
                <div class="modal-metadata-item">
                    <span class="modal-metadata-label">${attr.trait_type || attr.name}:</span>
                    <span class="modal-metadata-value">${attr.value}</span>
                </div>
            `;
        });
        html += '</div>';

        return html;
    }

    /**
     * Navigate modal (previous/next) - works with infinite scroll
     */
    navigateModal(direction) {
        const currentItem = this.gridElement.querySelector(`[data-index="${this.state.activeModalIndex}"]`);
        if (!currentItem) return;

        // Find all items in order
        const allItems = Array.from(this.gridElement.querySelectorAll('.grid-item'));
        const currentItemIndex = allItems.indexOf(currentItem);
        const newItemIndex = currentItemIndex + direction;

        if (newItemIndex >= 0 && newItemIndex < allItems.length) {
            const newItem = allItems[newItemIndex];
            const newIndex = parseInt(newItem.dataset.index);
            this.openModal(newIndex);
        }
    }

    /**
     * Update modal navigation buttons
     */
    updateModalNavigation() {
        const allItems = Array.from(this.gridElement.querySelectorAll('.grid-item'));
        const currentItem = this.gridElement.querySelector(`[data-index="${this.state.activeModalIndex}"]`);
        
        if (!currentItem) {
            this.modalPrev.disabled = true;
            this.modalNext.disabled = true;
            return;
        }

        const currentItemIndex = allItems.indexOf(currentItem);
        this.modalPrev.disabled = currentItemIndex <= 0;
        this.modalNext.disabled = currentItemIndex >= allItems.length - 1;
    }

    /**
     * Close modal
     */
    closeModal() {
        this.modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        this.state.activeModalIndex = -1;
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        if (this.loadingState) {
            this.loadingState.style.display = 'none';
        }
    }

    /**
     * Handle scroll with parallax effects (optimized, only for items near viewport)
     */
    handleScroll() {
        const scrollTop = this.gridWrapper.scrollTop;
        const scrollLeft = this.gridWrapper.scrollLeft;
        const viewportHeight = this.gridWrapper.clientHeight;
        const viewportWidth = this.gridWrapper.clientWidth;
        
        // Only process items near viewport for performance
        const items = Array.from(this.gridWrapper.querySelectorAll('.grid-item'));
        const viewportTop = scrollTop - 500; // Process items 500px before viewport
        const viewportBottom = scrollTop + viewportHeight + 500; // And 500px after
        
        items.forEach((item) => {
            const itemTop = item.offsetTop;
            const itemBottom = itemTop + item.offsetHeight;
            
            // Skip items far from viewport
            if (itemBottom < viewportTop || itemTop > viewportBottom) {
                return;
            }
            
            const itemLeft = item.offsetLeft;
            const itemCenterY = itemTop + item.offsetHeight / 2;
            const itemCenterX = itemLeft + item.offsetWidth / 2;
            
            // Calculate position relative to viewport center
            const relativeY = (itemCenterY - scrollTop - viewportHeight / 2) / viewportHeight;
            const relativeX = (itemCenterX - scrollLeft - viewportWidth / 2) / viewportWidth;
            
            // Subtle parallax movement
            const translateY = relativeY * 15; // Max 15px movement
            const translateX = relativeX * 15;
            
            // Store parallax values in data attributes (don't override 3D transforms)
            item.dataset.parallaxX = translateX;
            item.dataset.parallaxY = translateY;
            
            // Only apply if not hovering (3D effect takes priority)
            if (!item.matches(':hover')) {
                const currentTransform = item.style.transform;
                if (!currentTransform || !currentTransform.includes('perspective')) {
                    item.style.transform = `translate(${translateX}px, ${translateY}px)`;
                }
            }
        });
    }

    /**
     * Hide scroll indicator
     */
    hideScrollIndicator() {
        if (this.scrollIndicator) {
            this.scrollIndicator.classList.add('hidden');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (this.loadingState) {
            this.loadingState.innerHTML = `
                <div class="error-message">
                    <p>${message}</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #fff; color: #000; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Showcase();
    });
} else {
    new Showcase();
}

