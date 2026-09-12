/**
 * Recuerda el último token usado en el editor TraitLab (localStorage,
 * por dispositivo — no por wallet: si cambian de cuenta y el token ya no
 * es suyo, `TokenSelectorSheet` simplemente no lo encuentra en su lista y
 * no se preselecciona).
 */

const KEY = 'traitlab:last-token-id';

export function getLastUsedTokenId(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setLastUsedTokenId(tokenId: string): void {
  try {
    window.localStorage.setItem(KEY, tokenId);
  } catch {
    // localStorage puede fallar (Safari privado, cuota) — no es crítico.
  }
}
