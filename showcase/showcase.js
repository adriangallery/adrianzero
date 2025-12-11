/**
 * AdrianZERO Showcase - Interactive Grid Gallery
 * Features: 3D effects, lazy loading, metadata cards, infinite scroll
 */

class Showcase {
    constructor() {
        this.images = [];
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
            metadataCache: new Map()
        };

        // State
        this.state = {
            isLoading: false,
            hasMore: true,
            currentPage: 1,
            activeModalIndex: -1,
            mouseX: 0,
            mouseY: 0
        };

        // Intersection Observer for lazy loading
        this.imageObserver = null;
        this.scrollObserver = null;

        this.init();
    }

    async init() {
        try {
            await this.loadImageList();
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

            console.log(`Loaded ${this.images.length} valid images from ${allPngFiles.length} PNG files`);
        } catch (error) {
            console.error('Error loading image list:', error);
            throw error;
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

        // Observer for scroll-based loading
        this.scrollObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && this.state.hasMore) {
                        this.loadMoreItems();
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

        // Scroll indicator and scroll animations
        let scrollRafId = null;
        let lastScrollTop = 0;
        this.gridWrapper.addEventListener('scroll', () => {
            if (scrollRafId === null) {
                scrollRafId = requestAnimationFrame(() => {
                    this.handleScroll();
                    const currentScrollTop = this.gridWrapper.scrollTop;
                    lastScrollTop = currentScrollTop;
                    scrollRafId = null;
                });
            }
            this.hideScrollIndicator();
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
            if (item.matches(':hover')) {
                // Only apply parallax, let CSS handle the flip
                const parallaxX = parseFloat(item.dataset.parallaxX) || 0;
                const parallaxY = parseFloat(item.dataset.parallaxY) || 0;
                item.style.transform = `translate(${parallaxX}px, ${parallaxY}px) translateY(-5px) scale(1.03)`;
                return;
            }
            
            const itemRect = item.getBoundingClientRect();
            const itemCenterX = itemRect.left + itemRect.width / 2;
            const itemCenterY = itemRect.top + itemRect.height / 2;
            
            const deltaX = (e.clientX - itemCenterX) / itemRect.width;
            const deltaY = (e.clientY - itemCenterY) / itemRect.height;
            
            // Calculate distance from center for intensity
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const intensity = Math.min(distance * 1.5, 1);
            
            const rotateX = deltaY * 5 * intensity; // Max 5 degrees
            const rotateY = deltaX * -5 * intensity; // Max -5 degrees
            const scale = 1 + (intensity * 0.02); // Subtle scale
            
            // Combine with parallax if exists
            const parallaxX = parseFloat(item.dataset.parallaxX) || 0;
            const parallaxY = parseFloat(item.dataset.parallaxY) || 0;
            
            item.style.transform = `translate(${parallaxX}px, ${parallaxY}px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
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
        initialItems.forEach((image, index) => {
            this.createGridItem(image, index);
        });

        // Create sentinel for infinite scroll
        this.createScrollSentinel();
    }

    /**
     * Create a grid item element with staggered animation
     */
    createGridItem(image, index) {
        const item = document.createElement('div');
        item.className = 'grid-item';
        item.dataset.index = index;
        item.dataset.tokenId = image.tokenId;
        item.dataset.hash = image.hash;
        
        // Stagger animation delay based on index
        const delay = (index % 20) * 0.03; // Max 0.6s delay
        item.style.animationDelay = `${delay}s`;

        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';

        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';

        const img = document.createElement('img');
        img.dataset.src = image.url;
        img.dataset.index = index;
        img.alt = `AdrianZERO #${image.tokenId}`;

        imageContainer.appendChild(placeholder);
        imageContainer.appendChild(img);
        item.appendChild(imageContainer);

        // Click handler
        item.addEventListener('click', () => {
            this.openModal(index);
        });

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
     * Create scroll sentinel for infinite loading
     */
    createScrollSentinel() {
        const sentinel = document.createElement('div');
        sentinel.className = 'scroll-sentinel';
        sentinel.style.height = '1px';
        sentinel.style.gridColumn = '1 / -1';
        this.gridElement.appendChild(sentinel);
        this.scrollObserver.observe(sentinel);
    }

    /**
     * Load more items when scrolling
     */
    loadMoreItems() {
        if (this.state.isLoading || !this.state.hasMore) return;

        const currentCount = this.gridElement.children.length - 1; // -1 for sentinel
        const nextBatch = this.images.slice(currentCount, currentCount + this.config.itemsPerPage);

        if (nextBatch.length === 0) {
            this.state.hasMore = false;
            return;
        }

        this.state.isLoading = true;

        // Remove sentinel temporarily
        const sentinel = this.gridElement.querySelector('.scroll-sentinel');
        if (sentinel) sentinel.remove();

        // Add new items
        nextBatch.forEach((image, i) => {
            const index = currentCount + i;
            this.createGridItem(image, index);
        });

        // Re-add sentinel
        this.createScrollSentinel();

        this.state.isLoading = false;
    }

    /**
     * Open modal with metadata
     */
    async openModal(index) {
        if (index < 0 || index >= this.images.length) return;

        this.state.activeModalIndex = index;
        const image = this.images[index];
        
        this.modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Show loading state
        this.modalContent.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p class="loading-text">Loading metadata...</p></div>';
        this.modalContent.classList.add('loading');

        // Load metadata
        const metadata = await this.loadMetadata(image);
        this.renderModalContent(image, metadata);

        // Update navigation buttons
        this.updateModalNavigation();
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
        
        const html = `
            ${imageContainer.outerHTML}
            <div class="modal-info">
                <h2>${metadata.name || `AdrianZERO #${image.tokenId}`}</h2>
                <div class="token-id">Token ID: #${image.tokenId}</div>
                <div class="trait-hash">Trait Hash: ${image.hash}</div>
                ${metadata.description ? `<p class="modal-description">${metadata.description}</p>` : ''}
                ${this.renderMetadataDetails(metadata)}
            </div>
        `;

        this.modalContent.innerHTML = html;

        // Preload modal image with smooth loading
        const modalImgContainer = this.modalContent.querySelector('.modal-image-container');
        const img = document.createElement('img');
        img.alt = metadata.name || `AdrianZERO #${image.tokenId}`;
        
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
     * Navigate modal (previous/next)
     */
    navigateModal(direction) {
        const newIndex = this.state.activeModalIndex + direction;
        if (newIndex >= 0 && newIndex < this.images.length) {
            this.openModal(newIndex);
        }
    }

    /**
     * Update modal navigation buttons
     */
    updateModalNavigation() {
        this.modalPrev.disabled = this.state.activeModalIndex <= 0;
        this.modalNext.disabled = this.state.activeModalIndex >= this.images.length - 1;
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

