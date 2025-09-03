/**
 * TRAITLAB - Módulo de Display Manager
 * Maneja la visualización de diferentes tipos de contenido
 */

class DisplayManager {
    constructor() {
        console.log('🎨 DisplayManager inicializado');
    }

    /**
     * Mostrar contenido de crafting
     */
    displayCraftingContent(grid, craftingModule, dataManager) {
        console.log('🔨 displayCraftingContent: Iniciando...');
        if (!grid) {
            console.warn('🔨 displayCraftingContent: Grid no disponible');
            return;
        }
        
        // Limpiar el grid
        grid.innerHTML = '';
        grid.className = 'crafting-container';
        console.log('🔨 displayCraftingContent: Grid limpiado y clase establecida');
        
        // Verificar si el módulo de crafting está disponible
        if (!craftingModule) {
            console.warn('🔨 displayCraftingContent: Módulo de crafting no disponible');
            grid.innerHTML = '<div class="no-recipes"><p>Módulo de crafting no disponible</p></div>';
            return;
        }
        
        // Debug: Verificar estado del módulo
        console.log('🔨 displayCraftingContent: Estado del módulo:', {
            isLoadingRecipes: craftingModule.isLoadingRecipes ? craftingModule.isLoadingRecipes() : 'método no existe',
            isRecipesLoaded: craftingModule.isRecipesLoaded ? craftingModule.isRecipesLoaded() : 'método no existe',
            getRecipes: craftingModule.getRecipes ? 'método existe' : 'método no existe'
        });
        
        // Verificar el estado de carga de las recetas
        if (craftingModule.isLoadingRecipes && craftingModule.isLoadingRecipes()) {
            console.log('🔨 displayCraftingContent: Mostrando loading...');
            grid.innerHTML = '<div class="loading-recipes"><p>Loading recipes...</p></div>';
        } else if (craftingModule.isRecipesLoaded && craftingModule.isRecipesLoaded()) {
            console.log('🔨 displayCraftingContent: Recetas cargadas, obteniendo recetas...');
            // Las recetas se cargaron, verificar si hay contenido
            const recipes = craftingModule.getRecipes ? craftingModule.getRecipes() : [];
            console.log('🔨 displayCraftingContent: Recetas obtenidas:', recipes.length);
            if (recipes && recipes.length > 0) {
                console.log('🔨 displayCraftingContent: Mostrando recetas y traits...');
                this.displayCraftingRecipes(grid, recipes);
                this.displayCraftingTraits(grid, dataManager);
            } else {
                console.log('🔨 displayCraftingContent: No hay recetas disponibles');
                grid.innerHTML = '<div class="no-recipes"><p>No recipes available.</p></div>';
            }
        } else {
            console.log('🔨 displayCraftingContent: Recetas no cargadas, mostrando loading...');
            // Aún no se han cargado las recetas, mostrar loading
            grid.innerHTML = '<div class="loading-recipes"><p>Loading recipes...</p></div>';
        }
    }

    /**
     * Mostrar recetas de crafting
     */
    displayCraftingRecipes(grid, recipes) {
        // Crear contenedor para recetas
        const recipesSection = document.createElement('div');
        recipesSection.className = 'crafting-section recipes-section';
        recipesSection.innerHTML = `
            <h3>Available Recipes</h3>
            <div class="recipes-grid" id="recipes-grid"></div>
        `;
        grid.appendChild(recipesSection);
        
        // Llenar el grid de recetas (igual que indexref.html)
        const recipesGrid = document.getElementById('recipes-grid');
        if (recipesGrid) {
            recipes.forEach(recipe => {
                if (recipe.type === 'specific') {
                    recipesGrid.innerHTML += this.renderSimpleRecipeCard(recipe);
                } else if (recipe.type === 'any') {
                    recipesGrid.innerHTML += this.renderSimpleRecipeCard(recipe);
                }
            });
        }
    }

