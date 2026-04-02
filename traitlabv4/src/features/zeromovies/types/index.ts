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
