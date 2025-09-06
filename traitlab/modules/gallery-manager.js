/**
 * Gallery Manager Module
 * Handles efficient loading and caching of ERC1155 traits for the gallery
 */

class GalleryManager {
    constructor() {
        this.traitsContract = null;
        this.allTraits = [];
        this.cache = new Map();
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
        this.batchSize = 50; // Load traits in batches
        this.isLoading = false;
    }

    async initialize(provider, signer) {
        try {
            // Initialize contract
            const traitsABI = [
                "function uri(uint256 id) external view returns (string memory)",
                "function totalSupply(uint256 id) external view returns (uint256)",
                "function maxSupply(uint256 id) external view returns (uint256)",
                "function balanceOf(address account, uint256 id) external view returns (uint256)",
                "function supportsInterface(bytes4 interfaceId) external view returns (bool)"
            ];

            this.traitsContract = new ethers.Contract(
                window.TRAITS_CONTRACT || "0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea",
                traitsABI,
                provider
            );

            console.log('Gallery Manager initialized');
            return true;
        } catch (error) {
            console.error('Error initializing Gallery Manager:', error);
            return false;
        }
    }

    async loadTraits(forceRefresh = false) {
        if (this.isLoading) {
            console.log('Already loading traits...');
            return;
        }

        this.isLoading = true;

        try {
            // Check cache first
            if (!forceRefresh && this.isCacheValid()) {
                console.log('Loading traits from cache...');
                this.allTraits = this.getCachedTraits();
                this.isLoading = false;
                return this.allTraits;
            }

            console.log('Loading traits from contract...');
            await this.loadTraitsFromContract();
            
            // Cache the results
            this.cacheTraits();
            
            this.isLoading = false;
            return this.allTraits;

        } catch (error) {
            console.error('Error loading traits:', error);
            this.isLoading = false;
            throw error;
        }
    }

