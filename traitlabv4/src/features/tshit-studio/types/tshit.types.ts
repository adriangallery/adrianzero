/**
 * T-Shit Studio types — shared across components, hooks, store.
 */

export type Tool = 'brush' | 'eraser' | 'fill' | 'picker' | 'text' | 'sticker';

export interface Pixel {
  x: number;
  y: number;
  color: string;
}

/** Layer of pixels — atomic for undo/redo (a single brush stroke = one layer). */
export interface Layer {
  pixels: Pixel[];
  /** Origin tag for analytics/debug; optional. */
  origin?: 'brush' | 'fill' | 'text' | 'year' | 'sticker' | 'paste';
}

export interface Sticker {
  id: string;
  name: string;
  url: string;          // Public URL of the sticker SVG
  width: number;        // pixel size, square-bound (e.g. 32)
  height: number;
  category?: string;
}

export interface MintStatus {
  phase:
    | 'idle'
    | 'checking-allowance'
    | 'approving'
    | 'awaiting-approval-confirm'
    | 'uploading'
    | 'minting'
    | 'awaiting-mint-confirm'
    | 'success'
    | 'error';
  txHash?: string;
  tokenId?: number;
  designUrl?: string;
  error?: string;
}

/** Compact 148x148 paint mask shipped as static JSON. */
export interface TShirtMask {
  width: number;
  height: number;
  rows: string[];       // each row is a "01010..." bitstring of length `width`
}
