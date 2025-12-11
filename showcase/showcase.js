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
            totalItemsRendered: 0 // Track total items rendered for infinite loop
        };

        // Intersection Observer for lazy loading
        this.imageObserver = null;
        this.scrollObserver = null;

        this.init();
    }

    async init() {
        try {
            await Promise.all([
                this.loadImageList(),
                this.loadFloppyGifs()
            ]);
            this.setupObservers();
            this.setupEventListeners();
            this.hideLoading();
            this.renderInitialGrid();
        } catch (error) {
            console.error('Error initializing showcase:', error);
            this.showError('Failed to load collection. Please refresh the page.');
        }
    }

    /**
     * Load list of floppy GIFs
     */
    async loadFloppyGifs() {
        // List of floppy GIFs (can be loaded from server or hardcoded for now)
        const floppyFiles = [
            '10000.gif', '10001.gif', '10002.gif', '10003.gif', '10004.gif',
            '10005.gif', '10009.gif', '10010.gif', '10013.gif', '10014.gif',
            '10015.gif', '262144.gif', '262145.gif', '262146.gif', '262147.gif'
        ];

        this.floppyGifs = floppyFiles.map(filename => {
            const match = filename.match(/^(\d+)\.gif$/);
            const tokenId = match ? parseInt(match[1], 10) : null;
            return {
                filename,
                tokenId,
                url: `${this.config.floppyGifPath}${filename}`,
                type: 'floppy'
            };
        }).filter(gif => gif.tokenId !== null);

        // Shuffle for variety
        this.shuffleArray(this.floppyGifs);
        
        console.log(`Loaded ${this.floppyGifs.length} floppy GIFs`);
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
                rootMargin: '100px', // Start loading 100px before visible for smoother experience
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
                rootMargin: '200px',
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
     * Handle mouse move for 3D effects (optimized)
     */
    handleMouseMove(e) {
        const rect = this.gridWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.state.mouseX = x;
        this.state.mouseY = y;

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
            
            // Combine swing animation with mouse movement
            // Get swing offset based on time and item index for variation
            const itemIndex = parseInt(item.dataset.index) || 0;
            const swingTime = Date.now() / 2000; // Slow swing
            const swingOffset = (itemIndex % 8) * 0.5; // Vary per item
            const swingX = Math.sin(swingTime + swingOffset) * 2; // Max 2 degrees
            const swingY = Math.cos(swingTime + swingOffset) * 2; // Max 2 degrees
            const swingZ = Math.sin(swingTime * 0.7 + swingOffset) * 3; // Max 3px depth
            
            // Combine mouse movement with swing (swing is subtle when mouse is active)
            const combinedRotateX = rotateX + (swingX * (1 - intensity * 0.5));
            const combinedRotateY = rotateY + (swingY * (1 - intensity * 0.5));
            const combinedTranslateZ = translateZ + swingZ;
            
            if (isHovered) {
                // When hovered, CSS handles the transform, just pause animation
                item.style.animationPlayState = 'paused';
            } else {
                // Normal 3D movement - combine with CSS swing animation
                // Apply additional transforms on top of CSS animation
                item.style.transform = `translate3d(${parallaxX}px, ${parallaxY}px, ${parallaxZ}px) perspective(1000px) rotateX(${combinedRotateX}deg) rotateY(${combinedRotateY}deg) scale(${scale}) translateZ(${combinedTranslateZ}px)`;
                item.style.animationPlayState = 'running';
            }
        });
    }

    /**
     * Reset 3D effects when mouse leaves
     */
    handleMouseLeave() {
        const items = this.gridWrapper.querySelectorAll('.grid-item');
        items.forEach(item => {
            item.style.transform = '';
        });
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
        
        // Check if this should be a floppy GIF (1 in every gifFrequency)
        const isFloppyGif = (index % this.config.gifFrequency === 0);
        let floppyGif = null;
        
        if (isFloppyGif) {
            floppyGif = this.getRandomFloppyGif();
            if (floppyGif) {
                item.classList.add('grid-item-gif');
                item.dataset.isGif = 'true';
                item.dataset.floppyTokenId = floppyGif.tokenId;
                item.dataset.type = 'floppy';
            }
        }
        
        if (!isFloppyGif || !floppyGif) {
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

        if (isFloppyGif && floppyGif) {
            // Create floppy GIF element
            const gif = document.createElement('img');
            gif.src = floppyGif.url;
            gif.alt = `AdrianLAB Floppy #${floppyGif.tokenId}`;
            gif.className = 'gif-image';
            gif.dataset.loaded = 'true';
            gif.dataset.tokenId = floppyGif.tokenId;
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

        // Click handler - capture variables in closure
        const itemIndex = index;
        const isFloppy = isFloppyGif && floppyGif;
        item.addEventListener('click', () => {
            if (isFloppy) {
                this.openModal(itemIndex, 'floppy');
            } else {
                this.openModal(itemIndex, 'adrianzero');
            }
        });

        return item;
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

        if (type === 'floppy') {
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
        
        // Create placeholder first
        const placeholder = document.createElement('div');
        placeholder.className = 'modal-image-placeholder';
        placeholder.innerHTML = '<div class="loading-spinner"></div>';
        
        const imageContainer = document.createElement('div');
        imageContainer.className = 'modal-image-container';
        imageContainer.appendChild(placeholder);
        
        const isFloppy = image.type === 'floppy';
        const displayName = metadata.name || (isFloppy ? `AdrianLAB Floppy #${image.tokenId}` : `AdrianZERO #${image.tokenId}`);
        const tokenIdText = isFloppy ? `AdrianLAB Token ID: #${image.tokenId}` : `Token ID: #${image.tokenId}`;
        const hashText = image.hash ? `<div class="trait-hash">Trait Hash: ${image.hash}</div>` : '';
        
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

        // Preload modal image with smooth loading
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

