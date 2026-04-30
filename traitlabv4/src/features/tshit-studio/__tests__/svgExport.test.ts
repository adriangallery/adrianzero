import { describe, it, expect } from 'vitest';
import { buildDesignSvg } from '../lib/svgExport';

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
    expect((out.match(/<g fill="/g) ?? []).length).toBe(2);
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
    expect(out).toContain('<rect x="60" y="130" width="3" height="1"/>');
  });

  it('does not merge across rows', () => {
    const out = buildDesignSvg({
      pixels: [
        { x: 60, y: 130, color: '#abcdef' },
        { x: 60, y: 131, color: '#abcdef' },
      ],
    });
    expect(out).toContain('<rect x="60" y="130" width="1" height="1"/>');
    expect(out).toContain('<rect x="60" y="131" width="1" height="1"/>');
  });

  it('embeds escaped title when provided', () => {
    const out = buildDesignSvg({
      pixels: [],
      title: '<bold> & "fancy"',
    });
    expect(out).toContain('<title>&lt;bold&gt; &amp; &quot;fancy&quot;</title>');
  });
});
