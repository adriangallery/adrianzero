/**
 * NFT Type Definitions
 * Core types for ERC721 and ERC1155 tokens
 */

export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: NFTAttribute[];
  external_url?: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface NFTImage {
  cachedUrl?: string;
  thumbnailUrl?: string;
  pngUrl?: string;
  originalUrl?: string;
}

export interface AdrianZeroToken {
  tokenId: string;
  owner: string;
  name?: string; // Custom name from NameRegistry
  metadata?: NFTMetadata;
  image?: NFTImage;
  tokenUri?: string;
  isActivated?: boolean;
  appliedTraits?: string[]; // Array of trait token IDs
}

export interface Trait {
  tokenId: string;
  name: string;
  category: TraitCategory;
  fileName: string;
  maxSupply: number;
  balance: number; // User's balance of this trait
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  metadata?: NFTMetadata;
  image?: NFTImage;
}

// TraitCategory is now a flexible string type to accommodate all categories from traits.json
// Including: SWAG, HEAD, GEAR, BEARD, TOP, HAT, WEAPON, MASK, SKINTRAIT, RANDOMSHIT,
// ARMOUR, PAGERS, GI, KIMONO, SKIN, 3D, FLOPPY DISCS, ACTION PACKS, and more
export type TraitCategory = string;

export interface Pack {
  packId: string;
  name: string;
  type: 'FLOPPY_DISC' | 'ACTION_PACK' | 'SPECIAL';
  contract: string;
  balance: number;
  metadata?: NFTMetadata;
  image?: NFTImage;
  rarity?: string;
  special?: boolean;
}

export interface Serum {
  tokenId: string;
  name: string;
  balance: number;
  metadata?: NFTMetadata;
  image?: NFTImage;
}

export interface CraftingRecipe {
  recipeId: string;
  inputTraits: string[]; // Token IDs required (empty for ANY type)
  outputTrait: string; // Token ID produced
  type: 'SPECIFIC' | 'ANY';
  burnTotal?: number; // For ANY recipes - number of any traits to burn
  isActive: boolean;
  isEligible?: boolean; // User has required traits
}
