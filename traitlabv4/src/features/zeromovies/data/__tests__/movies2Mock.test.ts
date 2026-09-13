import { describe, it, expect } from 'vitest';
import { isMovie2Hidden, getS2PosterUrl } from '../movies2Mock';
import { labImageUrl } from '@/lib/adrianlab';

describe('isMovie2Hidden', () => {
  it('is hidden only while isMystery is true AND not yet revealed', () => {
    expect(isMovie2Hidden({ isMystery: true, revealed: false })).toBe(true);
  });

  it('is NOT hidden once revealed, even though isMystery stays true forever on-chain', () => {
    // Regression for the 2026-09-13 reveal bug: `isMystery` never flips back
    // to false on-chain — `revealed` is the only field that changes.
    expect(isMovie2Hidden({ isMystery: true, revealed: true })).toBe(false);
  });

  it('is never hidden for a movie that was never a mystery', () => {
    expect(isMovie2Hidden({ isMystery: false, revealed: false })).toBe(false);
    expect(isMovie2Hidden({ isMystery: false, revealed: true })).toBe(false);
  });
});

describe('getS2PosterUrl', () => {
  it('resolves to the mystery placeholder when hidden', () => {
    expect(getS2PosterUrl(30, true)).toBe('/images/zeromovies2/_mystery.svg');
  });

  it('resolves to the real AdrianLAB SVG once not hidden', () => {
    expect(getS2PosterUrl(27, false)).toBe(labImageUrl('zeromovies2/27.svg'));
  });

  it('resolves a revealed movie to its real poster, not the mystery placeholder', () => {
    // This is the exact regression scenario: a movie that IS isMystery but
    // HAS been revealed must resolve through isMovie2Hidden() (false) to its
    // real poster — never straight off the raw isMystery flag (which would
    // wrongly stay true and always return _mystery.svg).
    const revealedMysteryMovie = { id: 30, isMystery: true, revealed: true };
    const hidden = isMovie2Hidden(revealedMysteryMovie);
    expect(getS2PosterUrl(revealedMysteryMovie.id, hidden)).toBe(
      labImageUrl('zeromovies2/30.svg')
    );
  });

  it('resolves the animated GIF for movies flagged hasAnimation', () => {
    expect(getS2PosterUrl(42, false)).toBe(labImageUrl('zeromovies2/animated/42.gif'));
  });
});
