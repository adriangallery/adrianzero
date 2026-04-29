import { describe, it, expect } from 'vitest';
import { buildDesignSvg } from '../lib/svgExport';

const FAKE_TSHIRT = '<svg viewBox="0 0 148 148"><rect x="10" y="10" width="1" height="1" fill="#fff"/></svg>';

describe('buildDesignSvg', () => {
  it('produces a valid <svg> with the t-shirt template inlined', () => {
    const out = buildDesignSvg({ pixels: [], tshirtSvg: FAKE_TSHIRT });
    expect(out.startsWith('<svg')).toBe(true);
    expect(out.endsWith('</svg>')).toBe(true);
    expect(out).toContain('<title>T-Shit</title>');
    expect(out).toContain('id="tshirt-base"');
    expect(out).toContain('<rect x="10" y="10"');
  });

  it('groups same-color pixels into a single <g>', () => {
    const out = buildDesignSvg({
      pixels: [
        { x: 0, y: 0, color: '#ff0000' },
        { x: 1, y: 0, color: '#ff0000' },
        { x: 2, y: 0, color: '#00ff00' },
      ],
      tshirtSvg: FAKE_TSHIRT,
    });
    const redMatches = out.match(/<g fill="#ff0000">/g) ?? [];
    const greenMatches = out.match(/<g fill="#00ff00">/g) ?? [];
    expect(redMatches.length).toBe(1);
    expect(greenMatches.length).toBe(1);
  });

  it('merges horizontally adjacent same-color cells into one rect', () => {
    const out = buildDesignSvg({
      pixels: [
        { x: 0, y: 0, color: '#000' },
        { x: 1, y: 0, color: '#000' },
        { x: 2, y: 0, color: '#000' },
      ],
      tshirtSvg: FAKE_TSHIRT,
    });
    // Three contiguous pixels should collapse to width="3"
    expect(out).toContain('<rect x="0" y="0" width="3" height="1"/>');
  });

  it('does not merge across rows', () => {
    const out = buildDesignSvg({
      pixels: [
        { x: 0, y: 0, color: '#000' },
        { x: 0, y: 1, color: '#000' },
      ],
      tshirtSvg: FAKE_TSHIRT,
    });
    expect(out).toContain('<rect x="0" y="0" width="1" height="1"/>');
    expect(out).toContain('<rect x="0" y="1" width="1" height="1"/>');
  });

  it('embeds escaped title when provided', () => {
    const out = buildDesignSvg({
      pixels: [],
      tshirtSvg: FAKE_TSHIRT,
      title: '<bold> & "fancy"',
    });
    expect(out).toContain('<title>&lt;bold&gt; &amp; &quot;fancy&quot;</title>');
  });
});
