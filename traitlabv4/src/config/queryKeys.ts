/**
 * Query Key Factory
 * Centralized query keys for React Query consistency
 */

export const queryKeys = {
  // Packs & Serums (derived from Zustand store — staleTime: Infinity)
  packs: (address?: string) => ['packs', address] as const,
  serums: (address?: string) => ['serums', address] as const,

  // Crafting
  craftingRecipes: (address?: string) => ['crafting-recipes', address] as const,
  canCraft: (address: string, recipeId: string) => ['can-craft', address, recipeId] as const,

  // Customization
  customNames: (tokenIds: string[]) => ['custom-names', tokenIds] as const,
  tokenToggle: (tokenId?: string) => ['token-toggle', tokenId] as const,
  togglePrice: (toggleId: number) => ['toggle-price', toggleId] as const,
  canSetToggle: (address?: string, tokenId?: string, toggleId?: number) =>
    ['can-set-toggle', address, tokenId, toggleId] as const,

  // OG Claim (slow-changing — staleTime: 300_000)
  ogClaimStats: () => ['ogclaim-stats'] as const,

  // Rewards
  rewardsCampaigns: () => ['rewards-campaigns'] as const,

  // Shitdrop
  shitdropActive: () => ['shitdrop-active'] as const,
  shitdropUserMinted: (address?: string) => ['shitdrop-user-minted', address] as const,
  shitdropConfig: () => ['shitdrop-config'] as const,

  // Shop
  shopItems: () => ['shop-items'] as const,

  // Kit
  kitInfo: () => ['kit-info'] as const,
} as const;
