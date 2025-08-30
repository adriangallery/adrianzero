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
        if (!grid) return;
        
        // Limpiar el grid
        grid.innerHTML = '';
        grid.className = 'crafting-container';
        
        // Verificar si el módulo de crafting está disponible
        if (!craftingModule) {
            grid.innerHTML = '<div class="no-recipes"><p>Módulo de crafting no disponible</p></div>';
            return;
        }
        
        // Verificar el estado de carga de las recetas
        if (craftingModule.isLoadingRecipes && craftingModule.isLoadingRecipes()) {
            grid.innerHTML = '<div class="loading-recipes"><p>Loading recipes...</p></div>';
        } else if (craftingModule.isRecipesLoaded && craftingModule.isRecipesLoaded()) {
            // Las recetas se cargaron, verificar si hay contenido
            const recipes = craftingModule.getRecipes ? craftingModule.getRecipes() : [];
            if (recipes && recipes.length > 0) {
                this.displayCraftingRecipes(grid, recipes);
                this.displayCraftingTraits(grid, dataManager);
            } else {
                grid.innerHTML = '<div class="no-recipes"><p>No recipes available.</p></div>';
            }
        } else {
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
        
        // Llenar el grid de recetas
        const recipesGrid = document.getElementById('recipes-grid');
        if (recipesGrid) {
            recipes.forEach(recipe => {
                const recipeCard = this.renderRecipeCard(recipe);
                recipesGrid.appendChild(recipeCard);
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
     * Renderizar tarjeta de receta
     */
    renderRecipeCard(recipe) {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        recipeCard.setAttribute('data-recipe-id', recipe.recipeId);
        
        let burnItems = '';
        if (recipe.burn && Array.isArray(recipe.burn)) {
            burnItems = recipe.burn.map(item => 
                `<div class="recipe-ingredient">
                    <span class="trait-id">ID: ${item.id}</span>
                    <span class="trait-required">Required: ${item.amount}</span>
                </div>`
            ).join('');
        }
        
        recipeCard.innerHTML = `
            <div class="recipe-header">
                <h4>Recipe #${recipe.recipeId}</h4>
                <span class="recipe-type">${recipe.type || 'Standard'} Recipe</span>
            </div>
            <div class="recipe-ingredients">
                <h5>Burn Requirements:</h5>
                ${burnItems || '<p>No requirements</p>'}
            </div>
            <div class="recipe-output">
                <h5>Output:</h5>
                <div class="output-info">
                    <span>Trait #${recipe.output?.id || 'Unknown'}</span>
                    <span>Amount: ${recipe.output?.amount || 1}</span>
                </div>
            </div>
        `;
        
        return recipeCard;
    }

    /**
     * Cargar traits en el grid de crafting
     */
    loadTraitsInCraftingGrid(dataManager) {
        const traitsGrid = document.getElementById('traits-grid');
        if (!traitsGrid) return;
        
        // Verificar si tenemos traits disponibles
        if (dataManager && dataManager.getAdrianLabTokens) {
            const traits = dataManager.getAdrianLabTokens();
            if (traits && traits.length > 0) {
                this.displayTraitsInCraftingGrid(traits);
            } else {
                traitsGrid.innerHTML = '<div class="no-traits"><p>No traits available for crafting</p></div>';
            }
        } else {
            traitsGrid.innerHTML = '<div class="no-traits"><p>DataManager not available</p></div>';
        }
    }

    /**
     * Mostrar traits en el grid de crafting
     */
    displayTraitsInCraftingGrid(traits) {
        const traitsGrid = document.getElementById('traits-grid');
        if (!traitsGrid) return;
        
        traitsGrid.innerHTML = '';
        
        traits.forEach(trait => {
            const traitCard = document.createElement('div');
            traitCard.className = 'trait-card';
            traitCard.setAttribute('data-token-id', trait.tokenId);
            
            const imageUrl = trait.image || trait.imageUrl || `https://adrianlab.vercel.app/labmetadata/images/${trait.tokenId}.png`;
            
            traitCard.innerHTML = `
                <img src="${imageUrl}" alt="${trait.title}" class="trait-image" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjQwIiB5PSI0NSIgZm9udC1mYW1pbHk9IjEwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5UcmFpdDwvdGV4dD4KPC9zdmc+'>
                <div class="trait-info">
                    <div class="trait-title">${trait.title}</div>
                    <div class="trait-id">#${trait.tokenId}</div>
                </div>
            `;
            
            traitsGrid.appendChild(traitCard);
        });
    }

    /**
     * Mostrar mensaje de no tokens
     */
    showNoTokens(grid, message = 'No tokens found') {
        if (!grid) return;
        grid.innerHTML = `<div class="no-tokens"><p>${message}</p></div>`;
    }

    /**
     * Mostrar mensaje de loading
     */
    showLoading(grid, message = 'Loading tokens...') {
        if (!grid) return;
        grid.innerHTML = `<div class="loading-message"><p>${message}</p></div>`;
    }
}

// Exportar para uso global
window.TraitLABDisplayManager = DisplayManager;
