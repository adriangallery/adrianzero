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
 *
 * F7 (13-sep-2026): extendido a TODOS los flujos con tx del sitio (serum,
 * crafting, toggles, name registry, rewards, ogclaim, kit sale/onboarding…).
 * Los `require(...)` string y los custom errors nuevos se sacaron de los ABIs
 * verificados en Blockscout de los contratos reales usados por el front
 * (`src/config/contracts.ts`): `SERUM_MODULE`, `ADRIAN_CRAFTING`,
 * `ZOOM_TOGGLE`, `ADRIAN_NAME_REGISTRY`, `REWARDS_CONTRACT`,
 * `OGCLAIM_CONTRACT`, `TRAITS_EXTENSIONS`, `KIT_SALE` — no del Diamond
 * `0x542b…D0A0` (ZEROmovies/Shop/Packs viven ahí y ya tienen su propio mapeo
 * en `parseMovie2Error.ts` / `PurchaseSheet`).
 */

/** true si el usuario cerró/rechazó la firma en la wallet (no es un fallo real). */
export function isUserRejection(error: unknown): boolean {
  const msg = errorMessage(error).toLowerCase();
  return msg.includes('user rejected') || msg.includes('user denied') || msg.includes('rejected the request');
}

/**
 * Aplana un error (y su cadena `cause`, como hacen los `BaseError` de viem —
 * `ContractFunctionExecutionError` envolviendo un `ContractFunctionRevertedError`)
 * en un único string de búsqueda. Cubre tanto `Error#message` normal como
 * `shortMessage`/`details` de viem y `data.errorName` (el nombre del custom
 * error de Solidity ya decodificado por viem contra el ABI).
 */
function errorMessage(error: unknown): string {
  if (!error) return '';

  const parts: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;

  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);
    const obj = current as Record<string, unknown>;
    if (typeof obj.shortMessage === 'string') parts.push(obj.shortMessage);
    if (typeof obj.message === 'string') parts.push(obj.message);
    if (typeof obj.details === 'string') parts.push(obj.details);
    const data = obj.data as { errorName?: unknown } | undefined;
    if (data && typeof data.errorName === 'string') parts.push(data.errorName);
    current = obj.cause;
  }

  if (parts.length > 0) return parts.join(' ');
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
  if (msg.includes('not punk owner')) {
    return 'You must own this punk';
  }
  if (msg.includes('not token owner') || msg.includes('not owner') || msg.includes('caller is not owner')) {
    return 'You must own this token';
  }
  if (msg.includes('too early')) {
    return "It's too early to claim this — check back later";
  }
  if (msg.includes('too late')) {
    return 'The claim window for this has closed';
  }
  if (msg.includes('campaign not active') || msg.includes('not active')) {
    return 'Campaign expired or not started';
  }
  if (msg.includes('429') || msg.includes('rate limit')) {
    return 'Too many requests, please wait';
  }
  // Custom errors de KIT_SALE (onboarding/buy — `Contratos` ABI verificado en
  // Blockscout, 13-sep-2026): nombres de identificador Solidity, sin espacios.
  if (msg.includes('kitsalespaused')) {
    return 'Kit sales are paused right now';
  }
  if (msg.includes('kitnotactive') || msg.includes('kitnotavailable')) {
    return "This kit isn't available right now";
  }
  if (msg.includes('notstarted')) {
    return "This sale hasn't started yet";
  }
  if (msg.includes('exceedsmaxsupply')) {
    return 'Sold out — no supply left for this kit';
  }
  if (msg.includes('exceedskitwalletlimit')) {
    return "You've reached the per-wallet limit for this kit";
  }
  if (msg.includes('exceedsmintlimit') || msg.includes('exceedstxlimit')) {
    return "You've hit the mint limit for this transaction";
  }
  if (msg.includes('nofreeallocation')) {
    return "You don't have a free allocation for this";
  }
  if (msg.includes('insufficienteth')) {
    return 'Not enough ETH sent for this purchase';
  }
  if (msg.includes('insufficientadriantokens')) {
    return "You don't have enough ADRIAN for this";
  }
  if (
    msg.includes('batchnotavailable') ||
    msg.includes('noactivebatch') ||
    msg.includes('invalidbatch') ||
    msg.includes('batchmintingpaused')
  ) {
    return "This batch isn't available right now";
  }
  // Serum / Crafting / Toggles / Name Registry / Traits (require() strings de
  // los contratos reales del front, no del Diamond $ZERO).
  if (msg.includes('serum already used')) {
    return 'This serum has already been used on this token';
  }
  if (msg.includes('token not eligible')) {
    return "This token isn't eligible for this serum";
  }
  if (msg.includes('serum does not exist')) {
    return 'That serum no longer exists';
  }
  if (msg.includes('recipe inactive')) {
    return "This recipe isn't active right now";
  }
  if (msg.includes('total burn below requirement')) {
    return "You don't have enough materials for this recipe";
  }
  if (msg.includes('token does not exist')) {
    return "That token doesn't exist";
  }
  if (msg.includes('name cannot be empty')) {
    return 'Enter a name first';
  }
  if (msg.includes('name too long')) {
    return 'That name is too long';
  }
  if (msg.includes('cannot apply this asset')) {
    return "This trait can't be applied here";
  }
  if (msg.includes('insufficient inventory balance')) {
    return "You don't have enough of this in your inventory";
  }
  if (msg.includes('too many traits in single transaction')) {
    return 'Too many traits at once — try fewer';
  }
  if (
    msg.includes('insufficientbalance') ||
    msg.includes('erc20insufficientbalance') ||
    msg.includes('erc721insufficientbalance')
  ) {
    return "You don't have enough tokens for this";
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
