import type {BudokaiStatus} from '@/lib/web3/abi';

export const FIRST_SAMURAI_TOKEN_ID = 500;
export const LAST_SAMURAI_TOKEN_ID = 1099;
export const TOTAL_SAMURAI = 600;
export const ENTRY_FEE_ZERO = 100;
export const SENZU_FEE_ZERO = 10_000;

export interface Samurai {
    tokenId: number;
    name: string;
    senryoku: number;
    tier: string;
    weapon?: string;
    mask?: string;
    armour?: string;
    background?: string;
}

export interface BudokaiInfo {
    id: number;
    seed: bigint;
    pool: bigint;
    entryStart: number;
    entryEnd: number;
    resolveBlock: bigint;
    minEntries: number;
    status: BudokaiStatus;
    entryCount: number;
}

export interface Champions {
    champion: number;
    runnerUp: number;
    semifinalists: [number, number];
    quarterfinalists: [number, number, number, number];
}

export interface MatchResult {
    budokaiId: number;
    round: number;
    tokenA: number;
    tokenB: number;
    winner: number;
    kaioken: boolean;
}
