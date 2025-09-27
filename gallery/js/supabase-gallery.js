// Supabase Gallery Integration
class SupabaseGalleryManager {
    constructor() {
        this.apiBase = '/api';
        this.allTraits = [];
        this.categories = [];
        this.currentFilters = {
            search: '',
            category: 'all',
            sortBy: 'rarity_score',
            sortDirection: 'desc',
            limit: 20,
            offset: 0
        };
        this.hasMoreTraits = true;
        this.isLoading = false;
    }

    async loadTraits() {
        try {
            this.isLoading = true;
            console.log('Loading traits from Supabase...');
            
            const response = await fetch(`${this.apiBase}/gallery?action=nfts&limit=100`);
            const data = await response.json();
            
            if (data.success) {
                this.allTraits = data.data || [];
                console.log('Loaded traits from Supabase:', this.allTraits.length);
                return this.allTraits;
            } else {
                console.error('API Error:', data.message);
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading traits from Supabase:', error);
            // Fallback to JSON file
            return await this.loadTraitsFromJSON();
        } finally {
            this.isLoading = false;
        }
    }

    async loadTraitsFromJSON() {
        try {
            const response = await fetch('./traitlab/json/traits.json');
            const data = await response.json();
            this.allTraits = data.traits || [];
            console.log('Loaded traits from JSON fallback:', this.allTraits.length);
            return this.allTraits;
        } catch (error) {
            console.error('Error loading traits from JSON:', error);
            throw error;
        }
    }

    async loadMoreTraits() {
        if (this.isLoading || !this.hasMoreTraits) {
            return this.allTraits;
        }

        try {
            this.isLoading = true;
            const newOffset = this.currentFilters.offset + this.currentFilters.limit;
            
            const response = await fetch(`${this.apiBase}/gallery?action=nfts&limit=${this.currentFilters.limit}&offset=${newOffset}`);
            const data = await response.json();
            
            if (data.success && data.data.length > 0) {
                this.allTraits = [...this.allTraits, ...data.data];
                this.currentFilters.offset = newOffset;
                console.log('Loaded more traits. Total:', this.allTraits.length);
            } else {
                this.hasMoreTraits = false;
                console.log('No more traits to load');
            }
            
            return this.allTraits;
        } catch (error) {
            console.error('Error loading more traits:', error);
            return this.allTraits;
        } finally {
            this.isLoading = false;
        }
    }

    async loadCategories() {
        try {
            const response = await fetch(`${this.apiBase}/gallery?action=categories`);
            const data = await response.json();
            
            if (data.success) {
                this.categories = data.data || [];
                console.log('Loaded categories from Supabase:', this.categories.length);
                return this.categories;
            } else {
                console.error('Error loading categories:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            return [];
        }
    }

    async getStats() {
        try {
            const response = await fetch(`${this.apiBase}/gallery?action=stats`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                console.error('Error loading stats:', data.message);
                return null;
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            return null;
        }
    }

    filterTraits(filters = {}) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        
        let filtered = this.allTraits.filter(trait => {
            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search.toLowerCase();
                const matchesSearch = 
                    trait.name?.toLowerCase().includes(searchTerm) ||
                    trait.description?.toLowerCase().includes(searchTerm) ||
                    trait.token_id?.toString().includes(searchTerm);
                
                if (!matchesSearch) return false;
            }

            // Category filter
            if (this.currentFilters.category && this.currentFilters.category !== 'all') {
                const matchesCategory = trait.categories?.includes(this.currentFilters.category);
                if (!matchesCategory) return false;
            }

            return true;
        });

        // Sort traits
        filtered.sort((a, b) => {
            let result = 0;
            switch (this.currentFilters.sortBy) {
                case 'name':
                    result = (a.name || '').localeCompare(b.name || '');
                    break;
                case 'rarity_score':
                    result = (b.rarity_score || 0) - (a.rarity_score || 0);
                    break;
                case 'token_id':
                    result = (a.token_id || 0) - (b.token_id || 0);
                    break;
                default:
                    result = 0;
            }
            
            if (this.currentFilters.sortDirection === 'asc') {
                result = -result;
            }
            
            return result;
        });

        return filtered;
    }

    // Convert Supabase NFT data to gallery format
    convertToGalleryFormat(nftData) {
        return {
            id: nftData.token_id,
            name: nftData.name || `Token #${nftData.token_id}`,
            description: nftData.description || '',
            image: nftData.image_base64 || nftData.image_url || '',
            category: nftData.categories?.[0] || 'unknown',
            categories: nftData.categories || [],
            rarity_score: nftData.rarity_score || 0,
            supply: nftData.supply || 1,
            attributes: nftData.attributes || [],
            contract_address: nftData.contract_address
        };
    }

    // Convert all traits to gallery format
    convertAllToGalleryFormat() {
        return this.allTraits.map(nft => this.convertToGalleryFormat(nft));
    }
}

// Global gallery manager instance
window.galleryManager = new SupabaseGalleryManager();
