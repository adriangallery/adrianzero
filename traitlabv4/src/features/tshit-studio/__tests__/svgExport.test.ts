import { describe, it, expect } from 'vitest';
import { buildDesignSvg, designSvgBytes, MAX_DESIGN_SVG_BYTES } from '../lib/svgExport';

describe('buildDesignSvg', () => {
  it('produces a valid <svg> with the baked PNG template embedded', () => {
    const out = buildDesignSvg({ pixels: [] });
    expect(out.startsWith('<svg')).toBe(true);
    expect(out.endsWith('</svg>')).toBe(true);
    expect(out).toContain('<title>T-Shit</title>');
    // Template is embedded as a single <image> data-URI instead of 2860 rects
    expect(out).toContain('<image');
    expect(out).toContain('data:image/png;base64,');
    expect(out).toContain('id="design"');
  });

  it('keeps the export under 64KB even with hundreds of painted pixels', () => {
    const pixels = [];
    for (let y = 110; y < 145; y++) for (let x = 25; x < 110; x++) {
      pixels.push({ x, y, color: '#ff0080' });
    }
    const out = buildDesignSvg({ pixels });
    expect(out.length).toBeLessThan(64 * 1024);
  });

  it('groups same-color pixels into a single <g>', () => {
    const out = buildDesignSvg({
      pixels: [
        { x: 0, y: 0, color: '#ff0000' },
        { x: 1, y: 0, color: '#ff0000' },
        { x: 2, y: 0, color: '#00ff00' },
      ],
    });
    expect((out.match(/<path fill="/g) ?? []).length).toBe(2);
  });

  it('merges horizontally adjacent same-color cells into one rect', () => {
    // Pick coords inside the paintable region so brightness == 1 (no shading
    // applied) — that lets us assert the original color survives unchanged.
    const out = buildDesignSvg({
      pixels: [
        { x: 60, y: 130, color: '#abcdef' },
        { x: 61, y: 130, color: '#abcdef' },
        { x: 62, y: 130, color: '#abcdef' },
      ],
    });
    expect(out).toContain('M60 130h3v1h-3z');
  });

  it('does not merge across rows', () => {
    const out = buildDesignSvg({
      pixels: [
        { x: 60, y: 130, color: '#abcdef' },
        { x: 60, y: 131, color: '#abcdef' },
      ],
    });
    expect(out).toContain('M60 130h1v1h-1z');
    expect(out).toContain('M60 131h1v1h-1z');
  });

  it('un garabato denso (caso real 13-sep: miles de runs de 1 px y 6 colores) cabe en el tope del uploader', () => {
    // Pseudoaleatorio determinista: ~4 000 píxeles sueltos en la zona de la camiseta.
    let seed = 42;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const colors = ['#ff0080', '#00a0ff', '#ffe600', '#ffffff', '#000000', '#00ff00'];
    const seen = new Set<string>();
    const pixels = [];
    while (pixels.length < 4000) {
      const x = 25 + Math.floor(rnd() * 100);
      const y = 95 + Math.floor(rnd() * 50);
      const k = `${x},${y}`;
      if (seen.has(k)) continue;
      seen.add(k);
      pixels.push({ x, y, color: colors[Math.floor(rnd() * colors.length)] });
    }
    const out = buildDesignSvg({ pixels });
    expect(designSvgBytes(out)).toBeLessThan(MAX_DESIGN_SVG_BYTES);
    // y con margen: la codificación por paths debe dejarlo por debajo del antiguo tope de 64KB
    expect(designSvgBytes(out)).toBeLessThan(64 * 1024);
  });

  it('embeds escaped title when provided', () => {
    const out = buildDesignSvg({
      pixels: [],
      title: '<bold> & "fancy"',
    });
    expect(out).toContain('<title>&lt;bold&gt; &amp; &quot;fancy&quot;</title>');
  });
});
