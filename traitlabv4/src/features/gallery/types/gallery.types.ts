export interface GalleryNFT {
  tokenId: string;
  fileName: string;
  imageUrl: string;
}

export interface NFTMetadata {
  tokenId: string;
  traitHash?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  name?: string;
  description?: string;
}

export interface GalleryState {
  // Modal state
  selectedNFT: GalleryNFT | null;
  isModalOpen: boolean;
  currentIndex: number;
  allNFTs: GalleryNFT[];

  // Actions
  openModal: (nft: GalleryNFT, index: number, allNFTs: GalleryNFT[]) => void;
  closeModal: () => void;
  goToNext: () => void;
  goToPrevious: () => void;

  // Auto-scroll state
  isAutoScrollPlaying: boolean;
  scrollVelocity: number;
  toggleAutoScroll: () => void;
  setScrollVelocity: (v: number) => void;

  // Metadata cache
  metadataCache: Map<string, NFTMetadata>;
  setMetadata: (tokenId: string, metadata: NFTMetadata) => void;
}
