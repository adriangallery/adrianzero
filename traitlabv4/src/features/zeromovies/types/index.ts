export interface Movie {
  id: number;
  name: string;
  minted: boolean;
  active: boolean;
  tokenId: number;
  mintedBy: string;
}

export interface MovieCatalog {
  movies: Movie[];
  isLoading: boolean;
  error: Error | null;
}

// ───── ZEROmovies Season 2 ─────

/** S2 catalog entry (mirrors on-chain `Movie2` returned by getMovie2). */
export interface Movie2 {
  id: number;
  name: string;
  /** Theme bucket — drives accent colour in the UI grid. */
  angle: 'cult' | 'pixel' | 'horror';
  isMystery: boolean;
}

/** Per-movie rental state (mirrors getMovie2RentalInfo on-chain). */
export interface Movie2RentalState {
  permanent: boolean;
  renter: string;
  rentedAt: number;
  isOverdue: boolean;
  daysOverdue: number;
}

/** A single S1 holder's eligibility row from the Merkle snapshot. */
export interface GoldenSnapshotEntry {
  address: string;
  /** 1 base + 1 per S1 franchise completed (max 10). */
  ticketCount: number;
  /** Number of S1 movies permanently held — drives cross-season share. */
  crossSeasonWeight: number;
  /** Merkle proof passed to claimGoldenMint / claimCrossSeasonRewards. */
  proof: string[];
}
