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
     * Load recipes from the smart contract
     */
    async loadRecipesFromContract(ethers) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            // AdrianCrafting contract
            const ADRIAN_CRAFTING_CONTRACT = window.TraitLABConfig.ADRIAN_CRAFTING_CONTRACT;
            
            // Contract ABI for recipe functions
            const contractABI = [
                "function getSpecificRecipe(uint256 recipeId) view returns (bool active, uint256[] burnIds, uint256[] burnAmounts, uint256 outId, uint256 outAmount)",
                "function getAnyRecipe(uint256 recipeId) view returns (bool active, uint256 burnTotal, uint256 outId, uint256 outAmount)"
            ];

            const contract = new ethers.Contract(ADRIAN_CRAFTING_CONTRACT, contractABI, signer);
            
            // For now, we'll use a curated list of recipe IDs
            // In production, you'd index events to get all recipe IDs
            const recipeIds = [1, 2, 3, 4, 5]; // Example IDs
            
            const recipes = [];
            
            for (const recipeId of recipeIds) {
                try {
                    // Try specific recipe first
                    const specificRecipe = await contract.getSpecificRecipe(recipeId);
                    if (specificRecipe.active) {
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
                                amount: specificRecipe.outAmount.toString()
                            },
                            eligible: false // Will be calculated after loading balances
                        });
                        continue;
                    }
                } catch (error) {
                    // Recipe doesn't exist or is inactive, try any recipe
                }
                
                try {
                    const anyRecipe = await contract.getAnyRecipe(recipeId);
                    if (anyRecipe.active) {
                        recipes.push({
                            type: 'any',
                            recipeId: recipeId,
                            active: anyRecipe.active,
                            requirement: {
                                burnTotal: anyRecipe.burnTotal.toString()
                            },
                            output: {
                                id: anyRecipe.outId.toString(),
                                amount: anyRecipe.outAmount.toString()
                            },
                            selection: {
                                chosen: [],
                                total: 0,
                                meetsRequirement: false
                            }
                        });
                    }
                } catch (error) {
                    // Recipe doesn't exist
                }
            }
            
            this.recipes = recipes;
            console.log('🔨 TraitLABCrafting: Recetas cargadas:', recipes);
            
            // Load user balances for all recipe ingredients
            await this.loadUserBalances();
            
            // Calculate eligibility
            this.calculateEligibility();
            
            this.emit('recipesLoaded', { recipes: this.recipes });
            return recipes;
            
        } catch (error) {
            console.error('Error loading recipes from contract:', error);
            throw error;
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
            
            // Get all unique trait IDs from recipes
            const traitIds = new Set();
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
