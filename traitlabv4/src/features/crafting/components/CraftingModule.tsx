/**
 * CraftingModule Component
 * Craft traits using recipes with burning mechanism
 */

import { useState } from 'react';
import { AlertTriangle, FlaskConical, Flame, Sparkles, Check, Frame } from 'lucide-react';
import { useCraftTrait } from '../hooks/useCrafting';
import { useCraftingRecipes } from '../hooks/useCraftingRecipes';
import { useTraits } from '@/features/traits/hooks/useTraits';
import { useWalletPrompt } from '@/hooks/useWalletPrompt';
import type { CraftingRecipe, Trait } from '@/types/nft.types';

export function CraftingModule() {
  const craftTrait = useCraftTrait();
  const { data: recipes = [], isLoading: recipesLoading } = useCraftingRecipes();
  const { data: traits = [], isLoading: traitsLoading } = useTraits();
  const { requireWallet } = useWalletPrompt();

  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(null);
  const [selectedTraitIds, setSelectedTraitIds] = useState<Set<string>>(new Set());

  const isLoading = recipesLoading || traitsLoading;

  // Helper to get trait name by tokenId
  const getTraitName = (tokenId: string) => {
    const trait = traits.find(t => t.tokenId === tokenId);
    return trait ? trait.name : `Trait #${tokenId}`;
  };

  // Helper to get trait by tokenId
  const getTrait = (tokenId: string): Trait | undefined => {
    return traits.find(t => t.tokenId === tokenId);
  };

  // Helper to get trait image URL
  const getTraitImageUrl = (trait: Trait | undefined): string | undefined => {
    if (!trait) return undefined;
    return (
      trait.image?.cachedUrl ||
      trait.image?.thumbnailUrl ||
      trait.image?.originalUrl ||
      trait.metadata?.image
    );
  };

  // Helper to check if user has a specific trait
  const hasTrait = (tokenId: string) => {
    return traits.some(t => t.tokenId === tokenId && Number(t.balance || 0) > 0);
  };

  // Toggle trait selection
  const toggleTraitSelection = (tokenId: string) => {
    const newSelection = new Set(selectedTraitIds);
    if (newSelection.has(tokenId)) {
      newSelection.delete(tokenId);
    } else {
      newSelection.add(tokenId);
    }
    setSelectedTraitIds(newSelection);
  };

  // Check if can craft with current selection
  const canCraftWithSelection = (): boolean => {
    if (!selectedRecipe) return false;

    if (selectedRecipe.type === 'ANY') {
      return selectedTraitIds.size >= (selectedRecipe.burnTotal || 0);
    } else {
      // SPECIFIC: must have all required traits selected
      return selectedRecipe.inputTraits.every(id => selectedTraitIds.has(id));
    }
  };

  const handleCraft = async () => {
    if (!selectedRecipe || !canCraftWithSelection()) return;

    // Check if wallet is connected before proceeding
    if (!requireWallet('craft traits')) {
      return;
    }

    const confirmed = confirm(
      `Warning: Crafting will permanently burn (destroy) ${selectedTraitIds.size} trait(s). This action cannot be undone. Continue?`
    );

    if (!confirmed) return;

    try {
      await craftTrait.mutateAsync({
        recipeId: selectedRecipe.recipeId,
        // For ANY recipes, we need to pass the selected trait IDs
        burnIds: selectedRecipe.type === 'ANY' ? Array.from(selectedTraitIds) : undefined,
      });

      // Reset selection after successful craft
      setSelectedTraitIds(new Set());
      setSelectedRecipe(null);
    } catch (error) {
      console.error('Failed to craft:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="shimmer w-16 h-16 rounded-full mb-4" />
        <p className="text-muted-foreground">Loading recipes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Crafting</h1>
        <p className="text-muted-foreground mt-1">
          Select a recipe, choose traits to burn, and craft new items
        </p>
      </div>

      {/* Warning */}
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-700 dark:text-yellow-400">
              Warning: Irreversible Action
            </h3>
            <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
              Crafting will permanently burn (destroy) the input traits. Make sure
              you want to proceed before crafting.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Left Column: Recipes */}
        <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Available Recipes
        </h2>

          {recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FlaskConical className="h-16 w-16 mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground">
                No recipes available
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Check back later for crafting recipes
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recipes.map((recipe) => {
                const isSelected = selectedRecipe?.recipeId === recipe.recipeId;
                const outputTrait = getTrait(recipe.outputTrait);
                const outputImageUrl = getTraitImageUrl(outputTrait);

                return (
                  <button
                    key={`recipe-${recipe.recipeId}`}
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      setSelectedTraitIds(new Set());
                    }}
                    className={`p-4 bg-card border-2 rounded-lg text-left transition-all w-full ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground">
                        Recipe #{recipe.recipeId}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-muted rounded-full">
                        {recipe.type}
                      </span>
                    </div>

                    {/* Requirements */}
                    <div className="text-sm text-muted-foreground mb-3">
                      {recipe.type === 'ANY' ? (
                        <span>Burn any {recipe.burnTotal} traits</span>
                      ) : (
                        <span>Burn {recipe.inputTraits.length} specific trait{recipe.inputTraits.length > 1 ? 's' : ''}</span>
                      )}
                    </div>

                    {/* Output with Image */}
                    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                      {/* Output trait image */}
                      <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                        {outputImageUrl ? (
                          <img
                            src={outputImageUrl}
                            alt={outputTrait?.name || `#${recipe.outputTrait}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-success" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground">Creates:</p>
                        <p className="font-medium text-foreground text-sm truncate">
                          {getTraitName(recipe.outputTrait)}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-primary">
                        <Check className="h-3 w-3" />
                        <span>Selected - Choose traits below</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Trait Selection Grid */}
        <div className="space-y-4">
          {selectedRecipe ? (
            <>
              {/* Recipe Requirements */}
              <div className="p-4 bg-card border border-border rounded-lg">
                <h3 className="font-semibold text-foreground mb-3">
                  Recipe Requirements
                </h3>

                {selectedRecipe.type === 'ANY' ? (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Select any {selectedRecipe.burnTotal} traits to burn:
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{
                            width: `${Math.min(100, (selectedTraitIds.size / (selectedRecipe.burnTotal || 1)) * 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {selectedTraitIds.size}/{selectedRecipe.burnTotal}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Required traits:</p>
                    {selectedRecipe.inputTraits.map((traitId, index) => {
                      const trait = getTrait(traitId);
                      const isSelected = selectedTraitIds.has(traitId);
                      const hasIt = hasTrait(traitId);

                      return (
                        <div
                          key={`req-${index}`}
                          className={`flex items-center gap-2 text-sm ${
                            isSelected ? 'text-success' : hasIt ? 'text-foreground' : 'text-destructive'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <Flame className="h-4 w-4" />
                          )}
                          <span>{trait?.name || `Trait #${traitId}`}</span>
                          {!hasIt && <span className="text-xs">(Don't have)</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Output Preview */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Will create:</p>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-success" />
                    <span className="font-semibold text-foreground">
                      {getTraitName(selectedRecipe.outputTrait)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Craft Button - Above Grid */}
              <button
                onClick={handleCraft}
                disabled={craftTrait.isPending || !canCraftWithSelection()}
                className="w-full touch-target px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {craftTrait.isPending ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Crafting...
                  </>
                ) : canCraftWithSelection() ? (
                  <>
                    <Flame className="h-5 w-5" />
                    Craft Now
                  </>
                ) : (
                  'Select Required Traits'
                )}
              </button>

              {/* Trait Selection Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">
                    Select Traits to Burn
                  </h3>
                  {selectedTraitIds.size > 0 && (
                    <button
                      onClick={() => setSelectedTraitIds(new Set())}
                      className="text-xs text-destructive hover:underline"
                    >
                      Clear ({selectedTraitIds.size})
                    </button>
                  )}
                </div>

                {traits.length === 0 ? (
                  <div className="p-8 bg-muted rounded-lg text-center">
                    <Frame className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No traits found in your wallet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[500px] overflow-y-auto p-1">
                    {traits.map((trait, index) => {
                      const isSelected = selectedTraitIds.has(trait.tokenId);
                      const isRequired = selectedRecipe.type === 'SPECIFIC' && selectedRecipe.inputTraits.includes(trait.tokenId);
                      const imageUrl = getTraitImageUrl(trait);

                      return (
                        <button
                          key={`trait-select-${index}-${trait.tokenId}`}
                          onClick={() => toggleTraitSelection(trait.tokenId)}
                          className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                            isSelected
                              ? 'ring-2 ring-primary shadow-lg'
                              : 'hover:ring-1 hover:ring-border hover:shadow-md'
                          } bg-muted`}
                        >
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={trait.name || `#${trait.tokenId}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                // Fallback to originalUrl if cachedUrl fails
                                if (trait.image?.originalUrl && e.currentTarget.src !== trait.image.originalUrl) {
                                  e.currentTarget.src = trait.image.originalUrl;
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Frame className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}

                          {/* Required badge */}
                          {isRequired && (
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-yellow-500/90 rounded text-[10px] font-medium text-white">
                              Required
                            </div>
                          )}

                          {/* Balance badge */}
                          {trait.balance && Number(trait.balance) > 1 && (
                            <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-accent/90 rounded text-[10px] font-medium" style={{ color: '#00ff00' }}>
                              ×{trait.balance}
                            </div>
                          )}

                          {/* Selection indicator */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          )}

                          {/* Name overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                            <p className="text-[10px] text-white truncate">
                              {trait.name || `#${trait.tokenId}`}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 bg-muted rounded-lg text-center">
              <FlaskConical className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground mb-2">
                Select a Recipe
              </p>
              <p className="text-sm text-muted-foreground">
                Choose a recipe from the left to start crafting
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-muted rounded-lg mt-6">
        <h3 className="font-semibold text-foreground">How Crafting Works</h3>
        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
          <li>• Select a recipe from the available options</li>
          <li>• Choose traits to burn from your collection (they show with images)</li>
          <li>• Selected traits will be permanently destroyed</li>
          <li>• You will receive the output trait after crafting</li>
        </ul>
      </div>
    </div>
  );
}