    async loadTraitsFromContract() {
        const traits = [];
        const maxId = 1000; // Adjust based on your collection size
        
        // Load traits in batches to avoid overwhelming the contract
        for (let startId = 1; startId <= maxId; startId += this.batchSize) {
            const endId = Math.min(startId + this.batchSize - 1, maxId);
            console.log(`Loading traits ${startId}-${endId}...`);
            
            const batchTraits = await this.loadBatchTraits(startId, endId);
            traits.push(...batchTraits);
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.allTraits = traits.filter(trait => trait !== null);
        console.log(`Loaded ${this.allTraits.length} traits`);
    }

    async loadBatchTraits(startId, endId) {
        const batchPromises = [];
        
        for (let id = startId; id <= endId; id++) {
            batchPromises.push(this.loadSingleTrait(id));
        }

        try {
            const results = await Promise.allSettled(batchPromises);
            return results
                .filter(result => result.status === 'fulfilled' && result.value !== null)
                .map(result => result.value);
        } catch (error) {
            console.error(`Error loading batch ${startId}-${endId}:`, error);
            return [];
        }
    }

    async loadSingleTrait(id) {
        try {
            // Check if trait exists by trying to get its URI
            const uri = await this.traitsContract.uri(id);
            if (!uri || uri === '') {
                return null;
            }

            // Get supply information
            const [totalSupply, maxSupply] = await Promise.all([
                this.traitsContract.totalSupply(id).catch(() => ethers.BigNumber.from(0)),
                this.traitsContract.maxSupply(id).catch(() => ethers.BigNumber.from(0))
            ]);

            // Load metadata from URI
            const metadata = await this.loadMetadata(uri);

            return {
                id: id,
                name: metadata.name || `Trait ${id}`,
                description: metadata.description || '',
                image: metadata.image || this.getDefaultImage(id),
                category: this.categorizeTrait(metadata.name || `Trait ${id}`),
                totalSupply: totalSupply.toString(),
                maxSupply: maxSupply.toString(),
                uri: uri,
                metadata: metadata
            };

        } catch (error) {
            // Trait doesn't exist or error loading
            return null;
        }
    }

    async loadMetadata(uri) {
        try {
            // Handle different URI formats
            let metadataUri = uri;
            if (uri.startsWith('ipfs://')) {
                metadataUri = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
            } else if (uri.includes('{id}')) {
                // Handle template URIs - would need to replace {id} with actual ID
                metadataUri = uri.replace('{id}', '0');
            }

            const response = await fetch(metadataUri);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.warn(`Error loading metadata from ${uri}:`, error);
            return {
                name: `Trait ${uri}`,
                description: '',
                image: this.getDefaultImage(0)
            };
        }
    }

    getDefaultImage(id) {
        // Generate a placeholder image or use a default
        return `https://via.placeholder.com/200x200/00ff00/000000?text=Trait+${id}`;
    }

    categorizeTrait(name) {
        const categories = {
            'Background': ['background', 'bg', 'sky', 'ground'],
            'Body': ['body', 'skin', 'torso', 'chest'],
            'Eyes': ['eye', 'eyes', 'glasses', 'sunglasses'],
            'Mouth': ['mouth', 'smile', 'frown', 'teeth'],
            'Accessories': ['hat', 'cap', 'glasses', 'mask', 'jewelry'],
            'Special': ['special', 'rare', 'legendary', 'unique']
        };

        const nameLower = name.toLowerCase();
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => nameLower.includes(keyword))) {
                return category;
            }
        }

        return 'Other';
    }

    isCacheValid() {
        const cacheTime = localStorage.getItem('adrianzero_traits_cache_time');
        if (!cacheTime) return false;
        
        const now = Date.now();
        const cacheAge = now - parseInt(cacheTime);
        return cacheAge < this.cacheExpiry;
    }

    getCachedTraits() {
        const cachedData = localStorage.getItem('adrianzero_traits_cache');
        return cachedData ? JSON.parse(cachedData) : [];
    }

    cacheTraits() {
        localStorage.setItem('adrianzero_traits_cache', JSON.stringify(this.allTraits));
        localStorage.setItem('adrianzero_traits_cache_time', Date.now().toString());
        console.log('Traits cached successfully');
    }

    clearCache() {
        localStorage.removeItem('adrianzero_traits_cache');
        localStorage.removeItem('adrianzero_traits_cache_time');
        console.log('Cache cleared');
    }

    getTraits() {
        return this.allTraits;
    }

    getTraitById(id) {
        return this.allTraits.find(trait => trait.id === id);
    }

    searchTraits(query) {
        const searchTerm = query.toLowerCase();
        return this.allTraits.filter(trait => 
            trait.name.toLowerCase().includes(searchTerm) ||
            trait.description.toLowerCase().includes(searchTerm) ||
            trait.category.toLowerCase().includes(searchTerm)
        );
    }

    filterTraitsByCategory(category) {
        if (!category) return this.allTraits;
        return this.allTraits.filter(trait => trait.category === category);
    }

    getCategories() {
        const categories = [...new Set(this.allTraits.map(trait => trait.category))];
        return categories.sort();
    }

    sortTraits(traits, sortBy) {
        const sortedTraits = [...traits];
        
        switch (sortBy) {
            case 'name':
                return sortedTraits.sort((a, b) => a.name.localeCompare(b.name));
            case 'id':
                return sortedTraits.sort((a, b) => a.id - b.id);
            case 'supply':
                return sortedTraits.sort((a, b) => parseInt(b.totalSupply) - parseInt(a.totalSupply));
            case 'category':
                return sortedTraits.sort((a, b) => a.category.localeCompare(b.category));
            default:
                return sortedTraits;
        }
    }

    paginateTraits(traits, page, itemsPerPage) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return {
            items: traits.slice(startIndex, endIndex),
            totalPages: Math.ceil(traits.length / itemsPerPage),
            currentPage: page,
            totalItems: traits.length
        };
    }
}

// Export for use in other modules
window.GalleryManager = GalleryManager;
