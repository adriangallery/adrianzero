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
        this.batchSize = 20; // Initial load size
        this.isLoading = false;
        this.currentPage = 0;
        this.hasMoreTraits = true;
        this.alchemyApiKey = "5qIXA1UZxOAzi8b9l0nrYmsQBO9-W7Ot";
        this.alchemyBaseUrl = "https://base-mainnet.g.alchemy.com/nft/v3";
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
            return this.allTraits;
        }

        this.isLoading = true;

        try {
            // Load initial batch from database
            console.log('Loading initial traits from database...');
            await this.loadTraitsFromDatabase();
            
            this.isLoading = false;
            return this.allTraits;

        } catch (error) {
            console.error('Error loading traits:', error);
            this.isLoading = false;
            throw error;
        }
    }

    async loadMoreTraits() {
        if (this.isLoading || !this.hasMoreTraits) {
            return this.allTraits;
        }

        this.isLoading = true;

        try {
            console.log(`Loading more traits from database (page ${this.currentPage + 1})...`);
            await this.loadTraitsFromDatabase();
            
            this.isLoading = false;
            return this.allTraits;

        } catch (error) {
            console.error('Error loading more traits:', error);
            this.isLoading = false;
            throw error;
        }
    }

    // AdrianZERO NFT methods
    async loadNfts() {
        if (this.isLoading) {
            return this.allTraits;
        }

        this.isLoading = true;

        try {
            // Load initial batch from Alchemy
            console.log('Loading initial AdrianZERO NFTs from Alchemy...');
            await this.loadNftsFromAlchemy();
            
            this.isLoading = false;
            return this.allTraits;

        } catch (error) {
            console.error('Error loading NFTs:', error);
            this.isLoading = false;
            throw error;
        }
    }

    async loadMoreNfts() {
        if (this.isLoading || !this.hasMoreNfts()) {
            return this.allTraits;
        }

        this.isLoading = true;

        try {
            console.log(`Loading more AdrianZERO NFTs from Alchemy (page ${this.currentPage + 1})...`);
            await this.loadNftsFromAlchemy();
            
            this.isLoading = false;
            return this.allTraits;

        } catch (error) {
            console.error('Error loading more NFTs:', error);
            this.isLoading = false;
            throw error;
        }
    }

    async loadNftsFromAlchemy() {
        try {
            const contractAddress = window.ADRIANZERO_CONTRACT || "0x6e369bf0e4e0c106192d606fb6d85836d684da75";
            const pageKey = this.currentPage > 0 ? this.pageKey : null;
            
            let alchemyUrl = `${this.alchemyBaseUrl}/${this.alchemyApiKey}/getNFTsForCollection?contractAddress=${contractAddress}&withMetadata=true&pageSize=${this.batchSize}&tokenType=ERC721`;
            
            if (pageKey) {
                alchemyUrl += `&pageKey=${pageKey}`;
            }

            console.log(`Requesting AdrianZERO NFTs from Alchemy: ${alchemyUrl}`);
            
            const response = await fetch(alchemyUrl);
            if (!response.ok) {
                throw new Error(`Alchemy API error: ${response.status}`);
            }

            const data = await response.json();
            console.log(`Alchemy response:`, data);

            // Check if there are more pages
            this.pageKey = data.pageKey || null;
            this.hasMoreTraits = !!this.pageKey;

            // Process the NFTs
            const newNfts = data.nfts ? data.nfts.map(nft => this.processAlchemyNFT(nft)) : [];
            
            // Add to existing NFTs
            this.allTraits.push(...newNfts);
            this.currentPage++;

            console.log(`Loaded ${newNfts.length} new AdrianZERO NFTs (total: ${this.allTraits.length})`);
            return this.allTraits;

        } catch (error) {
            console.error('Error loading AdrianZERO NFTs from Alchemy:', error);
            throw error;
        }
    }

    hasMoreNfts() {
        return this.hasMoreTraits;
    }

    async loadTraitsFromDatabase() {
        try {
            console.log('Loading traits from local database...');
            
            // Load traits database from JSON (same as TraitLAB)
            let response;
            try {
                response = await fetch('./traitlab/json/traits.json');
                if (!response.ok) {
                    throw new Error(`Local file not found: ${response.status}`);
                }
            } catch (localError) {
                console.log('Local file failed, trying Vercel...');
                response = await fetch('https://adrianlab.vercel.app/labmetadata/traits.json');
                if (!response.ok) {
                    throw new Error(`Vercel file not found: ${response.status}`);
                }
            }

            const data = await response.json();
            console.log(`Traits database loaded:`, data);

            // Process traits with pagination
            const startIndex = this.currentPage * this.batchSize;
            const endIndex = startIndex + this.batchSize;
            const traitsSlice = data.traits.slice(startIndex, endIndex);
            
            // Check if there are more traits
            this.hasMoreTraits = endIndex < data.traits.length;

            // Process the traits (same as TraitLAB)
            const newTraits = traitsSlice.map(trait => this.processDatabaseTraitWithAlchemy(trait));
            
            // Add to existing traits
            this.allTraits.push(...newTraits);
            this.currentPage++;

            console.log(`Loaded ${newTraits.length} new traits (total: ${this.allTraits.length})`);
            return this.allTraits;

        } catch (error) {
            console.error('Error loading traits from database:', error);
            throw error;
        }
    }

    processDatabaseTraitWithAlchemy(trait) {
        const tokenId = parseInt(trait.tokenId);
        
        // Use the same image URL format as TraitLAB for traits
        const imageUrl = `https://adrianlab.vercel.app/labmetadata/traits/${trait.fileName}.png`;
        
        return {
            id: tokenId,
            name: trait.name || `Trait ${tokenId}`,
            description: trait.description || '',
            image: imageUrl,
            category: trait.category || 'Other',
            totalSupply: '0', // Not available in database
            maxSupply: trait.maxSupply || '1000',
            uri: '',
            metadata: trait,
            contractAddress: window.TRAITS_CONTRACT || "0x0995c0dA1ca071b792E852b6Ec531b7cD7d1F8D6"
        };
    }

    processDatabaseTrait(trait) {
        const tokenId = parseInt(trait.tokenId);
        
        return {
            id: tokenId,
            name: trait.name || `Trait ${tokenId}`,
            description: trait.description || '',
            image: null, // Will use CSS placeholder
            category: trait.category || 'Other',
            totalSupply: '0', // Not available in database
            maxSupply: trait.maxSupply || '1000',
            uri: '',
            metadata: trait,
            contractAddress: window.TRAITS_CONTRACT || "0x0995c0dA1ca071b792E852b6Ec531b7cD7d1F8D6"
        };
    }

    getTraitImageUrl(fileName, tokenId) {
        if (tokenId) {
            // Use Alchemy's cached image API
            return `https://base-mainnet.g.alchemy.com/nft/v3/${this.alchemyApiKey}/getNFTMetadata?contractAddress=${window.TRAITS_CONTRACT}&tokenId=${tokenId}&tokenType=ERC1155&refreshCache=false`;
        }
        return null; // Will use CSS placeholder
    }

    processAlchemyNFT(nft) {
        const metadata = nft.metadata || {};
        const tokenId = parseInt(nft.tokenId);
        
        // Check if this is an AdrianZERO NFT or a trait
        const isAdrianZERO = window.ADRIANZERO_CONTRACT && nft.contract?.address?.toLowerCase() === window.ADRIANZERO_CONTRACT.toLowerCase();
        
        if (isAdrianZERO) {
            // Process as AdrianZERO NFT
            return {
                id: tokenId,
                name: metadata.name || `AdrianZERO #${tokenId}`,
                description: metadata.description || '',
                image: this.getAdrianZEROImageUrl(tokenId),
                attributes: metadata.attributes || [],
                rarity: this.calculateRarity(metadata.attributes || []),
                totalSupply: nft.totalSupply || '0',
                maxSupply: nft.maxSupply || '1000',
                uri: nft.tokenUri?.raw || '',
                metadata: metadata,
                contractAddress: nft.contract?.address || window.ADRIANZERO_CONTRACT
            };
        } else {
            // Process as trait
            return {
                id: tokenId,
                name: metadata.name || `Trait ${tokenId}`,
                description: metadata.description || '',
                image: this.getImageUrl(metadata.image, tokenId),
                category: this.categorizeTrait(metadata.name || `Trait ${tokenId}`),
                totalSupply: nft.totalSupply || '0',
                maxSupply: nft.maxSupply || '1000',
                uri: nft.tokenUri?.raw || '',
                metadata: metadata,
                contractAddress: nft.contract?.address || window.TRAITS_CONTRACT
            };
        }
    }

    getAdrianZEROImageUrl(tokenId) {
        // Use the same image URL format as TraitLAB for AdrianZERO NFTs
        return `https://adrianlab.vercel.app/api/render/${tokenId}.png`;
    }

    calculateRarity(attributes) {
        // Simple rarity calculation based on attributes
        if (!attributes || attributes.length === 0) return 0;
        
        let rarity = 0;
        attributes.forEach(attr => {
            // Add points based on trait value uniqueness
            rarity += Math.random() * 10; // Placeholder calculation
        });
        
        return Math.floor(rarity);
    }

    getImageUrl(imageUrl, tokenId) {
        if (imageUrl) {
            // Handle different URL formats
            if (imageUrl.startsWith('ipfs://')) {
                return imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            return imageUrl;
        }
        
        // Return null for placeholder - will be handled by CSS
        return null;
    }

    async loadBatchTraitsWithRetry(startId, endId, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.loadBatchTraits(startId, endId);
            } catch (error) {
                console.warn(`Attempt ${attempt} failed for batch ${startId}-${endId}:`, error.message);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Exponential backoff: wait longer each retry
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    async loadBatchTraits(startId, endId) {
        const batchPromises = [];
        
        // Load traits sequentially to avoid rate limiting
        for (let id = startId; id <= endId; id++) {
            batchPromises.push(this.loadSingleTraitWithDelay(id));
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

    async loadSingleTraitWithDelay(id) {
        try {
            const trait = await this.loadSingleTrait(id);
            // Small delay between each trait to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
            return trait;
        } catch (error) {
            // If rate limited, wait longer
            if (error.message.includes('rate limit') || error.message.includes('429')) {
                console.warn(`Rate limited for trait ${id}, waiting...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return null;
            }
            throw error;
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

    hasMore() {
        return this.hasMoreTraits;
    }

    isLoadingMore() {
        return this.isLoading;
    }

    reset() {
        this.allTraits = [];
        this.currentPage = 0;
        this.hasMoreTraits = true;
        this.pageKey = null;
        this.isLoading = false;
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
