/**
 * Session persistence for the AZombie builder (28-oct-2026).
 * The wallet popup (chain switch, account events) can remount the route: without this the editor
 * snapped back to a blank zombie while the tx already carried the design, and the reveal was lost.
 * sessionStorage only (per tab); every access is guarded (private mode, blocked storage).
 */

import { MASK_BYTES } from './zombieSpec';
import { type Traits, NO_TRAITS, bytesToHex, hexToBytes, normalizeTraits, sanitizeMask } from './encoding';

const DRAFT_KEY = 'azombie:draft';
const PENDING_KEY = 'azombie:pending';

export interface Design {
  mask: Uint8Array;
  traits: Traits;
}

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

function toDesign(v: { mask?: string; traits?: number[] } | null): Design | null {
  if (!v || typeof v.mask !== 'string' || !Array.isArray(v.traits)) return null;
  const bytes = hexToBytes(v.mask);
  if (bytes.length !== MASK_BYTES) return null;
  return { mask: sanitizeMask(bytes), traits: normalizeTraits(v.traits) };
}

export function loadDraft(): Design | null {
  return toDesign(read(DRAFT_KEY));
}

export function saveDraft(d: Design | null) {
  write(DRAFT_KEY, d ? { mask: bytesToHex(d.mask), traits: [...d.traits] } : null);
}

export interface PendingMint extends Design {
  hash: `0x${string}`;
}

export function loadPending(): PendingMint | null {
  const v = read<{ hash?: string; mask?: string; traits?: number[] }>(PENDING_KEY);
  const d = toDesign(v);
  if (!d || !v?.hash || !/^0x[0-9a-fA-F]{64}$/.test(v.hash)) return null;
  return { ...d, hash: v.hash as `0x${string}` };
}

export function savePending(p: PendingMint | null) {
  write(PENDING_KEY, p ? { hash: p.hash, mask: bytesToHex(p.mask), traits: [...p.traits] } : null);
}

export const EMPTY_TRAITS = NO_TRAITS;