    /**
     * Mostrar traits para crafting
     */
    displayCraftingTraits(grid, dataManager) {
        // Crear contenedor para traits
        const traitsSection = document.createElement('div');
        traitsSection.className = 'crafting-section traits-section';
        traitsSection.innerHTML = `
            <h3>Your Traits</h3>
            <div class="traits-grid" id="traits-grid">
                <div class="traits-placeholder"><p>Loading traits...</p></div>
            </div>
        `;
        grid.appendChild(traitsSection);
        
        // Cargar traits si están disponibles
        this.loadTraitsInCraftingGrid(dataManager);
    }

    /**
     * Renderizar tarjeta de receta (compatible con indexref.html)
     */
    renderRecipeCard(recipe) {
        return this.renderSimpleRecipeCard(recipe);
    }

    /**
     * Renderizar tarjeta de receta simple (igual que indexref.html)
     */
    renderSimpleRecipeCard(recipe) {
        if (recipe.type === 'specific') {
            const burnItems = recipe.burn.map(item => 
                `<div class="recipe-ingredient">
                    <span class="trait-id">ID: ${item.id}</span>
                    <span class="trait-required">Required: ${item.amount}</span>
                </div>`
            ).join('');
            
            return `
                <div class="recipe-card specific-recipe" data-recipe-id="${recipe.recipeId}">
                    <div class="recipe-header">
                        <h4>Recipe #${recipe.recipeId}</h4>
                        <span class="recipe-type">Specific Recipe</span>
                    </div>
                    <div class="recipe-ingredients">
                        <h5>Burn Requirements:</h5>
                        ${burnItems}
                    </div>
                    <div class="recipe-output">
                        <h5>Output:</h5>
                        <div class="output-info">
                            <span>Trait #${recipe.output.id}</span>
                            <span>Amount: ${recipe.output.amount}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="recipe-card any-recipe" data-recipe-id="${recipe.recipeId}">
                    <div class="recipe-header">
                        <h4>Recipe #${recipe.recipeId}</h4>
                        <span class="recipe-type">Any Recipe</span>
                    </div>
                    <div class="recipe-ingredients">
                        <h5>Burn Requirements:</h5>
                        <div class="recipe-ingredient">
                            <span class="trait-id">Any Traits</span>
                            <span class="trait-required">Total: ${recipe.requirement.burnTotal}</span>
                        </div>
                    </div>
                    <div class="recipe-output">
                        <h5>Output:</h5>
                        <div class="output-info">
                            <span>Trait #${recipe.output.id}</span>
                            <span>Amount: ${recipe.output.amount}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Cargar traits en el grid de crafting (igual que indexref.html)
     */
    loadTraitsInCraftingGrid(dataManager) {
        console.log('🔨 loadTraitsInCraftingGrid: Cargando traits para crafting...');
        
        const traitsGrid = document.getElementById('traits-grid');
        if (!traitsGrid) {
            console.warn('🔨 Traits grid no encontrado');
            return;
        }
        
        // Verificar si el DataManager está disponible y tiene traits
        if (dataManager && dataManager.isReady && dataManager.isReady('adrianLab')) {
            const traits = dataManager.getTokens('adrianLab', 'traits');
            console.log('🔨 Traits disponibles en DataManager:', traits.length);
            
            if (traits && traits.length > 0) {
                // Limpiar placeholder y mostrar traits
                traitsGrid.innerHTML = '';
                
                // Crear grid de traits similar al tab traits
                traits.forEach(trait => {
                    const traitCard = this.createTraitCardForCrafting(trait);
                    traitsGrid.appendChild(traitCard);
                });
                
                console.log('🔨 Traits cargados en grid de crafting:', traits.length);
            } else {
                traitsGrid.innerHTML = '<div class="no-traits"><p>No traits available. Please visit the Traits tab first to load your traits.</p></div>';
            }
        } else {
            // Si el DataManager no está listo, mostrar mensaje
            console.log('🔨 DataManager no está listo, mostrando mensaje...');
            traitsGrid.innerHTML = '<div class="loading-traits"><p>Loading traits...</p></div>';
        }
    }

    /**
     * Crear tarjeta de trait para el grid de crafting (igual que indexref.html)
     */
    createTraitCardForCrafting(trait) {
        const traitCard = document.createElement('div');
        traitCard.className = 'trait-card crafting-trait';
        traitCard.setAttribute('data-trait-id', trait.tokenId);
        traitCard.setAttribute('data-trait-balance', trait.balance);
        
        traitCard.innerHTML = `
            <div class="trait-image">
                <img src="${trait.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+JDt0cmFpdC50b2tlbklkPC90ZXh0Pjwvc3ZnPg=='}" alt="Trait #${trait.tokenId}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+JCB7dHJhaXQudG9rZW5JZH08L3RleHQ+PC9zdmc+'">
            </div>
            <div class="trait-info">
                <h4>Trait #${trait.tokenId}</h4>
                <p class="trait-title">${trait.title || `Trait #${trait.tokenId}`}</p>
                <p class="trait-balance">Balance: ${trait.balance}</p>
            </div>
        `;
        
        return traitCard;
    }

    /**
     * Mostrar traits en el grid de crafting (método legacy)
     */
    displayTraitsInCraftingGrid(traits) {
        const traitsGrid = document.getElementById('traits-grid');
        if (!traitsGrid) return;
        
        traitsGrid.innerHTML = '';
        
        traits.forEach(trait => {
            const traitCard = this.createTraitCardForCrafting(trait);
            traitsGrid.appendChild(traitCard);
        });
    }

    /**
     * Mostrar mensaje de no tokens con estilo pixelado
     */
    showNoTokens(grid, filterType = 'tokens') {
        if (!grid) return;
        
        const messages = {
            adrianzero: {
                title: 'NO ADRIANZEROS FOUND',
                subtitle: 'Connect your wallet to see your collection',
                emoji: '🤖'
            },
            traits: {
                title: 'NO TRAITS AVAILABLE',
                subtitle: 'Your trait collection is empty',
                emoji: '🎭'
            },
            floppy: {
                title: 'NO FLOPPY DISCS',
                subtitle: 'No floppy discs in your inventory',
                emoji: '💾'
            },
            serum: {
                title: 'NO SERUMS FOUND',
                subtitle: 'Your serum collection is empty',
                emoji: '🧪'
            },
            crafting: {
                title: 'NO RECIPES AVAILABLE',
                subtitle: 'No crafting recipes found',
                emoji: '🔨'
            }
        };
        
        const msg = messages[filterType] || messages.traits;
        
        grid.innerHTML = `
            <div class="no-tokens pixelated">
                <div class="pixel-icon">${msg.emoji}</div>
                <h2 class="pixel-title">${msg.title}</h2>
                <p class="pixel-subtitle">${msg.subtitle}</p>
                <div class="pixel-border"></div>
            </div>
        `;
    }

    /**
     * Mostrar mensaje de loading con estilo pixelado
     */
    showLoading(grid, filterType = 'tokens') {
        if (!grid) return;
        
        const messages = {
            adrianzero: {
                title: 'SCANNING BLOCKCHAIN...',
                subtitle: 'Loading your AdrianZERO collection',
                emoji: '🔍'
            },
            traits: {
                title: 'LOADING TRAITS...',
                subtitle: 'Fetching your trait collection',
                emoji: '🎭'
            },
            floppy: {
                title: 'LOADING FLOPPY DISCS...',
                subtitle: 'Scanning your floppy inventory',
                emoji: '💾'
            },
            serum: {
                title: 'LOADING SERUMS...',
                subtitle: 'Analyzing your serum collection',
                emoji: '🧪'
            },
            crafting: {
                title: 'LOADING RECIPES...',
                subtitle: 'Preparing crafting recipes',
                emoji: '🔨'
            }
        };
        
        const msg = messages[filterType] || messages.traits;
        
        grid.innerHTML = `
            <div class="loading-message pixelated">
                <div class="pixel-spinner">
                    <div class="spinner-dot"></div>
                    <div class="spinner-dot"></div>
                    <div class="spinner-dot"></div>
                </div>
                <div class="pixel-icon">${msg.emoji}</div>
                <h2 class="pixel-title">${msg.title}</h2>
                <p class="pixel-subtitle">${msg.subtitle}</p>
                <div class="pixel-border"></div>
            </div>
        `;
    }
}

// Exportar para uso global
window.TraitLABDisplayManager = DisplayManager;
