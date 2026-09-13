/**
 * Formato de cantidades de token para la Shop (D11/maqueta Shop.dc.html):
 * «36 349 ZERO» — miles con espacio fino, sin decimales salvo cantidades
 * pequeñas. Nunca lanza.
 */
import { formatUnits } from 'viem';

// uint128 max — ShopFacet devuelve esto cuando el precio no está configurado
export const UINT128_MAX = BigInt('340282366920938463463374607431768211455');

export function isPriceConfigured(price: bigint | undefined | null): price is bigint {
  return typeof price === 'bigint' && price > 0n && price < UINT128_MAX;
}

const THIN_SPACE = ' ';

/** 36349.12 → "36 349"; 12.5 → "12.5"; 0.004 → "0.004" */
export function formatTokenAmount(amount: bigint, decimals = 18): string {
  const asNumber = Number(formatUnits(amount, decimals));
  if (!Number.isFinite(asNumber)) return '—';
  const abs = Math.abs(asNumber);
  let fixed: string;
  if (abs >= 100) fixed = Math.round(asNumber).toString();
  else if (abs >= 1) fixed = asNumber.toFixed(1).replace(/\.0$/, '');
  else fixed = asNumber.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  const [int, dec] = fixed.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = sign ? int.slice(1) : int;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE);
  return `${sign}${grouped}${dec ? `.${dec}` : ''}`;
}

export function formatPrice(price: bigint | undefined | null): string {
  return isPriceConfigured(price) ? formatTokenAmount(price) : '—';
}
