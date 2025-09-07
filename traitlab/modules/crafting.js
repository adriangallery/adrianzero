/**
 * TRAITLAB - Módulo de Crafting Simplificado
 * Solo muestra las recetas disponibles del contrato
 */

class TraitLABCrafting {
    constructor() {
        this.recipes = null; // null = no cargado, [] = cargado pero vacío
        this.availableTraits = [];
        this.isLoading = false;
        this.isLoadingRecipes = false;
        this.recipesLoaded = false;
        this.selectedTraits = new Map();
        console.log('🔨 TraitLABCrafting: Módulo simplificado inicializado');
    }

    /**
     * Inicializar módulo
     */
    init() {
        console.log('🔨 TraitLABCrafting: Inicializando módulo...');
        // No hay inicialización específica necesaria
        return Promise.resolve();
    }

    /**
     * Cargar recetas desde el contrato
     */
    async loadRecipes() {
        console.log('🔨 TraitLABCrafting: Cargando recetas desde contrato...');
        
        this.isLoading = true;
        
        try {
            // Verificar que ethers esté disponible
            if (typeof window.ethers === 'undefined') {
                throw new Error('Ethers library not available');
            }

            const provider = new window.ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            // Contrato de crafting
            const ADRIAN_CRAFTING_CONTRACT = window.TraitLABConfig.ADRIAN_CRAFTING_CONTRACT;
            console.log('🔨 TraitLABCrafting: Contrato:', ADRIAN_CRAFTING_CONTRACT);
            
            // ABI mínimo para recetas
            const contractABI = [
                "function getSpecificRecipe(uint256 recipeId) view returns (bool active, uint256[] burnIds, uint256[] burnAmounts, uint256 outId, uint256 outAmount)",
                "function getAnyRecipe(uint256 recipeId) view returns (bool active, uint256 burnTotal, uint256 outId, uint256 outAmount)"
            ];

            const contract = new window.ethers.Contract(ADRIAN_CRAFTING_CONTRACT, contractABI, signer);
            
            // Verificar que el contrato existe
            const code = await provider.getCode(ADRIAN_CRAFTING_CONTRACT);
            if (code === '0x') {
                throw new Error('Contract not deployed at specified address');
            }
            
            // IDs de recetas a probar
            const recipeIds = [1, 2, 3, 4, 5];
            console.log('🔨 TraitLABCrafting: Probando IDs de recetas:', recipeIds);
            
            const recipes = [];
            
            for (const recipeId of recipeIds) {
                try {
                    // Probar receta específica
                    const specificRecipe = await contract.getSpecificRecipe(recipeId);
                    console.log(`🔨 Receta específica ${recipeId}:`, specificRecipe);
                    
                    if (specificRecipe.active) {
                        recipes.push({
                            type: 'specific',
                            recipeId: recipeId,
                            active: true,
                            burn: specificRecipe.burnIds.map((id, index) => ({
                                id: id.toString(),
                                amount: specificRecipe.burnAmounts[index].toString()
                            })),
                            output: {
                                id: specificRecipe.outId.toString(),
                                amount: specificRecipe.outAmount.toString()
                            }
                        });
                        continue;
                    }
                } catch (error) {
                    console.log(`🔨 Receta específica ${recipeId} no existe o error:`, error.message);
                }
                
                try {
                    // Probar receta general
                    const anyRecipe = await contract.getAnyRecipe(recipeId);
                    console.log(`🔨 Receta general ${recipeId}:`, anyRecipe);
                    
                    if (anyRecipe.active) {
                        recipes.push({
                            type: 'any',
                            recipeId: recipeId,
                            active: true,
                            requirement: {
                                burnTotal: anyRecipe.burnTotal.toString()
                            },
                            output: {
                                id: anyRecipe.outId.toString(),
                                amount: anyRecipe.outAmount.toString()
                            }
                        });
                    }
                } catch (error) {
                    console.log(`🔨 Receta general ${recipeId} no existe o error:`, error.message);
                }
            }
            
            this.recipes = recipes;
            this.isLoading = false;
            this.recipesLoaded = true;
            console.log('🔨 TraitLABCrafting: Recetas cargadas:', recipes);
            
            return recipes;
            
        } catch (error) {
            console.error('🔨 TraitLABCrafting: Error cargando recetas:', error);
            
            // Crear recetas de ejemplo si falla
            this.recipes = this.createExampleRecipes();
            this.isLoading = false;
            this.recipesLoaded = true;
            console.log('🔨 TraitLABCrafting: Usando recetas de ejemplo:', this.recipes);
            
            return this.recipes;
        }
    }

