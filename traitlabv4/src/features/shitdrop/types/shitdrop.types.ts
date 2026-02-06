export interface Drop {
  id: number;
  title: string;
  short: string;
  image: string;
  opensea: string;
  date: string;
  totalMinted?: number;
}

export interface DropsData {
  version: number;
  updatedAt: string;
  drops: Drop[];
}

export interface MintConfig {
  tokenId: bigint;
  startTime: bigint;
  endTime: bigint;
  maxPerWallet: bigint;
}

export interface ShitdropState {
  isActive: boolean;
  userMinted: number;
  config: MintConfig | null;
  currentDrop: Drop | null;
  previousDrops: Drop[];

  // Actions
  setIsActive: (active: boolean) => void;
  setUserMinted: (minted: number) => void;
  setConfig: (config: MintConfig) => void;
  setCurrentDrop: (drop: Drop) => void;
  setPreviousDrops: (drops: Drop[]) => void;
}
