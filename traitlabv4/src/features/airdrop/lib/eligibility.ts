/**
 * Airdrop Cubist Souls → $ZERO (plan A4b-2): lógica pura de la página /claim.
 * La lista y las pruebas vienen del árbol ya publicado on-chain
 * (`public/data/airdrop/cubist-souls-2026-09.json`, raíz 0x6f4b…32d6); aquí
 * no se recalcula nada.
 */

export interface AirdropClaimEntry {
  /** wei, en string */
  amount: string;
  /** ZERO en decimal, p. ej. "1362.5" */
  amountZero: string;
  souls: number;
  proof: `0x${string}`[];
}

export interface AirdropList {
  name: string;
  chainId: number;
  diamond: string;
  root: `0x${string}`;
  totalRecipients: number;
  /** wei, en string */
  totalAmount: string;
  /** por dirección en minúsculas */
  claims: Record<string, AirdropClaimEntry>;
}

export function findClaim(list: AirdropList | undefined, address: string | undefined): AirdropClaimEntry | null {
  if (!list || !address) return null;
  return list.claims[address.toLowerCase()] ?? null;
}

/** "25000.0" → "25,000" (sin decimales: los importes son enteros o casi). */
export function formatZero(amountZero: string): string {
  const n = Number(amountZero);
  if (!Number.isFinite(n)) return amountZero;
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export type ClaimView =
  | 'disconnected'
  | 'loading'
  | 'error'
  | 'not-eligible'
  | 'claimed'
  | 'root-mismatch'
  | 'closed'
  | 'ready';

export interface ClaimViewInput {
  isConnected: boolean;
  isLoading: boolean;
  hasError: boolean;
  entry: AirdropClaimEntry | null;
  hasClaimed?: boolean;
  isActive?: boolean;
  onchainRoot?: string;
  listRoot?: string;
}

export function claimView(i: ClaimViewInput): ClaimView {
  if (!i.isConnected) return 'disconnected';
  if (i.hasError) return 'error';
  if (i.isLoading) return 'loading';
  if (!i.entry) return 'not-eligible';
  if (i.hasClaimed) return 'claimed';
  // Si alguien cambiara la raíz on-chain, las pruebas de este fichero dejarían de valer
  if (i.onchainRoot && i.listRoot && i.onchainRoot.toLowerCase() !== i.listRoot.toLowerCase()) return 'root-mismatch';
  if (!i.isActive) return 'closed';
  return 'ready';
}
