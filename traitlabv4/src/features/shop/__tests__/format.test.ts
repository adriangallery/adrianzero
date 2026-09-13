import { describe, expect, it } from 'vitest';
import { formatPrice, formatTokenAmount, isPriceConfigured, UINT128_MAX } from '../lib/format';

const Z = 10n ** 18n;

describe('formatTokenAmount (Shop)', () => {
  it('agrupa miles con espacio fino y sin decimales a partir de 100', () => {
    expect(formatTokenAmount(36349n * Z + Z / 8n)).toBe('36 349');
    expect(formatTokenAmount(5000n * Z)).toBe('5 000');
    expect(formatTokenAmount(150n * Z)).toBe('150');
  });
  it('conserva decimales útiles en cantidades pequeñas', () => {
    expect(formatTokenAmount(125n * Z / 10n)).toBe('12.5');
    expect(formatTokenAmount(4n * Z / 1000n)).toBe('0.004');
    expect(formatTokenAmount(0n)).toBe('0');
  });
  it('precio no configurado (uint128.max o 0) → —', () => {
    expect(isPriceConfigured(UINT128_MAX)).toBe(false);
    expect(isPriceConfigured(0n)).toBe(false);
    expect(formatPrice(UINT128_MAX)).toBe('—');
    expect(formatPrice(5000n * Z)).toBe('5 000');
  });
});
