/**
 * OGCLAIM Module Types
 */

export interface Punk {
  id: number;
  claimed: boolean;
}

export interface OGClaimStats {
  totalClaimed: number;
  totalSupply: number;
  percentClaimed: number;
}
