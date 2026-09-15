import { describe, expect, it } from 'vitest';
import { normalizeAdrianlabBase, adrianlabUrl } from '../adrianlab';

describe('normalizeAdrianlabBase', () => {
  it('recorta el /api final que lleva VITE_VERCEL_API_URL en producción (crítico 13-sep)', () => {
    expect(normalizeAdrianlabBase('https://adrianlab.vercel.app/api')).toBe('https://adrianlab.vercel.app');
    expect(normalizeAdrianlabBase('https://adrianlab.vercel.app/api/')).toBe('https://adrianlab.vercel.app');
    expect(normalizeAdrianlabBase('https://adrianlab.vercel.app/API')).toBe('https://adrianlab.vercel.app');
  });
  it('acepta la base sin /api y recorta barras', () => {
    expect(normalizeAdrianlabBase('https://adrianlab.vercel.app/')).toBe('https://adrianlab.vercel.app');
    expect(normalizeAdrianlabBase('https://lab.adrianzero.com')).toBe('https://lab.adrianzero.com');
  });
  it('sin variable → fallback de producción', () => {
    expect(normalizeAdrianlabBase(undefined)).toBe('https://lab.adrianzero.com');
    expect(normalizeAdrianlabBase('  ')).toBe('https://lab.adrianzero.com');
  });
  it('adrianlabUrl nunca produce /api/api', () => {
    expect(adrianlabUrl('/api/render/146')).not.toContain('/api/api');
  });
});
