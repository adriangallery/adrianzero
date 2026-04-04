export type NFTType = 'Gen0' | 'SamuraiZERO' | 'SubZERO' | 'ZEROmovies' | 'GenZERO' | 'Unknown';

export interface GalleryNFT {
  tokenId: number;
  owner: string;
  name: string;
  imageUrl: string;
  type: NFTType;
}

export interface NFTMetadata {
  name: string;
  description?: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface GalleryState {
  // Modal
  selectedTokenId: number | null;
  isModalOpen: boolean;

  // Actions
  openModal: (tokenId: number) => void;
  closeModal: () => void;
  goToNext: () => void;
  goToPrevious: () => void;

  // All loaded token IDs (for modal navigation)
  tokenIds: number[];
  setTokenIds: (ids: number[]) => void;

  // Type filter
  activeFilter: NFTType | 'All';
  setActiveFilter: (filter: NFTType | 'All') => void;

  // Metadata cache
  metadataCache: Map<number, NFTMetadata>;
  setMetadata: (tokenId: number, metadata: NFTMetadata) => void;
}
