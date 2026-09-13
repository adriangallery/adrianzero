/**
 * Parser de errores humanos para transacciones on-chain.
 *
 * Extraído de `lib/web3/utils/batchReads.ts:77-93` (`parseClaimError`) para
 * TraitLab (F4, recon RECON_TRAITLAB_UX_2026-09-12 §8.7): los 6 hooks de
 * escritura del hub (useApplyTraits, useOpenPack, useApplySerum,
 * useCraftTrait, useToggles, useRenameToken) comparten un `onError`
 * genérico "Failed to X. Please try again" — solo buy/onboarding
 * distinguían motivos, usando este mismo parser bajo otro nombre.
 * `batchReads.ts` re-exporta `parseClaimError` desde aquí para no romper
 * los imports existentes.
 */

/** true si el usuario cerró/rechazó la firma en la wallet (no es un fallo real). */
export function isUserRejection(error: unknown): boolean {
  const msg = errorMessage(error).toLowerCase();
  return msg.includes('user rejected') || msg.includes('user denied') || msg.includes('rejected the request');
}

function errorMessage(error: unknown): string {
  if (!error) return '';
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Traduce un error de wallet/RPC/contrato a un mensaje corto y humano.
 * Nunca lanza — si no reconoce el patrón, devuelve un mensaje genérico
 * pero seguro de mostrar en un toast.
 */
export function humanError(error: unknown): string {
  const msg = errorMessage(error).toLowerCase();

  if (msg.includes('user rejected') || msg.includes('user denied') || msg.includes('rejected the request')) {
    return 'Transaction cancelled';
  }
  if (msg.includes('already claimed')) {
    return 'Already claimed for this punk';
  }
  if (msg.includes('not token owner') || msg.includes('not owner') || msg.includes('caller is not owner')) {
    return 'You must own this token';
  }
  if (msg.includes('campaign not active') || msg.includes('not active')) {
    return 'Campaign expired or not started';
  }
  if (msg.includes('429') || msg.includes('rate limit')) {
    return 'Too many requests, please wait';
  }
  if (msg.includes('insufficient funds') || msg.includes('insufficient balance')) {
    return 'Insufficient funds for gas';
  }
  if (msg.includes('exceeds allowance') || msg.includes('erc1155: caller is not owner nor approved')) {
    return 'Approval needed — try again to grant it';
  }
  if (msg.includes('already equipped') || msg.includes('trait already applied')) {
    return 'That trait is already equipped';
  }
  if (msg.includes('exclusive') || msg.includes('category') || msg.includes('slot')) {
    return 'This trait conflicts with a rule for this category';
  }
  if (msg.includes('network changed') || msg.includes('chain mismatch') || msg.includes('wrong network')) {
    return 'Switch your wallet to Base and try again';
  }
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return 'The network took too long to respond, try again';
  }

  return 'Transaction failed. Please try again.';
}
