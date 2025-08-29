/**
 * TRAITLAB - Módulo de Crafting
 * Maneja el sistema de recetas para quemar traits y crear nuevos tokens
 */

class TraitLABCrafting {
    constructor() {
        this.recipes = [];
        this.userBalances = new Map();
        this.selectedTraits = new Map(); // traitId => amount
        this.currentRecipe = null;
        this.eventListeners = new Map();
        
        // Bind methods
        this.loadRecipes = this.loadRecipes.bind(this);
        this.loadUserBalances = this.loadUserBalances.bind(this);
        this.selectTrait = this.selectTrait.bind(this);
        this.deselectTrait = this.deselectTrait.bind(this);
        this.craftSpecific = this.craftSpecific.bind(this);
        this.craftAny = this.craftAny.bind(this);
        this.on = this.on.bind(this);
        this.emit = this.emit.bind(this);
        
        console.log('🔨 TraitLABCrafting: Módulo inicializado');
    }

    /**
     * Event system for communication with other modules
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => callback(data));
        }
    }

    /**
     * Load all available recipes from the contract
     */
    async loadRecipes() {
        console.log('🔨 TraitLABCrafting: Cargando recetas...');
        
        try {
            // Load ethers dynamically if needed
            let ethers;
            if (typeof window.ethers === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        ethers = window.ethers;
                        console.log('Ethers loaded successfully');
                        this.loadRecipesFromContract(ethers)
                            .then(resolve)
                            .catch(reject);
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load ethers library'));
                    };
                    document.head.appendChild(script);
                });
            } else {
                ethers = window.ethers;
                return await this.loadRecipesFromContract(ethers);
            }
        } catch (error) {
            console.error('Error loading recipes:', error);
            throw error;
        }
    }

    /**
     * Set available traits from external source (e.g., from traits tab)
     */
    setAvailableTraits(traits) {
        console.log('🔨 TraitLABCrafting: Estableciendo traits disponibles:', traits.length);
        this.availableTraits = traits;
        this.emit('traitsLoaded', { traits: this.availableTraits });
    }

    /**
     * Load available traits for crafting (ERC1155 from AdrianLAB)
     * This method is now deprecated in favor of setAvailableTraits
     */
    async loadAvailableTraits() {
        console.log('🔨 TraitLABCrafting: loadAvailableTraits deprecated, use setAvailableTraits instead');
        
        // If we already have traits, return them
        if (this.availableTraits && this.availableTraits.length > 0) {
            console.log('🔨 TraitLABCrafting: Traits ya cargados, retornando existentes');
            return this.availableTraits;
        }
        
        // Fallback: try to load from wallet if available
        try {
            if (typeof window.TraitLABWallet !== 'undefined' && window.TraitLABWallet.getCurrentAccount) {
                const userAddress = window.TraitLABWallet.getCurrentAccount();
                console.log('🔨 TraitLABCrafting: Cargando traits desde wallet, address:', userAddress);
                
                // Load ERC1155 traits from AdrianLAB contract
                const contractAddress = window.TraitLABConfig.CONTRACTS.ERC1155;
                const tokenType = "ERC1155";
                
                // Load all traits with pagination
                let allTraits = [];
                let pageKey = null;
                let hasMore = true;
                let pageCount = 0;
                
                while (hasMore) {
                    pageCount++;
                    console.log(`Loading traits page ${pageCount}...`);
                    
                    // Build URL with pagination and correct endpoint
                    let alchemyUrl = `https://base-mainnet.g.alchemy.com/nft/v3/${window.TraitLABConfig.ALCHEMY_API_KEY}/getNFTsForOwner?owner=${userAddress}&contractAddresses[]=${contractAddress}&withMetadata=true&pageSize=100&tokenType=${tokenType}`;
                    
                    if (pageKey) {
                        alchemyUrl += `&pageKey=${pageKey}`;
                    }
                    
                    const alchemyResponse = await fetch(alchemyUrl);
                    
                    if (!alchemyResponse.ok) {
                        throw new Error(`Error getting traits from Alchemy API: ${alchemyResponse.status}`);
                    }
                    
                    const nftsData = await alchemyResponse.json();
                    console.log(`Page ${pageCount}: ${nftsData.ownedNfts?.length || 0} traits received`);
                    
                    // Add traits from this page
                    if (nftsData.ownedNfts && nftsData.ownedNfts.length > 0) {
                        allTraits = allTraits.concat(nftsData.ownedNfts);
                    }
                    
                    // Check if there are more pages
                    pageKey = nftsData.pageKey;
                    hasMore = !!pageKey;
                    
                    // Optional: Add a small delay to avoid rate limiting
                    if (hasMore) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                
                console.log(`Total traits loaded: ${allTraits.length} from ${pageCount} pages`);
                
                // Process traits and store them
                this.availableTraits = allTraits.map(nft => {
                    try {
                        // Extract tokenId
                        let tokenId;
                        if (nft.tokenId) {
                            tokenId = nft.tokenId;
                        } else if (nft.id && nft.id.tokenId) {
                            tokenId = nft.id.tokenId;
                        } else {
                            console.error("No tokenId found in trait:", nft);
                            return null;
                        }
                        
                        // Convert tokenId to integer
                        let tokenIdInt;
                        if (typeof tokenId === 'number') {
                            tokenIdInt = tokenId;
                        } else if (tokenId.startsWith('0x')) {
                            tokenIdInt = parseInt(tokenId, 16);
                        } else {
                            tokenIdInt = parseInt(tokenId, 10);
                        }
                        
                        if (isNaN(tokenIdInt)) {
                            console.error("Invalid tokenId format:", tokenId);
                            return null;
                        }
                        
                        // Extract title/name
                        let title = `Trait #${tokenIdInt}`;
                        if (nft.title) {
                            title = nft.title;
                        } else if (nft.metadata && nft.metadata.name) {
                            title = nft.metadata.name;
                        }
                        
                        // Extract image
                        let image = '';
                        if (nft.metadata && nft.metadata.image) {
                            image = nft.metadata.image;
                        } else if (nft.media && nft.media.length > 0 && nft.media[0].gateway) {
                            image = nft.media[0].gateway;
                        }
                        
                        return {
                            tokenId: tokenIdInt,
                            title: title,
                            image: image,
                            contract: contractAddress,
                            tokenType: tokenType,
                            metadata: nft.metadata || {}
                        };
                    } catch (error) {
                        console.error('Error processing trait:', error, nft);
                        return null;
                    }
                }).filter(trait => trait !== null);
                
                console.log('🔨 TraitLABCrafting: Traits procesados:', this.availableTraits);
                
                // Emit event
                this.emit('traitsLoaded', { traits: this.availableTraits });
                
                return this.availableTraits;
            } else {
                console.log('🔨 TraitLABCrafting: Wallet no disponible, retornando array vacío');
                return [];
            }
            
        } catch (error) {
            console.error('Error loading available traits:', error);
            throw error;
        }
    }

    /**
     * Load recipes from the smart contract
     */
    async loadRecipesFromContract(ethers) {
        try {
            console.log('🔨 TraitLABCrafting: Cargando recetas desde contrato...');
            
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            // AdrianCrafting contract
            const ADRIAN_CRAFTING_CONTRACT = window.TraitLABConfig.ADRIAN_CRAFTING_CONTRACT;
            console.log('🔨 TraitLABCrafting: Contrato:', ADRIAN_CRAFTING_CONTRACT);
            
            // Contract ABI for recipe functions
            const contractABI = [
                "function getSpecificRecipe(uint256 recipeId) view returns (bool active, uint256[] burnIds, uint256[] burnAmounts, uint256 outId, uint256 outAmount)",
                "function getAnyRecipe(uint256 recipeId) view returns (bool active, uint256 burnTotal, uint256 outId, uint256 outAmount)"
            ];

            const contract = new ethers.Contract(ADRIAN_CRAFTING_CONTRACT, contractABI, signer);
            console.log('🔨 TraitLABCrafting: Contrato creado:', !!contract);
            
            // For now, we'll use a curated list of recipe IDs
            // In production, you'd index events to get all recipe IDs
            const recipeIds = [1, 2, 3, 4, 5]; // Example IDs
            console.log('🔨 TraitLABCrafting: Probando IDs de recetas:', recipeIds);
            
            const recipes = [];
            
            for (const recipeId of recipeIds) {
                console.log(`🔨 TraitLABCrafting: Probando receta ${recipeId}...`);
                
                try {
                    // Try specific recipe first
                    console.log(`🔨 TraitLABCrafting: Llamando getSpecificRecipe(${recipeId})...`);
                    const specificRecipe = await contract.getSpecificRecipe(recipeId);
                    console.log(`🔨 TraitLABCrafting: Respuesta specificRecipe:`, specificRecipe);
                    
                    if (specificRecipe.active) {
                        console.log(`🔨 TraitLABCrafting: Receta específica ${recipeId} activa`);
                        
                        // Find output trait information
                        const outputTrait = this.availableTraits ? this.availableTraits.find(trait => trait.tokenId === parseInt(specificRecipe.outId.toString())) : null;
                        // Fallback: fetch image from Alchemy if not in wallet
                        let outputImage = outputTrait ? outputTrait.image : '';
                        let outputTitle = outputTrait ? outputTrait.title : `Trait #${specificRecipe.outId}`;
                        if (!outputImage) {
                            try {
                                const alch = await this.fetchOutputTraitFromAlchemy(specificRecipe.outId.toString());
                                if (alch && (alch.image || alch.media)) {
                                    outputImage = alch.image || (alch.media && alch.media[0] && alch.media[0].gateway) || '';
                                    if (alch.title) outputTitle = alch.title;
                                }
                            } catch (e) {
                                console.warn('Could not fetch output image from Alchemy:', e.message);
                            }
                        }
                        
                        recipes.push({
                            type: 'specific',
                            recipeId: recipeId,
                            active: specificRecipe.active,
                            burn: specificRecipe.burnIds.map((id, index) => ({
                                id: id.toString(),
                                amount: specificRecipe.burnAmounts[index].toString(),
                                userBalance: 0 // Will be filled later
                            })),
                            output: {
                                id: specificRecipe.outId.toString(),
                                amount: specificRecipe.outAmount.toString(),
                                title: outputTitle,
                                image: outputImage,
                                metadata: outputTrait ? outputTrait.metadata : {}
                            },
                            eligible: false // Will be calculated after loading balances
                        });
                        continue;
                    } else {
                        console.log(`🔨 TraitLABCrafting: Receta específica ${recipeId} inactiva`);
                    }
                } catch (error) {
                    console.log(`🔨 TraitLABCrafting: Error en receta específica ${recipeId}:`, error.message);
                    // Recipe doesn't exist or is inactive, try any recipe
                }
                
                try {
                    console.log(`🔨 TraitLABCrafting: Llamando getAnyRecipe(${recipeId})...`);
                    const anyRecipe = await contract.getAnyRecipe(recipeId);
                    console.log(`🔨 TraitLABCrafting: Respuesta anyRecipe:`, anyRecipe);
                    
                    if (anyRecipe.active) {
                        console.log(`🔨 TraitLABCrafting: Receta general ${recipeId} activa`);
                        
                        // Find output trait information
                        const outputTrait = this.availableTraits ? this.availableTraits.find(trait => trait.tokenId === parseInt(anyRecipe.outId.toString())) : null;
                        // Fallback: fetch image from Alchemy if not in wallet
                        let outputImage = outputTrait ? outputTrait.image : '';
                        let outputTitle = outputTrait ? outputTrait.title : `Trait #${anyRecipe.outId}`;
                        if (!outputImage) {
                            try {
                                const alch = await this.fetchOutputTraitFromAlchemy(anyRecipe.outId.toString());
                                if (alch && (alch.image || alch.media)) {
                                    outputImage = alch.image || (alch.media && alch.media[0] && alch.media[0].gateway) || '';
                                    if (alch.title) outputTitle = alch.title;
                                }
                            } catch (e) {
                                console.warn('Could not fetch output image from Alchemy (any):', e.message);
                            }
                        }
                        
                        recipes.push({
                            type: 'any',
                            recipeId: recipeId,
                            active: anyRecipe.active,
                            requirement: {
                                burnTotal: anyRecipe.burnTotal.toString()
                            },
                            output: {
                                id: anyRecipe.outId.toString(),
                                amount: anyRecipe.outAmount.toString(),
                                title: outputTitle,
                                image: outputImage,
                                metadata: outputTrait ? outputTrait.metadata : {}
                            },
                            selection: {
                                chosen: [],
                                total: 0,
                                meetsRequirement: false
                            }
                        });
                    } else {
                        console.log(`🔨 TraitLABCrafting: Receta general ${recipeId} inactiva`);
                    }
                } catch (error) {
                    console.log(`🔨 TraitLABCrafting: Error en receta general ${recipeId}:`, error.message);
                    // Recipe doesn't exist
                }
            }
            
            this.recipes = recipes;
            console.log('🔨 TraitLABCrafting: Recetas finales:', recipes);
            
            // Load balances to compute eligibility correctly
            try {
                await this.loadUserBalances();
            } catch (e) {
                console.warn('Could not load user balances:', e.message);
            }
            // Calculate eligibility using loaded balances
            this.calculateEligibility();
            
            // If no recipes found, create some example recipes for testing
            if (this.recipes.length === 0) {
                console.log('🔨 TraitLABCrafting: No se encontraron recetas, creando ejemplos...');
                this.recipes = this.createExampleRecipes();
            }
            
            this.emit('recipesLoaded', { recipes: this.recipes });
            return this.recipes;
            
        } catch (error) {
            console.error('Error loading recipes from contract:', error);
            throw error;
        }
    }

    /**
     * Fetch output trait metadata (image/title) from Alchemy by tokenId
     */
    async fetchOutputTraitFromAlchemy(tokenId) {
        try {
            const contractAddress = window.TraitLABConfig.CONTRACTS.ERC1155;
            const apiKey = window.TraitLABConfig.ALCHEMY_API_KEY;
            const url = `https://base-mainnet.g.alchemy.com/nft/v3/${apiKey}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}&tokenType=erc1155`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Alchemy ${res.status}`);
            const data = await res.json();
            // Normalize minimal fields
            const image = (data.raw && data.raw.metadata && data.raw.metadata.image)
                || (data.media && data.media[0] && data.media[0].gateway)
                || '';
            const title = (data.raw && data.raw.metadata && data.raw.metadata.name) || data.name || '';
            return { image, title, media: data.media };
        } catch (e) {
            console.warn('fetchOutputTraitFromAlchemy failed:', e.message);
            return null;
        }
    }

    /**
     * Load user balances for all traits used in recipes
     */
    async loadUserBalances() {
        console.log('🔨 TraitLABCrafting: Cargando balances del usuario...');
        
        try {
            if (!window.TraitLABWallet || !window.TraitLABWallet.isWalletConnected()) {
                console.log('Wallet not connected, skipping balance load');
                return;
            }
            
            const userAddress = window.TraitLABWallet.getCurrentAccount();
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // AdrianTraitsCore contract for balanceOf
            const ADRIAN_TRAITS_CORE_CONTRACT = window.TraitLABConfig.CONTRACTS.ERC1155;
            
            const contractABI = [
                "function balanceOf(address account, uint256 id) view returns (uint256)"
            ];
            
            const contract = new ethers.Contract(ADRIAN_TRAITS_CORE_CONTRACT, contractABI, provider);
            
            // Get all unique trait IDs from available traits
            const traitIds = new Set();
            if (this.availableTraits) {
                this.availableTraits.forEach(trait => traitIds.add(trait.tokenId.toString()));
            }
            
            // Also add trait IDs from recipes
            this.recipes.forEach(recipe => {
                if (recipe.type === 'specific') {
                    recipe.burn.forEach(item => traitIds.add(item.id));
                }
            });
            
            // Load balances for each trait
            for (const traitId of traitIds) {
                try {
                    const balance = await contract.balanceOf(userAddress, traitId);
                    this.userBalances.set(traitId, balance.toString());
                } catch (error) {
                    console.warn(`Failed to load balance for trait ${traitId}:`, error);
                    this.userBalances.set(traitId, '0');
                }
            }
            
            console.log('🔨 TraitLABCrafting: Balances cargados:', Object.fromEntries(this.userBalances));
            
        } catch (error) {
            console.error('Error loading user balances:', error);
        }
    }

    /**
     * Calculate eligibility for each recipe
     */
    calculateEligibility() {
        this.recipes.forEach(recipe => {
            if (recipe.type === 'specific') {
                recipe.eligible = recipe.burn.every(item => {
                    const userBalance = parseInt(this.userBalances.get(item.id) || '0');
                    const required = parseInt(item.amount);
                    item.userBalance = userBalance;
                    return userBalance >= required;
                });
            }
        });
        
        console.log('🔨 TraitLABCrafting: Eligibilidad calculada');
    }

    /**
     * Select a trait for crafting (for "any" recipes)
     */
    selectTrait(traitId, amount) {
        if (amount <= 0) {
            this.deselectTrait(traitId);
            return;
        }
        
        this.selectedTraits.set(traitId, amount);
        console.log('🔨 TraitLABCrafting: Trait seleccionado:', traitId, amount);
        this.emit('traitsSelectionChanged', { selectedTraits: this.selectedTraits });
    }

    /**
     * Deselect a trait
     */
    deselectTrait(traitId) {
        this.selectedTraits.delete(traitId);
        console.log('🔨 TraitLABCrafting: Trait deseleccionado:', traitId);
        this.emit('traitsSelectionChanged', { selectedTraits: this.selectedTraits });
    }

    /**
     * Get total selected amount
     */
    getSelectedTotal() {
        let total = 0;
        for (const amount of this.selectedTraits.values()) {
            total += amount;
        }
        return total;
    }

    /**
     * Check if current selection meets recipe requirement
     */
    checkRecipeRequirement(recipe) {
        if (recipe.type !== 'any') return false;
        
        const selectedTotal = this.getSelectedTotal();
        const requiredTotal = parseInt(recipe.requirement.burnTotal);
        
        return selectedTotal >= requiredTotal;
    }

    /**
     * Execute a specific recipe
     */
    async craftSpecific(recipeId) {
        console.log('🔨 TraitLABCrafting: Ejecutando receta específica:', recipeId);
        
        try {
            if (!window.TraitLABWallet || !window.TraitLABWallet.isWalletConnected()) {
                throw new Error('Please connect your wallet first.');
            }
            
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            const ADRIAN_CRAFTING_CONTRACT = window.TraitLABConfig.ADRIAN_CRAFTING_CONTRACT;
            
            const contractABI = [
                "function craftSpecific(uint256 recipeId)"
            ];
            
            const contract = new ethers.Contract(ADRIAN_CRAFTING_CONTRACT, contractABI, signer);
            
            const tx = await contract.craftSpecific(recipeId);
            console.log('Transaction hash:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);
            
            this.emit('craftingSuccessful', { 
                recipeId, 
                transactionHash: receipt.transactionHash,
                type: 'specific'
            });
            
            // Refresh recipes and balances
            await this.loadRecipes();
            
            return receipt;
            
        } catch (error) {
            console.error('Error crafting specific recipe:', error);
            throw error;
        }
    }

    /**
     * Execute an "any" recipe
     */
    async craftAny(recipeId, burnIds, burnAmounts) {
        console.log('🔨 TraitLABCrafting: Ejecutando receta general:', recipeId, burnIds, burnAmounts);
        
        try {
            if (!window.TraitLABWallet || !window.TraitLABWallet.isWalletConnected()) {
                throw new Error('Please connect your wallet first.');
            }
            
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            const ADRIAN_CRAFTING_CONTRACT = window.TraitLABConfig.ADRIAN_CRAFTING_CONTRACT;
            
            const contractABI = [
                "function craftAny(uint256 recipeId, uint256[] burnIds, uint256[] burnAmounts)"
            ];
            
            const contract = new ethers.Contract(ADRIAN_CRAFTING_CONTRACT, contractABI, signer);
            
            const tx = await contract.craftAny(recipeId, burnIds, burnAmounts);
            console.log('Transaction hash:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);
            
            this.emit('craftingSuccessful', { 
                recipeId, 
                transactionHash: receipt.transactionHash,
                type: 'any',
                burned: { ids: burnIds, amounts: burnAmounts }
            });
            
            // Refresh recipes and balances
            await this.loadRecipes();
            
            return receipt;
            
        } catch (error) {
            console.error('Error crafting any recipe:', error);
            throw error;
        }
    }

    /**
     * Get all recipes
     */
    getRecipes() {
        return this.recipes;
    }

    /**
     * Get user balances
     */
    getUserBalances() {
        return this.userBalances;
    }

    /**
     * Get selected traits
     */
    getSelectedTraits() {
        return this.selectedTraits;
    }

    /**
     * Get available traits
     */
    getAvailableTraits() {
        return this.availableTraits || [];
    }

    /**
     * Create example recipes for testing
     */
    createExampleRecipes() {
        console.log('🔨 TraitLABCrafting: Creando recetas de ejemplo...');
        
        return [
            {
                type: 'specific',
                recipeId: 1,
                active: true,
                burn: [
                    { id: '1', amount: '2', userBalance: 0 },
                    { id: '3', amount: '1', userBalance: 0 }
                ],
                output: {
                    id: '100',
                    amount: '1',
                    title: 'Rare Trait #100',
                    image: '',
                    metadata: {}
                },
                eligible: false
            },
            {
                type: 'any',
                recipeId: 2,
                active: true,
                requirement: {
                    burnTotal: '5'
                },
                output: {
                    id: '200',
                    amount: '1',
                    title: 'Epic Trait #200',
                    image: '',
                    metadata: {}
                },
                selection: {
                    chosen: [],
                    total: 0,
                    meetsRequirement: false
                }
            },
            {
                type: 'specific',
                recipeId: 3,
                active: true,
                burn: [
                    { id: '7', amount: '1', userBalance: 0 },
                    { id: '8', amount: '1', userBalance: 0 },
                    { id: '9', amount: '1', userBalance: 0 }
                ],
                output: {
                    id: '300',
                    amount: '1',
                    title: 'Legendary Trait #300',
                    image: '',
                    metadata: {}
                },
                eligible: false
            }
        ];
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.selectedTraits.clear();
        this.emit('traitsSelectionChanged', { selectedTraits: this.selectedTraits });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TraitLABCrafting;
} else {
    window.TraitLABCrafting = TraitLABCrafting;
}
