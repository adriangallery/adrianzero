export interface ShowcaseNFT {
  tokenId: string;
  imageUrl: string;
}

export interface SampleTrait {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
}

export interface TraitCategory {
  name: string;
  traits: SampleTrait[];
}

export interface UtilityCardData {
  title: string;
  description: string;
  icon: string;
}

export interface StatData {
  value: string;
  label: string;
}