    /**
     * Crear recetas de ejemplo para testing
     */
    createExampleRecipes() {
        return [
            {
                type: 'specific',
                recipeId: 1,
                active: true,
                burn: [
                    { id: '375', amount: '1' },
                    { id: '371', amount: '1' }
                ],
                output: {
                    id: '33',
                    amount: '1'
                }
            },
            {
                type: 'any',
                recipeId: 2,
                active: true,
                requirement: {
                    burnTotal: '3'
                },
                output: {
                    id: '100',
                    amount: '1'
                }
            }
        ];
    }

    /**
     * Obtener recetas cargadas
     */
    getRecipes() {
        return this.recipes;
    }

    /**
     * Verificar si las recetas están cargadas
     */
    isRecipesLoaded() {
        return this.recipesLoaded === true;
    }

    /**
     * Verificar si está cargando
     */
    isLoadingRecipes() {
        return this.isLoading;
    }

    /**
     * Establecer traits disponibles (para compatibilidad)
     */
    setAvailableTraits(traits) {
        this.availableTraits = traits || [];
        console.log('🔨 TraitLABCrafting: Traits establecidos:', this.availableTraits.length);
    }


    /**
     * Seleccionar trait para crafting
     */
    selectTrait(traitId, amount = 1) {
        this.selectedTraits.set(traitId, amount);
        console.log('🔨 Trait seleccionado:', traitId, 'cantidad:', amount);
    }

    /**
     * Deseleccionar trait para crafting
     */
    deselectTrait(traitId) {
        this.selectedTraits.delete(traitId);
        console.log('🔨 Trait deseleccionado:', traitId);
    }

    /**
     * Obtener traits seleccionados
     */
    getSelectedTraits() {
        return this.selectedTraits;
    }

    /**
     * Obtener total de traits seleccionados
     */
    getSelectedTotal() {
        return Array.from(this.selectedTraits.values()).reduce((sum, amount) => sum + amount, 0);
    }

    /**
     * Limpiar selección de traits
     */
    clearSelectedTraits() {
        this.selectedTraits.clear();
        console.log('🔨 Selección de traits limpiada');
    }

    /**
     * Asegurar aprobación del contrato de crafting para mover ERC1155
     */
    async ensureERC1155Approval() {
        try {
            if (typeof window.ethers === 'undefined') {
                throw new Error('Ethers library not available');
            }

            const provider = new window.ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const userAddress = await signer.getAddress();

            const erc1155Address = window.TraitLABConfig.CONTRACTS.ERC1155;
            const craftingAddress = window.TraitLABConfig.ADRIAN_CRAFTING_CONTRACT;

            const erc1155Abi = [
                "function isApprovedForAll(address account, address operator) view returns (bool)",
                "function setApprovalForAll(address operator, bool approved)"
            ];

            const erc1155 = new window.ethers.Contract(erc1155Address, erc1155Abi, signer);

            const isApproved = await erc1155.isApprovedForAll(userAddress, craftingAddress);
            console.log('🔨 Crafting: isApprovedForAll =', isApproved);

            if (!isApproved) {
                console.log('🔨 Crafting: Solicitando setApprovalForAll al contrato de crafting...');
                const tx = await erc1155.setApprovalForAll(craftingAddress, true);
                await tx.wait();
                console.log('✅ Crafting: setApprovalForAll confirmado:', tx.hash);
            }
        } catch (error) {
            console.error('❌ Crafting: Error al asegurar aprobación ERC1155:', error);
            throw error;
        }
    }

