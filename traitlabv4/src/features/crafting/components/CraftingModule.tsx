/**
 * CraftingModule Component
 * Craft traits using recipes with burning mechanism
 */

import { useAccount } from 'wagmi';
import { useCraftTrait } from '../hooks/useCrafting';

// Placeholder recipes - in production, these would be fetched from the contract
const SAMPLE_RECIPES = [
  {
    recipeId: '1',
    name: 'Rare Background',
    inputTraits: ['Common Background #1', 'Common Background #2'],
    outputTrait: 'Rare Background',
    isActive: true,
  },
  {
    recipeId: '2',
    name: 'Epic Eyes',
    inputTraits: ['Rare Eyes #1', 'Rare Eyes #2', 'Rare Eyes #3'],
    outputTrait: 'Epic Eyes',
    isActive: true,
  },
];

export function CraftingModule() {
  const { isConnected } = useAccount();
  const craftTrait = useCraftTrait();

  const handleCraft = async (recipeId: string) => {
    const confirmed = confirm(
      'Warning: Crafting will burn (destroy) the input traits. This action cannot be undone. Continue?'
    );

    if (!confirmed) return;

    try {
      await craftTrait.mutateAsync({ recipeId });
    } catch (error) {
      console.error('Failed to craft:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🔌</div>
        <h2 className="text-xl font-semibold text-foreground">
          Wallet Not Connected
        </h2>
        <p className="text-muted-foreground mt-2">
          Please connect your wallet to craft traits
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Crafting</h1>
        <p className="text-muted-foreground mt-1">
          Combine traits to create new ones
        </p>
      </div>

      {/* Warning */}
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⚠️</div>
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

      {/* Recipes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Available Recipes
        </h2>

        {SAMPLE_RECIPES.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-4">⚗️</div>
            <p className="text-lg font-medium text-foreground">
              No recipes available
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back later for crafting recipes
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {SAMPLE_RECIPES.map((recipe) => (
              <div
                key={recipe.recipeId}
                className="p-6 bg-card border border-border rounded-lg"
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {recipe.name}
                </h3>

                {/* Input Traits */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Required Traits:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {recipe.inputTraits.map((trait, index) => (
                      <li
                        key={index}
                        className="text-sm text-foreground flex items-center gap-2"
                      >
                        <span className="text-red-500">🔥</span>
                        {trait}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Output Trait */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Creates:
                  </p>
                  <p className="mt-1 text-foreground font-medium flex items-center gap-2">
                    <span className="text-green-500">✨</span>
                    {recipe.outputTrait}
                  </p>
                </div>

                {/* Craft Button */}
                <button
                  onClick={() => handleCraft(recipe.recipeId)}
                  disabled={craftTrait.isPending}
                  className="mt-6 w-full touch-target px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {craftTrait.isPending ? 'Crafting...' : 'Craft'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-semibold text-foreground">How Crafting Works</h3>
        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
          <li>• Select a recipe you want to craft</li>
          <li>• Make sure you have all required input traits</li>
          <li>• Input traits will be burned (destroyed) permanently</li>
          <li>• You will receive the output trait after crafting</li>
        </ul>
      </div>
    </div>
  );
}