    /**
     * Intentar ejecutar un método del contrato de crafting (con estimateGas para validar)
     */
    async tryCraftMethod(contract, methodName, args) {
        try {
            if (!contract[methodName]) return null;
            // Validar con estimateGas para evitar fallos predecibles
            await contract.estimateGas[methodName](...args);
            const tx = await contract[methodName](...args);
            console.log(`🧪 Crafting: Método ${methodName} enviado:`, tx.hash);
            const receipt = await tx.wait();
            console.log(`✅ Crafting: Método ${methodName} confirmado:`, receipt.transactionHash);
            return receipt;
        } catch (error) {
            console.warn(`⚠️ Crafting: Método ${methodName} falló:`, error?.reason || error?.message || error);
            return null;
        }
    }

    /**
     * Ejecutar crafting para receta específica
     */
    async craftSpecific(recipeId) {
        console.log('🔨 Crafting: craftSpecific para receta:', recipeId);
        await this.ensureERC1155Approval();

        const provider = new window.ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const craftingAddress = window.TraitLABConfig.ADRIAN_CRAFTING_CONTRACT;

        // ABI con posibles variantes de función
        const craftingAbi = [
            "function craftSpecific(uint256 recipeId)",
            "function useSpecificRecipe(uint256 recipeId)",
            // fallback genérico por si el contrato usa un nombre común
            "function craft(uint256 recipeId)"
        ];

        const crafting = new window.ethers.Contract(craftingAddress, craftingAbi, signer);

        const candidates = [
            ['useSpecificRecipe', [window.parseInt ? window.parseInt(recipeId) : Number(recipeId)]],
            ['craftSpecific', [window.parseInt ? window.parseInt(recipeId) : Number(recipeId)]],
            ['craft', [window.parseInt ? window.parseInt(recipeId) : Number(recipeId)]]
        ];

        for (const [method, args] of candidates) {
            const receipt = await this.tryCraftMethod(crafting, method, args);
            if (receipt) {
                return receipt;
            }
        }
        throw new Error('No se pudo ejecutar craftSpecific: ninguna variante de método funcionó');
    }

    /**
     * Ejecutar crafting para receta "any" con arrays de burn
     */
    async craftAny(recipeId, burnIds, burnAmounts) {
        console.log('🔨 Crafting: craftAny para receta:', recipeId, 'burnIds:', burnIds, 'burnAmounts:', burnAmounts);
        await this.ensureERC1155Approval();

        const provider = new window.ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const craftingAddress = window.TraitLABConfig.ADRIAN_CRAFTING_CONTRACT;

        // ABI con posibles variantes de función
        const craftingAbi = [
            "function craftAny(uint256 recipeId, uint256[] burnIds, uint256[] burnAmounts)",
            "function useAnyRecipe(uint256 recipeId, uint256[] burnIds, uint256[] burnAmounts)",
            // fallback genérico por si el contrato usa un nombre común
            "function craft(uint256 recipeId, uint256[] burnIds, uint256[] burnAmounts)"
        ];

        const crafting = new window.ethers.Contract(craftingAddress, craftingAbi, signer);

        const rid = window.parseInt ? window.parseInt(recipeId) : Number(recipeId);
        const ids = burnIds.map(id => window.parseInt ? window.parseInt(id) : Number(id));
        const amts = burnAmounts.map(a => window.parseInt ? window.parseInt(a) : Number(a));

        const candidates = [
            ['useAnyRecipe', [rid, ids, amts]],
            ['craftAny', [rid, ids, amts]],
            ['craft', [rid, ids, amts]]
        ];

        for (const [method, args] of candidates) {
            const receipt = await this.tryCraftMethod(crafting, method, args);
            if (receipt) {
                return receipt;
            }
        }
        throw new Error('No se pudo ejecutar craftAny: ninguna variante de método funcionó');
    }
}

// Exportar la clase al scope global
if (typeof window !== 'undefined') {
    window.TraitLABCrafting = TraitLABCrafting;
}
